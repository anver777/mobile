import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/notes/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      updates.title = t;
    }
    if (typeof body.content === "string") {
      const c = body.content.trim();
      if (!c) return NextResponse.json({ error: "Content cannot be empty" }, { status: 400 });
      updates.content = c;
    }
    if (typeof body.color === "string") updates.color = body.color;
    if (typeof body.pinned === "boolean") updates.pinned = body.pinned;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(notes)
      .set(updates)
      .where(eq(notes.id, idNum))
      .returning();

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/notes/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const idNum = Number(id);
    if (Number.isNaN(idNum)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const [deleted] = await db
      .delete(notes)
      .where(eq(notes.id, idNum))
      .returning();
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
