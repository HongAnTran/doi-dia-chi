import Link from "next/link";
import type { ComponentProps } from "react";

import {
  MergeOverview,
  TopNewProvinces,
  TopSplitProvinces,
} from "@/components/blog/stat-embeds";

// Internal links use next/link; external links open in a new tab.
function A({ href = "", ...props }: ComponentProps<"a">) {
  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className="text-brand underline-offset-2 hover:underline"
        {...props}
      />
    );
  }
  return (
    <a
      href={href}
      className="text-brand underline-offset-2 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}

// Styling map + data embeds passed to <MDXRemote components={...} />.
export const mdxComponents = {
  a: A,
  h2: (p: ComponentProps<"h2">) => (
    <h2 className="mt-10 text-2xl font-semibold tracking-tight" {...p} />
  ),
  h3: (p: ComponentProps<"h3">) => (
    <h3 className="mt-6 text-lg font-semibold tracking-tight" {...p} />
  ),
  p: (p: ComponentProps<"p">) => (
    <p className="text-foreground/85 mt-4 text-[17px] leading-relaxed" {...p} />
  ),
  ul: (p: ComponentProps<"ul">) => (
    <ul className="mt-4 list-disc space-y-1.5 pl-6 text-[17px]" {...p} />
  ),
  ol: (p: ComponentProps<"ol">) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-6 text-[17px]" {...p} />
  ),
  li: (p: ComponentProps<"li">) => (
    <li className="text-foreground/85 leading-relaxed" {...p} />
  ),
  strong: (p: ComponentProps<"strong">) => (
    <strong className="font-semibold" {...p} />
  ),
  blockquote: (p: ComponentProps<"blockquote">) => (
    <blockquote
      className="border-brand/40 text-muted-foreground my-5 border-l-2 pl-4 italic"
      {...p}
    />
  ),
  MergeOverview,
  TopNewProvinces,
  TopSplitProvinces,
};
