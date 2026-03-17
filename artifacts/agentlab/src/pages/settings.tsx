import { useState } from "react";
import { useGetSettings, useSaveApiKey, useTestConnection } from "@workspace/api-client-react";
import { Key, CheckCircle2, XCircle, Loader2, Server, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ProviderIcon } from "@/components/provider-icon";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data, isLoading, refetch } = useGetSettings();
  const { mutate: saveKey, isPending: isSaving } = useSaveApiKey();
  const { mutate: testConnection, isPending: isTesting } = useTestConnection();
  const { toast } = useToast();
  
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleSave = (provider: string) => {
    const apiKey = keys[provider];
    if (!apiKey) {
      toast({ title: "Key required", description: "Please enter an API key.", variant: "destructive" });
      return;
    }

    saveKey(
      { data: { provider, apiKey } },
      {
        onSuccess: () => {
          toast({ title: "Key saved", description: `${provider} API key securely stored.` });
          setKeys(prev => ({ ...prev, [provider]: "" })); // clear input
          refetch();
        }
      }
    );
  };

  const handleTest = (provider: string) => {
    setTestingId(provider);
    testConnection(
      { data: { provider } },
      {
        onSuccess: (res) => {
          if (res.success) {
             toast({ 
               title: "Connection Successful", 
               description: `Latency: ${res.latencyMs}ms. Ready to test.`,
               className: "bg-success/10 border-success/20 text-success-foreground"
             });
          } else {
             toast({ title: "Connection Failed", description: res.message, variant: "destructive" });
          }
          setTestingId(null);
        },
        onError: () => {
          toast({ title: "Test Failed", description: "Network error occurred.", variant: "destructive" });
          setTestingId(null);
        }
      }
    );
  };

  const hasNoKeys = data?.providers?.every(p => !p.connected);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3 mb-2">
          <Key className="w-8 h-8 text-primary" /> API Keys & Providers
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Connect your API keys to run real simulations. Keys are stored locally and never sent to our database.
        </p>
      </div>

      {hasNoKeys && !isLoading && (
        <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4">
          <Shield className="w-6 h-6 text-yellow-500 shrink-0" />
          <div>
            <h4 className="font-bold text-yellow-600 dark:text-yellow-500">Running in Demo Mode</h4>
            <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80 mt-1">
              You haven't connected any API keys yet. The playground will return simulated responses for demonstration purposes. Add at least one key to run real requests.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-6">
          {data?.providers.map((p) => (
            <Card key={p.provider} className="glass-card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="p-6 sm:w-1/3 bg-secondary/20 border-b sm:border-b-0 sm:border-r border-border/50 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm border border-border">
                      <ProviderIcon provider={p.provider} className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl">{p.provider}</CardTitle>
                  </div>
                  <CardDescription className="mb-4">{p.description}</CardDescription>
                  <div className="mt-auto">
                    {p.connected ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 w-fit">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground w-fit">
                        <XCircle className="w-3 h-3 mr-1" /> Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                    <span>Default Model: <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">{p.model}</code></span>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder={p.connected ? "•••••••••••••••••••• (Key saved)" : `Enter ${p.provider} API Key`}
                        className="pl-9 bg-background/50"
                        value={keys[p.provider] || ""}
                        onChange={(e) => setKeys({...keys, [p.provider]: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={() => handleSave(p.provider)}
                      disabled={!keys[p.provider] || isSaving}
                      className="shrink-0"
                    >
                      Save Key
                    </Button>
                  </div>
                  
                  {p.connected && (
                    <div className="flex justify-end pt-2 border-t border-border/50">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleTest(p.provider)}
                        disabled={testingId === p.provider || isTesting}
                      >
                        {testingId === p.provider ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                        ) : (
                          <><Server className="w-4 h-4 mr-2" /> Test Connection</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {/* Coming Soon Cards */}
          <div className="grid md:grid-cols-2 gap-6 mt-8 opacity-60">
            <h3 className="md:col-span-2 text-lg font-bold border-b border-border/50 pb-2">Coming Soon</h3>
            
            <Card className="bg-card/30 border-dashed">
              <CardHeader className="flex flex-row items-center gap-4">
                <ProviderIcon provider="OpenAI" className="w-8 h-8 opacity-50" />
                <div>
                  <CardTitle>OpenAI</CardTitle>
                  <CardDescription>GPT-4o & GPT-4 Turbo</CardDescription>
                </div>
              </CardHeader>
            </Card>
            
            <Card className="bg-card/30 border-dashed">
              <CardHeader className="flex flex-row items-center gap-4">
                <ProviderIcon provider="Anthropic" className="w-8 h-8 opacity-50" />
                <div>
                  <CardTitle>Anthropic</CardTitle>
                  <CardDescription>Claude 3.5 Sonnet & Opus</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
