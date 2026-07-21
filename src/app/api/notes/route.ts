import { db } from "@/db";
import { notes } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(notes).orderBy(desc(notes.createdAt));
    return Response.json({ notes: rows });
  } catch (error) {
    console.error("GET /api/notes error", error);
    return Response.json({ error: "Не удалось загрузить заметки" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !String(body.title).trim()) {
      return Response.json({ error: "Укажите заголовок заметки" }, { status: 400 });
    }
    const [row] = await db
      .insert(notes)
      .values({
        title: String(body.title).trim(),
        content: body.content ? String(body.content) : "",
        color: body.color || "violet",
        pinned: body.pinned ? 1 : 0,
      })
      .returning();
    return Response.json({ note: row }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error", error);
    return Response.json({ error: "Не удалось добавить заметку" }, { status: 500 });
  }
}
