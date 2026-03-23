import { ProviderResult } from "./providers/types.js";

export interface ComparisonSummary {
  recommendedWinner: string;
  bestQuality: string;
  cheapest: string;
  fastest: string;
  bestValue: string;
  csvExport: string;
}

export function computeSummary(results: ProviderResult[]): ComparisonSummary {
  if (results.length === 0) {
    return { recommendedWinner: "", bestQuality: "", cheapest: "", fastest: "", bestValue: "", csvExport: "" };
  }

  const bestQuality = results.reduce((best, r) => r.overallScore > best.overallScore ? r : best);
  const cheapest = results.reduce((best, r) => r.estimatedCost < best.estimatedCost ? r : best);
  const fastest = results.reduce((best, r) => r.latencyMs < best.latencyMs ? r : best);
  const bestValue = results.reduce((best, r) => r.costPerQuality < best.costPerQuality ? r : best);

  const maxLatency = Math.max(...results.map((r) => r.latencyMs));
  const maxCost = Math.max(...results.map((r) => r.estimatedCost));

  const scored = results.map((r) => ({
    provider: r.provider,
    score:
      (r.overallScore / 5) * 0.4 +
      (1 - r.latencyMs / (maxLatency + 1)) * 0.3 +
      (1 - r.estimatedCost / (maxCost + 0.0001)) * 0.3,
  }));
  const winner = scored.reduce((best, r) => r.score > best.score ? r : best);

  const csvRows = [
    "Provider,Model,Speed (ms),Input Tokens,Output Tokens,Total Tokens,Dollar Cost,Quality Score,Overall Score,Cost/Quality",
    ...results.map((r) =>
      [
        r.provider,
        r.model ?? "",
        r.latencyMs ?? 0,
        r.inputTokens ?? 0,
        r.outputTokens ?? 0,
        r.tokenCount ?? 0,
        r.dollarCost ?? r.estimatedCost ?? 0,
        (r.qualityScore ?? 0).toFixed(1),
        (r.overallScore ?? 0).toFixed(1),
        (r.costPerQuality ?? (r.estimatedCost / (r.overallScore + 0.001))).toFixed(8),
      ].join(",")
    ),
  ];
  const csvExport = csvRows.join("\n");

  return {
    recommendedWinner: winner.provider,
    bestQuality: bestQuality.provider,
    cheapest: cheapest.provider,
    fastest: fastest.provider,
    bestValue: bestValue.provider,
    csvExport,
  };
}
