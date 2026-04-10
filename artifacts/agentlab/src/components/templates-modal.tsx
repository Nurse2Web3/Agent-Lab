import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Trash2, ArrowRight, Tag, Loader2,
  BookOpen, Code2, BarChart3, Palette, Lock, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useTemplates,
  useSaveTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useIncrementTemplateUse,
  type Template,
  type SeedTemplate,
} from "@/hooks/use-templates";
import { useBillingStatus } from "@/hooks/use-billing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "coding", label: "Coding", icon: Code2 },
  { id: "marketing", label: "Marketing", icon: Tag },
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "creative", label: "Creative", icon: Palette },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (prompt: string, systemPrompt?: string) => void;
}

export function TemplatesModal({ open, onOpenChange, onApply }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creatingName, setCreatingName] = useState("");
  const [creatingPrompt, setCreatingPrompt] = useState("");
  const [creatingSys, setCreatingSys] = useState("");
  const [creatingDesc, setCreatingDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState("general");
  const [creatingPublic, setCreatingPublic] = useState(false);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);

  const { data, isLoading } = useTemplates();
  const save = useSaveTemplate();
  const update = useUpdateTemplate();
  const remove = useDeleteTemplate();
  const incrementUse = useIncrementTemplateUse();
  const { data: billing } = useBillingStatus();
  const { toast } = useToast();

  const plan = billing?.plan ?? "sandbox";
  const isSandbox = plan === "sandbox";
  const canSaveTemplates = plan !== "sandbox";
  const canMakePublic = plan === "studio";

  const seeds = data?.seeds ?? [];
  const userTemplates = data?.userTemplates ?? [];

  // Merge and filter seeds by category
  const filteredSeeds = seeds.filter((t: SeedTemplate) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.prompt.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || t.category === category;
    return matchSearch && matchCat;
  });

  // Filter user templates
  const filteredUserTemplates = userTemplates.filter((t: Template) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.prompt.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || t.category === category;
    return matchSearch && matchCat;
  });

  const handleApply = async (prompt: string, systemPrompt?: string, id?: number) => {
    onApply(prompt, systemPrompt);
    if (id) {
      try {
        await incrementUse.mutateAsync(id);
      } catch {
        // non-critical
      }
    }
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!creatingName.trim() || !creatingPrompt.trim()) {
      toast({ title: "Name and prompt required", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync({
        name: creatingName,
        description: creatingDesc || null,
        category: creatingCategory,
        prompt: creatingPrompt,
        systemPrompt: creatingSys || null,
        isPublic: creatingPublic,
      });
      toast({ title: "Template saved", description: `"${creatingName}" added to your library.` });
      setShowCreate(false);
      setCreatingName("");
      setCreatingPrompt("");
      setCreatingSys("");
      setCreatingDesc("");
      setCreatingCategory("general");
      setCreatingPublic(false);
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast({ title: "Deleted", description: "Template removed from your library." });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
  };

  const openCreate = () => {
    if (isSandbox) {
      setShowUpgradeTooltip(true);
      setTimeout(() => setShowUpgradeTooltip(false), 3000);
      return;
    }
    setShowCreate(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Prompt Templates Library
          </DialogTitle>
          <DialogDescription>
            Browse built-in templates or save your own for faster comparisons.
          </DialogDescription>
        </DialogHeader>

        {/* Search + filter + create */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <cat.icon className="w-3 h-3" />
                    {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Button
              variant={isSandbox ? "outline" : "default"}
              size="sm"
              onClick={openCreate}
              className={cn("gap-1.5", isSandbox && "border-dashed")}
            >
              {isSandbox ? (
                <>
                  <Lock className="w-3.5 h-3.5" /> Save Current
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Save Current
                </>
              )}
            </Button>
            {showUpgradeTooltip && (
              <div className="absolute top-full mt-2 right-0 z-50 bg-popover border rounded-lg shadow-lg p-3 text-xs whitespace-nowrap">
                <p className="font-medium">Upgrade to save templates</p>
                <p className="text-muted-foreground mt-1">Pro or Studio plans can save custom templates.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
            <Badge
              key={cat.id}
              variant={category === cat.id ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(category === cat.id ? "all" : cat.id)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        {/* Template grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* User templates section */}
            {filteredUserTemplates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Your Templates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredUserTemplates.map((tpl: Template, i: number) => (
                    <motion.div
                      key={`user-${tpl.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="cursor-pointer hover:border-primary/40 transition-colors group h-full">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {tpl.name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {tpl.category}
                            </Badge>
                          </div>
                          {tpl.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                            {tpl.prompt.slice(0, 80)}…
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleApply(tpl.prompt, tpl.systemPrompt ?? undefined, tpl.id)}
                            >
                              Use template <ArrowRight className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive/70 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(tpl.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Built-in templates section */}
            {filteredSeeds.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Built-in Templates
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredSeeds.map((tpl: SeedTemplate, i: number) => (
                    <motion.div
                      key={`seed-${tpl.id ?? tpl.name}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="cursor-pointer hover:border-primary/40 transition-colors group h-full">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-semibold leading-tight">
                              {tpl.name}
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {tpl.category}
                            </Badge>
                          </div>
                          {tpl.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tpl.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                            {tpl.prompt.slice(0, 80)}…
                          </p>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleApply(tpl.prompt, tpl.systemPrompt ?? undefined)}
                            >
                              Use template <ArrowRight className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {filteredSeeds.length === 0 && filteredUserTemplates.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No templates match your search.</p>
              </div>
            )}
          </div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t pt-4 mt-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Save as Template
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name *</Label>
                    <Input
                      placeholder="Template name"
                      value={creatingName}
                      onChange={(e) => setCreatingName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select value={creatingCategory} onValueChange={setCreatingCategory}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description (optional)</Label>
                  <Input
                    placeholder="Short description"
                    value={creatingDesc}
                    onChange={(e) => setCreatingDesc(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Prompt *</Label>
                  <Textarea
                    placeholder="Prompt template… use {{placeholder}} for variables"
                    className="h-20 resize-none text-sm mt-1"
                    value={creatingPrompt}
                    onChange={(e) => setCreatingPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">System prompt (optional)</Label>
                  <Textarea
                    placeholder="System prompt"
                    className="h-16 resize-none text-sm mt-1"
                    value={creatingSys}
                    onChange={(e) => setCreatingSys(e.target.value)}
                  />
                </div>
                {canMakePublic && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={creatingPublic}
                      onChange={(e) => setCreatingPublic(e.target.checked)}
                      className="rounded border-input"
                    />
                    <span>Make public (Studio only)</span>
                  </label>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={save.isPending}
                    className="gap-1.5"
                  >
                    {save.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Save Template
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
