// Shared helpers for the NEON FINANCE app.

export type Money = number;

// Global UI settings (mutated at runtime from the settings modal / localStorage).
export const appSettings = { name: "", currency: "₽" };

export function formatMoney(value: number, currency = appSettings.currency): string {
  const n = Number.isFinite(value) ? value : 0;
  const rounded = Math.round(n * 100) / 100;
  const num = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(rounded);
  const cur = currency || "₽";
  return cur === "₽" ? `${num} ₽` : `${num} ${cur}`;
}

// Map income categories to neon accent colors for analytics.
export const CATEGORY_COLORS: Record<string, NeonKey> = {
  Зарплата: "cyan",
  Фриланс: "green",
  Инвестиции: "violet",
  Подарок: "pink",
  Возврат: "amber",
  Прочее: "red",
};

export const MONTHS_RU = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

export function monthLabel(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 2) return iso;
  const m = Number(parts[1]) - 1;
  const y = parts[0];
  return `${MONTHS_RU[m] ?? parts[1]} ${y.slice(2)}`;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  // date columns come as YYYY-MM-DD
  const parts = iso.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export type NeonKey = "cyan" | "pink" | "green" | "violet" | "amber" | "red";

export const NEON_OPTIONS: { key: NeonKey; label: string }[] = [
  { key: "cyan", label: "Циан" },
  { key: "pink", label: "Розовый" },
  { key: "green", label: "Зелёный" },
  { key: "violet", label: "Фиолет" },
  { key: "amber", label: "Янтарь" },
  { key: "red", label: "Красный" },
];

export const INCOME_CATEGORIES = [
  "Зарплата",
  "Фриланс",
  "Инвестиции",
  "Подарок",
  "Возврат",
  "Прочее",
];

// ---- Client-facing shapes (numeric amounts parsed to numbers) ----
export interface Income {
  id: number;
  amount: number;
  source: string;
  category: string;
  note: string | null;
  date: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: NeonKey;
  createdAt: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: NeonKey;
  pinned: boolean;
  createdAt: string;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
