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
