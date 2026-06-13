"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_LINKS, isActive } from "@/components/common/nav-links";

/** Fixed bottom tab bar shown only on mobile (the header nav is hidden there). */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-50 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
    >
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
              active ? "text-brand" : "text-foreground/65",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
