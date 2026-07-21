"use client";

import { useState } from "react";
import { Plus, Trash2, Target, Calendar, Check, Coins, Pencil, ArrowDownRight } from "lucide-react";
import type { Goal, NeonKey } from "@/lib/utils";
import { formatMoney, formatDate, clampPercent } from "@/lib/utils";
import { createGoal, updateGoal, deleteGoal } from "@/lib/api";
import { Modal, ColorPicker, EmptyState, Field } from "./ui";

export function GoalsView({ goals, onChanged }: { goals: Goal[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [topup, setTopup] = useState<Goal | null>(null);
  const [subtract, setSubtract] = useState<Goal | null>(null);
  const [amount, setAmount] = useState("");

  const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
  const saved = goals.reduce((s, g) => s + g.currentAmount, 0);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(g: Goal) {
    setEditing(g);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="neon-label">Целей достигнуто</p>
          <p className="font-display text-3xl text-violet-300 neon-text c-violet">
            {completed} / {goals.length}
          </p>
          <p className="text-xs text-muted mt-1">Накоплено всего: {formatMoney(saved)}</p>
        </div>
        <button className="neon-btn solid c-violet" onClick={openNew}>
          <Plus size={18} /> Цель
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={40} strokeWidth={1.4} />}
          title="Целей пока нет"
          hint="Создайте финансовую цель и отслеживайте прогресс накопления."
        />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => {
            const pct = clampPercent((g.currentAmount / g.targetAmount) * 100);
            const done = g.currentAmount >= g.targetAmount;
            const left = Math.max(0, g.targetAmount - g.currentAmount);
            return (
              <div key={g.id} className={`glow-card c-${g.color} fade-up p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Target size={18} style={{ color: "var(--neon)" }} />
                    <p className="font-display text-base text-white truncate">{g.title}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(g)}
                      aria-label="Редактировать"
                      className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Удалить цель?")) return;
                        try {
                          await deleteGoal(g.id);
                          onChanged();
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Ошибка");
                        }
                      }}
                      aria-label="Удалить"
                      className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-end justify-between mb-2">
                    <span className="font-display text-lg neon-text">
                      {formatMoney(g.currentAmount)}
                    </span>
                    <span className="text-sm text-muted">из {formatMoney(g.targetAmount)}</span>
                  </div>
                  <div className="neon-progress">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <span className="neon-chip">
                      {done ? (
                        <>
                          <Check size={12} /> Цель достигнута
                        </>
                      ) : (
                        `${Math.round(pct)}% · осталось ${formatMoney(left)}`
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {g.deadline && (
                        <span className="neon-chip c-amber">
                          <Calendar size={12} /> {formatDate(g.deadline)}
                        </span>
                      )}
                      <button
                        className="neon-btn neon-btn-sm c-green"
                        onClick={() => {
                          setTopup(g);
                          setAmount("");
                        }}
                      >
                        <Coins size={14} /> Пополнить
                      </button>
                      <button
                        className="neon-btn neon-btn-sm c-red"
                        onClick={() => {
                          setSubtract(g);
                          setAmount("");
                        }}
                        title="Снять"
                      >
                        <ArrowDownRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GoalModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onChanged={onChanged}
      />

      <AmountModal
        open={topup !== null}
        onClose={() => setTopup(null)}
        goal={topup}
        title="Пополнить цель"
        accent="green"
        action="add"
        amount={amount}
        setAmount={setAmount}
        onChanged={onChanged}
      />

      <AmountModal
        open={subtract !== null}
        onClose={() => setSubtract(null)}
        goal={subtract}
        title="Снять с цели"
        accent="red"
        action="subtract"
        amount={amount}
        setAmount={setAmount}
        onChanged={onChanged}
      />
    </div>
  );
}

function GoalModal({
  open,
  onClose,
  editing,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  editing: Goal | null;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: editing?.title ?? "",
    targetAmount: editing ? String(editing.targetAmount) : "",
    currentAmount: editing ? String(editing.currentAmount) : "",
    deadline: editing?.deadline ?? "",
    color: (editing?.color ?? "violet") as NeonKey,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (editing) {
        await updateGoal(editing.id, {
          title: form.title,
          targetAmount: Number(form.targetAmount),
          currentAmount: Number(form.currentAmount),
          deadline: form.deadline || null,
          color: form.color,
        });
      } else {
        await createGoal({
          title: form.title,
          targetAmount: Number(form.targetAmount),
          currentAmount: form.currentAmount ? Number(form.currentAmount) : 0,
          deadline: form.deadline || null,
          color: form.color,
        });
      }
      onClose();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Редактировать цель" : "Новая цель"} accent="violet">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Название цели">
          <input
            className="neon-input c-violet"
            type="text"
            required
            maxLength={60}
            placeholder="Новый ноутбук"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Цель (₽)">
            <input
              className="neon-input c-green"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              placeholder="100000"
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            />
          </Field>
          <Field label="Накоплено (₽)">
            <input
              className="neon-input c-cyan"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={form.currentAmount}
              onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Срок (необязательно)">
          <input
            className="neon-input c-amber"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </Field>
        <Field label="Цвет">
          <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="neon-btn solid c-violet w-full" disabled={loading}>
          {loading ? "Сохраняем…" : editing ? "Сохранить" : "Создать цель"}
        </button>
      </form>
    </Modal>
  );
}

function AmountModal({
  open,
  onClose,
  goal,
  title,
  accent,
  action,
  amount,
  setAmount,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  goal: Goal | null;
  title: string;
  accent: NeonKey;
  action: "add" | "subtract";
  amount: string;
  setAmount: (v: string) => void;
  onChanged: () => void;
}) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    try {
      await updateGoal(goal.id, action === "add" ? { addAmount: amt } : { subtractAmount: amt });
      onClose();
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} accent={accent}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Сумма (₽)">
          <input
            className={`neon-input c-${accent}`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            autoFocus
            placeholder="5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <button type="submit" className={`neon-btn solid c-${accent} w-full`}>
          {action === "add" ? "Добавить к цели" : "Снять с цели"}
        </button>
      </form>
    </Modal>
  );
}
