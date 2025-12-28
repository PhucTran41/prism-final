"use client";

import { Button } from "@/src/frontend/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ content }: { content: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied brief to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="inline-flex items-center gap-2">
      <Copy className="h-4 w-4" />
      Copy
    </Button>
  );
}


