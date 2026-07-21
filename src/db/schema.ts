import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";

// Доходы (Incomes)
export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  source: text("source").notNull(),
  category: text("category").notNull().default("Прочее"),
  note: text("note"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Цели (Goals)
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  deadline: date("deadline"),
  color: text("color").notNull().default("cyan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Заметки (Notes)
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  color: text("color").notNull().default("violet"),
  pinned: integer("pinned").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Income = typeof incomes.$inferSelect;
export type NewIncome = typeof incomes.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
