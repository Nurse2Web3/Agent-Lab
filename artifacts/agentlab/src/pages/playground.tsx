import { useState } from "react";
import { useRunComparison, useSaveRun } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Save, Copy, Loader2, Star, AlertCircle, Clock, DollarSign, Database, Tag, FlaskConical, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ProviderIcon, ProviderBadge } from "@/components/provider-icon";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PROVIDERS = [
  { id: "Gemini", name: "Google Gemini", model: "gemini-1.5-pro" },
  { id: "HuggingFace", name: "Hugging Face", model: "mistralai/Mistral-7B-Instruct" },
  { id: "Groq", name: "Groq", model: "llama3-70b-8192" },
];

const TEMPLATES = [
  { name: "Support Bot", prompt: "A customer is complaining about a delayed refund. Write a polite, empathetic response.", sys: "You are an expert customer success manager. Keep it brief and professional." },
  { name: "Code Review", prompt: "Review this React code for performance issues: useEffect(() => { fetch('/api').then(r => set(r.data)) })", sys: "You are a senior React developer. Point out anti-patterns." },
  { name: "Product Copy", prompt: "Write a short landing page hero section for an AI-powered code editor.", sys: "You are a world-class startup copywriter. Use strong, action-oriented verbs." },
];

export default function Playground() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["Gemini", "Groq"]);
  const [temperature, setTemperature] = useState([0.7]);
  const [scores, setScores] = useState<Record<string, number>>({});
  
  const { mutate: runCompare, data: response, isPending, error } = useRunComparison();
  const { mutate: saveToHistory, isPending: isSaving } = useSaveRun();

  const handleRun = () => {
    if (!prompt) {
      toast({ title: "Prompt required", description: "Please enter a prompt to test.", variant: "destructive" });
      return;
    }
    if (selectedProviders.length === 0) {
      toast({ title: "Provider required", description: "Select at least one provider.", variant: "destructive" });
      return;
    }
    
    // Reset scores
    setScores({});
    
    runCompare({
      data: {
        prompt,
        systemPrompt,
        providers: selectedProviders,
        temperature: temperature[0]
      }
    });
  };

  const handleSaveWinner = (providerName: string) => {
    if (!response || !prompt) return;
    
    const resultsStr = JSON.stringify(response.results);
    
    saveToHistory(
      {
        data: {
          name: prompt.slice(0, 30) + "...",
          prompt,
          systemPrompt,
          providers: selectedProviders,
          winner: providerName,
          temperature: temperature[0],
          results: resultsStr
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Saved to history", description: `${providerName} was marked as the winner.` });
        },
        onError: () => {
          toast({ title: "Failed to save", description: "Could not save the run.", variant: "destructive" });
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Column: Controls */}
        <div className="w-full xl:w-[400px] flex-shrink-0 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-6 sticky top-24">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" /> Compare Setup
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {TEMPLATES.map((tpl, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1"
                    onClick={() => {
                      setPrompt(tpl.prompt);
                      setSystemPrompt(tpl.sys);
                    }}
                  >
                    <Tag className="w-3 h-3 mr-1" /> {tpl.name}
                  </Badge>
                ))}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>System Prompt (Optional)</Label>
                  <Textarea 
                    placeholder="e.g. You are a helpful assistant..." 
                    className="h-20 resize-none bg-background/50"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>User Prompt <span className="text-destructive">*</span></Label>
                  <Textarea 
                    placeholder="Ask something..." 
                    className="h-32 resize-none bg-background/50 border-primary/30 focus-visible:ring-primary/20"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <Label className="text-base">Providers</Label>
              <div className="space-y-3">
                {PROVIDERS.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id={`provider-${p.id}`} 
                        checked={selectedProviders.includes(p.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedProviders([...selectedProviders, p.id]);
                          else setSelectedProviders(selectedProviders.filter(id => id !== p.id));
                        }}
                      />
                      <label htmlFor={`provider-${p.id}`} className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                        <ProviderIcon provider={p.id} className="w-4 h-4" />
                        {p.name}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{p.model}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm font-mono text-muted-foreground">{temperature[0]}</span>
              </div>
              <Slider 
                value={temperature} 
                onValueChange={setTemperature} 
                max={2} step={0.1} 
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">Higher values make output more random, lower values more deterministic.</p>
            </div>

            <Button 
              className="w-full h-12 text-base rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" 
              onClick={handleRun}
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Comparing providers...</>
              ) : (
                <><Play className="mr-2 h-5 w-5 fill-current" /> Run Comparison</>
              )}
            </Button>
            
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Failed to run comparison. Check API keys in Settings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="flex-1 min-w-0">
          {!response && !isPending && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border/40 rounded-3xl bg-secondary/10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ready to compare</h3>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                Write a prompt, choose your providers, and run. You'll get outputs, scores, and a recommended winner — side by side.
              </p>
            </div>
          )}

          {isPending && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(selectedProviders.length || 2)].map((_, i) => (
                <Card key={i} className="bg-card/50 border-border/50 animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-secondary rounded w-1/3 mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/4" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-4 bg-secondary rounded w-full" />
                    <div className="h-4 bg-secondary rounded w-[90%]" />
                    <div className="h-4 bg-secondary rounded w-[95%]" />
                    <div className="h-4 bg-secondary rounded w-[60%]" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {response && !isPending && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Winner Engine Panel */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden shadow-lg shadow-primary/10">
                <div className="px-6 py-3 border-b border-primary/20 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-wider">Winner Engine</span>
                </div>
                <div className="p-6 flex flex-wrap gap-6 items-center justify-between">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recommended Winner</p>
                    <div className="flex items-center gap-3">
                      <ProviderIcon provider={response.recommendedWinner} className="w-6 h-6 text-primary" />
                      <span className="text-2xl font-bold tracking-tight">{response.recommendedWinner}</span>
                      <span className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-full font-semibold">Ship This 🏆</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Best balance of quality, speed &amp; cost</p>
                  </div>

                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Best Quality</p>
                      <span className="text-sm font-semibold">{response.bestQuality}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Fastest</p>
                      <span className="text-sm font-semibold">{response.fastest}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Cheapest</p>
                      <span className="text-sm font-semibold">{response.cheapest}</span>
                    </div>
                  </div>

                  <div className="border-t border-primary/20 w-full mt-2 pt-4 flex flex-wrap gap-2">
                    <p className="text-xs font-semibold text-muted-foreground w-full mb-1 uppercase tracking-wider">Ready to Ship</p>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => copyToClipboard(prompt, "Prompt")}>
                      <Copy className="w-3 h-3 mr-1.5" /> Copy Prompt
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => copyToClipboard(JSON.stringify({ prompt, systemPrompt, providers: selectedProviders, temperature: temperature[0] }, null, 2), "Settings JSON")}>
                      <Copy className="w-3 h-3 mr-1.5" /> Copy Settings
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => copyToClipboard(JSON.stringify(response, null, 2), "API Payload")}>
                      <Copy className="w-3 h-3 mr-1.5" /> Copy API Payload
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {response.results.map((result, i) => (
                  <motion.div
                    key={result.provider}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={`overflow-hidden h-full flex flex-col ${response.recommendedWinner === result.provider ? 'ring-2 ring-primary border-primary/50 shadow-xl shadow-primary/10' : ''}`}>
                      <CardHeader className="bg-secondary/30 pb-4 border-b border-border/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <ProviderIcon provider={result.provider} />
                              {result.provider}
                            </CardTitle>
                            <CardDescription className="mt-1 font-mono text-xs">{result.model}</CardDescription>
                          </div>
                          {result.isDemo && (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Demo Data</Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-4 pt-2">
                          <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {result.latencyMs}ms
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> ${result.estimatedCost.toFixed(5)}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
                            <Database className="w-3 h-3" /> {result.tokenCount} tkns
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-5 flex-1 relative group">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm"
                          onClick={() => copyToClipboard(result.text, "Output")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                          {result.text}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="bg-secondary/20 border-t border-border/50 p-4 flex-col gap-4">
                        <div className="w-full flex items-center justify-between">
                          <span className="text-sm font-medium">Your Rating</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star}
                                onClick={() => setScores({...scores, [result.provider]: star})}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star className={`w-5 h-5 ${
                                  (scores[result.provider] || 0) >= star 
                                    ? "fill-primary text-primary" 
                                    : "text-muted-foreground/30"
                                }`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Button 
                          variant={response.recommendedWinner === result.provider ? "default" : "secondary"} 
                          className="w-full font-medium"
                          onClick={() => handleSaveWinner(result.provider)}
                          disabled={isSaving}
                        >
                          <Save className="w-4 h-4 mr-2" /> 
                          {response.recommendedWinner === result.provider ? "Save as Winner 🏆" : "Save This Run"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
