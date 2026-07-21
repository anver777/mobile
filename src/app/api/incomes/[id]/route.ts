import { db } from "@/db";
import { incomes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return Response.json({ error: "Неверный ID" }, { status: 400 });
    }
    await db.delete(incomes).where(eq(incomes.id, numId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/incomes/[id] error", error);
    return Response.json({ error: "Не удалось удалить доход" }, { status: 500 });
  }
}
