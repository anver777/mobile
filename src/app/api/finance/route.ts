import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { localISO, monthKeyOf, todayISO } from "@/lib/core";
import type { Category, CategoryShare, FinanceData, MonthFlow, Transaction } from "@/lib/core";

export const dynamic = "force-dynamic";

export async function GET() {
  const [catRows, txRows] = await Promise.all([
    db.select().from(categories),
    db
      .select({ t: transactions, c: categories })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .orderBy(desc(transactions.date), desc(transactions.id)),
  ]);

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
  for (const t of txs) {
    balance += t.type === "income" ? t.amount : -t.amount;
    if (monthKeyOf(t.date) === monthKey) {
      if (t.type === "income") incomeMonth += t.amount;
      else expenseMonth += t.amount;
    }
  }

  // Денежный поток за последние 5 месяцев
  const byMonth: MonthFlow[] = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    byMonth.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""),
      income: 0,
      expense: 0,
    });
  }
  const monthIdx = new Map(byMonth.map((m, i) => [m.key, i]));
  for (const t of txs) {
    const i = monthIdx.get(monthKeyOf(t.date));
    if (i === undefined) continue;
    if (t.type === "income") byMonth[i].income += t.amount;
    else byMonth[i].expense += t.amount;
  }

  // Структура расходов текущего месяца по категориям
  const totals = new Map<number, number>();
  let expTotal = 0;
  for (const t of txs) {
    if (t.type !== "expense" || monthKeyOf(t.date) !== monthKey) continue;
    totals.set(t.category.id, (totals.get(t.category.id) ?? 0) + t.amount);
    expTotal += t.amount;
  }
  const byCategory: CategoryShare[] = [...totals.entries()]
    .map(([id, total]) => {
      const c = catRows.find((x) => x.id === id) as Category;
      return { id, name: c.name, icon: c.icon, color: c.color, total, share: expTotal ? total / expTotal : 0 };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const data: FinanceData = {
    categories: catRows,
    transactions: txs,
    balance,
    incomeMonth,
    expenseMonth,
    byMonth,
    byCategory,
  };
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    categoryId?: number;
    amount?: number;
    note?: string;
    date?: string;
  } | null;

  const amount = Number(body?.amount);
  if (!body || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Сумма должна быть больше нуля" }, { status: 400 });
  }
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, Number(body.categoryId)))
    .limit(1);
  if (!cat) {
    return Response.json({ error: "Категория не найдена" }, { status: 400 });
  }

  const [row] = await db
    .insert(transactions)
    .values({
      categoryId: cat.id,
      amount: (Math.round(amount * 100) / 100).toFixed(2),
      type: cat.type,
      note: body.note?.trim() || null,
      date: body.date || todayISO(),
    })
    .returning();
  return Response.json({ ...row, category: cat }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Не указан id" }, { status: 400 });
  }
  await db.delete(transactions).where(eq(transactions.id, id));
  return Response.json({ ok: true });
}
