"use client";

import Link from "next/link";

import { FeatureRequestDialog } from "@/components/feedback/feature-request-dialog";

/** Footer entry points for "Liên hệ" (page), "Góp ý phát triển" (modal) and
 * "Ủng hộ" (page). */
export function FooterFeedback() {
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-[13px]">
      <Link href="/lien-he" className="hover:text-foreground transition-colors">
        Liên hệ
      </Link>
      <span aria-hidden>·</span>
      <FeatureRequestDialog />
      <span aria-hidden>·</span>
      <Link href="/ung-ho" className="hover:text-foreground transition-colors">
        Ủng hộ
      </Link>
    </div>
  );
}
