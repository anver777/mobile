import { db } from "@/db";
import { notes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const serialize = (n: typeof notes.$inferSelect) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  color: n.color,
  pinned: n.pinned,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

export async function GET() {
  const rows = await db
    .select()
    .from(notes)
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));
  return Response.json(rows.map(serialize));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    content?: string;
    color?: string;
    pinned?: boolean;
  } | null;

  if (!body || !body.title?.trim()) {
    return Response.json({ error: "Укажите заголовок заметки" }, { status: 400 });
  }

  const [row] = await db
    .insert(notes)
    .values({
      title: body.title.trim().slice(0, 140),
      content: body.content?.trim() ?? "",
      color: body.color || "#00e5ff",
      pinned: Boolean(body.pinned),
    })
    .returning();
  return Response.json(serialize(row), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id?: number;
    title?: string;
    content?: string;
    color?: string;
    pinned?: boolean;
  } | null;

  if (!body || typeof body.id !== "number") {
    return Response.json({ error: "Не указан id заметки" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) patch.title = body.title.trim().slice(0, 140);
  if (body.content !== undefined) patch.content = body.content;
  if (body.color !== undefined) patch.color = body.color;
  if (body.pinned !== undefined) patch.pinned = body.pinned;

  const [row] = await db.update(notes).set(patch).where(eq(notes.id, body.id)).returning();
  if (!row) return Response.json({ error: "Заметка не найдена" }, { status: 404 });
  return Response.json(serialize(row));
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Не указан id" }, { status: 400 });
  }
  await db.delete(notes).where(eq(notes.id, id));
  return Response.json({ ok: true });
}
