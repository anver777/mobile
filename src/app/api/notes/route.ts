import { NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/notes
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.pinned), desc(notes.updatedAt));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const color = typeof body.color === "string" ? body.color : "#ff2d6f";

    const [row] = await db
      .insert(notes)
      .values({ title, content, color, pinned: false })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
