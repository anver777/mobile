import { db } from "@/db";
import { goals } from "@/db/schema";
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
    if (body.targetAmount !== undefined) update.targetAmount = String(Number(body.targetAmount));
    if (body.currentAmount !== undefined) update.currentAmount = String(Number(body.currentAmount));
    if (body.deadline !== undefined) update.deadline = body.deadline ? String(body.deadline) : null;
    if (body.color !== undefined) update.color = String(body.color);
    if (body.addAmount !== undefined) {
      const add = Number(body.addAmount);
      if (Number.isFinite(add) && add > 0) {
        const [current] = await db.select().from(goals).where(eq(goals.id, numId));
        if (!current) return Response.json({ error: "Цель не найдена" }, { status: 404 });
        const next = Number(current.currentAmount) + add;
        update.currentAmount = String(next);
      }
    }
    if (body.subtractAmount !== undefined) {
      const sub = Number(body.subtractAmount);
      if (Number.isFinite(sub) && sub > 0) {
        const [current] = await db.select().from(goals).where(eq(goals.id, numId));
        if (!current) return Response.json({ error: "Цель не найдена" }, { status: 404 });
        const next = Math.max(0, Number(current.currentAmount) - sub);
        update.currentAmount = String(next);
      }
    }
    if (Object.keys(update).length === 0) {
      return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
    }
    const [row] = await db.update(goals).set(update).where(eq(goals.id, numId)).returning();
    return Response.json({ goal: row });
  } catch (error) {
    console.error("PATCH /api/goals/[id] error", error);
    return Response.json({ error: "Не удалось обновить цель" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return Response.json({ error: "Неверный ID" }, { status: 400 });
    }
    await db.delete(goals).where(eq(goals.id, numId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error", error);
    return Response.json({ error: "Не удалось удалить цель" }, { status: 500 });
  }
}
