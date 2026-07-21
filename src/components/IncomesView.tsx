"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet, ArrowUpRight, Tag, Calendar, StickyNote, Search, X } from "lucide-react";
import type { Income } from "@/lib/utils";
import { formatMoney, formatDate, todayISO, INCOME_CATEGORIES } from "@/lib/utils";
import { createIncome, deleteIncome } from "@/lib/api";
import { Modal, ColorPicker, EmptyState, Field } from "./ui";

type Period = "all" | "month" | "last";

export function IncomesView({
  incomes,
  total,
  onChanged,
}: {
  incomes: Income[];
  total: number;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [period, setPeriod] = useState<Period>("all");

  const [form, setForm] = useState({
    amount: "",
    source: "",
    category: INCOME_CATEGORIES[0],
    note: "",
    date: todayISO(),
  });

  const categories = useMemo(() => {
    const present = new Set(incomes.map((i) => i.category));
    return INCOME_CATEGORIES.filter((c) => present.has(c));
  }, [incomes]);

  const filtered = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lym = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}`;
    const q = query.trim().toLowerCase();
    return incomes.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (period === "month" && !i.date.startsWith(ym)) return false;
      if (period === "last" && !i.date.startsWith(lym)) return false;
      if (q && !(i.source.toLowerCase().includes(q) || (i.note ?? "").toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [incomes, cat, period, query]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createIncome({
        amount: Number(form.amount),
        source: form.source,
        category: form.category,
        note: form.note || undefined,
        date: form.date,
      });
      setForm({ amount: "", source: "", category: INCOME_CATEGORIES[0], note: "", date: todayISO() });
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить эту запись дохода?")) return;
    try {
      await deleteIncome(id);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка удаления");
    }
  }

  const listTotal = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="neon-label">Всего получено</p>
          <p className="font-display text-3xl text-cyan-300 neon-text c-cyan">{formatMoney(total)}</p>
        </div>
        <button className="neon-btn solid c-green" onClick={() => setOpen(true)}>
          <Plus size={18} /> Доход
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-3 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="neon-input pl-9"
            placeholder="Поиск по источнику или заметке…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              aria-label="Очистить"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "month", "last"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`neon-btn neon-btn-sm ${period === p ? "solid" : ""}`}
            >
              {p === "all" ? "Все" : p === "month" ? "Этот месяц" : "Прошлый"}
            </button>
          ))}
          <span className="flex-1" />
          {cat !== "all" && (
            <button onClick={() => setCat("all")} className="neon-btn neon-btn-sm c-red">
              <X size={14} /> {cat}
            </button>
          )}
        </div>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`neon-chip ${cat === c ? "c-cyan" : ""} ${
                  cat === c ? "ring-1 ring-cyan-400/50" : "opacity-70"
                }`}
                style={{ cursor: "pointer" }}
              >
                <Tag size={11} /> {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted px-1">
        Показано: {filtered.length} · на сумму {formatMoney(listTotal)}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wallet size={40} strokeWidth={1.4} />}
          title={incomes.length === 0 ? "Пока нет доходов" : "Ничего не найдено"}
          hint={
            incomes.length === 0
              ? "Добавьте первый доход, чтобы начать отслеживать свои финансы."
              : "Измените фильтры или поисковый запрос."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <div key={inc.id} className="glow-card c-green fade-up p-4">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-11 h-11 rounded-xl border border-white/10 bg-white/5 shrink-0">
                  <ArrowUpRight className="c-green" size={20} style={{ color: "var(--green)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-base text-white truncate">{inc.source}</p>
                    <p className="font-display text-lg neon-text c-green whitespace-nowrap">
                      {formatMoney(inc.amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted">
                    <span className="neon-chip c-cyan">
                      <Tag size={12} /> {inc.category}
                    </span>
                    <span className="neon-chip c-violet">
                      <Calendar size={12} /> {formatDate(inc.date)}
                    </span>
                    {inc.note && (
                      <span className="inline-flex items-center gap-1 max-w-full truncate">
                        <StickyNote size={12} /> <span className="truncate">{inc.note}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(inc.id)}
                  aria-label="Удалить"
                  className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Новый доход" accent="green">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Сумма (₽)">
            <input
              className="neon-input c-green"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              placeholder="10000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="Источник">
            <input
              className="neon-input c-cyan"
              type="text"
              required
              maxLength={60}
              placeholder="Например: Зарплата за март"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </Field>
          <Field label="Категория">
            <select
              className="neon-select c-violet"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {INCOME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Дата">
            <input
              className="neon-input c-amber"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Заметка (необязательно)">
            <textarea
              className="neon-textarea c-pink"
              maxLength={240}
              placeholder="Комментарий к доходу"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="neon-btn solid c-green w-full" disabled={loading}>
            {loading ? "Сохраняем…" : "Добавить доход"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
