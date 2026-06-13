// SEO slugs for commune/province pages: a keyword-rich name slug with the
// stable unit code appended, e.g. "phuong-phuc-xa-ha-noi-1". The trailing code
// keeps the URL unique and lets us resolve the page without ambiguity even when
// two units share a name.

import { normalizeVietnamese } from "./normalize";

/** "Phường Phúc Xá" → "phuong-phuc-xa". */
export function slugify(name: string): string {
  return normalizeVietnamese(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** name + code → canonical slug. Code is always the final hyphen segment. */
export function buildSlug(name: string, code: string): string {
  return `${slugify(name)}-${code.toLowerCase()}`;
}

/** Pull the unit code back out of a slug (everything after the last hyphen). */
export function codeFromSlug(slug: string): string {
  return slug.slice(slug.lastIndexOf("-") + 1);
}
