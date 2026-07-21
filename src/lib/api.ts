import type { Goal, Income, Note } from "./utils";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || "Ошибка запроса");
  }
  return data as T;
}

// ---------- Incomes ----------
export async function fetchIncomes(): Promise<Income[]> {
  const res = await fetch("/api/incomes", { cache: "no-store" });
  const data = await parse<{ incomes: any[] }>(res);
  return data.incomes.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
}

export async function createIncome(body: {
  amount: number;
  source: string;
  category: string;
  note?: string;
  date: string;
}): Promise<Income> {
  const res = await fetch("/api/incomes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ income: any }>(res);
  return { ...data.income, amount: Number(data.income.amount) };
}

export async function deleteIncome(id: number): Promise<void> {
  const res = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
  await parse(res);
}

// ---------- Goals ----------
export async function fetchGoals(): Promise<Goal[]> {
  const res = await fetch("/api/goals", { cache: "no-store" });
  const data = await parse<{ goals: any[] }>(res);
  return data.goals.map((r) => ({
    ...r,
    targetAmount: Number(r.targetAmount),
    currentAmount: Number(r.currentAmount),
  }));
}

export async function createGoal(body: {
  title: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | null;
  color: string;
}): Promise<Goal> {
  const res = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ goal: any }>(res);
  return {
    ...data.goal,
    targetAmount: Number(data.goal.targetAmount),
    currentAmount: Number(data.goal.currentAmount),
  };
}

export async function updateGoal(
  id: number,
  body: {
    title?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | null;
    color?: string;
    addAmount?: number;
    subtractAmount?: number;
  },
): Promise<Goal> {
  const res = await fetch(`/api/goals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ goal: any }>(res);
  return {
    ...data.goal,
    targetAmount: Number(data.goal.targetAmount),
    currentAmount: Number(data.goal.currentAmount),
  };
}

export async function deleteGoal(id: number): Promise<void> {
  const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
  await parse(res);
}

// ---------- Notes ----------
export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes", { cache: "no-store" });
  const data = await parse<{ notes: any[] }>(res);
  return data.notes as Note[];
}

export async function createNote(body: {
  title: string;
  content: string;
  color: string;
  pinned?: boolean;
}): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ note: any }>(res);
  return data.note as Note;
}

export async function updateNote(
  id: number,
  body: { title?: string; content?: string; color?: string; pinned?: boolean },
): Promise<Note> {
  const res = await fetch(`/api/notes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parse<{ note: any }>(res);
  return data.note as Note;
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  await parse(res);
}
