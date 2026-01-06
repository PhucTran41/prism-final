"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Label } from "@/src/frontend/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/src/frontend/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/frontend/components/ui/select";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { Checkbox } from "@/src/frontend/components/ui/checkbox";

export default function GenerateRoadmapButton({ projectId, projectName, disabled }: { projectId: string; projectName?: string; disabled?: boolean }) {
  const [strictness, setStrictness] = useState<"normal"|"strict">("normal");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cadence, setCadence] = useState<"weekly"|"monthly"|"quarterly">("quarterly");
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [startDate, setStartDate] = useState<string>("");
  const [maxPerPeriod, setMaxPerPeriod] = useState<number>(4);
  const [notes, setNotes] = useState<string>("");
  const [teamSize, setTeamSize] = useState<number>(5);
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState<number>(5);
  const [velocityPointsPerSprint, setVelocityPointsPerSprint] = useState<number>(30);
  const [avgStoryPoints, setAvgStoryPoints] = useState<number>(3);
  const [avgEpicPoints, setAvgEpicPoints] = useState<number>(20);
  const [includeStorySchedule, setIncludeStorySchedule] = useState<boolean>(true);
  const [holidayDatesCsv, setHolidayDatesCsv] = useState<string>("");
  const [releaseMilestones, setReleaseMilestones] = useState<string>("Beta, GA");

  const isValid =
    Boolean(startDate) &&
    horizonMonths > 0 &&
    teamSize > 0 &&
    workDaysPerWeek >= 3 &&
    workDaysPerWeek <= 7 &&
    velocityPointsPerSprint > 0 &&
    avgStoryPoints > 0 &&
    avgEpicPoints > 0;

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating roadmap…");
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName ?? "Project",
          strictness,
          cadence,
          horizonMonths,
          startDate: startDate || undefined,
          maxItemsPerPeriod: maxPerPeriod,
          notes: notes || undefined,
          teamSize,
          workDaysPerWeek,
          velocityPointsPerSprint,
          avgStoryPoints,
          avgEpicPoints,
          includeStorySchedule,
          holidayDatesCsv: holidayDatesCsv || undefined,
          releaseMilestones: releaseMilestones || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      const data = await res.json();
      const generated = Array.isArray(data?.items) ? data.items : [];
      // auto-save generated items
      const save = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: generated }),
      });
      if (!save.ok) {
        const j = await save.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save generated roadmap");
      }
      toast.success("Roadmap generated and saved", { id: toastId });
      setOpen(false);
      location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled || loading} size="sm">Generate roadmap</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Roadmap</DialogTitle>
          <DialogDescription>Draft quarterly roadmap from your Brief/Scope.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Strictness</Label>
            <Select value={strictness} onValueChange={(v)=>setStrictness(v as any)}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="strict">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Cadence</Label>
            <Select value={cadence} onValueChange={(v)=>setCadence(v as "weekly"|"monthly"|"quarterly")}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Start date</Label>
            <Input
              type="date"
              className="h-8 w-[220px]"
              value={startDate}
              onChange={(e)=>setStartDate(e.target.value)}
            />
          </div>
          {/* Numbers grid two-per-row on md+ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Horizon (months)</Label>
              <Input
                type="number"
                min={1}
                className="h-8 w-[220px]"
                value={horizonMonths}
                onChange={(e)=>setHorizonMonths(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Max items per period</Label>
              <Input
                type="number"
                min={1}
                className="h-8 w-[220px]"
                value={maxPerPeriod}
                onChange={(e)=>setMaxPerPeriod(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Team size</Label>
              <Input type="number" min={1} className="h-8 w-[220px]" value={teamSize} onChange={(e)=>setTeamSize(Number(e.target.value) || 1)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Work days per week</Label>
              <Input type="number" min={3} max={7} className="h-8 w-[220px]" value={workDaysPerWeek} onChange={(e)=>setWorkDaysPerWeek(Number(e.target.value) || 5)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Velocity (points per sprint)</Label>
              <Input type="number" min={1} className="h-8 w-[220px]" value={velocityPointsPerSprint} onChange={(e)=>setVelocityPointsPerSprint(Number(e.target.value) || 1)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Avg story points</Label>
              <Input type="number" min={1} className="h-8 w-[220px]" value={avgStoryPoints} onChange={(e)=>setAvgStoryPoints(Number(e.target.value) || 1)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Avg epic points</Label>
              <Input type="number" min={1} className="h-8 w-[220px]" value={avgEpicPoints} onChange={(e)=>setAvgEpicPoints(Number(e.target.value) || 1)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Additional notes/constraints</Label>
            <Textarea
              rows={3}
              placeholder="E.g., prioritize MVP features in first month; limit to 3 items per sprint; avoid holidays…"
              value={notes}
              onChange={(e)=>setNotes(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Release milestones (comma separated)</Label>
            <Input className="h-8" value={releaseMilestones} onChange={(e)=>setReleaseMilestones(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs text-muted-foreground">Holidays (YYYY-MM-DD, comma separated)</Label>
            <Input className="h-8" placeholder="2026-01-01, 2026-02-14" value={holidayDatesCsv} onChange={(e)=>setHolidayDatesCsv(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="include-stories" checked={includeStorySchedule} onCheckedChange={(v)=>setIncludeStorySchedule(Boolean(v))} />
            <Label htmlFor="include-stories" className="text-xs text-muted-foreground">Include story‑level schedule</Label>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading || !isValid} className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


