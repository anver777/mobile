import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, financeCategories } from "@/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/finance/transactions?from=...&to=...&type=income|expense
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const type = searchParams.get("type") as "income" | "expense" | null;

  const conditions: any[] = [];
  if (fromStr) {
    const from = new Date(fromStr);
    if (!isNaN(from.getTime())) conditions.push(gte(transactions.occurredOn, from));
  }
  if (toStr) {
    const to = new Date(toStr);
    if (!isNaN(to.getTime())) conditions.push(lte(transactions.occurredOn, to));
  }
  if (type === "income" || type === "expense") {
    conditions.push(eq(transactions.type, type));
  }

  try {
    const rows = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        title: transactions.title,
        notes: transactions.notes,
        categoryId: transactions.categoryId,
        occurredOn: transactions.occurredOn,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        categoryName: financeCategories.name,
        categoryEmoji: financeCategories.emoji,
        categoryColor: financeCategories.color,
      })
      .from(transactions)
      .leftJoin(financeCategories, eq(transactions.categoryId, financeCategories.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(transactions.occurredOn), desc(transactions.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

// POST /api/finance/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = body.type === "income" ? "income" : "expense";
    const amount = Number(body.amount);
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const categoryId = body.categoryId != null ? Number(body.categoryId) : null;
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    const occurredOn = body.occurredOn ? new Date(body.occurredOn) : new Date();

    const [row] = await db
      .insert(transactions)
      .values({
        type,
        amount: amount.toFixed(2),
        title,
        notes,
        categoryId,
        occurredOn,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
