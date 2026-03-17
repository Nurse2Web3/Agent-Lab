import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Scale, BarChart3, Lock, Sparkles, ChevronRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Hero Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>New: Support for Groq Llama 3 models</span>
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
          A founder-friendly AI testing studio for comparing prompts, models, cost, speed, and output quality side-by-side without writing a single line of code.
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
              View Demo History
            </Link>
          </Button>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-32 grid md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: Scale,
              title: "Side-by-side Comparison",
              desc: "Run the same prompt across Gemini, Hugging Face, and Groq simultaneously. Spot the hallucinations instantly."
            },
            {
              icon: BarChart3,
              title: "Metrics that Matter",
              desc: "Track latency, token count, and estimated cost per API call. Optimize your unit economics before scaling."
            },
            {
              icon: Lock,
              title: "Secure & Private",
              desc: "Bring your own API keys. We never store them, they live securely in your browser's local environment."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl text-left relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Workflow Section */}
      <div className="py-24 border-t border-border/50 bg-background/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How the Lab Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Stop guessing which model is best for your specific use case. Quantify it.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              {[
                { step: "01", title: "Write your prompt", desc: "Craft your system instructions and user prompt. Use templates to get started quickly." },
                { step: "02", title: "Select models", desc: "Choose multiple providers and tweak the temperature setting." },
                { step: "03", title: "Analyze results", desc: "Review speed, cost, and output quality side-by-side. Score the results." },
                { step: "04", title: "Export to code", desc: "Copy the winning API payload as JSON and drop it directly into your codebase." },
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
                  </div>
                  <div className="p-6 space-y-4 font-mono text-sm text-muted-foreground">
                    <p><span className="text-primary">const</span> <span className="text-blue-400">response</span> = <span className="text-primary">await</span> fetch(<span className="text-green-400">'/api/v1/chat'</span>, {'{'}</p>
                    <p className="pl-4">model: <span className="text-green-400">'llama3-70b-8192'</span>,</p>
                    <p className="pl-4">temperature: <span className="text-orange-400">0.7</span>,</p>
                    <p className="pl-4">messages: [...]</p>
                    <p>{'}'});</p>
                    <div className="mt-8 p-4 rounded bg-secondary/30 border border-border text-foreground font-sans">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Groq (Llama 3)</span>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Winner 🏆</span>
                      </div>
                      <p>Here is the generated landing page copy you requested...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-32 relative z-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Ready to optimize your AI?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join founders and engineers building better AI features faster.</p>
          <Button size="lg" className="h-14 px-10 text-base rounded-full shadow-lg shadow-primary/25" asChild>
            <Link href="/playground">Start Testing for Free</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
