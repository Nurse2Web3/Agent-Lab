import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default-user"),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  plan: text("plan").notNull().default("sandbox"),
  isPublic: boolean("is_public").notNull().default(false),
  useCount: integer("use_count").notNull().default(0),
  parentVersionId: integer("parent_version_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const seedTemplatesTable = pgTable("seed_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  systemPrompt: text("system_prompt"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertTemplateSchema = createInsertSchema(templatesTable).omit({ id: true, createdAt: true });
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;
export type SeedTemplate = typeof seedTemplatesTable.$inferSelect;
