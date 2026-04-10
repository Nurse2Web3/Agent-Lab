import { pgTable, text, serial, real, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const historyTable = pgTable("history", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  providers: text("providers").notNull(),
  winner: text("winner").notNull(),
  temperature: real("temperature").notNull().default(0.7),
  results: text("results").notNull(),
  versionCount: integer("version_count").notNull().default(1),
  currentVersionId: integer("current_version_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const promptVersionsTable = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  historyId: integer("history_id").notNull().references(() => historyTable.id),
  versionNumber: integer("version_number").notNull(),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true, createdAt: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type History = typeof historyTable.$inferSelect;
export type PromptVersion = typeof promptVersionsTable.$inferSelect;