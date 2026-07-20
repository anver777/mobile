"use client";

import { useEffect, useState } from "react";
import type { FinanceCategory, Transaction } from "@/db/schema";

interface ExtTxn extends Transaction {
  categoryName?: string | null;
  categoryEmoji?: string | null;
  categoryColor?: string | null;
}

interface Props {
  editing: ExtTxn | null;
  incomeCategories: FinanceCategory[];
  expenseCategories: FinanceCategory[];
  onClose: () => void;
  onSubmit: (d: { type: "income"|"expense"; amount: number; title: string; notes: string; categoryId: number|null; occurredOn: string }, id: number|null) => void;
  onDelete?: () => void;
}

export function TransactionForm({ editing, incomeCategories, expenseCategories, onClose, onSubmit, onDelete }: Props) {
  const [type, setType] = useState<"income"|"expense">((editing?.type as any) ?? "expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(editing?.categoryId ?? null);
  const [occurredOn, setOccurredOn] = useState("");
  const [delConfirm, setDelConfirm] = useState(false);

  const cats = type === "income" ? incomeCategories : expenseCategories;
  const accent = type === "income" ? "#00ffa3" : "#ff2d6f";

  useEffect(() => {
    if (editing) {
      setType(editing.type as any);
      setAmount(String(editing.amount));
      setTitle(editing.title);
      setNotes(editing.notes ?? "");
      setCategoryId(editing.categoryId);
      setOccurredOn(new Date(editing.occurredOn).toISOString().slice(0, 16));
    } else {
      setOccurredOn(new Date().toISOString().slice(0, 16));
    }
  }, [editing]);

  useEffect(() => { if (!editing) setCategoryId(cats[0]?.id ?? null); }, [type, cats, editing]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (editing || true) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = title.trim().length > 0 && Number(amount) > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg max-h-[90%] overflow-y-auto rounded-t-3xl bg-[#0c0c18] border-t border-white/[0.08]" style={{ animation: "sheetUp 0.3s ease" }}>
        <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-white/20" /></div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">{editing ? "Изменить" : "Новая операция"}</h2>
            <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 text-white/60">✕</button>
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(["expense", "income"] as const).map((t) => {
              const a = t === "income";
              const active = type === t;
              return (
                <button key={t} type="button" onClick={() => setType(t)} className="rounded-xl py-3.5 text-[15px] font-semibold active:scale-95 transition-all" style={active ? { background: `${a ? "0,255,163" : "255,45,111"}20`, color: a ? "#00ffa3" : "#ff2d6f" } : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>
                  {a ? "💰 Доход" : "💸 Расход"}
                </button>
              );
            })}
          </div>

          {/* Amount */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Сумма</div>
            <div className="flex items-center rounded-xl bg-white/5 border border-white/10 px-4 py-4">
              <span className="mr-2 text-2xl font-bold" style={{ color: accent }}>{type === "expense" ? "−" : "+"}</span>
              <input type="number" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder:text-white/20" />
              <span className="text-sm text-white/40">₽</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Название</div>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="На что?" className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30" />
          </div>

          {/* Categories */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Категория</div>
            <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
              {cats.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className="rounded-xl py-2.5 flex flex-col items-center gap-0.5 active:scale-95 transition-all" style={categoryId === c.id ? { background: `${hexToRgb(c.color)}20`, border: `1px solid ${c.color}` } : { background: "rgba(255,255,255,0.05)" }}>
                  <span className="text-xl">{c.emoji}</span>
                  <span className="text-[10px] text-white/60 truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Дата</div>
            <input type="datetime-local" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none" style={{ colorScheme: "dark" }} />
          </div>

          {/* Notes */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Заметка</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Детали..." rows={2} className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30" />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {editing && onDelete && (
              <button type="button" onClick={() => { if (delConfirm) { onDelete(); } else { setDelConfirm(true); setTimeout(() => setDelConfirm(false), 3000); } }} className="w-12 rounded-xl flex items-center justify-center transition-all" style={{ background: delConfirm ? "#ff2d6f" : "rgba(255,45,111,0.1)" }}>
                {delConfirm ? <span className="text-[10px] font-bold text-[#000]">✕</span> : <span className="text-lg">🗑️</span>}
              </button>
            )}
            <button onClick={onClose} className="flex-1 rounded-xl bg-white/8 py-3.5 text-sm font-semibold text-white/60">Отмена</button>
            <button onClick={() => onSubmit({ type, amount: Number(amount), title: title.trim(), notes: notes.trim(), categoryId, occurredOn: new Date(occurredOn).toISOString() }, editing?.id ?? null)} disabled={!valid} className="flex-[1.5] rounded-xl py-3.5 text-sm font-bold text-[#000] disabled:opacity-30 active:scale-95 transition-all" style={{ background: accent }}>
              {editing ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const b = parseInt(h.length === 3 ? h.split("").map((c: string) => c + c).join("") : h, 16);
  return `${(b >> 16) & 255},${(b >> 8) & 255},${b & 255}`;
}
