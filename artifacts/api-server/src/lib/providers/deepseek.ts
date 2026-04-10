import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";

const MODEL = "deepseek-chat";
const BASE_URL = "https://api.deepseek.com";

const INPUT_COST_PER_M  = 0.27;
const OUTPUT_COST_PER_M = 1.10;

function calcCost(inputTokens: number, outputTokens: number) {
  return (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
}

function getMockDeepSeekResponse(prompt: string): ProviderResult {
  const responses = [
    "DeepSeek V3 delivers precise, structured responses with strong reasoning chains. The model excels at technical depth and demonstrates competitive performance on par with frontier models at significantly lower cost.",
    "Analysis complete: DeepSeek V3 provides thorough, well-structured reasoning with particular strength in technical domains. Cost-efficiency combined with high capability makes it a compelling production choice.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " Input: " + prompt.slice(0, 60);
  const latencyMs = Math.round(700 + Math.random() * 900);
  const inputTokens = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount = inputTokens + outputTokens;
  const rawCost = calcCost(inputTokens, outputTokens);
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost = `$${rawCost.toFixed(6)}`;
  const scores = computeScores(text, "deepseek");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  return {
    provider: "deepseek",
    model: MODEL,
    text,
    latencyMs,
    inputTokens,
    outputTokens,
    tokenCount,
    estimatedCost,
    dollarCost,
    costPerQuality,
    qualityScore: scores.quality,
    clarityScore: scores.clarity,
    toneScore: scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}

export async function callDeepSeek(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockDeepSeekResponse(prompt);
  }

  const start = Date.now();
  try {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const inputTokens  = data.usage?.prompt_tokens    ?? Math.round(text.split(" ").length * 0.9);
    const outputTokens = data.usage?.completion_tokens ?? Math.round(text.split(" ").length * 0.4);
    const tokenCount   = inputTokens + outputTokens;
    const latencyMs    = Date.now() - start;
    const rawCost      = calcCost(inputTokens, outputTokens);
    const estimatedCost = Math.round(rawCost * 10000) / 10000;
    const dollarCost    = `$${rawCost.toFixed(6)}`;
    const scores        = computeScores(text, "deepseek");
    const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

    return {
      provider: "deepseek",
      model: MODEL,
      text,
      latencyMs,
      inputTokens,
      outputTokens,
      tokenCount,
      estimatedCost,
      dollarCost,
      costPerQuality,
      qualityScore: scores.quality,
      clarityScore: scores.clarity,
      toneScore: scores.tone,
      overallScore: scores.overall,
      isDemo: false,
    };
  } catch (err) {
    console.error("DeepSeek error:", err);
    return { ...getMockDeepSeekResponse(prompt), isDemo: true };
  }
}
