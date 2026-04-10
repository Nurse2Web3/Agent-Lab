import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { historyTable, promptVersionsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/history", async (_req, res) => {
  const items = await db.select().from(historyTable).orderBy(desc(historyTable.createdAt));
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
  if (!rows[0]) { res.status(404).json({ error: "Not found" }); return; }
  const item = rows[0];
  res.json({
    ...item,
    providers: JSON.parse(item.providers),
    createdAt: item.createdAt.toISOString(),
  });
});

// POST /history — create history + first version
router.post("/history", async (req, res) => {
  const { name, prompt, systemPrompt, providers, winner, temperature, results } = req.body as {
    name: string; prompt: string; systemPrompt?: string;
    providers: string[]; winner: string; temperature: number; results: string;
  };

  const inserted = await db
    .insert(historyTable)
    .values({
      name, prompt, systemPrompt,
      providers: JSON.stringify(providers),
      winner, temperature, results,
      versionCount: 1,
    })
    .returning();

  const historyId = inserted[0].id;

  const version = await db
    .insert(promptVersionsTable)
    .values({
      historyId,
      versionNumber: 1,
      prompt,
      systemPrompt: systemPrompt ?? null,
    })
    .returning();

  await db
    .update(historyTable)
    .set({ currentVersionId: version[0].id })
    .where(eq(historyTable.id, historyId));

  const item = inserted[0];
  res.status(201).json({
    ...item,
    providers,
    createdAt: item.createdAt.toISOString(),
  });
});

// PUT /history/:id/version — save new version (called on every prompt edit)
router.put("/history/:id/version", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { prompt, systemPrompt } = req.body as { prompt: string; systemPrompt?: string };

  const existing = await db.select().from(historyTable).where(eq(historyTable.id, id));
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const nextVersion = (existing[0].versionCount ?? 1) + 1;

  const version = await db
    .insert(promptVersionsTable)
    .values({
      historyId: id,
      versionNumber: nextVersion,
      prompt,
      systemPrompt: systemPrompt ?? null,
    })
    .returning();

  await db
    .update(historyTable)
    .set({
      prompt,
      systemPrompt,
      versionCount: nextVersion,
      currentVersionId: version[0].id,
    })
    .where(eq(historyTable.id, id));

  res.json({ version: { ...version[0], createdAt: version[0].createdAt.toISOString() }, versionCount: nextVersion });
});

// GET /history/:id/versions — version timeline
router.get("/history/:id/versions", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const versions = await db
    .select()
    .from(promptVersionsTable)
    .where(eq(promptVersionsTable.historyId, id))
    .orderBy(promptVersionsTable.versionNumber);
  res.json({
    versions: versions.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })),
  });
});

// GET /history/:id/diff/:v1/:v2 — side-by-side diff
router.get("/history/:id/diff/:v1/:v2", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const v1 = parseInt(req.params.v1, 10);
  const v2 = parseInt(req.params.v2, 10);

  const rows = await db
    .select()
    .from(promptVersionsTable)
    .where(and(
      eq(promptVersionsTable.historyId, id),
    ))
    .orderBy(promptVersionsTable.versionNumber);

  const oldVer = rows.find((r) => r.versionNumber === v1);
  const newVer = rows.find((r) => r.versionNumber === v2);

  if (!oldVer || !newVer) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  // Simple word-level diff — split into words and compare
  function computeWordDiff(oldText: string, newText: string) {
    const oldWords = (oldText || "").split(/\s+/);
    const newWords = (newText || "").split(/\s+/);
    const result: Array<{ type: "same" | "added" | "removed"; text: string }> = [];

    // Simple LCS-based diff
    const lcs = computeLCS(oldWords, newWords);
    let oi = 0, ni = 0, li = 0;
    while (oi < oldWords.length || ni < newWords.length) {
      if (li < lcs.length && oi < oldWords.length && ni < newWords.length &&
          oldWords[oi] === lcs[li] && newWords[ni] === lcs[li]) {
        result.push({ type: "same", text: oldWords[oi] });
        oi++; ni++; li++;
      } else if (ni < newWords.length && (li >= lcs.length || newWords[ni] !== lcs[li])) {
        result.push({ type: "added", text: newWords[ni] });
        ni++;
      } else {
        result.push({ type: "removed", text: oldWords[oi] });
        oi++;
      }
    }
    return result;
  }

  function computeLCS(a: string[], b: string[]): string[] {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) { lcs.unshift(a[i - 1]); i--; j--; }
      else if (dp[i - 1][j] > dp[i][j - 1]) i--;
      else j--;
    }
    return lcs;
  }

  const promptDiff = computeWordDiff(oldVer.prompt, newVer.prompt);
  const sysDiff = computeWordDiff(oldVer.systemPrompt ?? "", newVer.systemPrompt ?? "");

  res.json({
    v1: { ...oldVer, createdAt: oldVer.createdAt.toISOString() },
    v2: { ...newVer, createdAt: newVer.createdAt.toISOString() },
    promptDiff,
    sysDiff,
  });
});

router.delete("/history/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  await db.delete(promptVersionsTable).where(eq(promptVersionsTable.historyId, id));
  await db.delete(historyTable).where(eq(historyTable.id, id));
  res.json({ success: true });
});

export default router;