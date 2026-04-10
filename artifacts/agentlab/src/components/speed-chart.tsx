import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StreamingProviderResult } from "@/hooks/use-streaming";

interface Props {
  results: StreamingProviderResult[];
}

export function SpeedChart({ results }: Props) {
  const sorted = [...results].sort((a, b) => (a.ttftMs ?? 999999) - (b.ttftMs ?? 999999));
  const maxTTFT = Math.max(...sorted.map((r) => r.ttftMs ?? 0), 1);

  if (results.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Speed Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map((r) => {
          const ttftPct = Math.min(100, ((r.ttftMs ?? 0) / maxTTFT) * 100);
          return (
            <div key={r.provider} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium capitalize">{r.provider}</span>
                <span className="text-muted-foreground">
                  TTFT: {(r.ttftMs ?? 0).toFixed(0)}ms | Total: {(r.latencyMs ?? 0).toFixed(0)}ms
                </span>
              </div>
              <div className="flex gap-1">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${ttftPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
