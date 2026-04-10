import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsageSummary, useUsageDaily, useUsageExport } from "@/hooks/use-usage";
import { useBillingStatus } from "@/hooks/use-billing";

function formatCredits(n: number) {
  return "$" + (n / 10000).toFixed(4);
}

export default function Usage() {
  const { data: summary, isLoading } = useUsageSummary();
  const { data: daily } = useUsageDaily();
  const exportMutation = useUsageExport();
  const { data: billing } = useBillingStatus();
  const plan = billing?.plan ?? "sandbox";

  // Pro+ only — sandbox sees upgrade prompt
  const isProOrAbove = plan === "pro" || plan === "studio";

  if (!isProOrAbove) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Token Usage Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Usage tracking and cost analytics are available on Pro and Studio plans.
        </p>
        <Button asChild><Link to="/pricing">Upgrade Your Plan</Link></Button>
      </div>
    );
  }

  const dailyItems = daily?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild><Link to="/playground"><ArrowLeft className="w-5 h-5" /></Link></Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Token Usage & Costs</h1>
            <p className="text-muted-foreground mt-1">Track your API spend across all providers.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => exportMutation.mutate({})} disabled={exportMutation.isPending}>
          <Download className="w-4 h-4 mr-2" />
          {exportMutation.isPending ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Spend", value: formatCredits(summary?.today?.costCredits ?? 0) },
          { label: "Today's Tokens", value: (summary?.today?.totalTokens ?? 0).toLocaleString() },
          { label: "Today's Comparisons", value: String(summary?.today?.comparisons ?? 0) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{isLoading ? "—" : value}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Period summaries */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "This Week", value: formatCredits(summary?.thisWeek?.cost ?? 0), sub: `${Number(summary?.thisWeek?.comparisons ?? 0).toLocaleString()} comparisons` },
          { label: "This Month", value: formatCredits(summary?.thisMonth?.cost ?? 0), sub: `${Number(summary?.thisMonth?.comparisons ?? 0).toLocaleString()} comparisons` },
          { label: "All Time", value: formatCredits(summary?.allTime?.cost ?? 0), sub: `${Number(summary?.allTime?.comparisons ?? 0).toLocaleString()} comparisons` },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{isLoading ? "—" : value}</p>
              <p className="text-xs text-muted-foreground mt-1">{isLoading ? "—" : sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily breakdown table */}
      <Card>
        <CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-right py-2 font-medium">Input Tokens</th>
                  <th className="text-right py-2 font-medium">Output Tokens</th>
                  <th className="text-right py-2 font-medium">Total Tokens</th>
                  <th className="text-right py-2 font-medium">Cost</th>
                  <th className="text-right py-2 font-medium">Comparisons</th>
                </tr>
              </thead>
              <tbody>
                {dailyItems.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No usage data yet. Run some comparisons!</td></tr>
                )}
                {dailyItems.map((row: any) => (
                  <tr key={row.date} className="border-b border-border/50">
                    <td className="py-2">{row.date}</td>
                    <td className="text-right">{Number(row.totalInputTokens).toLocaleString()}</td>
                    <td className="text-right">{Number(row.totalOutputTokens).toLocaleString()}</td>
                    <td className="text-right">{Number(row.totalTokens).toLocaleString()}</td>
                    <td className="text-right font-medium">{formatCredits(row.totalCostCredits)}</td>
                    <td className="text-right">{row.comparisonCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
