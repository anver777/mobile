import { NextResponse } from "next/server";
import { db } from "@/db";
import { goals, transactions, notes } from "@/db/schema";
import { sql, gte, lte, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/dashboard — summary data
export async function GET() {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Goals stats
    const goalsData = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where completed = true)::int`,
      })
      .from(goals);

    // Today's goals
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayGoals = await db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where completed = true)::int`,
      })
      .from(goals)
      .where(
        and(
          sql`${goals.timeframe} = 'day'`,
          gte(goals.createdAt, today)
        )
      );

    // Finance stats
    const financeData = await db
      .select({
        totalIncome: sql<string>`coalesce(sum(case when type = 'income' then amount else 0 end), 0)`,
        totalExpense: sql<string>`coalesce(sum(case when type = 'expense' then amount else 0 end), 0)`,
        monthIncome: sql<string>`coalesce(sum(case when type = 'income' and occurred_on >= ${monthStart} then amount else 0 end), 0)`,
        monthExpense: sql<string>`coalesce(sum(case when type = 'expense' and occurred_on >= ${monthStart} then amount else 0 end), 0)`,
      })
      .from(transactions);

    // Notes count
    const notesCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes);

    return NextResponse.json({
      goals: {
        total: goalsData[0]?.total ?? 0,
        completed: goalsData[0]?.completed ?? 0,
        todayTotal: todayGoals[0]?.total ?? 0,
        todayCompleted: todayGoals[0]?.completed ?? 0,
      },
      finance: {
        totalIncome: financeData[0]?.totalIncome ?? "0",
        totalExpense: financeData[0]?.totalExpense ?? "0",
        monthIncome: financeData[0]?.monthIncome ?? "0",
        monthExpense: financeData[0]?.monthExpense ?? "0",
      },
      notes: {
        total: notesCount[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
