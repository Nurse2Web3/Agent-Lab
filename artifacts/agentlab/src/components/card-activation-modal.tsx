import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Shield, CreditCard, Lock, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const STRIPE_PK = "pk_live_51TC2tOCs26Gb3UhACBGhYa1B0vyZGMzV5sTuxfVQXmhV27K0XdevRZyUMAX1wjAemXj0oaTkj8hEuMOEOZGaRMP000JvQvNjYw";
const stripePromise = loadStripe(STRIPE_PK);

interface CardActivationModalProps {
  createSetupIntent: () => Promise<string>;
  activateCard: (paymentMethodId: string) => Promise<void>;
  userEmail: string | null;
}

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#7c3aed",
    colorBackground: "#13131a",
    colorText: "#ffffff",
    colorDanger: "#ef4444",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: "10px",
  },
};

function CardForm({ activateCard, onSuccess }: {
  activateCard: (paymentMethodId: string) => Promise<void>;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Card error. Please try again.");
      setLoading(false);
      return;
    }

    const { setupIntent, error: confirmError } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Card verification failed. Please try again.");
      setLoading(false);
      return;
    }

    const pm = setupIntent?.payment_method;
    if (!pm) {
      setError("Card verification incomplete. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const pmId = typeof pm === "string" ? pm : pm.id;
      await activateCard(pmId);
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Failed to activate trial. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
          fields: { billingDetails: { email: "auto" } },
        }}
      />

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-12 font-semibold rounded-xl text-base"
        disabled={loading || !stripe || !elements}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</>
        ) : (
          <><Shield className="w-4 h-4 mr-2" />Activate Free Trial — $0.00 charged</>
        )}
      </Button>
    </form>
  );
}

function ActivatedView() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">Trial activated!</h3>
        <p className="text-sm text-muted-foreground">You're all set. Start comparing now.</p>
      </div>
    </div>
  );
}

export function CardActivationModal({ createSetupIntent, activateCard, userEmail }: CardActivationModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const secret = await createSetupIntent();
        setClientSecret(secret);
      } catch (err: any) {
        if (err.message !== "ALREADY_VERIFIED") {
          setIntentError(err.message ?? "Failed to load card form.");
        }
      } finally {
        setLoadingIntent(false);
      }
    })();
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0d0d14] border border-border/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border/40">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Activate your free trial</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            Card required to verify you're human. Email used: <span className="font-medium text-foreground">{userEmail ?? "your email"}</span>
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, label: "$0 charged now" },
              { icon: <Lock className="w-3.5 h-3.5" />, label: "No auto-renewal" },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Cancel anytime" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                <span className="text-emerald-400">{item.icon}</span>
                <span className="text-[11px] font-semibold text-emerald-400/90">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Why we ask for a card:</span> This is identity verification only. Your card will <span className="font-semibold text-emerald-400">never be charged</span> for the trial. We use it to prevent bot abuse. You can remove it from your Stripe account at any time.
            </p>
          </div>

          {activated ? (
            <ActivatedView />
          ) : loadingIntent ? (
            <div className="h-32 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading secure card form…</span>
            </div>
          ) : intentError ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-red-400">{intentError}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Try again</Button>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: STRIPE_APPEARANCE }}
            >
              <CardForm activateCard={activateCard} onSuccess={() => setActivated(true)} />
            </Elements>
          ) : null}

          <p className="text-center text-xs text-muted-foreground/60">
            Secured by Stripe · <Link href="/pricing" className="underline underline-offset-2 hover:text-muted-foreground">View pricing</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
