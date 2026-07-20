"use client";

import { useEffect, useState } from "react";
import type { FinanceCategory, Transaction } from "@/db/schema";

interface ExtendedTransaction extends Transaction {
  categoryName?: string | null;
  categoryEmoji?: string | null;
  categoryColor?: string | null;
}

interface TransactionFormProps {
  editing: ExtendedTransaction | null;
  incomeCategories: FinanceCategory[];
  expenseCategories: FinanceCategory[];
  onClose: () => void;
  onSubmit: (
    data: {
      type: "income" | "expense";
      amount: number;
      title: string;
      notes: string;
      categoryId: number | null;
      occurredOn: string;
    },
    editingId: number | null
  ) => void;
  onDelete?: () => void;
}

export function TransactionForm({
  editing,
  incomeCategories,
  expenseCategories,
  onClose,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">((editing?.type as "income" | "expense") ?? "expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(editing?.categoryId ?? null);
  const [occurredOn, setOccurredOn] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const categories = type === "income" ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (editing) {
      setType(editing.type as "income" | "expense");
      setAmount(String(editing.amount));
      setTitle(editing.title);
      setNotes(editing.notes ?? "");
      setCategoryId(editing.categoryId);
      const d = new Date(editing.occurredOn);
      setOccurredOn(d.toISOString().slice(0, 16));
    } else {
      const now = new Date();
      setOccurredOn(now.toISOString().slice(0, 16));
      setCategoryId(null);
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) {
      setCategoryId(categories[0]?.id ?? null);
    }
  }, [type, categories, editing]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = title.trim().length > 0 && Number(amount) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit(
      {
        type,
        amount: Number(amount),
        title: title.trim(),
        notes: notes.trim(),
        categoryId,
        occurredOn: new Date(occurredOn).toISOString(),
      },
      editing?.id ?? null
    );
  }

  const accent = type === "income" ? "#00ffa3" : "#ff2d6f";
  const glow = type === "income" ? "rgba(0,255,163,0.5)" : "rgba(255,45,111,0.5)";
  const glowRgb = type === "income" ? "0,255,163" : "255,45,111";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#04040c]/80 backdrop-blur-md" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl max-h-[92%] overflow-y-auto rounded-t-[28px] border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a18]/95 px-5 pb-8 pt-3 backdrop-blur-xl"
        style={{
          animation: "sheetUp 0.32s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 -2px 30px ${glow}`,
        }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white" style={{ textShadow: `0 0 16px ${glow}` }}>
            {editing ? "Редактировать" : "Новая операция"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Type toggle */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className="rounded-2xl border py-4 text-base font-bold transition-all active:scale-95"
            style={
              type === "expense"
                ? {
                    borderColor: "rgba(255,45,111,0.6)",
                    background: "rgba(255,45,111,0.18)",
                    color: "#ff2d6f",
                    boxShadow: "0 0 16px rgba(255,45,111,0.3)",
                  }
                : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(232,232,255,0.6)" }
            }
          >
            💸 Расход
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className="rounded-2xl border py-4 text-base font-bold transition-all active:scale-95"
            style={
              type === "income"
                ? {
                    borderColor: "rgba(0,255,163,0.6)",
                    background: "rgba(0,255,163,0.18)",
                    color: "#00ffa3",
                    boxShadow: "0 0 16px rgba(0,255,163,0.3)",
                  }
                : { borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(232,232,255,0.6)" }
            }
          >
            💰 Доход
          </button>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Сумма</p>
          <div
            className="flex items-center rounded-2xl border px-4 py-4"
            style={{ borderColor: `rgba(${glowRgb},0.4)`, background: "rgba(255,255,255,0.04)" }}
          >
            <span
              className="mr-2 text-3xl font-bold"
              style={{ color: accent, textShadow: `0 0 12px ${glow}` }}
            >
              {type === "expense" ? "−" : "+"}
            </span>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-3xl font-bold text-white outline-none placeholder:text-white/20"
              autoFocus
              autoComplete="off"
            />
            <span className="text-base font-semibold text-white/40">₽</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Название</p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="На что потратили / откуда доход?"
            className="w-full rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] font-medium text-slate-50 outline-none transition-colors placeholder:text-slate-500 focus:bg-[rgba(255,255,255,0.07)]"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Categories */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Категория</p>
          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
            {categories.map((cat) => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="flex flex-col items-center gap-0.5 rounded-xl p-2 text-[10px] font-semibold transition-all active:scale-95"
                  style={
                    active
                      ? {
                          background: `rgba(${hexToRgb(cat.color)},0.18)`,
                          border: `1px solid ${cat.color}`,
                          boxShadow: `0 0 10px ${cat.color}`,
                          color: "#fff",
                        }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(232,232,255,0.7)" }
                  }
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="truncate w-full text-center">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Дата и время</p>
          <input
            type="datetime-local"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            className="w-full rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[15px] text-white outline-none"
            style={{ borderColor: "rgba(255,255,255,0.1)", colorScheme: "dark" }}
          />
        </div>

        {/* Notes */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Заметка (необязательно)</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Детали..."
            rows={2}
            className="w-full resize-none rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-slate-50 outline-none transition-colors placeholder:text-slate-500 focus:bg-[rgba(255,255,255,0.07)]"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {editing && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirmingDelete) {
                  onDelete();
                } else {
                  setConfirmingDelete(true);
                  setTimeout(() => setConfirmingDelete(false), 3000);
                }
              }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all"
              style={
                confirmingDelete
                  ? {
                      background: "#ff2d6f",
                      color: "#05050f",
                      boxShadow: "0 0 14px rgba(255,45,111,0.6)",
                    }
                  : { background: "rgba(255,45,111,0.1)", color: "#ff2d6f" }
              }
            >
              {confirmingDelete ? <span className="text-[10px] font-bold">OK?</span> : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/8 py-3 text-sm font-bold text-slate-300 transition-colors hover:bg-white/14"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="flex-[1.6] rounded-2xl py-3 text-sm font-bold text-[#05050f] transition-all active:scale-[0.98] disabled:opacity-30"
            style={{ background: accent, boxShadow: valid ? `0 0 24px ${glow}` : "none" }}
          >
            {editing ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </form>
    </div>
  );
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(bigint >> 16) & 255},${(bigint >> 8) & 255},${bigint & 255}`;
}
