// ─── Общие типы и утилиты (клиент + сервер) ────────────────────────────────

export type SectionId = "dashboard" | "goals" | "finance" | "notes";

export type TxType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TxType;
}

export interface Transaction {
  id: number;
  amount: number;
  type: TxType;
  note: string | null;
  date: string; // YYYY-MM-DD
  category: Category;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  category: string;
  color: string;
  progress: number;
  dueDate: string | null;
  completed: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  updatedAt: string;
}

export interface SectionProps {
  notify: (msg: string) => void;
  intent: string | null;
  clearIntent: () => void;
}

export interface MonthFlow {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export interface CategoryShare {
  id: number;
  name: string;
  icon: string;
  color: string;
  total: number;
  share: number; // 0..1
}

export interface FinanceData {
  categories: Category[];
  transactions: Transaction[];
  balance: number;
  incomeMonth: number;
  expenseMonth: number;
  byMonth: MonthFlow[];
  byCategory: CategoryShare[];
}

export interface DashboardData {
  balance: number;
  incomeMonth: number;
  expenseMonth: number;
  txMonth: number;
  goalsActive: number;
  goalsDone: number;
  avgProgress: number;
  topGoals: Goal[];
  notesCount: number;
  pinnedNotes: number;
  latestNotes: Note[];
  recentTx: Transaction[];
  spend14: { iso: string; label: string; total: number }[];
}

// ─── Константы ──────────────────────────────────────────────────────────────

export const NEON_COLORS = [
  "#00e5ff",
  "#ff2ec4",
  "#b8ff2e",
  "#ffb020",
  "#9d6bff",
  "#ff5470",
  "#38bdf8",
  "#4ade80",
];

export const GOAL_CATEGORIES = [
  "Карьера",
  "Здоровье",
  "Финансы",
  "Обучение",
  "Спорт",
  "Личное",
];

// ─── Форматтеры ─────────────────────────────────────────────────────────────

const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export const fmtMoney = (n: number) => `${rub.format(Math.round(n))} ₽`;

export const fmtMoneySigned = (n: number, type: TxType) =>
  `${type === "income" ? "+" : "−"} ${fmtMoney(n)}`;

const pad = (x: number) => String(x).padStart(2, "0");

export const localISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayISO = () => localISO(new Date());

export const monthKeyOf = (iso: string) => iso.slice(0, 7);

export function fmtDateShort(iso: string) {
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export function daysLeft(iso: string) {
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  const d = new Date(`${iso}T00:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = Math.abs(n) % 10;
  const m100 = Math.abs(n) % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 18) return "Добрый день";
  if (h >= 18 && h < 24) return "Добрый вечер";
  return "Доброй ночи";
}

// ─── API-клиент ─────────────────────────────────────────────────────────────

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Ошибка ${res.status}`);
  }
  return (await res.json()) as T;
}

export const jpost = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
});
export const jpatch = (body: unknown) => ({
  method: "PATCH",
  body: JSON.stringify(body),
});
