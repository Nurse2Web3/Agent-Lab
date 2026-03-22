import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";
const TRIAL_USER_ID_KEY = "trial_user_id";
const TRIAL_USER_EMAIL_KEY = "trial_user_email";

function consumeUrlTrialParams(): { trialId?: string; trialError?: string } {
  const params = new URLSearchParams(window.location.search);
  const trialId = params.get("trialId") ?? undefined;
  const trialError = params.get("trialError") ?? undefined;
  if (trialId || trialError) {
    params.delete("trialId");
    params.delete("trialError");
    const newSearch = params.toString();
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
    window.history.replaceState(null, "", newUrl);
  }
  return { trialId, trialError };
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export interface TrialStatus {
  id: string;
  email: string;
  emailVerified: boolean;
  cardVerified: boolean;
  trialUsed: boolean;
  comparisonsUsed: number;
  comparisonsRemaining: number;
  trialLimit: number;
  exhausted: boolean;
}

export type TrialStage = "loading" | "signup" | "pending_verify" | "needs_card" | "active" | "exhausted";

export function useTrialStatus() {
  const [stage, setStage] = useState<TrialStage>("loading");
  const [status, setStatus] = useState<TrialStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem(TRIAL_USER_ID_KEY) : null;

  const refresh = useCallback(async () => {
    const id = localStorage.getItem(TRIAL_USER_ID_KEY);
    if (!id) {
      setStage("signup");
      return;
    }
    try {
      const data: TrialStatus = await apiFetch(`/trial/status/${id}`);
      setStatus(data);
      if (data.exhausted) {
        setStage("exhausted");
      } else if (!data.emailVerified) {
        setStage("pending_verify");
      } else if (!data.cardVerified) {
        setStage("needs_card");
      } else {
        setStage("active");
      }
    } catch {
      localStorage.removeItem(TRIAL_USER_ID_KEY);
      setStage("signup");
    }
  }, []);

  useEffect(() => {
    const { trialId, trialError } = consumeUrlTrialParams();
    if (trialId) {
      localStorage.setItem(TRIAL_USER_ID_KEY, trialId);
    }
    if (trialError === "expired") {
      setUrlError("Your verification link has expired. Please sign up again to get a new one.");
    } else if (trialError === "invalid") {
      setUrlError("This verification link is invalid or has already been used.");
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (stage === "pending_verify") {
      const interval = setInterval(refresh, 4000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [stage, refresh]);

  async function getCaptcha(): Promise<{ question: string; token: string; formLoadedAt?: number }> {
    return apiFetch("/trial/captcha");
  }

  async function signup(opts: {
    email: string;
    captchaToken: string;
    deviceFingerprint: string;
    website?: string;
    formLoadedAt?: number;
  }): Promise<{ alreadyVerified: boolean; _devVerifyUrl?: string }> {
    const data = await apiFetch("/trial/signup", {
      method: "POST",
      body: JSON.stringify(opts),
    });
    localStorage.setItem(TRIAL_USER_ID_KEY, data.trialUserId);
    localStorage.setItem(TRIAL_USER_EMAIL_KEY, opts.email);
    setError(null);
    if (data.alreadyVerified) {
      await refresh();
    } else {
      setStage("pending_verify");
    }
    return { alreadyVerified: data.alreadyVerified, _devVerifyUrl: data._devVerifyUrl };
  }

  async function createSetupIntent(): Promise<string> {
    const id = localStorage.getItem(TRIAL_USER_ID_KEY);
    if (!id) throw new Error("No trial account found.");
    const data = await apiFetch("/trial/setup-intent", {
      method: "POST",
      body: JSON.stringify({ trialUserId: id }),
    });
    if (data.alreadyVerified) {
      await refresh();
      throw new Error("ALREADY_VERIFIED");
    }
    return data.clientSecret as string;
  }

  async function activateCard(paymentMethodId: string): Promise<void> {
    const id = localStorage.getItem(TRIAL_USER_ID_KEY);
    if (!id) throw new Error("No trial account found.");
    await apiFetch("/trial/activate-card", {
      method: "POST",
      body: JSON.stringify({ trialUserId: id, paymentMethodId }),
    });
    await refresh();
  }

  function notifyComparisonUsed() {
    refresh();
  }

  return {
    stage,
    status,
    error,
    urlError,
    setError,
    userId,
    storedEmail: typeof window !== "undefined" ? localStorage.getItem(TRIAL_USER_EMAIL_KEY) : null,
    signup,
    getCaptcha,
    refresh,
    createSetupIntent,
    activateCard,
    notifyComparisonUsed,
  };
}
