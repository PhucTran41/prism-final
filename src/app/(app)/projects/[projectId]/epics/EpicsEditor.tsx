"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/frontend/components/ui/select";
import { Badge } from "@/src/frontend/components/ui/badge";
import { ChevronDown, ChevronRight, Filter, Loader2, MoreHorizontal, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/frontend/components/ui/dropdown-menu";

type Epic = { id?: number; title: string; description?: string | null; priority?: string | null; status?: string | null };
type Story = { id?: number; epicId?: number | null; title: string; description?: string | null; acceptance?: string | null; priority?: string | null; status?: string | null };

export default function EpicsEditor({
  projectId,
  initial,
  initialStories,
  onStoriesChange,
}: {
  projectId: string;
  initial: Epic[];
  initialStories: Story[];
  onStoriesChange?: (s: Story[]) => void;
}) {
  const [items, setItems] = useState<Epic[]>(initial);
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [expanded, setExpanded] = useState<Record<number | string, boolean>>({});
  const [savingEpics, setSavingEpics] = useState(false);
  const [savingStories, setSavingStories] = useState(false);
  const [query, setQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'M' | 'S' | 'C'>('ALL');
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [storyOpen, setStoryOpen] = useState<Record<number, boolean>>({});

  const savedEpicsSnapshot = useRef<string>(JSON.stringify(normalizeEpics(initial)));
  const savedStoriesSnapshot = useRef<string>(JSON.stringify(normalizeStories(initialStories)));
  const epicsTimer = useRef<NodeJS.Timeout | null>(null);
  const storiesTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setItems(initial);
  }, [initial]);
  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);

  // Debounced auto-save for epics
  useEffect(() => {
    const current = JSON.stringify(normalizeEpics(items));
    if (current === savedEpicsSnapshot.current) return;
    if (epicsTimer.current) clearTimeout(epicsTimer.current);
    epicsTimer.current = setTimeout(async () => {
      setSavingEpics(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/epics`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ epics: items }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to save epics");
        }
        savedEpicsSnapshot.current = JSON.stringify(normalizeEpics(items));
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save epics";
        toast.error(message);
      } finally {
        setSavingEpics(false);
      }
    }, 800);
    return () => {
      if (epicsTimer.current) clearTimeout(epicsTimer.current);
    };
  }, [items, projectId]);

  // Debounced auto-save for stories
  useEffect(() => {
    const current = JSON.stringify(normalizeStories(stories));
    if (current === savedStoriesSnapshot.current) return;
    if (storiesTimer.current) clearTimeout(storiesTimer.current);
    storiesTimer.current = setTimeout(async () => {
      setSavingStories(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/stories`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stories }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to save stories");
        }
        savedStoriesSnapshot.current = JSON.stringify(normalizeStories(stories));
        onStoriesChange?.(stories);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save stories";
        toast.error(message);
      } finally {
        setSavingStories(false);
      }
    }, 800);
    return () => {
      if (storiesTimer.current) clearTimeout(storiesTimer.current);
    };
  }, [stories, projectId, onStoriesChange]);

  const addEpic = () => setItems((prev) => [...prev, { title: "", status: "PLANNED" }]);
  const removeEpic = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateEpic = (idx: number, patch: Partial<Epic>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const storiesByEpic = useMemo<Record<string, Story[]>>(() => {
    const map: Record<string, Story[]> = {};
    for (const s of stories) {
      const key = String(s.epicId ?? "");
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [stories]);

  const toggleExpand = (epicKey: number | string) =>
    setExpanded((prev) => ({ ...prev, [epicKey]: !prev[epicKey] }));
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const e of items) next[String(e.id ?? `idx-${items.indexOf(e)}`)] = true;
    setExpanded(next);
  };
  const collapseAll = () => setExpanded({});

  const addStory = (epicId?: number, idx?: number) => {
    setStories((prev) => [...prev, { epicId: epicId ?? null, title: "", status: "PLANNED" }]);
    if (idx !== undefined) setExpanded((prev) => ({ ...prev, [String(epicId ?? "")]: true }));
  };

  const updateStory = (storyIndex: number, patch: Partial<Story>) =>
    setStories((prev) => prev.map((it, i) => (i === storyIndex ? { ...it, ...patch } : it)));

  const removeStory = (storyIndex: number) =>
    setStories((prev) => prev.filter((_, i) => i !== storyIndex));
  const toggleStory = (storyIndex: number) =>
    setStoryOpen((prev) => ({ ...prev, [storyIndex]: !prev[storyIndex] }));

  const generateStoriesForEpic = async (epicTitle: string, epicId?: number) => {
    const toastId = toast.loading("Generating stories…");
    try {
      const res = await fetch(`/api/projects/${projectId}/stories/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Project", epicTitles: [epicTitle], strictness: "normal" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate stories");
      }
      const data = await res.json();
      const genRaw: Story[] = Array.isArray(data?.stories) ? data.stories : [];
      const gen: Story[] = genRaw.map((s) => ({ ...s, epicId: epicId ?? s.epicId ?? null }));
      setStories((prev) => [...prev, ...gen]);
      toast.success("Stories generated.", { id: toastId });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate stories";
      toast.error(message, { id: toastId });
    }
  };

  const generateStoriesForAll = async () => {
    const toastId = toast.loading("Generating stories for all epics…");
    try {
      // Ensure epics are saved so they all have stable ids
      const saveRes = await fetch(`/api/projects/${projectId}/epics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epics: items }),
      });
      if (!saveRes.ok) {
        const j = await saveRes.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save epics before generation");
      }
      const saved = await saveRes.json().catch(() => ({}));
      const savedEpics: Epic[] = Array.isArray(saved?.epics) ? saved.epics : items;
      setItems(savedEpics);
      savedEpicsSnapshot.current = JSON.stringify(normalizeEpics(savedEpics));

      let generatedFor = 0;
      const failures: string[] = [];
      for (const e of savedEpics) {
        if (!e.title) continue;
        const res = await fetch(`/api/projects/${projectId}/stories/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Project", epicTitles: [e.title], strictness: "normal" }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Failed to generate stories");
        }
        const data = await res.json();
        const genRaw: Story[] = Array.isArray(data?.stories) ? data.stories : [];
        let out = genRaw;
        // Retry once with stricter mode if none returned
        if (out.length === 0) {
          const retry = await fetch(`/api/projects/${projectId}/stories/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Project", epicTitles: [e.title], strictness: "strict" }),
          });
          if (retry.ok) {
            const d2 = await retry.json().catch(() => ({}));
            out = Array.isArray(d2?.stories) ? d2.stories : [];
          }
        }
        if (out.length === 0) {
          failures.push(e.title);
          continue;
        }
        const gen: Story[] = out.map((s) => ({ ...s, epicId: (e.id ?? null) }));
        setStories((prev) => [...prev, ...gen]);
        generatedFor += 1;
      }
      if (failures.length > 0) {
        toast.message(`Stories generated for ${generatedFor} epics. ${failures.length} returned none: ${failures.join(", ")}`, { id: toastId });
      } else {
        toast.success("Stories generated for all epics.", { id: toastId });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate stories";
      toast.error(message, { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search epics"
              className="pl-8 w-[260px]"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={priorityFilter} onValueChange={(v)=>setPriorityFilter((v as 'ALL'|'M'|'S'|'C'))}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All priorities</SelectItem>
                <SelectItem value="M">Must</SelectItem>
                <SelectItem value="S">Should</SelectItem>
                <SelectItem value="C">Could</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>Expand all</Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse all</Button>
          <Button variant="outline" onClick={addEpic}>
            Add epic
          </Button>
          <Button onClick={generateStoriesForAll} variant="secondary">
            Generate all stories
          </Button>
          {(savingEpics || savingStories) ? (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Auto-saved</span>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="text-sm font-medium">Backlog</div>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <div className="p-3 space-y-3">
          {items.length === 0 ? <div className="text-xs text-muted-foreground">No epics</div> : null}
          {items
            .filter((e) => {
              if (priorityFilter !== 'ALL' && (e.priority ?? '') !== priorityFilter) return false;
              const q = query.trim().toLowerCase();
              if (!q) return true;
              return (
                e.title.toLowerCase().includes(q) ||
                (e.description ?? '').toLowerCase().includes(q)
              );
            })
            .map((item, i) => {
            const epicKey = item.id ?? `idx-${i}`;
            const isOpen = expanded[String(epicKey)] ?? false;
            const epicStories = storiesByEpic[String(item.id ?? "")] ?? [];
            return (
              <div key={String(epicKey)} className="rounded-md border p-3 bg-background space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(epicKey)}>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Input
                        placeholder="Epic title"
                        value={item.title}
                        onChange={(e) => updateEpic(i, { title: e.target.value })}
                        className="font-medium"
                      />
                      <Badge className={priorityBadgeClass(item.priority)}>{mapPriority(item.priority)}</Badge>
                      <Select value={item.priority ?? ""} onValueChange={(v)=>updateEpic(i, { priority: v })}>
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Must</SelectItem>
                          <SelectItem value="S">Should</SelectItem>
                          <SelectItem value="C">Could</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary">{epicStories.length} stories</Badge>
                    </div>
                    <Textarea
                      placeholder="Short description"
                      value={item.description ?? ""}
                      onChange={(e) => updateEpic(i, { description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => generateStoriesForEpic(item.title, item.id)}>Generate stories</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addStory(item.id)}>Add story</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => removeEpic(i)}>Remove epic</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowAcceptance((v)=>!v)}>
                        {showAcceptance ? "Hide acceptance" : "Show acceptance"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isOpen ? (
                  <div className="rounded-md border bg-card">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <div className="text-sm font-medium">Stories</div>
                      <Button size="sm" variant="outline" onClick={() => addStory(item.id)}>
                        Add story
                      </Button>
                    </div>
                    <div className="px-3">
                      {epicStories.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-3">No stories</div>
                      ) : null}
                      {stories.map((s, si) => {
                        if ((s.epicId ?? "") !== (item.id ?? "")) return null;
                        const isRowOpen = storyOpen[si] ?? false;
                        return (
                          <div key={si} className="border-b last:border-b-0 py-3">
                            <div className="flex items-center gap-3">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStory(si)}>
                                {isRowOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                              <Input
                                placeholder="Story title (As a … I want … so that …)"
                                value={s.title}
                                onChange={(e) => updateStory(si, { title: e.target.value })}
                                className="flex-1"
                              />
                              <Select value={s.priority ?? ""} onValueChange={(v)=>updateStory(si, { priority: v })}>
                                <SelectTrigger className="h-8 w-[120px]">
                                  <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Must</SelectItem>
                                  <SelectItem value="S">Should</SelectItem>
                                  <SelectItem value="C">Could</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select value={s.status ?? ""} onValueChange={(v)=>updateStory(si, { status: v })}>
                                <SelectTrigger className="h-8 w-[150px]">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PLANNED">Planned</SelectItem>
                                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                                  <SelectItem value="DONE">Done</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={() => removeStory(si)}>
                                Remove
                              </Button>
                            </div>
                            {isRowOpen ? (
                              <div className="mt-3 space-y-3 pl-10">
                                <Textarea
                                  placeholder="Short description"
                                  value={s.description ?? ""}
                                  onChange={(e) => updateStory(si, { description: e.target.value })}
                                  rows={2}
                                />
                                {showAcceptance ? (
                                  <Textarea
                                    placeholder="Acceptance criteria (bullets)"
                                    value={s.acceptance ?? ""}
                                    onChange={(e) => updateStory(si, { acceptance: e.target.value })}
                                    rows={3}
                                  />
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function normalizeEpics(arr: Epic[]): Epic[] {
  return (arr ?? []).map(({ id, title, description, priority, status }) => ({
    id: id ?? undefined,
    title: title ?? '',
    description: description ?? null,
    priority: priority ?? null,
    status: status ?? null,
  }));
}

function normalizeStories(arr: Story[]): Story[] {
  return (arr ?? []).map(({ id, epicId, title, description, acceptance, priority, status }) => ({
    id: id ?? undefined,
    epicId: epicId ?? null,
    title: title ?? '',
    description: description ?? null,
    acceptance: acceptance ?? null,
    priority: priority ?? null,
    status: status ?? null,
  }));
}

function mapPriority(p?: string | null): string {
  if (!p) return "—";
  if (p === "M") return "Must";
  if (p === "S") return "Should";
  if (p === "C") return "Could";
  return p;
}

function priorityBadgeClass(p?: string | null): string {
  if (p === "M") return "bg-red-100 text-red-700 hover:bg-red-100";
  if (p === "S") return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  if (p === "C") return "bg-slate-100 text-slate-700 hover:bg-slate-100";
  return "bg-secondary text-secondary-foreground";
}

