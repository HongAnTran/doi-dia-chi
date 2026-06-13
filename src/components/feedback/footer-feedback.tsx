"use client";

import Link from "next/link";

import { FeatureRequestDialog } from "@/components/feedback/feature-request-dialog";

/** Footer entry points for "Liên hệ" (page) and "Góp ý phát triển" (modal). */
export function FooterFeedback() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-[13px]">
      <Link href="/lien-he" className="hover:text-foreground transition-colors">
        Liên hệ
      </Link>
      <span aria-hidden>·</span>
      <FeatureRequestDialog />
    </div>
  );
}
