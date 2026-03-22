import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, Loader2, ArrowRight, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useTrialStatus } from "@/hooks/use-trial";
import { getCompositeFingerprint } from "@/lib/deviceFingerprint";
import { CardActivationModal } from "@/components/card-activation-modal";
import { Turnstile } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = "0x4AAAAAACuksF2bnJ4Rzaei";

interface TrialGateProps {
  children: React.ReactNode;
  isPaidPlan: boolean;
}

interface EmailFormProps {
  signup: ReturnType<typeof useTrialStatus>["signup"];
  error: string | null;
  setError: (e: string | null) => void;
  urlError: string | null;
  onSignedUp: (devUrl?: string) => void;
}

function EmailForm({ signup, error, setError, urlError, onSignedUp }: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const formLoadedAt = useRef(Date.now());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !turnstileToken) return;
    setLoading(true);
    setError(null);
    try {
      const fp = getCompositeFingerprint();
      const result = await signup({
        email,
        captchaToken: turnstileToken,
        deviceFingerprint: fp,
        website: honeypot,
        formLoadedAt: formLoadedAt.current,
      });
      onSignedUp(result._devVerifyUrl);
    } catch (err: any) {
      setError(err.message ?? "Signup failed. Please try again.");
      setTurnstileToken(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none" }} aria-hidden="true">
        <input
          tabIndex={-1}
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trial-email" className="text-sm font-medium">Email address</Label>
        <Input
          id="trial-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-11 bg-background/60 border-border/60"
        />
      </div>

      <div className="flex justify-center">
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          onError={() => {
            setTurnstileToken(null);
            setError("CAPTCHA failed to load. Please refresh the page.");
          }}
          options={{ theme: "dark", size: "normal" }}
        />
      </div>

      {(urlError || error) && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error ?? urlError}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold rounded-xl"
        disabled={loading || !turnstileToken || !email}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting trial…</>
        ) : (
          <>Start your trial <ArrowRight className="ml-2 w-4 h-4" /></>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        By continuing you agree to our terms. One trial per person.
        Temporary email addresses are not accepted.
      </p>
    </form>
  );
}

function PendingVerify({ email, devVerifyUrl, onRefresh }: {
  email: string | null;
  devVerifyUrl?: string;
  onRefresh: () => void;
}) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold mb-1">Check your inbox</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We sent a verification link to <strong className="text-foreground">{email ?? "your email"}</strong>.
          Click it to activate your trial.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
        <Loader2 className="w-3 h-3 animate-spin" />
        Waiting for verification…
      </div>
      {devVerifyUrl && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
          <p className="text-xs font-semibold text-amber-400 mb-1.5">Dev mode — click to verify instantly:</p>
          <a
            href={devVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-300 break-all hover:underline"
          >
            {devVerifyUrl}
          </a>
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={onRefresh} className="text-xs text-muted-foreground">
        <RefreshCw className="w-3 h-3 mr-1.5" />
        Check again
      </Button>
    </div>
  );
}

function ExhaustedBanner() {
  return (
    <div className="text-center space-y-5 p-2">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Your Ai AgentLab Trial has ended</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          You've used your 3 free comparisons. Upgrade to Pro to unlock GROK THE ELON MODEL 🥇 alongside GPT and Claude.
        </p>
      </div>
      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <Button className="w-full h-11 rounded-xl font-semibold" asChild>
          <Link href="/pricing">Upgrade to Pro <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
        <Button variant="outline" className="w-full h-11 rounded-xl text-sm font-semibold" asChild>
          <Link href="/pricing">Go Premium</Link>
        </Button>
      </div>
    </div>
  );
}

function TrialCountBadge({ remaining, total }: { remaining: number; total: number }) {
  const used = total - remaining;
  return (
    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i < used ? "bg-primary/60" : "bg-border"}`}
          />
        ))}
      </div>
      <span>{remaining} comparison{remaining !== 1 ? "s" : ""} remaining in trial</span>
    </div>
  );
}

export function TrialGate({ children, isPaidPlan }: TrialGateProps) {
  const { stage, status, storedEmail, refresh, signup, error, setError, urlError, createSetupIntent, activateCard } = useTrialStatus();
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | undefined>();
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (stage !== "loading") setShowGate(true);
  }, [stage]);

  if (isPaidPlan || stage === "active" || stage === "exhausted" || stage === "needs_card") {
    return (
      <>
        {(stage === "active" && status) && (
          <div className="mb-4 flex items-center justify-between px-1">
            <TrialCountBadge
              remaining={status.comparisonsRemaining}
              total={status.trialLimit}
            />
            <Link href="/pricing" className="text-xs text-primary hover:underline font-medium">
              Upgrade to Pro
            </Link>
          </div>
        )}
        {stage === "needs_card" && (
          <CardActivationModal
            createSetupIntent={createSetupIntent}
            activateCard={activateCard}
            userEmail={storedEmail}
          />
        )}
        {stage === "exhausted" ? (
          <div className="max-w-md mx-auto mt-8">
            <ExhaustedBanner />
          </div>
        ) : (
          children
        )}
      </>
    );
  }

  if (!showGate || stage === "loading") {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="max-w-md mx-auto mt-8"
      >
        <div className="glass-card rounded-3xl p-8 border border-border/40">
          {stage === "signup" && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Start your free trial</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  3 free comparisons — GPT + Claude. Card required to verify identity — <span className="text-emerald-400 font-medium">$0 charged</span>.
                </p>
              </div>
              <EmailForm
                signup={signup}
                error={error}
                setError={setError}
                urlError={urlError}
                onSignedUp={(url) => {
                  setDevVerifyUrl(url);
                }}
              />
            </>
          )}

          {stage === "pending_verify" && (
            <PendingVerify
              email={storedEmail}
              devVerifyUrl={devVerifyUrl}
              onRefresh={refresh}
            />
          )}
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            Upgrade to Pro
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export { TrialCountBadge };
