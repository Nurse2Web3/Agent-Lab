import { useState } from "react";
import { X, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@workspace/api-client-react";
import type { PromptVersion } from "@/hooks/use-history";

interface DiffSegment { type: "same" | "added" | "removed"; text: string }

interface Props {
  historyId: number;
  versions: PromptVersion[];
  defaultV1?: number;
  defaultV2?: number;
  onClose: () => void;
}

export function VersionDiffModal({ historyId, versions, defaultV1, defaultV2, onClose }: Props) {
  const [v1Num, setV1Num] = useState(defaultV1 ?? versions[versions.length - 2]?.versionNumber ?? 1);
  const [v2Num, setV2Num] = useState(defaultV2 ?? versions[versions.length - 1]?.versionNumber ?? 2);
  const [diff, setDiff] = useState<{
    v1: PromptVersion; v2: PromptVersion;
    promptDiff: DiffSegment[]; sysDiff: DiffSegment[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadDiff() {
    setIsLoading(true);
    try {
      const data = await apiFetch(`/history/${historyId}/diff/${v1Num}/${v2Num}`);
      setDiff(data);
    } catch {
      setDiff(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCompare() {
    if (v1Num === v2Num) return;
    await loadDiff();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Compare Versions
          </DialogTitle>
        </DialogHeader>

        {/* Version selectors */}
        <div className="flex items-center gap-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <Select value={String(v1Num)} onValueChange={(v) => setV1Num(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.versionNumber} value={String(v.versionNumber)}
                    disabled={v.versionNumber === v2Num}>
                    Version {v.versionNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-muted-foreground text-sm">vs</span>
          <div className="flex items-center gap-2">
            <Select value={String(v2Num)} onValueChange={(v) => setV2Num(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((v) => (
                  <SelectItem key={v.versionNumber} value={String(v.versionNumber)}
                    disabled={v.versionNumber === v1Num}>
                    Version {v.versionNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCompare} disabled={v1Num === v2Num || isLoading} size="sm">
            {isLoading ? "Comparing..." : "Compare"}
          </Button>
        </div>

        {/* Diff view */}
        {diff && (
          <div className="space-y-6 pt-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {diff.v1.versionNumber === 0 ? "Original" : `Version ${diff.v1.versionNumber}`} → Version {diff.v2.versionNumber}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {/* Old version */}
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    v{diff.v1.versionNumber}
                    {diff.v1.createdAt && (
                      <span className="ml-2 font-normal">
                        {new Date(diff.v1.createdAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <div className="text-sm whitespace-pre-wrap">
                    {diff.promptDiff
                      .filter((s) => s.type !== "added")
                      .map((s, i) => (
                        <span
                          key={i}
                          className={s.type === "removed" ? "bg-red-500/20 text-red-700 line-through" : ""}
                        >
                          {s.text}{" "}
                        </span>
                      ))}
                  </div>
                </div>
                {/* New version */}
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    v{diff.v2.versionNumber}
                    {diff.v2.createdAt && (
                      <span className="ml-2 font-normal">
                        {new Date(diff.v2.createdAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                  <div className="text-sm whitespace-pre-wrap">
                    {diff.promptDiff
                      .filter((s) => s.type !== "removed")
                      .map((s, i) => (
                        <span
                          key={i}
                          className={s.type === "added" ? "bg-green-500/20 text-green-700 font-medium" : ""}
                        >
                          {s.text}{" "}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!diff && (
          <div className="text-center py-12 text-muted-foreground">
            Select two different versions and click Compare to see the diff.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}