"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  NotebookPen,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Btn, CountUp, EmptyState, Loader, NeonPanel, ProgressBar, cx } from "./ui";
import {
  api,
  daysLeft,
  fmtDateShort,
  fmtMoney,
  fmtMoneySigned,
  jpatch,
  plural,
} from "@/lib/core";
import type { DashboardData, Goal, SectionId } from "@/lib/core";

export default function Dashboard({
  go,
  notify,
}: {
  go: (s: SectionId, intent?: string) => void;
  notify: (msg: string) => void;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState("");
  const [chartReady, setChartReady] = useState(false);

  const load = useCallback(async () => {
    try {
      setErr("");
      setData(await api<DashboardData>("/api/dashboard"));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setChartReady(true), 60);
    return () => clearTimeout(t);
  }, [data]);

  const bumpGoal = async (g: Goal, delta: number) => {
    const progress = Math.min(100, Math.max(0, g.progress + delta));
    setData((d) =>
      d && {
        ...d,
        topGoals: d.topGoals.map((x) =>
          x.id === g.id ? { ...x, progress, completed: progress >= 100 } : x,
        ),
      },
    );
    try {
      await api("/api/goals", jpatch({ id: g.id, progress }));
      if (progress >= 100) notify("Цель достигнута! 🎉");
    } catch {
      notify("Не удалось обновить цель");
      load();
    }
  };

  if (err)
    return (
      <NeonPanel accent="#ff5470" className="p-8 text-center">
        <div className="font-display text-lg font-bold text-neon-red">СБОЙ СВЯЗИ</div>
        <p className="mt-2 text-sm text-mute">{err}</p>
        <Btn className="mt-4" accent="#ff5470" onClick={load}>
          Повторить
        </Btn>
      </NeonPanel>
    );

  if (!data)
    return (
      <div className="space-y-4">
        <Loader />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[10px] bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );

  const maxSpend = Math.max(1, ...data.spend14.map((s) => s.total));
  const spend14Total = data.spend14.reduce((s, x) => s + x.total, 0);
  const monthTotal = data.incomeMonth + data.expenseMonth;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── Плитки статистики ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <NeonPanel accent="#00e5ff" glow className="clip-corner col-span-2 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <Wallet size={12} className="text-neon-cyan" /> Баланс · всё время
          </div>
          <div
            className="mt-2 font-mono text-[26px] font-bold leading-none text-neon-cyan sm:text-4xl"
            style={{ textShadow: "0 0 22px rgba(0,229,255,0.55)" }}
          >
            <CountUp value={data.balance} format={fmtMoney} />
          </div>
          <div className="mt-4">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="bg-neon-lime transition-[width] duration-700"
                style={{
                  width: `${monthTotal ? (data.incomeMonth / monthTotal) * 100 : 50}%`,
                  boxShadow: "0 0 8px #b8ff2e",
                }}
              />
              <div className="flex-1 bg-neon-magenta/80" style={{ boxShadow: "0 0 8px #ff2ec4" }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 text-neon-lime">
                <TrendingUp size={12} /> +{fmtMoney(data.incomeMonth)}
              </span>
              <span className="inline-flex items-center gap-1 text-neon-magenta">
                <TrendingDown size={12} /> −{fmtMoney(data.expenseMonth)}
              </span>
              <span className="text-mute">за текущий месяц</span>
            </div>
          </div>
        </NeonPanel>

        <NeonPanel accent="#b8ff2e" glow className="clip-corner p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <Target size={12} className="text-neon-lime" /> Цели
          </div>
          <div className="mt-2 font-mono text-[26px] font-bold leading-none text-neon-lime sm:text-4xl">
            <CountUp value={data.goalsActive} />
            <span className="ml-1 text-sm font-semibold text-mute">актив.</span>
          </div>
          <div className="mt-4">
            <ProgressBar value={data.avgProgress} color="#b8ff2e" />
            <div className="mt-1.5 font-mono text-[11px] text-mute">
              средний прогресс{" "}
              <span className="text-neon-lime">{data.avgProgress}%</span>
            </div>
          </div>
        </NeonPanel>

        <NeonPanel accent="#ffb020" glow className="clip-corner p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <NotebookPen size={12} className="text-neon-amber" /> Заметки
          </div>
          <div className="mt-2 font-mono text-[26px] font-bold leading-none text-neon-amber sm:text-4xl">
            <CountUp value={data.notesCount} />
          </div>
          <div className="mt-4 font-mono text-[11px] text-mute">
            ⭐ {data.pinnedNotes} {plural(data.pinnedNotes, "закреплена", "закреплены", "закреплено")}
            <br />
            {data.txMonth} {plural(data.txMonth, "операция", "операции", "операций")} за месяц
          </div>
        </NeonPanel>
      </div>

      {/* ── Основная сетка ── */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="space-y-3 sm:space-y-4 lg:col-span-2">
          {/* Расходы за 14 дней */}
          <NeonPanel accent="#00e5ff" className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                Расходы <span className="text-mute">· 14 дней</span>
              </div>
              <div className="font-mono text-xs text-neon-cyan">Σ {fmtMoney(spend14Total)}</div>
            </div>
            <div className="mt-4 flex h-32 items-end gap-[3px] sm:h-36">
              {data.spend14.map((s, i) => {
                const h = s.total > 0 ? Math.max(5, (s.total / maxSpend) * 100) : 2;
                const isToday = i === data.spend14.length - 1;
                return (
                  <div key={s.iso} className="group relative flex h-full flex-1 items-end">
                    <div
                      className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-line bg-abyss px-2 py-1 text-center group-hover:block"
                    >
                      <div className="font-mono text-[10px] font-bold text-neon-cyan">
                        {fmtMoney(s.total)}
                      </div>
                      <div className="font-mono text-[9px] text-mute">{fmtDateShort(s.iso)}</div>
                    </div>
                    <div
                      className={cx(
                        "w-full rounded-t-[2px] transition-all duration-700 ease-out group-hover:brightness-150",
                        isToday ? "bg-gradient-to-t from-neon-magenta/30 to-neon-magenta" : "bg-gradient-to-t from-neon-cyan/15 to-neon-cyan/90",
                      )}
                      style={{
                        height: chartReady ? `${h}%` : "0%",
                        transitionDelay: `${i * 35}ms`,
                        boxShadow: s.total > 0 ? `0 0 10px ${isToday ? "#ff2ec466" : "#00e5ff44"}` : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-mute/70">
              <span>{data.spend14[0]?.label}</span>
              <span className="text-neon-magenta">сегодня</span>
            </div>
          </NeonPanel>

          {/* Последние операции */}
          <NeonPanel accent="#ff2ec4" className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                Последние операции
              </div>
              <button
                onClick={() => go("finance")}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-neon-magenta transition-all hover:gap-2"
              >
                все <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-3 divide-y divide-white/[0.04]">
              {data.recentTx.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: `${t.category.color}1f`, boxShadow: `inset 0 0 0 1px ${t.category.color}44` }}
                  >
                    {t.category.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {t.note || t.category.name}
                    </div>
                    <div className="font-mono text-[10px] text-mute">
                      {t.category.name} · {fmtDateShort(t.date)}
                    </div>
                  </div>
                  <div
                    className={cx(
                      "font-mono text-sm font-bold",
                      t.type === "income" ? "text-neon-lime" : "text-neon-magenta",
                    )}
                  >
                    {fmtMoneySigned(t.amount, t.type)}
                  </div>
                </div>
              ))}
              {data.recentTx.length === 0 && (
                <EmptyState title="Пока пусто" text="Добавьте первую операцию в разделе «Финансы»." />
              )}
            </div>
          </NeonPanel>
        </div>

        {/* Правая колонка */}
        <div className="space-y-3 sm:space-y-4">
          <NeonPanel accent="#b8ff2e" className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} className="mr-1 inline text-neon-lime" />
                Фокус
              </div>
              <button
                onClick={() => go("goals")}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-neon-lime transition-all hover:gap-2"
              >
                цели <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-3 space-y-3.5">
              {data.topGoals.map((g) => (
                <div key={g.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{g.title}</span>
                    <button
                      onClick={() => bumpGoal(g, +5)}
                      title="+5%"
                      className="inline-flex h-7 items-center gap-0.5 rounded-md border border-neon-lime/40 px-1.5 font-mono text-[10px] font-bold text-neon-lime transition-all hover:bg-neon-lime/10 hover:shadow-[0_0_12px_rgba(184,255,46,0.3)] active:scale-95"
                    >
                      <Zap size={10} /> +5
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 pl-4">
                    <ProgressBar value={g.progress} color={g.color} className="flex-1" />
                    <span className="w-9 text-right font-mono text-[11px] font-bold" style={{ color: g.color }}>
                      {g.progress}%
                    </span>
                  </div>
                  {g.dueDate && (
                    <div className="mt-1 flex items-center gap-1 pl-4 font-mono text-[10px] text-mute">
                      <CalendarDays size={10} />
                      {daysLeft(g.dueDate) >= 0
                        ? `${daysLeft(g.dueDate)} дн. до дедлайна`
                        : "дедлайн прошёл"}
                    </div>
                  )}
                </div>
              ))}
              {data.topGoals.length === 0 && (
                <EmptyState title="Нет активных целей" text="Самое время поставить первую." />
              )}
            </div>
          </NeonPanel>

          <NeonPanel accent="#ffb020" className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-xs font-bold uppercase tracking-wider">Заметки</div>
              <button
                onClick={() => go("notes")}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-neon-amber transition-all hover:gap-2"
              >
                все <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {data.latestNotes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go("notes")}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-all hover:border-line hover:bg-white/[0.03]"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: n.color, boxShadow: `0 0 8px ${n.color}` }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                    {n.pinned && "⭐ "}
                    {n.title}
                  </span>
                </button>
              ))}
            </div>
          </NeonPanel>

          {/* Быстрые действия */}
          <NeonPanel accent="#9d6bff" className="p-4 sm:p-5">
            <div className="font-display text-xs font-bold uppercase tracking-wider">
              Быстрый старт
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Btn ghost accent="#ff2ec4" className="!px-2 !py-2.5 !text-[11px]" onClick={() => go("goals", "new-goal")}>
                <Plus size={13} /> Цель
              </Btn>
              <Btn ghost accent="#b8ff2e" className="!px-2 !py-2.5 !text-[11px]" onClick={() => go("finance", "new-tx")}>
                <Plus size={13} /> Опер.
              </Btn>
              <Btn ghost accent="#ffb020" className="!px-2 !py-2.5 !text-[11px]" onClick={() => go("notes", "new-note")}>
                <Plus size={13} /> Заметка
              </Btn>
            </div>
          </NeonPanel>
        </div>
      </div>
    </div>
  );
}

