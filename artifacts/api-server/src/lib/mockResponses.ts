import { ProviderResult } from "./providers/types.js";

const grokResponses = [
  "Direct answer: yes, this approach works. Key points: (1) speed matters most here, (2) the tradeoff is acceptable, (3) implement with minimal overhead. Grok delivers fast, concise outputs optimized for latency-sensitive applications.",
  "Quick summary: the core idea is sound. Three things to watch: efficiency, scalability, maintainability. Prioritize in that order. Fast inference means faster iteration cycles for your team.",
];

const openaiResponses = [
  "Here is a comprehensive analysis. The request touches on several important dimensions: first, the core functionality which should be addressed by establishing clear requirements; second, the implementation pathway which benefits from a modular approach; and third, the testing strategy which should cover edge cases thoroughly. GPT-4o mini delivers reliable, structured reasoning ideal for production workflows.",
  "Based on the input provided, I recommend a three-phase approach: (1) define success metrics upfront, (2) prototype rapidly with the simplest viable solution, and (3) iterate based on real-world feedback. This framework applies across most product and engineering decisions.",
];

const claudeResponses = [
  "I want to think through this carefully. The question has both an immediate practical dimension and a longer-term strategic one. In the short term, the most important thing is to ensure reliability — users need to trust the system before they'll rely on it. Over time, the focus should shift toward efficiency and scale. Claude prioritizes thoughtful, nuanced responses that hold up under scrutiny.",
  "There are a few ways to approach this, each with distinct tradeoffs. Option A prioritizes speed and simplicity but may require rework later. Option B is more robust upfront but demands more initial investment. My recommendation depends on your timeline and risk tolerance — if you're in early discovery, lean toward A; if you're building for production scale, invest in B.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function computeScores(provider: string) {
  const baseQuality = provider === "claude" ? 4.5 : provider === "openai" ? 4.2 : 3.8;
  const baseClarity = provider === "claude" ? 4.3 : provider === "openai" ? 4.4 : 4.0;
  const baseTone    = provider === "claude" ? 4.6 : provider === "openai" ? 4.1 : 3.7;
  const quality = Math.min(5, Math.max(1, baseQuality + randomBetween(-0.3, 0.3)));
  const clarity = Math.min(5, Math.max(1, baseClarity + randomBetween(-0.3, 0.3)));
  const tone    = Math.min(5, Math.max(1, baseTone    + randomBetween(-0.3, 0.3)));
  const overall = (quality + clarity + tone) / 3;
  return {
    quality: Math.round(quality * 10) / 10,
    clarity: Math.round(clarity * 10) / 10,
    tone:    Math.round(tone    * 10) / 10,
    overall: Math.round(overall * 10) / 10,
  };
}

export function getMockGroqResponse(prompt: string): ProviderResult {
  const INPUT_COST_PER_M  = 0.05;
  const OUTPUT_COST_PER_M = 0.08;
  const text = pickRandom(grokResponses) + " Input summary: " + prompt.slice(0, 60);
  const latencyMs    = Math.round(randomBetween(200, 600));
  const inputTokens  = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.4);
  const tokenCount   = inputTokens + outputTokens;
  const rawCost      = (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost    = `$${rawCost.toFixed(6)}`;
  const scores        = computeScores("grok");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  return {
    provider: "grok",
    model: "llama-3.1-8b-instant",
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
    toneScore:    scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}

export function getMockOpenAIResponse(prompt: string): ProviderResult {
  const INPUT_COST_PER_M  = 0.15;
  const OUTPUT_COST_PER_M = 0.60;
  const text = pickRandom(openaiResponses) + "\n\nContext: " + prompt.slice(0, 100);
  const latencyMs    = Math.round(randomBetween(700, 1600));
  const inputTokens  = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.5);
  const tokenCount   = inputTokens + outputTokens;
  const rawCost      = (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost    = `$${rawCost.toFixed(6)}`;
  const scores        = computeScores("openai");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  return {
    provider: "openai",
    model: "gpt-4o-mini",
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
    toneScore:    scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}

export function getMockClaudeResponse(prompt: string): ProviderResult {
  const INPUT_COST_PER_M  = 3.0;
  const OUTPUT_COST_PER_M = 15.0;
  const text = pickRandom(claudeResponses) + "\n\nRegarding: " + prompt.slice(0, 100);
  const latencyMs    = Math.round(randomBetween(1000, 2200));
  const inputTokens  = Math.round(text.split(" ").length * 0.9);
  const outputTokens = Math.round(text.split(" ").length * 0.5);
  const tokenCount   = inputTokens + outputTokens;
  const rawCost      = (inputTokens * INPUT_COST_PER_M + outputTokens * OUTPUT_COST_PER_M) / 1_000_000;
  const estimatedCost = Math.round(rawCost * 10000) / 10000;
  const dollarCost    = `$${rawCost.toFixed(6)}`;
  const scores        = computeScores("claude");
  const costPerQuality = scores.overall > 0 ? rawCost / scores.overall : 0;

  return {
    provider: "claude",
    model: "claude-3-5-sonnet-20241022",
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
    toneScore:    scores.tone,
    overallScore: scores.overall,
    isDemo: true,
  };
}
