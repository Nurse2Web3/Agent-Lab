import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@workspace/api-client-react";

export type PromptVersion = {
  id: number;
  historyId: number;
  versionNumber: number;
  prompt: string;
  systemPrompt: string | null;
  createdAt: string;
};

export type HistoryItem = {
  id: number;
  name: string;
  prompt: string;
  systemPrompt: string | null;
  providers: string[];
  winner: string;
  temperature: number;
  results: string;
  versionCount: number;
  currentVersionId: number | null;
  createdAt: string;
};

export function useGetHistory() {
  return useQuery<{ items: HistoryItem[] }>({
    queryKey: ["history"],
    queryFn: () => apiFetch("/history"),
    staleTime: 30_000,
  });
}

export function useGetHistoryVersions(historyId: number) {
  return useQuery<{ versions: PromptVersion[] }>({
    queryKey: ["history-versions", historyId],
    queryFn: () => apiFetch(`/history/${historyId}/versions`),
    enabled: historyId > 0,
  });
}

export function useSaveRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; prompt: string; systemPrompt?: string;
      providers: string[]; winner: string; temperature: number; results: string;
    }) => apiFetch("/history", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });
}

export function useDeleteRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/history/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });
}

export function useSaveVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; prompt: string; systemPrompt?: string }) =>
      apiFetch(`/history/${id}/version`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["history-versions", vars.id] });
    },
  });
}