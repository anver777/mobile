import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { goals, type Timeframe } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID_TIMEFRAMES: Timeframe[] = ["day", "week", "month", "year"];

// GET /api/goals?timeframe=day
export async function GET(request: NextRequest) {
  const timeframe = request.nextUrl.searchParams.get("timeframe") as
    | Timeframe
    | null;

  try {
    let rows;
    if (timeframe && VALID_TIMEFRAMES.includes(timeframe)) {
      rows = await db
        .select()
        .from(goals)
        .where(eq(goals.timeframe, timeframe))
        .orderBy(asc(goals.position), asc(goals.id));
    } else {
      rows = await db
        .select()
        .from(goals)
        .orderBy(asc(goals.position), asc(goals.id));
    }
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to fetch goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const timeframe = VALID_TIMEFRAMES.includes(body.timeframe)
      ? body.timeframe
      : "day";
    const emoji =
      typeof body.emoji === "string" && body.emoji.trim()
        ? body.emoji.trim()
        : "🎯";
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    const [created] = await db
      .insert(goals)
      .values({
        title,
        timeframe,
        emoji,
        notes,
        position: Date.now(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
