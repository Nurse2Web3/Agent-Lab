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

export type Plan = "free" | "sandbox" | "pro" | "studio";

export interface BillingStatus {
  plan: Plan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscription: {
    status: string;
    currentPeriodEnd: number | null;
  } | null;
}

export interface BillingProduct {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: {
    id: string;
    unitAmount: number;
    currency: string;
    recurring: { interval: string } | null;
  }[];
}

export function useBillingStatus() {
  return useQuery<BillingStatus>({
    queryKey: ["billing-status"],
    queryFn: () => apiFetch("/billing/status"),
    staleTime: 30_000,
  });
}

export function useBillingProducts() {
  return useQuery<{ products: BillingProduct[] }>({
    queryKey: ["billing-products"],
    queryFn: () => apiFetch("/billing/products"),
    staleTime: 5 * 60_000,
  });
}

export function useActivateBillingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      return apiFetch("/billing/activate-session", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-status"] });
    },
  });
}

export function useDeactivateBillingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return apiFetch("/billing/deactivate-session", { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing-status"] });
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const data = await apiFetch("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });
      if (data.url) window.location.href = data.url;
      return data;
    },
  });
}

export function useManageBilling() {
  return useMutation({
    mutationFn: async () => {
      const data = await apiFetch("/billing/portal", { method: "POST" });
      if (data.url) window.location.href = data.url;
      return data;
    },
  });
}
