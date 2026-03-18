import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Shield, Loader2, CheckCircle2, ArrowRight, RefreshCw, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useTrialStatus } from "@/hooks/use-trial";
import { getCompositeFingerprint } from "@/lib/deviceFingerprint";

interface TrialGateProps {
  children: React.ReactNode;
  isPaidPlan: boolean;
}

function EmailForm({ onSignedUp }: { onSignedUp: (devUrl?: string) => void }) {
  const { signup, getCaptcha, setError, error } = useTrialStatus();
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);

  async function loadCaptcha() {
    setLoadingCaptcha(true);
    try {
      const c = await getCaptcha();
      setCaptcha(c);
      setCaptchaAnswer("");
    } catch {
      setError("Failed to load CAPTCHA. Please refresh.");
    } finally {
      setLoadingCaptcha(false);
    }
  }

  useEffect(() => {
    loadCaptcha();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !captcha || !captchaAnswer) return;
    setLoading(true);
    setError(null);
    try {
      const fp = getCompositeFingerprint();
      const result = await signup({
        email,
        captchaToken: captcha.token,
        captchaAnswer,
        deviceFingerprint: fp,
      });
      onSignedUp(result._devVerifyUrl);
    } catch (err: any) {
      setError(err.message ?? "Signup failed. Please try again.");
      await loadCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="space-y-2">
        <Label className="text-sm font-medium">Quick check</Label>
        {loadingCaptcha ? (
          <div className="h-11 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <div className="text-sm font-mono bg-secondary/50 px-3 py-2 rounded-lg border border-border/40 text-foreground">
                {captcha?.question}
              </div>
              <Input
                type="number"
                placeholder="Your answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                required
                className="h-11 bg-background/60 border-border/60"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              onClick={loadCaptcha}
              title="New question"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold rounded-xl"
        disabled={loading || loadingCaptcha || !captchaAnswer}
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
          You've used your 3 free comparisons. Upgrade to Pro for Gemini, Grok, and Kimi, or go Premium to unlock OpenAI, Claude, and deeper comparison power.
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
  const { stage, status, storedEmail, refresh } = useTrialStatus();
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | undefined>();
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    if (stage !== "loading") setShowGate(true);
  }, [stage]);

  if (isPaidPlan || stage === "active" || stage === "exhausted") {
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
                  3 comparisons across Gemini and Grok. No credit card required.
                </p>
              </div>
              <EmailForm
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
