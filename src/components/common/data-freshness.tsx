import {
  DATA_UPDATED_DISPLAY,
  SOURCE_AUTHORITY,
  SOURCE_RESOLUTION,
} from "@/lib/site-config";

// Trust signal: where the data comes from and when it was last effective.
// Shown on content pages so visitors (and crawlers) see the provenance inline.
export function DataFreshness({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-muted-foreground flex flex-wrap items-center gap-2 text-[13px] ${className}`}
    >
      <span className="bg-brand inline-block size-1.5 rounded-full" />
      <span>
        Nguồn: {SOURCE_AUTHORITY} · theo{" "}
        <span className="font-mono text-xs">{SOURCE_RESOLUTION}</span>
      </span>
      <span className="text-border">·</span>
      <span>
        Cập nhật{" "}
        <span className="font-mono text-xs">{DATA_UPDATED_DISPLAY}</span>
      </span>
    </p>
  );
}
