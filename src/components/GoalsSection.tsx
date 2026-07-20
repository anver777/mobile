"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Goal } from "@/db/schema";
import { TIMEFRAME_MAP, periodSubtitle, type TimeframeValue } from "@/lib/timeframes";
import { GoalSheet, type GoalDraft } from "./GoalSheet";

const PERIODS: { key: TimeframeValue; label: string }[] = [
  { key: "day", label: "День" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
];

export function GoalsSection({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [active, setActive] = useState<TimeframeValue>("day");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const tf = TIMEFRAME_MAP[active];

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      if (res.ok) setGoals(await res.json());
    } catch {}
  }, []);

  const visible = useMemo(
    () => goals.filter((g) => g.timeframe === active),
    [goals, active]
  );
  const done = visible.filter((g) => g.completed);
  const pending = visible.filter((g) => !g.completed);
  const progress = visible.length ? done.length / visible.length : 0;

  function openNew() { setEditing(null); setSheetOpen(true); }
  function openEdit(g: Goal) { setEditing(g); setSheetOpen(true); }

  async function toggleGoal(g: Goal) {
    const next = !g.completed;
    setGoals((p) => p.map((x) => x.id === g.id ? { ...x, completed: next, updatedAt: new Date() } : x));
    try {
      await fetch(`/api/goals/${g.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
    } catch {
      setGoals((p) => p.map((x) => x.id === g.id ? { ...x, completed: !next } : x));
    }
  }

  async function deleteGoal(g: Goal) {
    setGoals((p) => p.filter((x) => x.id !== g.id));
    try { await fetch(`/api/goals/${g.id}`, { method: "DELETE" }); } catch { refresh(); }
  }

  async function submit(d: GoalDraft) {
    setSheetOpen(false);
    if (editing) {
      setGoals((p) => p.map((x) => x.id === editing.id ? { ...x, ...d, notes: d.notes || null, updatedAt: new Date() } : x));
      try {
        const res = await fetch(`/api/goals/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (res.ok) { const u = await res.json(); setGoals((p) => p.map((x) => x.id === u.id ? u : x)); }
      } catch { refresh(); }
    } else {
      try {
        const res = await fetch("/api/goals", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(d),
        });
        if (res.ok) { const c = await res.json(); setGoals((p) => [...p, c]); setActive(d.timeframe); }
      } catch {}
    }
  }

  const counts = useMemo(() => {
    const m = { day: 0, week: 0, month: 0, year: 0 };
    const d = { day: 0, week: 0, month: 0, year: 0 };
    goals.forEach((g) => { const k = g.timeframe as TimeframeValue; m[k]++; if (g.completed) d[k]++; });
    return { total: m, done: d };
  }, [goals]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-white tracking-tight">Цели</h1>
          <button onClick={refresh} className="h-9 w-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-white/40 mt-0.5">{periodSubtitle(active)}</div>
      </div>

      {/* Progress */}
      {visible.length > 0 && (
        <div className="px-5 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/60">
              {done.length} из {visible.length}
            </span>
            <span className="text-sm font-bold" style={{ color: tf.accent }}>
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress * 100}%`, background: tf.accent, boxShadow: `0 0 8px ${tf.accent}` }}
            />
          </div>
        </div>
      )}

      {/* Period tabs */}
      <div className="px-5 mb-3">
        <div className="flex gap-1.5">
          {PERIODS.map((p) => {
            const isA = active === p.key;
            const t = counts.total[p.key];
            return (
              <button
                key={p.key}
                onClick={() => setActive(p.key)}
                className="flex-1 rounded-xl py-2.5 text-[13px] font-semibold transition-all active:scale-95 relative"
                style={
                  isA
                    ? { background: `${tf.accent}20`, color: tf.accent, boxShadow: `0 0 12px ${tf.accent}30` }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }
                }
              >
                {p.label}
                {t > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full ${isA ? "text-[#000]" : "text-white/50"}`} style={{ background: isA ? tf.accent : "rgba(255,255,255,0.1)" }}>
                    {counts.done[p.key]}/{t}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pb-28 space-y-2" style={{ minHeight: 0, overflowY: "auto" }}>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-5xl mb-4">{tf.icon}</div>
            <div className="text-lg font-semibold text-white">Пока нет целей</div>
            <div className="text-sm text-white/40 mt-1 max-w-[200px]">Нажмите + чтобы добавить</div>
          </div>
        ) : (
          <>
            {pending.map((g, i) => (
              <GoalCard key={g.id} goal={g} tf={tf} onToggle={toggleGoal} onEdit={openEdit} onDelete={deleteGoal} delay={i * 40} />
            ))}
            {done.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/25">Выполнено</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
                {done.map((g, i) => (
                  <GoalCard key={g.id} goal={g} tf={tf} onToggle={toggleGoal} onEdit={openEdit} onDelete={deleteGoal} delay={i * 30} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        style={{
          background: tf.accent,
          boxShadow: `0 0 24px ${tf.accent}60, 0 8px 24px rgba(0,0,0,0.4)`,
        }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#000]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <GoalSheet
        open={sheetOpen}
        editing={editing}
        defaultTimeframe={active}
        tf={tf}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        onSubmit={submit}
      />
    </>
  );
}

function GoalCard({
  goal, tf, onToggle, onEdit, onDelete, delay,
}: {
  goal: Goal;
  tf: typeof TIMEFRAME_MAP[keyof typeof TIMEFRAME_MAP];
  onToggle: (g: Goal) => void;
  onEdit: (g: Goal) => void;
  onDelete: (g: Goal) => void;
  delay: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { return () => { if (timer.current) clearTimeout(timer.current); }; }, []);

  function handleDelete() {
    if (confirming) { if (timer.current) clearTimeout(timer.current); onDelete(goal); }
    else { setConfirming(true); timer.current = setTimeout(() => setConfirming(false), 3000); }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3.5 border border-white/[0.06] transition-all active:scale-[0.98]"
      style={{ background: "rgba(255,255,255,0.03)", animation: "slideInUp 0.35s ease both", animationDelay: `${delay}ms` }}
    >
      {/* Check */}
      <button
        onClick={() => onToggle(goal)}
        className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-80"
        style={{
          background: goal.completed ? `${tf.accent}20` : "rgba(255,255,255,0.05)",
          border: `1.5px solid ${goal.completed ? tf.accent : "rgba(255,255,255,0.15)"}`,
        }}
      >
        <svg viewBox="0 0 24 24" className={`h-6 w-6 transition-all ${goal.completed ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} fill="none" stroke={tf.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Text */}
      <button onClick={() => onEdit(goal)} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-base">{goal.emoji}</span>
          <span className="text-[15px] font-medium truncate" style={{ color: goal.completed ? "rgba(255,255,255,0.3)" : "#fff", textDecoration: goal.completed ? "line-through" : "none" }}>
            {goal.title}
          </span>
        </div>
        {goal.notes && (
          <div className="text-xs text-white/30 mt-0.5 truncate">{goal.notes}</div>
        )}
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl active:scale-80 transition-all"
        style={{ background: confirming ? "#ff2d6f" : "transparent" }}
      >
        {confirming ? (
          <span className="text-[10px] font-bold text-[#000]">✕</span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </button>
    </div>
  );
}

// React imported at top via "use client"
