"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (non-HTTPS / permission denied) — keep label as is.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Sao chép địa chỉ"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-[13px] font-semibold transition-colors",
        copied
          ? "text-[#2e6b43]"
          : "text-brand hover:bg-brand/10",
      )}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Đã chép" : "Chép"}
    </button>
  );
}
