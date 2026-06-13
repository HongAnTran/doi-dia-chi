import { NextResponse } from "next/server";

import { parseAddress } from "@/lib/converter";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ query: q, candidates: [] });
  }
  return NextResponse.json(parseAddress(q), {
    headers: { "Cache-Control": "no-store" },
  });
}
