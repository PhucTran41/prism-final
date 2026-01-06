"use client";

import { useMemo, useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import { addMonths, differenceInCalendarDays, format, isAfter, isBefore, parse, parseISO, startOfDay } from "date-fns";
import { GanttBars, GanttHeader, GanttMarker, GanttProvider, GanttSidebar, GanttSidebarItem, GanttTimeline } from "@/src/frontend/components/ui/gantt";
import { ChevronDown, ChevronRight } from "lucide-react";

type Item = { id?: number; title: string; description?: string | null; target?: string | null; startDate?: string | null; endDate?: string | null; epicId?: number | null; priority?: string | null; status?: string | null };
type Epic = { id: number; title: string; startDate?: string | null; endDate?: string | null };
type Story = { id: number; epicId?: number | null; title: string; startDate?: string | null; endDate?: string | null; priority?: string | null; status?: string | null };

function parseFlexibleDate(v?: string | null): Date | undefined {
  if (!v) return undefined;
  const iso = parseISO(v);
  if (!isNaN(iso.getTime())) return startOfDay(iso);
  const md = parse(v, "MM/dd/yyyy", new Date());
  if (!isNaN(md.getTime())) return startOfDay(md);
  return undefined;
}

export default function RoadmapEditor({ projectId, initial, epics, stories }: { projectId: string; initial: Item[]; epics: Epic[]; stories: Story[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const add = () => setItems((prev) => [...prev, { title: "" }]);
  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const save = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving roadmap…");
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
      toast.success("Saved", { id: toastId });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save";
      toast.error(message, { id: toastId });
      setSaving(false);
    }
  };

  // --- Gantt helpers ---
  const safeDate = (v?: string | null) => parseFlexibleDate(v);
  const rangeStart: Date = useMemo(() => {
    const dates = items.map((i) => safeDate(i.startDate)).filter(Boolean) as Date[];
    const minDate = dates.length > 0 ? dates.reduce((a, b) => (isBefore(a, b) ? a : b)) : startOfDay(new Date());
    return minDate;
  }, [items]);
  const rangeEnd: Date = useMemo(() => {
    const dates = items.map((i) => safeDate(i.endDate)).filter(Boolean) as Date[];
    const maxDate = dates.length > 0 ? dates.reduce((a, b) => (isAfter(a, b) ? a : b)) : addMonths(rangeStart, 3);
    // ensure at least 1 month visible
    const minEnd = addMonths(rangeStart, 1);
    return isAfter(maxDate, minEnd) ? maxDate : minEnd;
  }, [items, rangeStart]);
  // keep computed range to ensure calendar renders correctly with wide ranges
  // computed but unused; preserved for potential future virtualisation
  void Math.max(1, differenceInCalendarDays(rangeEnd, rangeStart) + 1);

  // Compute overall window for Gantt from epics/stories/items dates
  const fromDate = useMemo(() => {
    const dates: Date[] = [];
    for (const e of epics) { const d = safeDate(e.startDate ?? undefined); if (d) dates.push(d); }
    for (const s of stories) { const d = safeDate(s.startDate ?? undefined); if (d) dates.push(d); }
    for (const it of items) { const d = safeDate(it.startDate ?? undefined); if (d) dates.push(d); }
    if (dates.length === 0) return startOfDay(new Date());
    const min = dates.reduce((a, b) => (a < b ? a : b));
    const pad = new Date(min);
    pad.setMonth(pad.getMonth() - 1);
    return pad;
  }, [epics, stories, items]);
  const toDate = useMemo(() => {
    const dates: Date[] = [];
    for (const e of epics) { const d = safeDate(e.endDate ?? undefined); if (d) dates.push(d); }
    for (const s of stories) { const d = safeDate(s.endDate ?? undefined); if (d) dates.push(d); }
    for (const it of items) { const d = safeDate(it.endDate ?? undefined); if (d) dates.push(d); }
    if (dates.length === 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      return d;
    }
    const max = dates.reduce((a, b) => (a > b ? a : b));
    const pad = new Date(max);
    pad.setMonth(pad.getMonth() + 1);
    return pad;
  }, [epics, stories, items]);

  return (
    <div className="space-y-6">
      {/* Gantt Timeline only */}
      <Card>
        <CardContent className="pt-6">
          <div className="mb-3 text-sm font-medium">Timeline</div>
          <div className="overflow-x-auto rounded-md border">
            <GanttProvider range="monthly" zoom={100} className="h-[640px]" from={fromDate} to={toDate}>
              <GanttSidebar>
                {epics.map((e) => {
                  const isCollapsed = !!collapsed[e.id];
                  return (
                    <div key={e.id}>
                      <div
                        className="flex items-center gap-2 cursor-pointer px-3 h-[var(--gantt-row-height)] text-xs text-muted-foreground"
                        onClick={() => setCollapsed((prev) => ({ ...prev, [e.id]: !prev[e.id] }))}
                      >
                        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span className="font-medium">[Epic] {e.title}</span>
                      </div>
                      <div className="divide-y">
                        {!isCollapsed
                          ? stories
                              .filter((s) => (s.epicId ?? null) === e.id)
                              .map((s) => <GanttSidebarItem key={`s-${s.id}`} name={s.title} color={toColor(s.priority)} />)
                          : null}
                      </div>
                    </div>
                  );
                })}
              </GanttSidebar>
              <GanttTimeline>
                <GanttHeader />
                <div
                  className="px-2 relative"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, rgba(120,120,120,0.06) 0, rgba(120,120,120,0.06) 1px, transparent 1px, transparent var(--gantt-column-width)), repeating-linear-gradient(to right, rgba(120,120,120,0.04) 0, rgba(120,120,120,0.04) 1px, transparent 1px, transparent 30px)",
                  }}
                >
                  <GanttBars rows={toRowsForTimeline(epics, stories, collapsed)} />
                  {items.map((it, idx) => {
                    const d = safeDate(it.endDate ?? it.startDate ?? undefined);
                    if (!d || isNaN(d.getTime())) return null;
                    return <GanttMarker key={`m-${idx}`} date={d} label={it.title ?? "Milestone"} />;
                  })}
                </div>
              </GanttTimeline>
            </GanttProvider>
          </div>
        </CardContent>
      </Card>

      {items.map((item, i) => (
        <div key={i} className="rounded-md border p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input
              placeholder="Title"
              value={item.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="md:col-span-2"
            />
            <Input placeholder="Target (e.g., Q1-2026)" value={item.target ?? ""} onChange={(e)=>update(i, { target: e.target.value })} />
            <Input type="date" value={item.startDate ? format(new Date(item.startDate), "yyyy-MM-dd") : ""} onChange={(e)=>update(i, { startDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <Input type="date" value={item.endDate ? format(new Date(item.endDate), "yyyy-MM-dd") : ""} onChange={(e)=>update(i, { endDate: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <Input placeholder="Priority" value={item.priority ?? ""} onChange={(e)=>update(i, { priority: e.target.value })} />
            <Input placeholder="Status" value={item.status ?? ""} onChange={(e)=>update(i, { status: e.target.value })} />
          </div>
          <Textarea placeholder="Short description" value={item.description ?? ""} onChange={(e)=>update(i, { description: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => remove(i)}>Remove</Button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={add}>Add item</Button>
        <Button onClick={save} disabled={saving}>Save</Button>
      </div>
    </div>
  );
}

function toColor(priority?: string | null): string {
  if (priority === "M") return "#ef4444";
  if (priority === "S") return "#f59e0b";
  if (priority === "C") return "#64748b";
  return "#0ea5e9";
}

function groupedByEpicWithStories(epics: Epic[], stories: Story[]) {
  const idToEpic = new Map<number, string>();
  epics.forEach((e) => idToEpic.set(e.id, e.title));
  const groups = new Map<string, { key: string; title: string; rows: Array<{ id: string; name: string; color: string }> }>();
  for (const epic of epics) {
    const title = idToEpic.get(epic.id) ?? "Ungrouped";
    const key = title.toLowerCase();
    if (!groups.has(key)) groups.set(key, { key, title, rows: [] });
    groups.get(key)!.rows.push({ id: `epic-${epic.id}`, name: `[Epic] ${title}`, color: "#0ea5e9" });
    const epicStories = stories.filter((s) => (s.epicId ?? null) === epic.id);
    for (const s of epicStories) {
      groups.get(key)!.rows.push({ id: `story-${s.id}`, name: s.title, color: toColor(s.priority) });
    }
  }
  return Array.from(groups.values());
}

function toRowsForTimeline(epics: Epic[], stories: Story[], collapsed: Record<number, boolean>) {
  const idToEpic = new Map<number, string>();
  epics.forEach((e) => idToEpic.set(e.id, e.title));
  const rows: Array<{ key: string; items: Array<{ id: string; name: string; start: Date; end?: Date | null; color?: string; dashed?: boolean }> }> = [];
  for (const epic of epics) {
    const title = idToEpic.get(epic.id) ?? "Ungrouped";
    const key = `epic-${epic.id}`;
    const epicStart = parseFlexibleDate(epic.startDate ?? null) ?? new Date();
    const epicEnd = parseFlexibleDate(epic.endDate ?? null) ?? null;
    rows.push({ key, items: [{ id: `epic-${epic.id}`, name: `[Epic] ${title}`, start: epicStart, end: epicEnd, color: "#0284c7", dashed: false }] });
    if (!collapsed[epic.id]) {
      const epicStories = stories.filter((s) => (s.epicId ?? null) === epic.id);
      for (const s of epicStories) {
        const sStart = parseFlexibleDate(s.startDate ?? null) ?? epicStart;
        const sEnd = parseFlexibleDate(s.endDate ?? null) ?? epicEnd;
        rows.push({
          key: `story-${s.id}`,
          items: [{ id: `story-${s.id}`, name: s.title, start: sStart, end: sEnd ?? epicEnd, color: toColor(s.priority), dashed: (s.status ?? '').toUpperCase() === 'PLANNED' }],
        });
      }
    }
  }
  return rows;
}

