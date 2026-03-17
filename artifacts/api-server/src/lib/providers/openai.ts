import { ProviderCallOptions, ProviderResult } from "./types.js";
import { computeScores } from "./utils.js";
import { PROVIDER_CONFIG } from "./config.js";

const cfg = PROVIDER_CONFIG.openai;

export async function callOpenAI(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockOpenAIResponse(prompt);
  }

  const start = Date.now();
  try {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const tokenCount = data.usage?.total_tokens ?? Math.round(text.split(" ").length * 1.3);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.000005 * 10000) / 10000;
    const scores = computeScores(text, "openai");

    return {
      provider: "openai",
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
    console.error("OpenAI error:", err);
    return { ...getMockOpenAIResponse(prompt), isDemo: true };
  }
}

function getMockOpenAIResponse(prompt: string): ProviderResult {
  const responses = [
    "GPT-4o delivers a nuanced, well-structured response here. The answer is thorough, covers edge cases, and presents information in a format that's immediately useful for production implementation.",
    "Here is a comprehensive analysis: the approach you're considering is sound, with a few refinements worth noting. OpenAI's models excel at following complex instructions and maintaining context throughout long interactions.",
  ];
  const text = responses[Math.floor(Math.random() * responses.length)] + " Regarding: " + prompt.slice(0, 60);
  const latencyMs = Math.round(900 + Math.random() * 1200);
  const tokenCount = Math.round(text.split(" ").length * 1.3);
  const estimatedCost = Math.round(tokenCount * 0.000005 * 10000) / 10000;
  const scores = computeScores(text, "openai");

  return {
    provider: "openai",
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
