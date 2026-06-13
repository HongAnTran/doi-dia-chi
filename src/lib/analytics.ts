import { sendGAEvent } from "@next/third-parties/google";

type EventParams = Record<string, string | number | boolean>;

/**
 * Fire a GA4 event. No-ops (and stays silent — no console warning) when GA is
 * not configured, so call sites don't need to guard. Pass only categorical /
 * aggregate params — NEVER user-entered address text (treat it as personal
 * data).
 */
export function track(event: string, params: EventParams = {}): void {
  if (!process.env.NEXT_PUBLIC_GA_ID) return;
  sendGAEvent("event", event, params);
}
