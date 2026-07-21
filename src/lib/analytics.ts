import type { Income } from "./utils";
import { CATEGORY_COLORS, MONTHS_RU, monthKey, monthLabel } from "./utils";

export interface CategorySlice {
  category: string;
  total: number;
  pct: number;
  color: string;
}

export interface MonthPoint {
  key: string;
  label: string;
  total: number;
}

export function categoryBreakdown(incomes: Income[]): CategorySlice[] {
  const map = new Map<string, number>();
  for (const inc of incomes) {
    map.set(inc.category, (map.get(inc.category) ?? 0) + inc.amount);
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
  return [...map.entries()]
    .map(([category, value]) => ({
      category,
      total: value,
      pct: Math.round((value / total) * 100),
      color: `var(--${CATEGORY_COLORS[category] ?? "red"})`,
    }))
    .sort((a, b) => b.total - a.total);
}

export function monthlySeries(incomes: Income[]): MonthPoint[] {
  const map = new Map<string, number>();
  for (const inc of incomes) {
    const key = monthKey(inc.date);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + inc.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, total]) => ({ key, label: monthLabel(key + "-01"), total }));
}

export function incomeStats(incomes: Income[]) {
  const total = incomes.reduce((s, i) => s + i.amount, 0);
  const months = new Set(incomes.map((i) => monthKey(i.date))).size || 1;
  const avg = total / months;
  const series = monthlySeries(incomes);
  const best = series.reduce((m, p) => (p.total > m.total ? p : m), { key: "", label: "—", total: 0 });
  return {
    total,
    count: incomes.length,
    avg,
    bestMonth: best.label,
    bestMonthTotal: best.total,
  };
}

export const MONTHS = MONTHS_RU;
