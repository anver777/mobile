"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Goal } from "@/db/schema";
import {
  TIMEFRAMES,
  TIMEFRAME_MAP,
  periodSubtitle,
  type TimeframeValue,
} from "@/lib/timeframes";
import { ProgressRing } from "./ProgressRing";
import { GoalItem } from "./GoalItem";
import { GoalSheet, type GoalDraft } from "./GoalSheet";

export function GoalApp({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [active, setActive] = useState<TimeframeValue>("day");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tf = TIMEFRAME_MAP[active];

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data: Goal[] = await res.json();
      setGoals(data);
    } catch {
      setError("Не удалось загрузить цели");
    } finally {
      setLoading(false);
    }
  }, []);

  const visible = useMemo(
    () => goals.filter((g) => (g.timeframe as TimeframeValue) === active),
    [goals, active]
  );

  const activeGoals = visible.filter((g) => !g.completed);
  const doneGoals = visible.filter((g) => g.completed);
  const total = visible.length;
  const completed = doneGoals.length;
  const progress = total === 0 ? 0 : completed / total;
  const allDone = total > 0 && completed === total;

  function openNew() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(goal: Goal) {
    setEditing(goal);
    setSheetOpen(true);
  }

  async function toggleGoal(goal: Goal) {
    const next = !goal.completed;
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goal.id
          ? { ...g, completed: next, updatedAt: new Date() }
          : g
      )
    );
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: next }),
      });
    } catch {
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, completed: !next } : g))
      );
    }
  }

  async function deleteGoal(goal: Goal) {
    const snapshot = goals;
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setGoals(snapshot);
      setError("Не удалось удалить цель");
    }
  }

  async function submitGoal(draft: GoalDraft) {
    setSheetOpen(false);
    const prevEditing = editing;
    if (prevEditing) {
      setGoals((prev) =>
        prev.map((g) =>
          g.id === prevEditing.id
            ? {
                ...g,
                title: draft.title,
                notes: draft.notes || null,
                emoji: draft.emoji,
                timeframe: draft.timeframe,
                updatedAt: new Date(),
              }
            : g
        )
      );
      try {
        const res = await fetch(`/api/goals/${prevEditing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.title,
            notes: draft.notes || null,
            emoji: draft.emoji,
            timeframe: draft.timeframe,
          }),
        });
        if (!res.ok) throw new Error();
        const updated: Goal = await res.json();
        setGoals((prev) =>
          prev.map((g) => (g.id === updated.id ? updated : g))
        );
      } catch {
        await refresh();
      }
      setEditing(null);
    } else {
      try {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        if (!res.ok) throw new Error();
        const created: Goal = await res.json();
        setGoals((prev) => [...prev, created]);
        setActive(draft.timeframe);
      } catch {
        setError("Не удалось создать цель");
      }
    }
  }

  const counts = useMemo(() => {
    const map: Record<TimeframeValue, { total: number; done: number }> = {
      day: { total: 0, done: 0 },
      week: { total: 0, done: 0 },
      month: { total: 0, done: 0 },
      year: { total: 0, done: 0 },
    };
    for (const g of goals) {
      const key = g.timeframe as TimeframeValue;
      if (map[key]) {
        map[key].total += 1;
        if (g.completed) map[key].done += 1;
      }
    }
    return map;
  }, [goals]);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const headerBg = {
    background: `radial-gradient(120% 90% at 50% -10%, rgba(${tf.glowRgb},0.28), transparent 60%), #08081a`,
    transition: "background 0.5s ease",
  } as React.CSSProperties;

  return (
    <div className="neon-bg relative min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
        {/* ===== HEADER ===== */}
        <header className="relative shrink-0 overflow-hidden px-5 pb-8 pt-9 text-white" style={headerBg}>
          {/* top hairline glow */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${tf.accent}, transparent)` }}
          />
          <div className="relative mx-auto max-w-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-lg backdrop-blur-sm"
                  style={{ boxShadow: `0 0 16px rgba(${tf.glowRgb},0.4)`, border: `1px solid rgba(${tf.glowRgb},0.4)` }}
                >
                  🎯
                </div>
                <span
                  className="text-base font-extrabold tracking-wide"
                  style={{ textShadow: `0 0 14px rgba(${tf.glowRgb},0.6)` }}
                >
                  МоиЦели
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

            <div className="mt-7 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/55">
                  {periodSubtitle(active)}
                </p>
                <h1
                  className="mt-1 flex items-center gap-2 text-4xl font-extrabold leading-tight"
                  style={{ textShadow: `0 0 24px rgba(${tf.glowRgb},0.7)` }}
                >
                  <span>{tf.icon}</span>
                  <span style={{ color: tf.accent }}>{tf.label}</span>
                </h1>
                <p className="mt-2 text-[13px] font-semibold text-white/70">
                  {total === 0
                    ? "Поставьте первую цель ✨"
                    : `${completed} из ${total} выполнено`}
                </p>
              </div>

              <ProgressRing progress={progress} color={tf.accent} size={108}>
                <span
                  className="text-2xl font-extrabold leading-none"
                  style={{ color: tf.accent, textShadow: `0 0 14px rgba(${tf.glowRgb},0.7)` }}
                >
                  {Math.round(progress * 100)}
                  <span className="text-sm">%</span>
                </span>
              </ProgressRing>
            </div>
          </div>
        </header>

        {/* ===== TABS (sticky) ===== */}
        <div className="sticky top-0 z-20 border-b border-[rgba(255,255,255,0.06)] bg-[#070714]/90 px-3 py-2.5 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl gap-1.5">
            {TIMEFRAMES.map((t) => {
              const isActive = active === t.value;
              const c = counts[t.value];
              return (
                <button
                  key={t.value}
                  onClick={() => setActive(t.value)}
                  className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[12px] font-bold transition-all duration-200 active:scale-95"
                  style={
                    isActive
                      ? {
                          background: `rgba(${t.glowRgb},0.18)`,
                          color: "#fff",
                          boxShadow: `0 0 16px rgba(${t.glowRgb},0.4), inset 0 0 12px rgba(${t.glowRgb},0.08)`,
                          border: `1px solid rgba(${t.glowRgb},0.6)`,
                        }
                      : { color: "rgba(232,232,255,0.45)" }
                  }
                >
                  <span className="text-base leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                  {c.total > 0 && (
                    <span
                      className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                      style={
                        isActive
                          ? { background: t.accent, color: "#05050f" }
                          : c.done === c.total
                            ? { background: "#00ffa3", color: "#05050f" }
                            : { background: "rgba(255,255,255,0.1)", color: "rgba(232,232,255,0.7)" }
                      }
                    >
                      {c.done}/{c.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== LIST ===== */}
        <main className="flex-1 px-4 py-4 pb-32">
          <div className="mx-auto max-w-xl">
            {error && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
                {error}
                <button className="ml-2 font-bold underline" onClick={() => setError(null)}>
                  закрыть
                </button>
              </div>
            )}

            {total === 0 && !loading ? (
              <EmptyState tf={tf} onAdd={openNew} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {activeGoals.map((g, i) => (
                  <GoalItem
                    key={g.id}
                    goal={g}
                    tf={tf}
                    onToggle={toggleGoal}
                    onEdit={openEdit}
                    onDelete={deleteGoal}
                    style={{ animation: "itemIn 0.35s ease both", animationDelay: `${i * 0.04}s` }}
                  />
                ))}

                {allDone && total > 0 && (
                  <div
                    className="rounded-2xl border border-[rgba(0,255,163,0.35)] p-4 text-center"
                    style={{ background: "rgba(0,255,163,0.06)", boxShadow: "0 0 24px rgba(0,255,163,0.18)" }}
                  >
                    <div className="text-3xl">🎉</div>
                    <p className="mt-1 text-sm font-bold text-[#00ffa3]" style={{ textShadow: "0 0 12px rgba(0,255,163,0.6)" }}>
                      Все цели выполнены!
                    </p>
                    <p className="text-xs text-[#00ffa3]/70">Так держать, вы супер!</p>
                  </div>
                )}

                {doneGoals.length > 0 && (
                  <>
                    <div className="flex items-center gap-3 px-1 pt-3 pb-1">
                      <span className="text-xs font-bold uppercase tracking-wide text-white/35">
                        Выполнено · {doneGoals.length}
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                    {doneGoals.map((g, i) => (
                      <GoalItem
                        key={g.id}
                        goal={g}
                        tf={tf}
                        onToggle={toggleGoal}
                        onEdit={openEdit}
                        onDelete={deleteGoal}
                        style={{ animation: "itemIn 0.35s ease both", animationDelay: `${i * 0.03}s` }}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* ===== FAB (fixed) ===== */}
        <button
          onClick={openNew}
          className="fixed bottom-6 z-30 flex h-14 items-center gap-2 rounded-full pl-5 pr-6 text-sm font-bold text-[#05050f] shadow-xl transition-all hover:scale-105 active:scale-95 sm:right-[max(1.25rem,calc((100vw-42rem)/2+1.25rem))] right-5"
          style={{
            background: tf.accent,
            boxShadow: `0 0 28px rgba(${tf.glowRgb},0.6)`,
            animation: "fabIn 0.4s ease",
          }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Новая цель
        </button>

        {/* ===== SHEET ===== */}
        <GoalSheet
          open={sheetOpen}
          editing={editing}
          defaultTimeframe={active}
          tf={tf}
          onClose={() => {
            setSheetOpen(false);
            setEditing(null);
          }}
          onSubmit={submitGoal}
        />
      </div>
    </div>
  );
}

function EmptyState({
  tf,
  onAdd,
}: {
  tf: (typeof TIMEFRAMES)[number];
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        style={{
          background: `rgba(${tf.glowRgb},0.1)`,
          border: `1px solid rgba(${tf.glowRgb},0.35)`,
          boxShadow: `0 0 30px rgba(${tf.glowRgb},0.3)`,
        }}
      >
        {tf.icon}
      </div>
      <h3 className="mt-5 text-lg font-bold text-white">Пока нет целей</h3>
      <p className="mt-1.5 max-w-[240px] text-sm text-white/45">
        Нажмите кнопку ниже, чтобы поставить цель на {tf.label.toLowerCase()} и начать путь к успеху.
      </p>
      <button
        onClick={onAdd}
        className="mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[#05050f] transition-transform hover:scale-105 active:scale-95"
        style={{ background: tf.accent, boxShadow: `0 0 24px rgba(${tf.glowRgb},0.55)` }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Добавить цель
      </button>
    </div>
  );
}
