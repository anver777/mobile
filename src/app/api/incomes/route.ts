import { db } from "@/db";
import { incomes } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(incomes).orderBy(desc(incomes.date));
    return Response.json({ incomes: rows });
  } catch (error) {
    console.error("GET /api/incomes error", error);
    return Response.json({ error: "Не удалось загрузить доходы" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "Сумма должна быть положительным числом" }, { status: 400 });
    }
    if (!body.source || !String(body.source).trim()) {
      return Response.json({ error: "Укажите источник дохода" }, { status: 400 });
    }
    const [row] = await db
      .insert(incomes)
      .values({
        amount: String(amount),
        source: String(body.source).trim(),
        category: body.category ? String(body.category).trim() : "Прочее",
        note: body.note ? String(body.note).trim() : null,
        date: body.date || new Date().toISOString().slice(0, 10),
      })
      .returning();
    return Response.json({ income: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/incomes error", error);
    return Response.json({ error: "Не удалось добавить доход" }, { status: 500 });
  }
}
