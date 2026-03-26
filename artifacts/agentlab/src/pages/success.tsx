import { useEffect } from "react";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Success() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan");

  const planLabel =
    plan === "premium"
      ? "Ai AgentLab Premium"
      : plan === "pro"
        ? "Ai AgentLab Pro"
        : "your plan";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
        <CheckCircle2 className="w-10 h-10 text-green-400" />
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
        <Zap className="w-3 h-3" />
        Subscription Active
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
        Welcome to {planLabel}!
      </h1>

      <p className="text-muted-foreground text-lg max-w-md mb-10">
        Your subscription is confirmed. You now have full access to your plan's
        providers, comparisons, and features. Start comparing AI models
        side-by-side right now.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" className="h-12 px-8 text-sm font-semibold rounded-xl shadow-lg shadow-primary/30">
          <Link href="/playground">
            Start Evaluating <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-8 text-sm font-semibold rounded-xl">
          <Link href="/settings">Manage Settings</Link>
        </Button>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        A receipt has been sent to your email. You can manage your subscription
        at any time from{" "}
        <Link href="/settings" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
