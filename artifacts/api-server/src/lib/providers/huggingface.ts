import { ProviderCallOptions, ProviderResult } from "./types.js";
import { getMockHuggingFaceResponse } from "../mockResponses.js";
import { computeScores } from "./utils.js";

const MODEL = "mistralai/Mistral-7B-Instruct-v0.3";

export async function callHuggingFace(options: ProviderCallOptions): Promise<ProviderResult> {
  const { prompt, systemPrompt, temperature = 0.7, apiKey } = options;

  if (!apiKey) {
    return getMockHuggingFaceResponse(prompt);
  }

  const start = Date.now();
  try {
    const systemMsg = systemPrompt ? `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n` : "<s>[INST] ";
    const fullPrompt = `${systemMsg}${prompt} [/INST]`;

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            temperature,
            max_new_tokens: 512,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json() as { generated_text?: string }[];
    const text = data[0]?.generated_text ?? "";
    const tokenCount = Math.round((prompt.length + text.length) / 4);
    const latencyMs = Date.now() - start;
    const estimatedCost = Math.round(tokenCount * 0.0000005 * 10000) / 10000;
    const scores = computeScores(text, "huggingface");

    return {
      provider: "huggingface",
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
    console.error("HuggingFace error:", err);
    return { ...getMockHuggingFaceResponse(prompt), isDemo: true };
  }
}
