"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Chuyển đổi" },
  { href: "/bulk", label: "Hàng loạt" },
] as const;

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="ml-auto flex items-center gap-1">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-[15px] font-medium transition-colors",
              active
                ? "text-brand"
                : "text-foreground/75 hover:bg-secondary hover:text-foreground",
            )}
          >
            {label}
            {active && (
              <span className="bg-brand mt-1 block h-0.5 rounded-full" aria-hidden />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
