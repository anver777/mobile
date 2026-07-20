import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/goals/:id  -> toggle/edit a goal
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) {
        return NextResponse.json(
          { error: "Title cannot be empty" },
          { status: 400 }
        );
      }
      updates.title = t;
    }
    if (typeof body.completed === "boolean") updates.completed = body.completed;
    if (typeof body.emoji === "string" && body.emoji.trim())
      updates.emoji = body.emoji.trim();
    if (typeof body.notes === "string")
      updates.notes = body.notes.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(goals)
      .set(updates)
      .where(eq(goals.id, idNum))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(goals)
      .where(eq(goals.id, idNum))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("Failed to delete goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
