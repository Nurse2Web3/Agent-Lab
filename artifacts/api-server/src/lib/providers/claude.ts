import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";
import { PROVIDER_CONFIG } from "./config.js";

const cfg = PROVIDER_CONFIG.claude;

export async function callClaude(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockClaudeResponse(prompt);
  }

  const start = Date.now();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.defaultModel,
        max_tokens: 1024,
        system: systemPrompt || undefined,
        messages: [{ role: "user", content: prompt }],
        temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    const tokenCount = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)
      || Math.round(text.split(" ").length * 1.3);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.000003 * 10000) / 10000;
    const scores = computeScores(text, "claude");

    return {
      provider: "claude",
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
    console.error("Claude error:", err);
    return { ...getMockClaudeResponse(prompt), isDemo: true };
  }
}

function getMockClaudeResponse(prompt: string): ProviderResult {
  const responses = [
    "Claude approaches this thoughtfully, weighing multiple considerations before arriving at a precise, well-reasoned response. Nuance and accuracy are prioritized, with clear acknowledgment of uncertainty where it exists.",
    "Let me think through this carefully. The core question here involves trade-offs that deserve careful consideration. Claude excels at reasoning through ambiguous situations and providing structured, honest guidance.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " In response to: " + prompt.slice(0, 60);
  const latencyMs = Math.round(800 + Math.random() * 1000);
  const tokenCount = Math.round(text.split(" ").length * 1.3);
  const estimatedCost = Math.round(tokenCount * 0.000003 * 10000) / 10000;
  const scores = computeScores(text, "claude");

  return {
    provider: "claude",
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
