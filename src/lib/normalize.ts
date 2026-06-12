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
