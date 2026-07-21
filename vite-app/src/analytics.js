const CATEGORY_COLORS = {
  Зарплата: "cyan",
  Фриланс: "green",
  Инвестиции: "violet",
  Подарок: "pink",
  Возврат: "amber",
  Прочее: "red",
};
const MONTHS_RU = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
const COLOR_VAR = { cyan: "var(--cyan)", pink: "var(--pink)", green: "var(--green)", violet: "var(--violet)", amber: "var(--amber)", red: "var(--red)" };

export function formatMoney(value, currency = "₽") {
  const n = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(n * 100) / 100;
  const num = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(rounded);
  const cur = currency || "₽";
  return cur === "₽" ? `${num} ₽` : `${num} ${cur}`;
}

function monthKey(iso) {
  return (iso || "").slice(0, 7);
}
function monthLabel(key) {
  const parts = (key || "").split("-");
  if (parts.length < 2) return key;
  const m = Number(parts[1]) - 1;
  return `${MONTHS_RU[m] ?? parts[1]} ${parts[0].slice(2)}`;
}

export function categoryBreakdown(incomes) {
  const map = new Map();
  for (const inc of incomes) map.set(inc.category, (map.get(inc.category) ?? 0) + Number(inc.amount));
  const total = [...map.values()].reduce((s, v) => s + v, 0) || 1;
  return [...map.entries()]
    .map(([category, value]) => ({
      category,
      total: value,
      pct: Math.round((value / total) * 100),
      color: COLOR_VAR[CATEGORY_COLORS[category] ?? "red"],
    }))
    .sort((a, b) => b.total - a.total);
}

export function monthlySeries(incomes) {
  const map = new Map();
  for (const inc of incomes) {
    const k = monthKey(inc.date);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + Number(inc.amount));
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, total]) => ({ key, label: monthLabel(key), total }));
}

export function incomeStats(incomes) {
  const total = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const months = new Set(incomes.map((i) => monthKey(i.date))).size || 1;
  const avg = total / months;
  const series = monthlySeries(incomes);
  const best = series.reduce((m, p) => (p.total > m.total ? p : m), { label: "—", total: 0 });
  return { total, count: incomes.length, avg, bestMonth: best.label, bestMonthTotal: best.total };
}

export { CATEGORY_COLORS, MONTHS_RU };
