import { db } from "@/db";
import { categories, goals, notes, transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { localISO, monthKeyOf } from "@/lib/core";
import type { DashboardData, Transaction } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const [catRows, txRows, goalRows, noteRows] = await Promise.all([
    db.select().from(categories),
    db
      .select({ t: transactions, c: categories })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.date), desc(transactions.id)),
    db.select().from(goals),
    db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
  ]);

  const catById = new Map(catRows.map((c) => [c.id, c]));
  const txs: Transaction[] = txRows.map(({ t, c }) => ({
    id: t.id,
    amount: Number(t.amount),
    type: t.type,
    note: t.note,
    date: t.date,
    category: c,
  }));

  const now = new Date();
  const monthKey = monthKeyOf(localISO(now));

  let balance = 0;
  let incomeMonth = 0;
  let expenseMonth = 0;
  let txMonth = 0;
  for (const t of txs) {
    balance += t.type === "income" ? t.amount : -t.amount;
    if (monthKeyOf(t.date) === monthKey) {
      txMonth += 1;
      if (t.type === "income") incomeMonth += t.amount;
      else expenseMonth += t.amount;
    }
  }

  // Расходы за последние 14 дней
  const spend14: DashboardData["spend14"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const iso = localISO(d);
    spend14.push({
      iso,
      label: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      total: 0,
    });
  }
  const dayIdx = new Map(spend14.map((s, i) => [s.iso, i]));
  for (const t of txs) {
    if (t.type !== "expense") continue;
    const i = dayIdx.get(t.date);
    if (i !== undefined) spend14[i].total += t.amount;
  }

  const active = goalRows.filter((g) => !g.completed);
  const done = goalRows.filter((g) => g.completed);
  const avgProgress = active.length
    ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
    : 0;
  const topGoals = [...active]
    .sort((a, b) => {
      const ad = a.dueDate ?? "9999-12-31";
      const bd = b.dueDate ?? "9999-12-31";
      return ad.localeCompare(bd);
    })
    .slice(0, 3)
    .map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      color: g.color,
      progress: g.progress,
      dueDate: g.dueDate,
      completed: g.completed,
    }));

  const latestNotes = noteRows.slice(0, 3).map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    color: n.color,
    pinned: n.pinned,
    updatedAt: n.updatedAt.toISOString(),
  }));

  const data: DashboardData = {
    balance,
    incomeMonth,
    expenseMonth,
    txMonth,
    goalsActive: active.length,
    goalsDone: done.length,
    avgProgress,
    topGoals,
    notesCount: noteRows.length,
    pinnedNotes: noteRows.filter((n) => n.pinned).length,
    latestNotes,
    recentTx: txs.slice(0, 5),
    spend14,
  };

  return Response.json(data);
}
