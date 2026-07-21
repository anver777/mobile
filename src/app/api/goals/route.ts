import { db } from "@/db";
import { goals } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(goals).orderBy(desc(goals.createdAt));
    return Response.json({ goals: rows });
  } catch (error) {
    console.error("GET /api/goals error", error);
    return Response.json({ error: "Не удалось загрузить цели" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target = Number(body.targetAmount);
    if (!Number.isFinite(target) || target <= 0) {
      return Response.json({ error: "Цель должна быть положительным числом" }, { status: 400 });
    }
    if (!body.title || !String(body.title).trim()) {
      return Response.json({ error: "Укажите название цели" }, { status: 400 });
    }
    const [row] = await db
      .insert(goals)
      .values({
        title: String(body.title).trim(),
        targetAmount: String(target),
        currentAmount: body.currentAmount ? String(Number(body.currentAmount)) : "0",
        deadline: body.deadline ? String(body.deadline) : null,
        color: body.color || "cyan",
      })
      .returning();
    return Response.json({ goal: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error", error);
    return Response.json({ error: "Не удалось добавить цель" }, { status: 500 });
  }
}
