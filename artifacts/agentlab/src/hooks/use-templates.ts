import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export type Template = {
  id: number;
  userId: string;
  name: string;
  description: string | null;
  category: string;
  prompt: string;
  systemPrompt: string | null;
  plan: string;
  isPublic: boolean;
  useCount: number;
  createdAt: string;
};

export type SeedTemplate = Omit<Template, "userId" | "plan" | "isPublic" | "useCount"> & {
  sortOrder: number;
};

export function useTemplates() {
  return useQuery<{ seeds: SeedTemplate[]; userTemplates: Template[] }>({
    queryKey: ["templates"],
    queryFn: () => apiFetch("/templates"),
    staleTime: 60_000,
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Template, "id" | "userId" | "createdAt" | "useCount" | "plan">) =>
      apiFetch("/templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Template> & { id: number }) =>
      apiFetch(`/templates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useIncrementTemplateUse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/templates/${id}/use`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}
