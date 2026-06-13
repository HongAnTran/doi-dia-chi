"use client";

import { useReportWebVitals } from "next/web-vitals";

import { track } from "@/lib/analytics";

// Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to GA4. GA4 doesn't
// collect these by default, and they're an SEO signal worth monitoring.
export function WebVitals() {
  useReportWebVitals((metric) => {
    track("web_vitals", {
      metric_name: metric.name,
      // GA event values must be integers; CLS is a small ratio, so scale it.
      metric_value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      metric_rating: metric.rating,
      metric_id: metric.id,
    });
  });
  return null;
}
