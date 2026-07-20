import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

export const txTypeEnum = pgEnum("tx_type", ["income", "expense"]);

/** Категории операций (финансы) */
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("💠"),
  color: text("color").notNull().default("#00e5ff"),
  type: txTypeEnum("type").notNull().default("expense"),
});

/** Финансовые операции */
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: txTypeEnum("type").notNull(),
  note: text("note"),
  date: date("date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Цели */
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Личное"),
  color: text("color").notNull().default("#00e5ff"),
  progress: integer("progress").notNull().default(0),
  dueDate: date("due_date", { mode: "string" }),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Заметки */
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  color: text("color").notNull().default("#00e5ff"),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
