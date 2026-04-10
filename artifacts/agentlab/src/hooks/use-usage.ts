import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@workspace/api-client-react";

export function useUsageSummary() {
  return useQuery({
    queryKey: ["usage-summary"],
    queryFn: () => apiFetch("/usage/summary"),
    staleTime: 60_000,
  });
}

export function useUsageDaily(opts?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  return useQuery({
    queryKey: ["usage-daily", opts],
    queryFn: () => apiFetch(`/usage/daily?${params}`),
    staleTime: 60_000,
  });
}

export function useUsageByProvider() {
  return useQuery({
    queryKey: ["usage-by-provider"],
    queryFn: () => apiFetch("/usage/by-provider"),
    staleTime: 60_000,
  });
}

export function useUsageExport() {
  return useMutation({
    mutationFn: async (opts: { from?: string; to?: string }) => {
      const params = new URLSearchParams();
      if (opts?.from) params.set("from", opts.from);
      if (opts?.to) params.set("to", opts.to);
      const res = await fetch(`/api/usage/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentlab-usage-${opts?.from ?? "start"}-${opts?.to ?? "end"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
