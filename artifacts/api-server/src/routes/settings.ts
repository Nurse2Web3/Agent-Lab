import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGemini, callGroq, callKimi, callOpenAI, callClaude, PROVIDER_CONFIG } from "../lib/providers/index.js";

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(apiKeysTable);
  const connectedProviders = new Set(rows.map((r) => r.provider));

  const providers = Object.values(PROVIDER_CONFIG).map((cfg) => ({
    provider: cfg.id,
    label: cfg.label,
    connected: connectedProviders.has(cfg.id),
    model: cfg.defaultModel,
    description: cfg.description,
    plans: cfg.plans,
    active: cfg.active,
  }));

  res.json({ providers });
});

router.post("/settings", async (req, res) => {
  const { provider, apiKey } = req.body as { provider: string; apiKey: string };

  if (!provider || !apiKey) {
    res.status(400).json({ success: false, message: "provider and apiKey are required" });
    return;
  }

  await db
    .insert(apiKeysTable)
    .values({ provider, encryptedKey: apiKey })
    .onConflictDoUpdate({
      target: apiKeysTable.provider,
      set: { encryptedKey: apiKey, updatedAt: new Date() },
    });

  res.json({ success: true, message: "API key saved successfully" });
});

router.post("/settings/test", async (req, res) => {
  const { provider } = req.body as { provider: string };

  const rows = await db.select().from(apiKeysTable).where(eq(apiKeysTable.provider, provider));
  const apiKey = rows[0]?.encryptedKey;

  if (!apiKey) {
    res.json({ success: false, message: "No API key found for this provider", latencyMs: 0 });
    return;
  }

  const start = Date.now();
  try {
    const testPrompt = "Say hello in one sentence.";
    let result;

    if (provider === "gemini") {
      result = await callGemini({ prompt: testPrompt, apiKey });
    } else if (provider === "grok") {
      result = await callGroq({ prompt: testPrompt, apiKey });
    } else if (provider === "kimi") {
      result = await callKimi({ prompt: testPrompt, apiKey });
    } else if (provider === "openai") {
      result = await callOpenAI({ prompt: testPrompt, apiKey });
    } else if (provider === "claude") {
      result = await callClaude({ prompt: testPrompt, apiKey });
    } else {
      res.json({ success: false, message: "Provider not supported yet", latencyMs: 0 });
      return;
    }

    const latencyMs = Date.now() - start;
    res.json({
      success: !result.isDemo,
      message: result.isDemo ? "Connection failed — check your API key" : "Connection successful!",
      latencyMs,
    });
  } catch {
    res.json({ success: false, message: "Connection test failed", latencyMs: Date.now() - start });
  }
});

export default router;
