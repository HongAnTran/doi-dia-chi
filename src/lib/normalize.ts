/**
 * Normalize Vietnamese text for accent-insensitive search/matching:
 * strips diacritics, maps đ/Đ → d, lowercases, collapses whitespace.
 */
export function normalizeVietnamese(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips a single leading administrative-unit prefix from an already-normalized
 * string so freeform tokens match unit names. Handles:
 *  - spaced/full prefixes: "phuong thanh khe", "p. thanh khe" → "thanh khe"
 *  - abbreviations glued to a number: "p6", "f6", "p.6", "q1" → "6", "1"
 *    ("f" is a common informal stand-in for "phường")
 *  - leading zeros in a numbered unit: "p.06" → "6"
 */
export function stripUnitPrefix(normalized: string): string {
  let s = normalized;
  // Abbreviated/glued prefix immediately before a number.
  const glued = s.match(/^(phuong|quan|xa|p|f|q|x)\.?\s*(\d+[a-z]?)$/);
  if (glued) {
    s = glued[2];
  } else {
    s = s.replace(
      /^(thanh pho|tinh|quan|huyen|thi xa|thi tran|phuong|xa|tp|tx|tt|q|h|p)\.?\s+/,
      "",
    );
  }
  // Collapse leading zeros in a purely numeric unit ("06" → "6").
  s = s.replace(/^0+(\d)/, "$1");
  return s.trim();
}
