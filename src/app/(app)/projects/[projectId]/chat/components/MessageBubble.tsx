"use client";

import { type ReactNode } from "react";
import { cn } from "@/src/frontend/lib/utils";
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function MessageBubble({
  role,
  children,
  streaming,
  used,
  onCopy,
}: {
  role: "user" | "assistant";
  children: ReactNode;
  streaming?: boolean;
  used?: string[];
  onCopy?: () => void;
}) {
  const isAssistant = role === "assistant";
  return (
    <div className={cn("flex w-full items-start gap-2", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && <AvatarBadge label="AI" />}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ring-1",
          isAssistant ? "bg-muted/70 ring-border" : "bg-primary text-primary-foreground ring-primary/40"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {streaming ? (
              <ThinkingDots />
            ) : isAssistant ? (
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted"
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {typeof children === "string" ? (children as string) : String(children ?? "")}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap leading-relaxed">{children}</div>
            )}
          </div>
          {isAssistant && !streaming && onCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="ml-2 shrink-0 rounded p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {!isAssistant && <AvatarBadge label="You" right />}
      {isAssistant && Array.isArray(used) && used.length > 0 && (
        <div className="ml-8 mt-1 flex flex-wrap gap-1">
          {used.map((u, idx) => (
            <span
              key={`${u}-${idx}`}
              className="inline-flex items-center rounded-full border bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              title="Used context"
            >
              {u}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AvatarBadge({ label, right }: { label: string; right?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-[10px] font-medium text-muted-foreground",
        right ? "order-2" : ""
      )}
    >
      {label}
    </span>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]"></span>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]"></span>
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"></span>
    </div>
  );
}


