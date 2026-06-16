/**
 * Example freeform addresses shown as input hints — used by both the paste
 * parser (clickable) and the bulk page (static), so the list stays in sync.
 * Each entry is [nhãn ngắn, địa chỉ ví dụ].
 */
export const ADDRESS_EXAMPLES: ReadonlyArray<readonly [string, string]> = [
  ["Viết tắt + số nhà", "123/4 Lê Lợi, P.Bến Nghé, Q1, TP.HCM"],
  ["Không cần dấu phẩy", "85/34f lò siêu p16 q11 hcm"],
  ["Gõ không dấu", "p vu ninh tp bac ninh"],
  ["Phường đánh số", "so 5 p.6 q3 tphcm"],
  ["Cần chọn thôn", "xã hòa tiến, hòa vang, đà nẵng"],
];
