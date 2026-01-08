"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/src/frontend/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/src/frontend/components/ui/dropdown-menu";
import { Input } from "@/src/frontend/components/ui/input";
import { Clock, ChevronDown, Send, Square } from "lucide-react";
import { MessageBubble } from "./components/MessageBubble";
import { ProposalPreview, ProposalTagLine } from "./components/ProposalPreview";

type ChatMessage = { role: "user" | "assistant"; content: string; streaming?: boolean; used?: string[] };

const SLASH_COMMANDS = [
  { cmd: "/brief", hint: "Draft or refine the Project Brief" },
  { cmd: "/scope", hint: "Define Scope (MoSCoW) based on brief" },
  { cmd: "/epics", hint: "Generate epics" },
  { cmd: "/stories", hint: "Generate stories (per epic or all)" },
  { cmd: "/roadmap", hint: "Build an editable roadmap" },
  { cmd: "/risks", hint: "Assess assumptions & risks" },
  { cmd: "/guide", hint: "Feature guidance: step-by-step coach with next actions" },
  { cmd: "/brainstorm", hint: "Brainstorm ideas (features, epics, solutions)" },
  { cmd: "/export", hint: "Export documents md/pdf/docx" },
  { cmd: "/new", hint: "Start a new conversation" },
];

export default function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I can draft briefs, scope, epics/stories, roadmaps, and risks — or make changes. What would you like to do?" },
  ]);
  const [threadId, setThreadId] = useState<number | null>(null);
  const [threads, setThreads] = useState<Array<{ id: number; title: string | null; visibility: string; updatedAt: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentThreadTitle = useMemo(() => {
    const t = threads.find(t => t.id === threadId);
    return t?.title ?? "New conversation";
  }, [threads, threadId]);

  // Slash menu state
  const showSlash = input.startsWith("/");
  const filteredCommands = useMemo(() => {
    if (!showSlash) return [];
    const q = input.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter(c => c.cmd.slice(1).startsWith(q));
  }, [input, showSlash]);

  const newConversation = () => {
    setMessages([{ role: "assistant", content: "New conversation started. How can I help?" }]);
    setCards([]);
    setThreadId(null);
  };

  const expandSlash = (raw: string): string => {
    const t = raw.trim();
    if (t.startsWith("/guide")) {
      const rest = t.replace(/^\/guide\s*/i, "").trim();
      return [
        "Guidance request:",
        "Act as a product coach. Lead me step-by-step. For each step:",
        "- Explain goal briefly",
        "- Ask 2-4 focused questions",
        "- Suggest next actions and quick commands (/brief, /scope, /epics, /stories, /roadmap, /risks)",
        rest ? `Context: ${rest}` : "",
      ].filter(Boolean).join("\n");
    }
    if (t.startsWith("/brainstorm")) {
      const rest = t.replace(/^\/brainstorm\s*/i, "").trim();
      return [
        "Brainstorm request:",
        "Generate concise idea lists with short rationales. Prefer bullet points. Group by themes.",
        "Offer follow-ups to refine or turn into epics/stories.",
        rest ? `Topic: ${rest}` : "",
      ].filter(Boolean).join("\n");
    }
    return raw;
  };

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    if (text === "/new") {
      setInput("");
      return newConversation();
    }
    const expanded = expandSlash(text);
    setInput("");
    const next: ChatMessage[] = [...messages, { role: "user" as const, content: expanded }];
    setMessages(next);
    setLoading(true);
    // placeholder assistant with thinking animation
    setMessages(m => [...m, { role: "assistant" as const, content: "…", streaming: true }]);
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(`/api/projects/${projectId}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, threadId: threadId ?? undefined }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to chat");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");
      let acc = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let sepIndex = buffer.indexOf("\n\n");
        while (sepIndex !== -1) {
          const evt = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          sepIndex = buffer.indexOf("\n\n");
          const line = evt.replace(/^data:\s?/, "");
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            if (obj.threadId && !threadId) setThreadId(obj.threadId);
            if (obj.type === "data-delta" && obj.delta) {
              acc += obj.delta as string;
              setMessages((m) => {
                const copy = [...m];
                const idx = copy.findIndex((x) => x.streaming);
                if (idx !== -1) copy[idx] = { role: "assistant", content: acc, streaming: true };
                return copy;
              });
            }
            if (obj.type === "data-finish") {
              setMessages((m) => {
                const copy = [...m];
                const idx = copy.findIndex((x) => x.streaming);
                const candidate = typeof obj.text === "string" && obj.text.length > 0 ? obj.text : acc;
                const finalText = extractTextFromMaybeJsonBlock(candidate);
                const used = Array.isArray(obj.used) ? (obj.used as string[]) : undefined;
                if (idx !== -1) copy[idx] = { role: "assistant", content: finalText, streaming: false, used };
                return copy;
              });
            }
            if (obj.type === "data-proposals") {
              setCards(Array.isArray(obj.proposals) ? obj.proposals : []);
            }
            if (obj.type === "data-error" || obj.error) {
              throw new Error(obj.error);
            }
          } catch {
            // ignore malformed lines; remainder will be handled when complete
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") {
        // replace streaming with cancelled
        setMessages(m => {
          const copy = [...m];
          const idx = copy.findIndex(x => x.streaming);
          if (idx !== -1) copy[idx] = { role: "assistant", content: "Cancelled." };
          return copy;
        });
        return;
      }
      const msg = e instanceof Error ? e.message : "Chat failed";
      toast.error(msg);
      // replace streaming with error
      setMessages(m => {
        const copy = [...m];
        const idx = copy.findIndex(x => x.streaming);
        if (idx !== -1) copy[idx] = { role: "assistant", content: "Sorry, something went wrong." };
        return copy;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
      scrollToBottom(listRef);
    }
  };

  type Proposal = { kind: string; payload?: unknown };
  const [cards, setCards] = useState<Proposal[]>([]);
  const [expandedCardIdx, setExpandedCardIdx] = useState<number | null>(null);
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [phaseMeta, setPhaseMeta] = useState<{ phase?: string|null; step?: number; answers?: Record<string, unknown>; suggestions?: Record<string, string[]> } | null>(null);
  const currentField = useMemo(() => {
    if (!phaseMeta?.phase || !phaseMeta.step) return null;
    const map: Record<string, string[]> = {
      brief: ['problem', 'targetUsers', 'goals', 'constraints', 'confirm'],
      scope: ['must', 'should', 'could', 'non_goals', 'confirm'],
      epics: ['themes', 'outcomes', 'priorities', 'confirm'],
      stories: ['epicTitles', 'seeds', 'acceptance', 'confirm'],
      roadmap: ['schedule', 'milestones', 'confirm'],
      risks: ['prompts', 'list', 'confirm'],
    };
    const list = map[String(phaseMeta.phase)] || [];
    return list[(phaseMeta.step ?? 1) - 1] ?? null;
  }, [phaseMeta?.phase, phaseMeta?.step]);
  const currentSuggestions = useMemo(() => {
    if (!phaseMeta?.suggestions || !currentField) return [];
    return Array.isArray(phaseMeta.suggestions[currentField]) ? phaseMeta.suggestions[currentField] : [];
  }, [phaseMeta?.suggestions, currentField]);

  const onApply = async (idx: number) => {
    const proposal = cards[idx];
    const toastId = toast.loading("Applying change…");
    try {
      setApplyingIdx(idx);
      const res = await fetch(`/api/projects/${projectId}/chat/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal, idempotencyKey: `${proposal?.kind}-${Date.now()}` }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Apply failed");
      }
      toast.success("Applied", { id: toastId });
      setCards((c) => c.filter((_, i) => i !== idx));
      // append confirmation message
      const summary = (() => {
        const payload = proposal?.payload;
        if (payload && typeof payload === "object" && "items" in payload) {
          const count = Array.isArray((payload as { items?: unknown[] }).items) ? ((payload as { items: unknown[] }).items.length) : undefined;
          if (typeof count === "number") return `${proposal?.kind} (${count} items)`;
        }
        if (payload && typeof payload === "object" && "name" in payload) {
          const name = (payload as { name?: unknown }).name;
          if (typeof name === "string") return `${proposal?.kind} for “${name}”`;
        }
        return String(proposal?.kind ?? "change applied");
      })();
      const maybeLink =
        proposal?.kind?.startsWith("brief.")
          ? `\n\nOpen: /projects/${projectId}/brief`
          : proposal?.kind?.startsWith("scope.")
          ? `\n\nOpen: /projects/${projectId}/scope`
          : proposal?.kind?.startsWith("risks.")
          ? `\n\nOpen: /projects/${projectId}/assumptions`
          : "";
      setMessages(m => [...m, { role: "assistant", content: `✔ Applied: ${summary}${maybeLink}` }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Apply failed";
      toast.error(msg, { id: toastId });
    } finally {
      setApplyingIdx(null);
    }
  };

  const onApplyAll = async () => {
    const total = cards.length;
    for (let i = 0; i < total; i++) {
      // always apply the first card since we remove on success
      await onApply(0);
    }
  };

  useEffect(() => {
    scrollToBottom(listRef);
  }, [messages.length]);

  useEffect(() => {
    // load threads on mount and when thread created
    (async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/chat/threads`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setThreads(j?.threads ?? []);
        }
      } catch {}
    })();
  }, [projectId, threadId]);

  // Poll active thread meta (phase/step)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!threadId) { setPhaseMeta(null); return; }
      try {
        const r = await fetch(`/api/projects/${projectId}/chat/threads/${threadId}`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (alive) setPhaseMeta(j?.thread?.meta ?? null);
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [projectId, threadId, messages.length]);

  const openThread = async (tid: number) => {
    try {
      const r = await fetch(`/api/projects/${projectId}/chat/threads/${tid}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to load thread");
      const j = await r.json();
      const msgs: ChatMessage[] = (j?.messages ?? []).map((m: { role: string; content: string }) => ({
        role: (m.role as "user" | "assistant"),
        content: String(m.content ?? "")
      }));
      if (msgs.length === 0) {
        setMessages([{ role: "assistant", content: "This conversation is empty yet." }]);
      } else {
        setMessages(msgs);
      }
      setThreadId(tid);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to open thread";
      toast.error(msg);
    }
  };

  return (
    <div className="flex w-full overflow-hidden">
      <div className="mx-auto w-full max-w-6xl flex h-[calc(100dvh-200px)] flex-col gap-3 overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-md border bg-card/60 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-card/60">
          <div className="flex items-center gap-2">
            <div className="text-base font-semibold leading-none tracking-tight">{currentThreadTitle}</div>
            {phaseMeta?.phase ? (
              <span className="ml-2 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                Phase: {String(phaseMeta.phase)} · Step {phaseMeta?.step ?? 1}
              </span>
            ) : null}
            <div className="text-xs text-muted-foreground ml-2">Type “/” for quick commands</div>
          </div>
          <div className="flex items-center gap-2">
            <ThreadHistoryDropdown
              threads={threads}
              activeId={threadId}
              onOpen={(id) => openThread(id)}
            />
            {cards.length > 1 && (
              <Button variant="outline" size="sm" onClick={onApplyAll}>Approve all</Button>
            )}
            <Button variant="outline" size="sm" onClick={newConversation}>New</Button>
          </div>
        </div>
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto rounded-md border p-4 bg-card/40 bg-linear-to-br from-primary/5 via-transparent to-primary/5 dark:from-primary/10 dark:to-primary/10">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} streaming={m.streaming} used={m.used} onCopy={m.role === "assistant" ? () => handleCopy(m.content) : undefined}>
                {m.content}
              </MessageBubble>
            ))}
            {cards.length > 0 && (
              <div className="grid gap-3">
                {cards.map((p, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Proposal</div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{p?.kind}</span>
                            <span className="text-xs text-muted-foreground">
                              <ProposalTagLine proposal={p} />
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setExpandedCardIdx(expandedCardIdx === idx ? null : idx)}>
                            {expandedCardIdx === idx ? "Hide details" : "View details"}
                          </Button>
                          <Button size="sm" onClick={() => onApply(idx)} disabled={applyingIdx === idx}>
                            {applyingIdx === idx ? "Applying…" : "Apply"}
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProposalPreview proposal={p} projectId={projectId} />
                      </div>
                      {expandedCardIdx === idx && (
                        <pre className="mt-3 max-h-60 overflow-auto rounded-md border bg-muted/60 p-3 text-xs">{JSON.stringify(p?.payload ?? {}, null, 2)}</pre>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 bg-card/60 backdrop-blur supports-backdrop-filter:bg-card/60">
          {phaseMeta?.phase ? (
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border px-2 py-0.5">Phase: {String(phaseMeta.phase)}</span>
              <span className="rounded-full border px-2 py-0.5">Step {phaseMeta?.step ?? 1}</span>
              <Button size="sm" variant="secondary" onClick={() => setInput("/back")}>/back</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/next")}>/next</Button>
              <Button size="sm" onClick={() => setInput("/confirm")}>/confirm</Button>
              <Button size="sm" variant="destructive" onClick={() => setInput("/restart")}>/restart</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/help")}>/help</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/suggest")}>/suggest</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/review")}>/review</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/skip")}>/skip</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/undo")}>/undo</Button>
              <Button size="sm" variant="secondary" onClick={() => setInput("/auto")}>/auto</Button>
            </div>
          ) : null}
          {/* Quick actions */}
          <div className="mb-2 flex flex-wrap gap-2">
            {["/guide", "/brainstorm", "/brief", "/scope", "/epics", "/stories", "/roadmap", "/risks"].map(cmd => (
              <Button key={cmd} variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => setInput(cmd + " ")}>
                {cmd}
              </Button>
            ))}
          </div>
          {phaseMeta?.answers ? (
            <div className="mt-2 rounded-md border bg-background/60 p-2">
              <div className="mb-1 text-xs text-muted-foreground">Answers so far</div>
              <pre className="max-h-32 overflow-auto text-xs">{JSON.stringify(phaseMeta.answers, null, 2)}</pre>
            </div>
          ) : null}
          {phaseMeta?.phase && currentSuggestions.length > 0 ? (
            <div className="mt-2 rounded-md border bg-background/60 p-2">
              <div className="mb-2 text-xs text-muted-foreground">Suggestions for {String(currentField)}</div>
              <div className="flex flex-wrap gap-2">
                {currentSuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                    onClick={() => {
                      setInput(`/pick ${i + 1}`);
                      void send();
                    }}
                    title={s}
                  >
                    {i + 1}. {s.length > 48 ? s.slice(0, 48) + "…" : s}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Click to pick or type “/pick N”.</div>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading) send();
                }
              }}
              placeholder="Ask anything… e.g., “/epics Generate 6 epics”, “/roadmap Plan quarterly roadmap”"
            />
            {loading ? (
              <Button variant="destructive" onClick={() => abortRef.current?.abort()} title="Stop">
                <Square className="h-4 w-4 mr-1" /> Stop
              </Button>
            ) : (
              <Button onClick={send} disabled={!input.trim()} title="Send">
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            )}
          </div>
          {showSlash && filteredCommands.length > 0 && (
            <div className="absolute bottom-14 left-0 z-10 w-[420px] max-w-[90vw] rounded-md border bg-card shadow">
              <div className="p-2 text-xs text-muted-foreground">Commands</div>
              <div className="max-h-64 overflow-auto">
                {filteredCommands.map((c) => (
                  <button
                    key={c.cmd}
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                    onClick={() => setInput(c.cmd + " ")}
                  >
                    <div className="font-mono text-sm">{c.cmd}</div>
                    <div className="text-xs text-muted-foreground">{c.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function handleCopy(text: string) {
  try {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
}

// AvatarBadge moved into MessageBubble.tsx

function ThreadHistoryDropdown({
  threads,
  activeId,
  onOpen,
}: {
  threads: Array<{ id: number; title: string | null; visibility: string; updatedAt: string }>;
  activeId: number | null;
  onOpen: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter(t => (t.title ?? "Untitled").toLowerCase().includes(s));
  }, [q, threads]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Clock className="h-4 w-4" />
          History
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Previous conversations</DropdownMenuLabel>
        <div className="p-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
          />
        </div>
        <DropdownMenuSeparator />
        {filtered.length === 0 ? (
          <DropdownMenuItem disabled>No conversations</DropdownMenuItem>
        ) : (
          filtered.map(t => (
            <DropdownMenuItem key={t.id} onClick={() => onOpen(t.id)} inset>
              <div className="flex flex-col">
                <div className={cn("text-sm", activeId === t.id ? "font-semibold" : "")}>
                  {t.title ?? "Untitled"}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(t.updatedAt).toLocaleString()}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// thinking dots moved into MessageBubble.tsx

// (reserved for optional typewriter effect)

function scrollToBottom(listRef: React.RefObject<HTMLDivElement | null>) {
  setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: "smooth" }), 50);
}

function extractTextFromMaybeJsonBlock(s: string): string {
  // If the model returned a fenced JSON block with { text, proposals }, extract text.
  try {
    const match = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonStr = match ? match[1] : null;
    if (jsonStr) {
      const obj = JSON.parse(jsonStr) as { text?: unknown };
      if (typeof obj.text === "string" && obj.text.length > 0) {
        return obj.text;
      }
    }
  } catch {
    // fall through
  }
  // If unfenced JSON was appended (common LLM quirk), try to parse a trailing JSON object.
  try {
    const tail = s.match(/\{[\s\S]*\}\s*$/);
    if (tail && tail[0]) {
      const obj = JSON.parse(tail[0]) as { text?: unknown };
      if (typeof obj.text === "string" && obj.text.length > 0) {
        return obj.text;
      }
    }
  } catch {
    // ignore
  }
  return s;
}

// Proposal components moved to components/ProposalPreview.tsx
