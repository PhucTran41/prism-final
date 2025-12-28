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

export function GenerateBriefForm({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [problem, setProblem] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [goals, setGoals] = useState("");
  const [constraints, setConstraints] = useState("");
  const [template, setTemplate] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const applyTemplate = (key: string) => {
    switch (key) {
      case "campus-food":
        setProblem("Students waste time and money finding decent meals on or around campus.");
        setTargetUser("University students and staff who need quick, affordable options.");
        setGoals("Reduce search time; improve decision confidence; track preferences.");
        setConstraints("2‑week MVP; one developer; iOS Safari + Chrome mobile first.");
        break;
      case "saas-analytics":
        setProblem("Early SaaS teams struggle to get reliable product metrics without costly data stacks.");
        setTargetUser("Seed‑stage SaaS founders and PMs.");
        setGoals("Ship dashboards in 1 day; surface retention and feature usage; alert on anomalies.");
        setConstraints("MVP web only; Postgres; privacy‑friendly.");
        break;
      case "fitness-tracker":
        setProblem("People fail to maintain workout routines due to time and motivation.");
        setTargetUser("Busy professionals seeking quick, trackable activities.");
        setGoals("Increase streaks; gentle reminders; share progress.");
        setConstraints("Mobile web MVP; notifications later.");
        break;
      case "none":
        setProblem("");
        setTargetUser("");
        setGoals("");
        setConstraints("");
        break;
    }
    setTemplate(key);
  };

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating brief…");
    try {
      const res = await fetch(`/api/projects/${projectId}/brief/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName ?? "Project", problem, targetUser, goals, constraints }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      toast.success("Brief generated", { id: toastId });
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
          Generate brief
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Project Brief</DialogTitle>
          <DialogDescription>Provide a few details or start from a template. You can edit later.</DialogDescription>
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
                <SelectItem value="campus-food">Campus Food Finder</SelectItem>
                <SelectItem value="saas-analytics">SaaS Analytics</SelectItem>
                <SelectItem value="fitness-tracker">Fitness Tracker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            Project:&nbsp;<span className="font-medium text-foreground">{projectName ?? "Project"}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="problem">Problem</Label>
            <Textarea id="problem" rows={4} value={problem} onChange={(e)=>setProblem(e.target.value)} placeholder="What problem are you solving?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target">Target users</Label>
            <Textarea id="target" rows={4} value={targetUser} onChange={(e)=>setTargetUser(e.target.value)} placeholder="Who is this for?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goals">Goals</Label>
            <Textarea id="goals" rows={4} value={goals} onChange={(e)=>setGoals(e.target.value)} placeholder="What do you want to achieve?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="constraints">Constraints</Label>
            <Textarea id="constraints" rows={4} value={constraints} onChange={(e)=>setConstraints(e.target.value)} placeholder="Time, budget, team, tech constraints" />
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


