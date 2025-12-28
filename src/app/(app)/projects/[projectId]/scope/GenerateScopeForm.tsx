"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { Label } from "@/src/frontend/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/frontend/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/src/frontend/components/ui/dialog";

export function GenerateScopeForm({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [goals, setGoals] = useState("");
  const [must, setMust] = useState("");
  const [should, setShould] = useState("");
  const [could, setCould] = useState("");
  const [nonGoals, setNonGoals] = useState("");
  const [template, setTemplate] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const applyTemplate = (key: string) => {
    switch (key) {
      case "saas-analytics":
        setGoals("Ship dashboards fast; retention and feature usage insights.");
        setMust("User auth; event ingestion; basic dashboards.");
        setShould("Cohorts; retention; anomaly alerting.");
        setCould("CSV import; Slack notifications.");
        setNonGoals("Complex ETL; multi-tenant RBAC.");
        break;
      case "campus-food":
        setGoals("Help students find nearby affordable meals quickly.");
        setMust("Location search; price filter; basic reviews.");
        setShould("Meal plans; dietary tags; map view.");
        setCould("Coupons; loyalty.");
        setNonGoals("Delivery logistics; payments.");
        break;
      case "none":
        setGoals(""); setMust(""); setShould(""); setCould(""); setNonGoals("");
        break;
    }
    setTemplate(key);
  };

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating scope…");
    try {
      const res = await fetch(`/api/projects/${projectId}/scope/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName ?? "Project",
          goals,
          must,
          should,
          could,
          non_goals: nonGoals,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      toast.success("Scope generated", { id: toastId });
      setOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={loading} variant="default" size="sm" className="inline-flex items-center gap-2">
          Generate scope
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Scope & Features</DialogTitle>
          <DialogDescription>Seed from the Project Brief; optionally add hints below.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Template</Label>
            <Select value={template} onValueChange={(v)=>applyTemplate(v)}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="saas-analytics">SaaS Analytics</SelectItem>
                <SelectItem value="campus-food">Campus Food Finder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Project:&nbsp;<span className="font-medium text-foreground">{projectName ?? "Project"}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals</Label>
            <Textarea id="goals" rows={3} value={goals} onChange={(e)=>setGoals(e.target.value)} placeholder="Key outcomes and value" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="must">Must-have (M)</Label>
            <Textarea id="must" rows={3} value={must} onChange={(e)=>setMust(e.target.value)} placeholder="Non-negotiable features" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="should">Should-have (S)</Label>
            <Textarea id="should" rows={3} value={should} onChange={(e)=>setShould(e.target.value)} placeholder="Important but not critical" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="could">Could-have (C)</Label>
            <Textarea id="could" rows={3} value={could} onChange={(e)=>setCould(e.target.value)} placeholder="Nice-to-have ideas" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="non">Non-goals / Out of scope</Label>
            <Textarea id="non" rows={3} value={nonGoals} onChange={(e)=>setNonGoals(e.target.value)} placeholder="What we will NOT build now" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


