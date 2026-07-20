"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  CalendarDays,
  Check,
  Flag,
  Minus,
  Pencil,
  Plus,
  Zap,
} from "lucide-react";
import {
  Btn,
  ColorSwatches,
  ConfirmDelete,
  EmptyState,
  Loader,
  Modal,
  NeonPanel,
  ProgressBar,
  SectionHead,
  cx,
  inputNeon,
} from "./ui";
import {
  GOAL_CATEGORIES,
  NEON_COLORS,
  api,
  daysLeft,
  jpatch,
  jpost,
  plural,
} from "@/lib/core";
import type { Goal, SectionProps } from "@/lib/core";

interface Draft {
  id?: number;
  title: string;
  description: string;
  category: string;
  color: string;
  dueDate: string;
  progress: number;
}

const emptyDraft: Draft = {
  title: "",
  description: "",
  category: "Личное",
  color: NEON_COLORS[0],
  dueDate: "",
  progress: 0,
};

export default function GoalsSection({ notify, intent, clearIntent }: SectionProps) {
  const [goals, setGoals] = useState<Goal[] | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const load = useCallback(async () => {
    try {
      setGoals(await api<Goal[]>("/api/goals"));
    } catch {
      notify("Не удалось загрузить цели");
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (intent === "new-goal") {
      setDraft(emptyDraft);
      setModalOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  const patchGoal = async (id: number, patch: Record<string, unknown>) => {
    setGoals((gs) => gs && gs.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    try {
      await api("/api/goals", jpatch({ id, ...patch }));
    } catch {
      notify("Не удалось сохранить изменение");
      load();
    }
  };

  const bump = (g: Goal, delta: number) => {
    const progress = Math.min(100, Math.max(0, g.progress + delta));
    patchGoal(g.id, { progress });
    if (progress >= 100 && g.progress < 100) notify("Цель достигнута! 🎉");
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try {
      if (draft.id) {
        await api("/api/goals", jpatch({ ...draft, id: draft.id }));
        notify("Цель обновлена");
      } else {
        await api("/api/goals", jpost({ ...draft }));
        notify("Цель добавлена ⚡");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const remove = async (id: number) => {
    await api(`/api/goals?id=${id}`, { method: "DELETE" });
    setGoals((gs) => gs && gs.filter((g) => g.id !== id));
    notify("Цель удалена");
  };

  if (!goals) return <Loader />;

  const active = goals.filter((g) => !g.completed);
  const done = goals.filter((g) => g.completed);
  const avg = active.length
    ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
    : 0;
  const shown = filter === "all" ? goals : filter === "active" ? active : done;

  return (
    <div>
      <SectionHead code="02 · GOALS" title="Цели" accent="#ff2ec4">
        <Btn accent="#ff2ec4" onClick={() => { setDraft(emptyDraft); setModalOpen(true); }}>
          <Plus size={15} /> Новая цель
        </Btn>
      </SectionHead>

      {/* мини-статистика */}
      <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { v: active.length, l: plural(active.length, "активная", "активные", "активных"), c: "#ff2ec4" },
          { v: done.length, l: plural(done.length, "завершена", "завершены", "завершено"), c: "#b8ff2e" },
          { v: `${avg}%`, l: "средний прогресс", c: "#00e5ff" },
        ].map((s, i) => (
          <NeonPanel key={i} accent={s.c} className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
            <div className="font-mono text-lg font-bold sm:text-xl" style={{ color: s.c, textShadow: `0 0 14px ${s.c}66` }}>
              {s.v}
            </div>
            <div className="text-[10px] font-semibold text-mute sm:text-[11px]">{s.l}</div>
          </NeonPanel>
        ))}
      </div>

      {/* фильтры */}
      <div className="mb-4 flex gap-2">
        {(
          [
            ["all", "Все"],
            ["active", "Активные"],
            ["done", "Завершённые"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cx(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all",
              filter === id
                ? "border-neon-magenta/70 bg-neon-magenta/10 text-neon-magenta shadow-[0_0_16px_rgba(255,46,196,0.25)]"
                : "border-line text-mute hover:border-neon-magenta/40 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <NeonPanel accent="#ff2ec4" className="p-4">
          <EmptyState
            icon={<Flag size={32} />}
            title={filter === "done" ? "Пока нет завершённых целей" : "Целей нет"}
            text={filter === "done" ? "Завершите первую — она появится здесь." : "Нажмите «Новая цель» и задайте вектор движения."}
          />
        </NeonPanel>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {shown.map((g) => {
            const dl = g.dueDate ? daysLeft(g.dueDate) : null;
            return (
              <NeonPanel
                key={g.id}
                accent={g.color}
                glow
                className={cx("relative overflow-hidden p-4 sm:p-5", g.completed && "opacity-60")}
              >
                <span
                  className="absolute inset-y-0 left-0 w-[3px]"
                  style={{ background: g.color, boxShadow: `0 0 14px ${g.color}` }}
                />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                      style={{ borderColor: `${g.color}55`, color: g.color }}
                    >
                      {g.category}
                    </span>
                    {!g.completed && dl !== null && (
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold",
                          dl < 0
                            ? "border-neon-red/60 text-neon-red"
                            : dl < 7
                              ? "border-neon-amber/60 text-neon-amber"
                              : "border-line text-mute",
                        )}
                      >
                        <CalendarDays size={10} />
                        {dl < 0 ? `просрочено ${-dl} дн.` : `${dl} дн.`}
                      </span>
                    )}
                  </div>
                  {g.completed && (
                    <span className="inline-flex items-center gap-1 rounded border border-neon-lime/60 bg-neon-lime/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest text-neon-lime">
                      <Check size={10} /> DONE
                    </span>
                  )}
                </div>

                <h3 className="mt-2.5 font-display text-[15px] font-bold leading-snug">{g.title}</h3>
                {g.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{g.description}</p>
                )}

                <div className="mt-4 flex items-center gap-2.5">
                  <ProgressBar value={g.progress} color={g.color} className="flex-1" />
                  <span className="w-10 text-right font-mono text-sm font-bold" style={{ color: g.color }}>
                    {g.progress}%
                  </span>
                </div>

                <div className="mt-3.5 flex items-center gap-1.5">
                  <button
                    onClick={() => bump(g, -5)}
                    aria-label="-5%"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-mute transition-all hover:border-neon-cyan/50 hover:text-neon-cyan active:scale-90"
                  >
                    <Minus size={13} />
                  </button>
                  <button
                    onClick={() => bump(g, +5)}
                    aria-label="+5%"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-mute transition-all hover:border-neon-lime/50 hover:text-neon-lime active:scale-90"
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => bump(g, 100)}
                    title="Быстрый буст до 100%"
                    className="flex h-8 items-center gap-1 rounded-md border border-line px-2 font-mono text-[10px] font-bold text-mute transition-all hover:border-neon-amber/50 hover:text-neon-amber active:scale-95"
                  >
                    <Zap size={11} /> MAX
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => patchGoal(g.id, { completed: !g.completed })}
                    title={g.completed ? "Вернуть в работу" : "Отметить выполненной"}
                    className={cx(
                      "flex h-8 w-8 items-center justify-center rounded-md border transition-all active:scale-90",
                      g.completed
                        ? "border-neon-lime/60 bg-neon-lime/10 text-neon-lime"
                        : "border-line text-mute hover:border-neon-lime/50 hover:text-neon-lime",
                    )}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setDraft({
                        id: g.id,
                        title: g.title,
                        description: g.description ?? "",
                        category: g.category,
                        color: g.color,
                        dueDate: g.dueDate ?? "",
                        progress: g.progress,
                      });
                      setModalOpen(true);
                    }}
                    aria-label="Редактировать"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-mute transition-all hover:border-neon-cyan/50 hover:text-neon-cyan active:scale-90"
                  >
                    <Pencil size={13} />
                  </button>
                  <ConfirmDelete onConfirm={() => remove(g.id)} />
                </div>
              </NeonPanel>
            );
          })}
        </div>
      )}

      {/* ── Модалка создания / редактирования ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={draft.id ? "Редактировать цель" : "Новая цель"}
        accent="#ff2ec4"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Название *
            </label>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Например: Пробежать 10 км"
              className={inputNeon}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Описание
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={2}
              placeholder="План, шаги, мотивация…"
              className={cx(inputNeon, "resize-none")}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Категория
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setDraft({ ...draft, category: c })}
                  className={cx(
                    "rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
                    draft.category === c
                      ? "border-neon-magenta/70 bg-neon-magenta/10 text-neon-magenta shadow-[0_0_14px_rgba(255,46,196,0.25)]"
                      : "border-line text-mute hover:text-ink",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Цвет
            </label>
            <ColorSwatches
              colors={NEON_COLORS}
              value={draft.color}
              onChange={(color) => setDraft({ ...draft, color })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
                Дедлайн
              </label>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                className={inputNeon}
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
                Прогресс: <span className="text-neon-cyan">{draft.progress}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={draft.progress}
                onChange={(e) => setDraft({ ...draft, progress: Number(e.target.value) })}
                className="range-neon mt-2.5 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Btn type="submit" accent="#ff2ec4" className="flex-1">
              {draft.id ? "Сохранить" : "Создать цель"}
            </Btn>
            <Btn type="button" ghost accent="#8b93b8" onClick={() => setModalOpen(false)}>
              Отмена
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
