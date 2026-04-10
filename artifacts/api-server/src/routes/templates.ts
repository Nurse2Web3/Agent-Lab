import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { templatesTable, seedTemplatesTable } from "@workspace/db/schema";
import { eq, desc, and, sql, count } from "drizzle-orm";

const router: IRouter = Router();
const BASE_USER_ID = "default-user";

// GET /templates — all seeds + user's templates
router.get("/", async (_req, res) => {
  const seeds = await db.select().from(seedTemplatesTable).orderBy(seedTemplatesTable.sortOrder);
  const userTemplates = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.userId, BASE_USER_ID))
    .orderBy(desc(templatesTable.createdAt));
  res.json({ seeds, userTemplates });
});

// POST /templates — create (tier-gated)
router.post("/", async (req, res) => {
  // Determine plan — default to sandbox for new users
  const plan = "sandbox" as "sandbox" | "pro" | "studio"; // billingStorage.getPlan would be used in production
  const MAX_TEMPLATES = plan === "pro" ? 25 : Infinity;

  const existing = await db
    .select({ count: count() })
    .from(templatesTable)
    .where(eq(templatesTable.userId, BASE_USER_ID));
  const currentCount = existing[0]?.count ?? 0;

  if (currentCount >= MAX_TEMPLATES && plan !== "studio") {
    res.status(403).json({
      error: `Template limit reached (${MAX_TEMPLATES}). Upgrade to Pro or Premium for more.`,
      limitReached: true,
    });
    return;
  }

  const { name, description, category, prompt, systemPrompt, isPublic } = req.body as {
    name: string;
    description?: string;
    category?: string;
    prompt: string;
    systemPrompt?: string;
    isPublic?: boolean;
  };

  const inserted = await db
    .insert(templatesTable)
    .values({
      userId: BASE_USER_ID,
      name,
      description,
      category: category || "general",
      prompt,
      systemPrompt,
      plan,
      isPublic: isPublic ?? false,
    })
    .returning();

  const item = inserted[0];
  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString() });
});

// PATCH /templates/:id — update own template
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = await db
    .select()
    .from(templatesTable)
    .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, BASE_USER_ID)));
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const { name, description, category, prompt, systemPrompt, isPublic } = req.body as {
    name?: string; description?: string; category?: string;
    prompt?: string; systemPrompt?: string; isPublic?: boolean;
  };

  const updated = await db
    .update(templatesTable)
    .set({ name, description, category, prompt, systemPrompt, isPublic })
    .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, BASE_USER_ID)))
    .returning();

  const item = updated[0];
  res.json({ ...item, createdAt: item.createdAt.toISOString() });
});

// DELETE /templates/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(templatesTable).where(and(eq(templatesTable.id, id), eq(templatesTable.userId, BASE_USER_ID)));
  res.json({ success: true });
});

// POST /templates/:id/use — increment useCount
router.post("/:id/use", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const updated = await db
    .update(templatesTable)
    .set({ useCount: sql`${templatesTable.useCount} + 1` })
    .where(and(eq(templatesTable.id, id), eq(templatesTable.userId, BASE_USER_ID)))
    .returning();
  if (!updated[0]) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true, useCount: updated[0].useCount });
});

// GET /templates/public — community templates (studio/premium only)
router.get("/public", async (_req, res) => {
  const items = await db
    .select()
    .from(templatesTable)
    .where(and(eq(templatesTable.isPublic, true)))
    .orderBy(desc(templatesTable.useCount))
    .limit(50);
  res.json({ items });
});

export default router;
