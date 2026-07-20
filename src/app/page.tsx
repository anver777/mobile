import { db } from "@/db";
import { goals, transactions, financeCategories, notes } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { AppShell } from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialGoals: typeof goals.$inferSelect[] = [];
  let initialTransactions: typeof transactions.$inferSelect[] = [];
  let initialCategories: typeof financeCategories.$inferSelect[] = [];
  let initialNotes: typeof notes.$inferSelect[] = [];

  try {
    [initialGoals, initialTransactions, initialCategories, initialNotes] = await Promise.all([
      db.select().from(goals).orderBy(asc(goals.position), asc(goals.id)),
      db.select().from(transactions).orderBy(desc(transactions.occurredOn), desc(transactions.id)).limit(100),
      db.select().from(financeCategories).orderBy(asc(financeCategories.type), asc(financeCategories.position)),
      db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
    ]);
  } catch (error) {
    console.error("Failed to load initial data:", error);
  }

  return (
    <AppShell
      initialGoals={initialGoals}
      initialTransactions={initialTransactions}
      initialCategories={initialCategories}
      initialNotes={initialNotes}
    />
  );
}
