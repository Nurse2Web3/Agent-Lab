import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";
import { PROVIDER_CONFIG } from "./config.js";

const cfg = PROVIDER_CONFIG.kimi;

export async function callKimi(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockKimiResponse(prompt);
  }

  const start = Date.now();
  try {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    // Kimi uses an OpenAI-compatible API at api.moonshot.cn
    const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.defaultModel,
        messages,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const tokenCount = data.usage?.total_tokens ?? Math.round(text.split(" ").length * 1.3);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.0000014 * 10000) / 10000;
    const scores = computeScores(text, "kimi");

    return {
      provider: "kimi",
      model: cfg.defaultModel,
      text,
      latencyMs,
      estimatedCost,
      tokenCount,
      qualityScore: scores.quality,
      clarityScore: scores.clarity,
      toneScore: scores.tone,
      overallScore: scores.overall,
      isDemo: false,
    };
  } catch (err) {
    console.error("Kimi error:", err);
    return { ...getMockKimiResponse(prompt), isDemo: true };
  }
}

function getMockKimiResponse(prompt: string): ProviderResult {
  const responses = [
    "Kimi provides structured, context-aware reasoning across long inputs. The analysis here considers multiple angles before converging on a clear recommendation. Long-context understanding is a core strength.",
    "Based on the input, here is a detailed breakdown: the key insight is that context matters as much as content. Kimi excels at maintaining coherence across complex, multi-part prompts.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " Prompt context: " + prompt.slice(0, 60);
  const latencyMs = Math.round(600 + Math.random() * 800);
  const tokenCount = Math.round(text.split(" ").length * 1.3);
  const estimatedCost = Math.round(tokenCount * 0.0000014 * 10000) / 10000;
  const scores = computeScores(text, "kimi");

  return {
    provider: "kimi",
    model: cfg.defaultModel,
    text,
    latencyMs,
    estimatedCost,
    tokenCount,
    qualityScore: scores.quality,
    clarityScore: scores.clarity,
    toneScore: scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}
