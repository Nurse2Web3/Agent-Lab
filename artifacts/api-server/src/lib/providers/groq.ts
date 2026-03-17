import { ProviderCallOptions, ProviderResult } from "./types.js";
import { getMockGroqResponse } from "../mockResponses.js";
import { computeScores } from "./utils.js";

const MODEL = "llama-3.1-8b-instant";

export async function callGroq(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockGroqResponse(prompt);
  }

  const start = Date.now();
  try {
    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const tokenCount = data.usage?.total_tokens ?? Math.round(text.split(" ").length * 1.3);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.0000002 * 10000) / 10000;
    const scores = computeScores(text, "groq");

    return {
      provider: "groq",
      model: MODEL,
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
    console.error("Groq error:", err);
    return { ...getMockGroqResponse(prompt), isDemo: true };
  }
}
