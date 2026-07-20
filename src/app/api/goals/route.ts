import { db } from "@/db";
import { goals } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(goals)
    .orderBy(asc(goals.completed), asc(goals.dueDate), desc(goals.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    progress?: number;
    dueDate?: string | null;
  } | null;

  if (!body || !body.title?.trim()) {
    return Response.json({ error: "Укажите название цели" }, { status: 400 });
  }

  const [row] = await db
    .insert(goals)
    .values({
      title: body.title.trim().slice(0, 120),
      description: body.description?.trim() || null,
      category: body.category || "Личное",
      color: body.color || "#00e5ff",
      progress: Math.min(100, Math.max(0, Math.round(body.progress ?? 0))),
      dueDate: body.dueDate || null,
    })
    .returning();
  return Response.json(row, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id?: number;
    title?: string;
    description?: string;
    category?: string;
    color?: string;
    progress?: number;
    dueDate?: string | null;
    completed?: boolean;
  } | null;

  if (!body || typeof body.id !== "number") {
    return Response.json({ error: "Не указан id цели" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) patch.title = body.title.trim().slice(0, 120);
  if (body.description !== undefined) patch.description = body.description.trim() || null;
  if (body.category !== undefined) patch.category = body.category;
  if (body.color !== undefined) patch.color = body.color;
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate || null;
  if (body.progress !== undefined) {
    const p = Math.min(100, Math.max(0, Math.round(body.progress)));
    patch.progress = p;
    if (p >= 100) patch.completed = true;
  }
  if (body.completed !== undefined) patch.completed = body.completed;

  const [row] = await db.update(goals).set(patch).where(eq(goals.id, body.id)).returning();
  if (!row) return Response.json({ error: "Цель не найдена" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Не указан id" }, { status: 400 });
  }
  await db.delete(goals).where(eq(goals.id, id));
  return Response.json({ ok: true });
}
