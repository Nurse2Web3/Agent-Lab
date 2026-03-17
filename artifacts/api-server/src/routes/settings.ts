import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { apiKeysTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { callGemini, callHuggingFace, callGroq } from "../lib/providers/index.js";

const router: IRouter = Router();

const PROVIDER_INFO: Record<string, { model: string; description: string }> = {
  gemini: {
    model: "gemini-1.5-flash",
    description: "Google's balanced and capable AI model with generous free tier.",
  },
  huggingface: {
    model: "mistralai/Mistral-7B-Instruct-v0.3",
    description: "Open-source model access via Hugging Face Inference API.",
  },
  groq: {
    model: "llama-3.1-8b-instant",
    description: "Ultra-fast inference for LLaMA models. Excellent free tier.",
  },
  openai: {
    model: "gpt-4o",
    description: "OpenAI's flagship model. Coming soon.",
  },
  anthropic: {
    model: "claude-3-5-sonnet",
    description: "Anthropic's Claude — thoughtful and safety-focused. Coming soon.",
  },
};

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(apiKeysTable);
  const connectedProviders = new Set(rows.map((r) => r.provider));

  const providers = ["gemini", "huggingface", "groq", "openai", "anthropic"].map((p) => ({
    provider: p,
    connected: connectedProviders.has(p),
    model: PROVIDER_INFO[p]?.model ?? "",
    description: PROVIDER_INFO[p]?.description ?? "",
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
    } else if (provider === "huggingface") {
      result = await callHuggingFace({ prompt: testPrompt, apiKey });
    } else if (provider === "groq") {
      result = await callGroq({ prompt: testPrompt, apiKey });
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
