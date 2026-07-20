"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { FinanceCategory, Transaction } from "@/db/schema";
import type { Period } from "@/lib/utils";
import { getPeriodRange } from "@/lib/utils";
import { TransactionForm } from "./TransactionForm";

interface ExtTxn extends Transaction {
  categoryName?: string | null;
  categoryEmoji?: string | null;
  categoryColor?: string | null;
}

const MONTHS = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];
const WEEKDAYS = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];

const PERIODS: { key: Period; label: string }[] = [
  { key: "day", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
  { key: "all", label: "Всё" },
];

export function FinanceSection({ initialTransactions, initialCategories }: {
  initialTransactions: Transaction[];
  initialCategories: FinanceCategory[];
}) {
  const [txns, setTxns] = useState<ExtTxn[]>(initialTransactions as ExtTxn[]);
  const [period, setPeriod] = useState<Period>("month");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExtTxn | null>(null);

  const incomeCats = initialCategories.filter((c) => c.type === "income" || c.type === "both");
  const expenseCats = initialCategories.filter((c) => c.type === "expense" || c.type === "both");

  const refresh = useCallback(async () => {
    try {
      const r = getPeriodRange(period);
      const p = new URLSearchParams({ from: r.from.toISOString(), to: r.to.toISOString() });
      if (typeFilter !== "all") p.set("type", typeFilter);
      const res = await fetch(`/api/finance/transactions?${p}`);
      if (res.ok) setTxns(await res.json());
    } catch {}
  }, [period, typeFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const stats = useMemo(() => {
    let inc = 0, exp = 0;
    const cats = new Map<string, { name: string; emoji: string; color: string; amt: number; type: string }>();
    for (const t of txns) {
      const a = Number(t.amount);
      if (t.type === "income") inc += a; else exp += a;
      const key = t.categoryId ? `c${t.categoryId}` : `u${t.type}`;
      if (!cats.has(key)) cats.set(key, { name: t.categoryName ?? "Без категории", emoji: t.categoryEmoji ?? (t.type === "income" ? "💰" : "💸"), color: t.categoryColor ?? (t.type === "income" ? "#00ffa3" : "#ff2d6f"), amt: 0, type: t.type });
      cats.get(key)!.amt += a;
    }
    return { inc, exp, bal: inc - exp, cats: Array.from(cats.values()).sort((a, b) => b.amt - a.amt) };
  }, [txns]);

  async function save(data: any, id: number | null) {
    setFormOpen(false);
    try {
      const url = id ? `/api/finance/transactions/${id}` : "/api/finance/transactions";
      const res = await fetch(url, { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) refresh();
    } catch {}
  }

  async function del(id: number) {
    setTxns((p) => p.filter((t) => t.id !== id));
    try { await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" }); } catch { refresh(); }
  }

  const byDay = useMemo(() => {
    const map = new Map<string, { date: Date; items: ExtTxn[] }>();
    for (const t of txns) {
      const d = new Date(t.occurredOn);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(k)) map.set(k, { date: d, items: [] });
      map.get(k)!.items.push(t);
    }
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [txns]);

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-white tracking-tight">Финансы</h1>
          <button onClick={refresh} className="h-9 w-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Balance */}
      <div className="px-5 mb-3">
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: stats.bal >= 0 ? "rgba(0,255,163,0.06)" : "rgba(255,45,111,0.06)",
            borderColor: stats.bal >= 0 ? "rgba(0,255,163,0.15)" : "rgba(255,45,111,0.15)",
          }}
        >
          <div className="text-xs text-white/40 mb-1">Баланс</div>
          <div className="text-[30px] font-extrabold tracking-tight" style={{ color: stats.bal >= 0 ? "#00ffa3" : "#ff2d6f" }}>
            {stats.bal >= 0 ? "+" : "−"}{fm(Math.abs(stats.bal))}
          </div>
          <div className="flex gap-4 mt-2">
            <div className="text-xs">
              <span className="text-white/40">Доходы</span>
              <div className="text-sm font-semibold text-emerald-400">+{fm(stats.inc)}</div>
            </div>
            <div className="text-xs">
              <span className="text-white/40">Расходы</span>
              <div className="text-sm font-semibold text-rose-400">−{fm(stats.exp)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 mb-3">
        <div className="flex gap-1 mb-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className="flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95 transition-all"
              style={period === p.key ? { background: "rgba(0,255,163,0.15)", color: "#00ffa3" } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[{ k: "all", l: "Все", c: "#fff" }, { k: "income", l: "Доходы", c: "#00ffa3" }, { k: "expense", l: "Расходы", c: "#ff2d6f" }].map((f) => (
            <button
              key={f.k}
              onClick={() => setTypeFilter(f.k as any)}
              className="flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95 transition-all"
              style={typeFilter === f.k ? { background: `${f.c}18`, color: f.c } : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      {stats.cats.length > 0 && (
        <div className="px-5 mb-4">
          <div className="rounded-2xl p-4 border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-xs font-semibold text-white/50 mb-3">По категориям</div>
            <div className="space-y-2.5">
              {stats.cats.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-white/70 truncate">{c.name}</span>
                      <span className="text-sm font-semibold" style={{ color: c.type === "income" ? "#00ffa3" : "#ff2d6f" }}>
                        {c.type === "income" ? "+" : "−"}{fm(c.amt)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${stats.cats.length > 0 ? (c.amt / Math.max(...stats.cats.map((x) => x.amt))) * 100 : 0}%`, background: c.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="px-5 pb-28 space-y-3" style={{ overflowY: "auto" }}>
        {byDay.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">💳</div>
            <div className="text-sm font-medium text-white/50">Нет операций</div>
          </div>
        ) : (
          byDay.map((g) => (
            <div key={g.date.toISOString()}>
              <div className="text-xs font-semibold text-white/30 mb-1.5 px-1">
                {WEEKDAYS[g.date.getDay()]}, {g.date.getDate()} {MONTHS[g.date.getMonth()]}
              </div>
              <div className="space-y-1.5">
                {g.items.map((t) => {
                  const isInc = t.type === "income";
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setEditing(t); setFormOpen(true); }}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 border border-white/[0.05] active:scale-[0.98] transition-all text-left"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className="text-lg">
                        {t.categoryEmoji ?? (isInc ? "📈" : "📉")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium text-white truncate">{t.title}</div>
                        {t.categoryName && <div className="text-[11px] text-white/30 truncate">{t.categoryName}</div>}
                      </div>
                      <div className="text-[14px] font-semibold" style={{ color: isInc ? "#00ffa3" : "#ff2d6f" }}>
                        {isInc ? "+" : "−"}{fm(Number(t.amount))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditing(null); setFormOpen(true); }}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        style={{ background: "#00ffa3", boxShadow: "0 0 24px rgba(0,255,163,0.5), 0 8px 24px rgba(0,0,0,0.4)" }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#000]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {formOpen && (
        <TransactionForm
          editing={editing}
          incomeCategories={incomeCats}
          expenseCategories={expenseCats}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={save}
          onDelete={editing ? () => { del(editing.id); setFormOpen(false); setEditing(null); } : undefined}
        />
      )}
    </>
  );
}

function fm(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}
