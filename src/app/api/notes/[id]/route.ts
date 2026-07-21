import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return Response.json({ error: "Неверный ID" }, { status: 400 });
    }
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = String(body.title).trim();
    if (body.content !== undefined) update.content = String(body.content);
    if (body.color !== undefined) update.color = String(body.color);
    if (body.pinned !== undefined) update.pinned = body.pinned ? 1 : 0;
    if (Object.keys(update).length === 0) {
      return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
    }
    const [row] = await db.update(notes).set(update).where(eq(notes.id, numId)).returning();
    return Response.json({ note: row });
  } catch (error) {
    console.error("PATCH /api/notes/[id] error", error);
    return Response.json({ error: "Не удалось обновить заметку" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return Response.json({ error: "Неверный ID" }, { status: 400 });
    }
    await db.delete(notes).where(eq(notes.id, numId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error", error);
    return Response.json({ error: "Не удалось удалить заметку" }, { status: 500 });
  }
}
