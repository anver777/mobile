import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";

export type Timeframe = "day" | "week" | "month" | "year";
export type TxnType = "income" | "expense";

// ============ GOALS ============
export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    notes: text("notes"),
    emoji: text("emoji").notNull().default("🎯"),
    timeframe: text("timeframe").notNull(), // day | week | month | year
    completed: boolean("completed").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("goals_timeframe_idx").on(t.timeframe),
    index("goals_completed_idx").on(t.completed),
  ]
);

// ============ FINANCE ============
export const financeCategories = pgTable(
  "finance_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    emoji: text("emoji").notNull().default("💰"),
    type: text("type").notNull(), // income | expense | both
    color: text("color").notNull().default("#00ffa3"),
    position: integer("position").notNull().default(0),
  }
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(), // income | expense
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    categoryId: integer("category_id"),
    occurredOn: timestamp("occurred_on", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("txn_occurred_on_idx").on(t.occurredOn),
    index("txn_type_idx").on(t.type),
    index("txn_category_idx").on(t.categoryId),
  ]
);

// ============ NOTES ============
export const notes = pgTable(
  "notes",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    color: text("color").notNull().default("#ff2d6f"),
    pinned: boolean("pinned").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("notes_pinned_idx").on(t.pinned),
    index("notes_created_at_idx").on(t.createdAt),
  ]
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type FinanceCategory = typeof financeCategories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Note = typeof notes.$inferSelect;
