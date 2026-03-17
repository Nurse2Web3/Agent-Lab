import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, History, Download, Plug, GitCompare, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>The AI decision studio for founders</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Test AI agents. <br className="hidden md:block" />
          <span className="text-gradient-primary">Compare outputs.</span><br />
          Ship with confidence.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          AI AgentLab helps founders compare prompts and models side by side, score what matters, and choose the best option to ship — without scripts, spreadsheets, or switching between tabs.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="h-14 px-8 text-base rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90" asChild>
            <Link href="/playground">
              Try the Lab <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full bg-secondary/50 backdrop-blur border-border/50 hover:bg-secondary" asChild>
            <Link href="/history">
              View Demo
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Problem Statement */}
      <div className="relative z-10 border-t border-border/30 bg-background/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Choosing an AI model for your product is usually messy and manual. You test the same prompt across different tools, compare answers by eye, and try to remember which one was faster, cheaper, or better.{" "}
            <span className="text-foreground font-medium">AI AgentLab turns that into one workflow:</span>{" "}
            run once, compare everything side by side, and pick a winner.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Everything in one view</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">One workflow. No tabs. No spreadsheets. A clear winner.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: GitCompare,
                title: "Side-by-side comparison",
                desc: "Run the same prompt across Gemini, Hugging Face, and Groq simultaneously. See every output next to each other — no switching tabs.",
                highlight: false,
              },
              {
                icon: Trophy,
                title: "Winner Engine",
                desc: "Every run surfaces Best Quality, Cheapest, Fastest, and a Recommended Winner. Make tradeoffs quickly and ship the right choice.",
                highlight: true,
              },
              {
                icon: Zap,
                title: "Demo mode",
                desc: "No API keys required to get started. Realistic simulated outputs show you exactly how the workflow feels before you commit.",
                highlight: false,
              },
              {
                icon: History,
                title: "Saved history",
                desc: "Every run you save is searchable and reopenable. Come back to past comparisons, revisit winners, and track how your thinking evolves.",
                highlight: false,
              },
              {
                icon: Download,
                title: "Production export",
                desc: "Copy the winning prompt, settings, and API payload straight into your product. No rerunning tests just to recreate what worked.",
                highlight: false,
              },
              {
                icon: Plug,
                title: "Connect your providers",
                desc: "Plug in your own API keys for Gemini, Hugging Face, and Groq. Keys stay on the server — never exposed to the browser.",
                highlight: false,
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`glass-card p-8 rounded-3xl text-left relative overflow-hidden group ${feature.highlight ? "border-primary/30 ring-1 ring-primary/20" : ""}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.highlight ? "bg-primary/20 text-primary" : "bg-secondary text-primary"}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                {feature.highlight && (
                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mb-3">Core feature</span>
                )}
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Section */}
      <div className="py-24 border-t border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From first prompt to production-ready choice in minutes.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                { step: "01", title: "Run one prompt across multiple providers", desc: "Write your prompt once. Select which providers to test. Hit run." },
                { step: "02", title: "Compare quality, speed, and cost in one view", desc: "Every output lands side by side with latency, token count, and cost visible at a glance." },
                { step: "03", title: "Get a recommended winner", desc: "The Winner Engine weighs quality, speed, and cost to recommend the best overall option — not just the most impressive answer." },
                { step: "04", title: "Export the winning setup", desc: "Copy the prompt, settings, and full API payload. Drop it into your product. Done." },
              ].map((item, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-primary font-display font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-indigo-500/20 blur-3xl rounded-full" />
              <div className="glass-card rounded-2xl p-2 relative">
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/50">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <span className="ml-2 text-xs text-muted-foreground font-mono">agentlab — compare run</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="h-2 rounded bg-secondary/60 w-3/4" />
                      <div className="h-2 rounded bg-secondary/60 w-1/2" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {["Gemini", "Groq", "HF"].map((p) => (
                        <div key={p} className="rounded-lg border border-border/50 p-3 bg-secondary/20">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">{p}</div>
                          <div className="space-y-1">
                            <div className="h-1.5 rounded bg-secondary/80 w-full" />
                            <div className="h-1.5 rounded bg-secondary/60 w-5/6" />
                            <div className="h-1.5 rounded bg-secondary/40 w-4/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/25">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Recommended Winner</div>
                          <span className="font-bold text-foreground">Groq</span>
                        </div>
                        <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full font-semibold">Ship This 🏆</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth note */}
      <div className="relative z-10 border-t border-border/30 bg-background/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-muted-foreground">
            Built to grow from prompt comparison into full agent testing, version tracking, and workflow evaluation.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Choose with confidence. Ship faster.</h2>
          <p className="text-xl text-muted-foreground mb-10">Join founders who stopped guessing and started comparing.</p>
          <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25" asChild>
            <Link href="/playground">Try the Lab for Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
