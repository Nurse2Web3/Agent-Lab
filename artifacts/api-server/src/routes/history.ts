import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { historyTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/history", async (_req, res) => {
  const items = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.createdAt));

  const mapped = items.map((item) => ({
    ...item,
    providers: JSON.parse(item.providers),
    createdAt: item.createdAt.toISOString(),
  }));

  res.json({ items: mapped });
});

router.get("/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rows = await db.select().from(historyTable).where(eq(historyTable.id, id));
  if (!rows[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const item = rows[0];
  res.json({
    ...item,
    providers: JSON.parse(item.providers),
    createdAt: item.createdAt.toISOString(),
  });
});

router.post("/history", async (req, res) => {
  const { name, prompt, systemPrompt, providers, winner, temperature, results } = req.body as {
    name: string;
    prompt: string;
    systemPrompt?: string;
    providers: string[];
    winner: string;
    temperature: number;
    results: string;
  };

  const inserted = await db
    .insert(historyTable)
    .values({
      name,
      prompt,
      systemPrompt,
      providers: JSON.stringify(providers),
      winner,
      temperature,
      results,
    })
    .returning();

  const item = inserted[0];
  res.json({
    ...item,
    providers,
    createdAt: item.createdAt.toISOString(),
  });
});

router.delete("/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(historyTable).where(eq(historyTable.id, id));
  res.json({ success: true });
});

export default router;
