import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/site-config";

export interface Crumb {
  name: string;
  /** Site-relative path. Omit on the final (current) crumb. */
  href?: string;
}

/** Visual breadcrumb trail plus a BreadcrumbList JSON-LD for rich results. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-foreground" aria-current="page">
                {item.name}
              </span>
            )}
            {i < items.length - 1 && (
              <span aria-hidden className="text-border">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
