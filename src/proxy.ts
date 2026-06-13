import { NextResponse, type NextRequest } from "next/server";

import { SITE_URL } from "@/lib/site-config";

// Restrict the data APIs to same-origin (our own site) callers.
//
// Honest scope: a public API that our own browser JS calls can't be made truly
// private — a determined person can replay any request our client sends. This
// blocks the realistic cases: other websites calling our API from a browser,
// and casual scrapers/bots. The primary signal is `Sec-Fetch-Site`, which
// modern browsers set automatically and page JavaScript cannot forge.

const allowedOrigins = new Set(
  [SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000"].filter(
    Boolean,
  ) as string[],
);

function isSameOriginRequest(req: NextRequest): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite) {
    // "same-origin" = our own page; "same-site" = a subdomain we own.
    return secFetchSite === "same-origin" || secFetchSite === "same-site";
  }

  // Fallback for clients that don't send Sec-Fetch metadata: check the Origin
  // (sent on POST/cross-origin) then the Referer against our allowlist.
  const origin = req.headers.get("origin");
  if (origin) return allowedOrigins.has(origin);

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  // No origin signal at all (e.g. a raw curl request) — reject.
  return false;
}

export function proxy(req: NextRequest) {
  // Better Auth handles its own OAuth callbacks, which are legitimately
  // cross-origin (e.g. Google redirect), so it must not be gated here.
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!isSameOriginRequest(req)) {
    return NextResponse.json(
      { error: "Forbidden: chỉ truy cập được từ doidiachi.vn." },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
