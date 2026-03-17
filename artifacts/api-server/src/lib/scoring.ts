import { ProviderResult } from "./providers/types.js";

export interface ComparisonSummary {
  recommendedWinner: string;
  bestQuality: string;
  cheapest: string;
  fastest: string;
}

export function computeSummary(results: ProviderResult[]): ComparisonSummary {
  if (results.length === 0) {
    return { recommendedWinner: "", bestQuality: "", cheapest: "", fastest: "" };
  }

  const bestQuality = results.reduce((best, r) => r.overallScore > best.overallScore ? r : best);
  const cheapest = results.reduce((best, r) => r.estimatedCost < best.estimatedCost ? r : best);
  const fastest = results.reduce((best, r) => r.latencyMs < best.latencyMs ? r : best);

  const scored = results.map(r => ({
    provider: r.provider,
    score: r.overallScore * 0.4 +
      (1 / (r.latencyMs / 1000 + 0.1)) * 0.3 +
      (1 / (r.estimatedCost + 0.0001)) * 0.3,
  }));
  const winner = scored.reduce((best, r) => r.score > best.score ? r : best);

  return {
    recommendedWinner: winner.provider,
    bestQuality: bestQuality.provider,
    cheapest: cheapest.provider,
    fastest: fastest.provider,
  };
}
