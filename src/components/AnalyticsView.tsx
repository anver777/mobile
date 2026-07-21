"use client";

import { useMemo } from "react";
import { TrendingUp, BarChart3, PieChart, CalendarDays, Hash } from "lucide-react";
import type { Income } from "@/lib/utils";
import { formatMoney } from "@/lib/utils";
import { categoryBreakdown, monthlySeries, incomeStats } from "@/lib/analytics";

export function AnalyticsView({ incomes }: { incomes: Income[] }) {
  const breakdown = useMemo(() => categoryBreakdown(incomes), [incomes]);
  const series = useMemo(() => monthlySeries(incomes), [incomes]);
  const stats = useMemo(() => incomeStats(incomes), [incomes]);
  const maxMonth = Math.max(1, ...series.map((s) => s.total));

  const cards = [
    { label: "Всего доходов", value: formatMoney(stats.total), icon: TrendingUp, accent: "c-green" },
    { label: "В среднем / мес", value: formatMoney(stats.avg), icon: BarChart3, accent: "c-cyan" },
    { label: "Лучший месяц", value: `${stats.bestMonth}`, sub: formatMoney(stats.bestMonthTotal), icon: CalendarDays, accent: "c-violet" },
    { label: "Записей", value: String(stats.count), icon: Hash, accent: "c-pink" },
  ] as const;

  return (
    <div className="space-y-4">
      <p className="neon-label">Аналитика доходов</p>

      <section className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`glow-card ${c.accent} p-3`}>
            <c.icon size={16} style={{ color: "var(--neon)" }} />
            <p className="text-[11px] text-muted uppercase tracking-wide mt-2">{c.label}</p>
            <p className="font-display text-lg sm:text-xl neon-text truncate">{c.value}</p>
            {"sub" in c && c.sub && <p className="text-xs text-muted">{c.sub}</p>}
          </div>
        ))}
      </section>

      {/* Category breakdown */}
      <section className="glow-card c-cyan p-4">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-cyan-300" />
          <h3 className="font-display text-base text-white">Распределение по категориям</h3>
        </div>
        {breakdown.length === 0 ? (
          <p className="text-sm text-muted">Нет данных о доходах.</p>
        ) : (
          <div className="space-y-3">
            {breakdown.map((b) => (
              <div key={b.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-white/90">{b.category}</span>
                  <span className="text-muted">
                    {formatMoney(b.total)} · {b.pct}%
                  </span>
                </div>
                <div className="neon-progress">
                  <span
                    style={{
                      width: `${b.pct}%`,
                      background: `linear-gradient(90deg, color-mix(in srgb, ${b.color} 55%, transparent), ${b.color})`,
                      boxShadow: `0 0 12px ${b.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Monthly chart */}
      <section className="glow-card c-violet p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-violet-300" />
          <h3 className="font-display text-base text-white">Динамика по месяцам</h3>
        </div>
        {series.length === 0 ? (
          <p className="text-sm text-muted">Нет данных о доходах.</p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-44">
            {series.map((s) => (
              <div key={s.key} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <span className="text-[10px] text-muted">{formatMoney(s.total)}</span>
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${(s.total / maxMonth) * 100}%`,
                    minHeight: 4,
                    background: "linear-gradient(180deg, var(--violet), color-mix(in srgb, var(--violet) 30%, transparent))",
                    boxShadow: "0 0 14px color-mix(in srgb, var(--violet) 60%, transparent)",
                  }}
                  title={`${s.label}: ${formatMoney(s.total)}`}
                />
                <span className="text-[10px] text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
