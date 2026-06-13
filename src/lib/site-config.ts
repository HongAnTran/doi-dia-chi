// Single source of truth for site identity, canonical URL, and data provenance.
// The "data updated" date doubles as a trust signal shown across the site and
// as `lastModified` in the sitemap, so keep it in one place.

export const SITE_URL = "https://doidiachi.vn";
export const SITE_NAME = "Đổi Địa Chỉ";

/** Effective date of the merger this dataset reflects (NQ 202/2025/QH15). */
export const DATA_UPDATED_ISO = "2025-07-01";
export const DATA_UPDATED_DISPLAY = "01/07/2025";

/** Governing resolution for the province-level merger. */
export const SOURCE_RESOLUTION = "NQ 202/2025/QH15";
export const SOURCE_AUTHORITY = "Cục Thống kê Việt Nam";

/** Absolute URL for a site-relative path, for canonical/OG/sitemap. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

// Donation QR (ủng hộ tác giả). A static image dropped under /public; the QR is
// square. Caption text is shown beneath it (e.g. bank/ví name + account holder).
export const DONATE_QR_SRC = "/donate/qr.jpg";
export const DONATE_CAPTION = "Quét mã để ủng hộ — cảm ơn bạn rất nhiều!";

// Analytics & search-console verification. Both read from env and are optional:
// nothing is rendered until the corresponding value is set.
/** GA4 measurement id, e.g. "G-XXXXXXXXXX". */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
/** Token from the Google Search Console `google-site-verification` meta tag. */
export const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;
