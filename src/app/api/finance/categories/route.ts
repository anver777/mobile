import { NextResponse } from "next/server";
import { db } from "@/db";
import { financeCategories } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/finance/categories
export async function GET() {
  try {
    const cats = await db
      .select()
      .from(financeCategories)
      .orderBy(asc(financeCategories.type), asc(financeCategories.position));
    return NextResponse.json(cats);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
