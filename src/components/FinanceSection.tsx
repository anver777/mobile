"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FinanceCategory, Transaction } from "@/db/schema";
import { formatMoney, getPeriodRange, formatDate, formatWeekday, type Period } from "@/lib/utils";
import { TransactionForm } from "./TransactionForm";

interface FinanceSectionProps {
  initialTransactions: Transaction[];
  initialCategories: FinanceCategory[];
}

interface ExtendedTransaction extends Transaction {
  categoryName?: string | null;
  categoryEmoji?: string | null;
  categoryColor?: string | null;
}

export function FinanceSection({ initialTransactions, initialCategories }: FinanceSectionProps) {
  const [transactions, setTransactions] = useState<ExtendedTransaction[]>(
    initialTransactions as ExtendedTransaction[]
  );
  const [period, setPeriod] = useState<Period>("month");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingTxn, setEditingTxn] = useState<ExtendedTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  const incomeCategories = initialCategories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCategories = initialCategories.filter((c) => c.type === "expense" || c.type === "both");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const range = getPeriodRange(period);
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      if (filterType !== "all") params.set("type", filterType);
      const res = await fetch(`/api/finance/transactions?${params.toString()}`);
      if (!res.ok) throw new Error();
      setTransactions(await res.json());
    } catch (error) {
      console.error("Failed to refresh transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [period, filterType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Stats
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const byCategory = new Map<string, { name: string; emoji: string; color: string; amount: number; type: string }>();

    for (const txn of transactions) {
      const amount = Number(txn.amount);
      if (txn.type === "income") income += amount;
      else expense += amount;

      const catKey = txn.categoryId ? `cat-${txn.categoryId}` : `uncat-${txn.type}`;
      if (!byCategory.has(catKey)) {
        byCategory.set(catKey, {
          name: txn.categoryName ?? "Без категории",
          emoji: txn.categoryEmoji ?? (txn.type === "income" ? "💰" : "💸"),
          color: txn.categoryColor ?? (txn.type === "income" ? "#00ffa3" : "#ff6b35"),
          amount: 0,
          type: txn.type,
        });
      }
      byCategory.get(catKey)!.amount += amount;
    }

    return {
      income,
      expense,
      balance: income - expense,
      byCategory: Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount),
    };
  }, [transactions]);

  async function handleSubmit(
    data: { type: "income" | "expense"; amount: number; title: string; notes: string; categoryId: number | null; occurredOn: string },
    editingId: number | null
  ) {
    setShowForm(false);
    try {
      const url = editingId ? `/api/finance/transactions/${editingId}` : "/api/finance/transactions";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      await refresh();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  }

  async function deleteTransaction(id: number) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      await refresh();
    }
  }

  // Group by day
  const groupedByDay = useMemo(() => {
    const groups: { date: Date; items: ExtendedTransaction[] }[] = [];
    const map = new Map<string, { date: Date; items: ExtendedTransaction[] }>();
    for (const txn of transactions) {
      const d = typeof txn.occurredOn === "string" ? new Date(txn.occurredOn) : txn.occurredOn;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, { date: d, items: [] });
      map.get(key)!.items.push(txn);
    }
    for (const [, group] of map) {
      group.items.sort((a, b) => {
        const da = new Date(a.occurredOn);
        const db = new Date(b.occurredOn);
        return db.getTime() - da.getTime();
      });
      groups.push(group);
    }
    groups.sort((a, b) => b.date.getTime() - a.date.getTime());
    return groups;
  }, [transactions]);

  const maxCategoryAmount = stats.byCategory.length > 0 ? Math.max(...stats.byCategory.map((c) => c.amount)) : 1;

  return (
    <>
      {/* Header */}
      <header
        className="relative shrink-0 overflow-hidden px-5 pb-6 pt-8 text-white"
        style={{ background: "radial-gradient(120% 90% at 50% -10%, rgba(0,255,163,0.22), transparent 60%), #08081a" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #00ffa3, transparent)" }}
        />
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-lg backdrop-blur-sm"
                style={{ boxShadow: "0 0 16px rgba(0,255,163,0.4)", border: "1px solid rgba(0,255,163,0.4)" }}
              >
                💰
              </div>
              <span className="text-base font-extrabold tracking-wide" style={{ textShadow: "0 0 14px rgba(0,255,163,0.6)" }}>
                Финансы
              </span>
            </div>
            <button
              onClick={() => refresh()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition-all hover:bg-white/15 active:scale-90"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              aria-label="Обновить"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {/* Balance card */}
          <div
            className="mt-5 rounded-3xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.06)] p-5 backdrop-blur-sm"
            style={{ boxShadow: "0 0 30px rgba(0,255,163,0.15)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-white/50">Баланс</div>
            <div
              className="mt-1 text-4xl font-extrabold"
              style={{
                color: stats.balance >= 0 ? "#00ffa3" : "#ff2d6f",
                textShadow: `0 0 20px ${stats.balance >= 0 ? "rgba(0,255,163,0.6)" : "rgba(255,45,111,0.6)"}`,
              }}
            >
              {stats.balance >= 0 ? "+" : ""}
              {formatMoney(stats.balance)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">Доходы</div>
                <div className="text-lg font-bold text-[#00ffa3]" style={{ textShadow: "0 0 10px rgba(0,255,163,0.5)" }}>
                  +{formatMoney(stats.income)}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-white/40">Расходы</div>
                <div className="text-lg font-bold text-[#ff2d6f]" style={{ textShadow: "0 0 10px rgba(255,45,111,0.5)" }}>
                  −{formatMoney(stats.expense)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Period + type filter */}
      <div className="sticky top-0 z-20 border-b border-[rgba(255,255,255,0.06)] bg-[#070714]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-xl px-3 py-2.5">
          <div className="flex gap-1.5 mb-2">
            {(["day", "week", "month", "year", "all"] as Period[]).map((p) => {
              const isActive = period === p;
              const labels: Record<Period, string> = {
                day: "День",
                week: "Неделя",
                month: "Месяц",
                year: "Год",
                all: "Всё",
              };
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="flex-1 rounded-xl py-1.5 text-[11px] font-bold transition-all active:scale-95"
                  style={
                    isActive
                      ? {
                          background: "rgba(0,255,163,0.18)",
                          color: "#00ffa3",
                          boxShadow: "0 0 12px rgba(0,255,163,0.3)",
                          border: "1px solid rgba(0,255,163,0.5)",
                        }
                      : { color: "rgba(232,232,255,0.45)" }
                  }
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "all", label: "Все", color: "#b14dff" },
              { key: "income", label: "Доходы", color: "#00ffa3" },
              { key: "expense", label: "Расходы", color: "#ff2d6f" },
            ].map((f) => {
              const isActive = filterType === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key as "all" | "income" | "expense")}
                  className="flex-1 rounded-xl py-1.5 text-[11px] font-bold transition-all active:scale-95"
                  style={
                    isActive
                      ? {
                          background: `rgba(${hexToRgb(f.color)},0.18)`,
                          color: f.color,
                          boxShadow: `0 0 12px rgba(${hexToRgb(f.color)},0.3)`,
                          border: `1px solid rgba(${hexToRgb(f.color)},0.5)`,
                        }
                      : { color: "rgba(232,232,255,0.45)" }
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24">
        <div className="mx-auto max-w-xl space-y-4">
          {/* Categories breakdown */}
          {stats.byCategory.length > 0 && (
            <div
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              style={{ boxShadow: "0 0 16px rgba(177,77,255,0.08)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white" style={{ textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>
                  По категориям
                </h3>
                <span className="text-[10px] font-semibold text-white/40">
                  {transactions.length} операций
                </span>
              </div>
              <div className="space-y-2">
                {stats.byCategory.map((cat) => (
                  <div key={`${cat.emoji}-${cat.name}-${cat.type}`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span className="text-white/70">{cat.name}</span>
                      </div>
                      <span
                        className="font-bold"
                        style={{
                          color: cat.type === "income" ? "#00ffa3" : "#ff2d6f",
                          textShadow: `0 0 8px ${cat.type === "income" ? "rgba(0,255,163,0.4)" : "rgba(255,45,111,0.4)"}`,
                        }}
                      >
                        {cat.type === "income" ? "+" : "−"}
                        {formatMoney(cat.amount)}
                      </span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.amount / maxCategoryAmount) * 100}%`,
                          background: cat.color,
                          boxShadow: `0 0 6px ${cat.color}`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions by day */}
          {groupedByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
                style={{
                  background: "rgba(0,255,163,0.1)",
                  border: "1px solid rgba(0,255,163,0.35)",
                  boxShadow: "0 0 30px rgba(0,255,163,0.3)",
                }}
              >
                💳
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Нет операций</h3>
              <p className="mt-1.5 max-w-[240px] text-sm text-white/45">
                Нажмите «+», чтобы добавить первую операцию
              </p>
            </div>
          ) : (
            groupedByDay.map((group) => (
              <div key={group.date.toISOString()}>
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-bold uppercase tracking-wide text-white/50">
                    {formatWeekday(group.date)} · {formatDate(group.date)}
                  </span>
                  <span className="text-[10px] font-semibold text-white/30">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "операция" : group.items.length < 5 ? "операции" : "операций"}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.items.map((txn) => {
                    const isIncome = txn.type === "income";
                    return (
                      <button
                        key={txn.id}
                        onClick={() => {
                          setEditingTxn(txn);
                          setShowForm(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 text-left backdrop-blur-sm transition-all hover:bg-white/8 active:scale-[0.99]"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                          style={{
                            background: isIncome ? "rgba(0,255,163,0.12)" : "rgba(255,45,111,0.12)",
                            border: `1px solid ${isIncome ? "rgba(0,255,163,0.3)" : "rgba(255,45,111,0.3)"}`,
                          }}
                        >
                          {txn.categoryEmoji ?? (isIncome ? "💰" : "💸")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white truncate">{txn.title}</div>
                          {txn.categoryName && (
                            <div className="text-[11px] text-white/40 truncate">{txn.categoryName}</div>
                          )}
                        </div>
                        <div
                          className="text-sm font-bold"
                          style={{
                            color: isIncome ? "#00ffa3" : "#ff2d6f",
                            textShadow: `0 0 8px ${isIncome ? "rgba(0,255,163,0.5)" : "rgba(255,45,111,0.5)"}`,
                          }}
                        >
                          {isIncome ? "+" : "−"}
                          {formatMoney(Number(txn.amount))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => {
          setEditingTxn(null);
          setShowForm(true);
        }}
        className="fixed bottom-28 right-4 z-30 flex items-center justify-center rounded-full shadow-2xl transition-all hover:scale-105 active:scale-90"
        style={{
          background: "#00ffa3",
          boxShadow: "0 0 16px rgba(0,255,163,0.6)",
          animation: "fabIn 0.4s ease",
          width: "40px",
          height: "40px",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#05050f" strokeWidth="3" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {showForm && (
        <TransactionForm
          editing={editingTxn}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          onClose={() => {
            setShowForm(false);
            setEditingTxn(null);
          }}
          onSubmit={handleSubmit}
          onDelete={editingTxn ? () => {
            deleteTransaction(editingTxn.id);
            setShowForm(false);
            setEditingTxn(null);
          } : undefined}
        />
      )}
    </>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
}
