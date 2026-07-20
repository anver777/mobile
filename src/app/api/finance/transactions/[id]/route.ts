import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/finance/transactions/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.type === "income" || body.type === "expense") updates.type = body.type;
    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      }
      updates.amount = amount.toFixed(2);
    }
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      updates.title = t;
    }
    if (typeof body.notes === "string") updates.notes = body.notes.trim() || null;
    if (body.categoryId !== undefined) {
      updates.categoryId = body.categoryId == null ? null : Number(body.categoryId);
    }
    if (body.occurredOn) {
      const d = new Date(body.occurredOn);
      if (!isNaN(d.getTime())) updates.occurredOn = d;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, idNum))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}

// DELETE /api/finance/transactions/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, idNum))
      .returning();
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
