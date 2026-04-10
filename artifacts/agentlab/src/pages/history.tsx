import { useGetHistory, useDeleteRun, useGetHistoryVersions } from "@/hooks/use-history";
import { format } from "date-fns";
import { History as HistoryIcon, Trash2, ExternalLink, Search, Loader2, GitCompare } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProviderBadge } from "@/components/provider-icon";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VersionDiffModal } from "@/components/version-diff-modal";

function VersionDiffModalWrapper({ historyId, onClose }: { historyId: number; onClose: () => void }) {
  const { data, isLoading } = useGetHistoryVersions(historyId);
  if (isLoading || !data) return null;
  return <VersionDiffModal historyId={historyId} versions={data.versions} onClose={onClose} />;
}

export default function History() {
  const { data, isLoading, refetch } = useGetHistory();
  const { mutate: deleteRun, isPending: isDeleting } = useDeleteRun();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(0);

  const handleDelete = (id: number) => {
    deleteRun(id, {
        onSuccess: () => {
          toast({ title: "Run deleted", description: "The test run has been removed." });
          refetch();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete run.", variant: "destructive" });
        }
      }
    );
  };

  const items = data?.items || [];
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-primary" /> Test History
          </h1>
          <p className="text-muted-foreground mt-2">Review your past prompt comparisons and winners.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search prompt or name..."
            className="pl-9 bg-card border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-3xl border border-border/50">
          <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4">
            <HistoryIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No history found</h3>
          <p className="text-muted-foreground mb-6">You haven't saved any comparison runs yet.</p>
          <Button asChild>
            <Link href="/playground">Go to Playground</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="glass-card overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6">

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold truncate">{item.name}</h3>
                      <Badge variant="secondary" className="font-mono text-xs bg-secondary/50">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </Badge>
                      {(item as { versionCount?: number }).versionCount > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {(item as { versionCount?: number }).versionCount} versions
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>

                    {(item as { versionCount?: number }).versionCount > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() => {
                          setSelectedHistoryId(item.id);
                          setShowVersionModal(true);
                        }}
                      >
                        <GitCompare className="w-3 h-3 mr-1" />
                        {(item as { versionCount?: number }).versionCount} versions
                      </Button>
                    )}

                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Tested:</span>
                        <div className="flex -space-x-2">
                          {item.providers.map(p => (
                            <div key={p} className="w-6 h-6 rounded-full bg-secondary border border-background flex items-center justify-center z-10 hover:z-20" title={p}>
                              {p.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-4 w-px bg-border" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Winner:</span>
                        <ProviderBadge provider={item.winner} />
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/playground?prompt=${encodeURIComponent(item.prompt)}`}>
                        <ExternalLink className="w-4 h-4 mr-2" /> Reopen
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showVersionModal && selectedHistoryId > 0 && (
        <VersionDiffModalWrapper
          historyId={selectedHistoryId}
          onClose={() => { setShowVersionModal(false); setSelectedHistoryId(0); }}
        />
      )}
    </div>
  );
}