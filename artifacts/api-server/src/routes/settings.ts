import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGroq, callOpenAI, callClaude, PROVIDER_CONFIG } from "../lib/providers/index.js";

const ENV_KEY_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  grok: "XAI_API_KEY",
};

const router: IRouter = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(apiKeysTable);
  const connectedProviders = new Set(rows.map((r) => r.provider));

  const providers = Object.values(PROVIDER_CONFIG).map((cfg) => {
    const hasEnvKey = !!(ENV_KEY_MAP[cfg.id] && process.env[ENV_KEY_MAP[cfg.id]!]);
    return {
      provider: cfg.id,
      label: cfg.label,
      connected: connectedProviders.has(cfg.id) || hasEnvKey,
      model: cfg.defaultModel,
      description: cfg.description,
      plans: cfg.plans,
      active: cfg.active,
    };
  });

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
  let apiKey = rows[0]?.encryptedKey;
  if (!apiKey) {
    const envName = ENV_KEY_MAP[provider];
    if (envName) apiKey = process.env[envName];
  }

  if (!apiKey) {
    res.json({ success: false, message: "No API key found for this provider", latencyMs: 0 });
    return;
  }

  const start = Date.now();
  try {
    const testPrompt = "Say hello in one sentence.";
    let result;

    if (provider === "grok") {
      result = await callGroq({ prompt: testPrompt, apiKey });
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
