import { NextResponse } from "next/server";

import { convertOldToNew } from "@/lib/converter";

// No HTTP caching: the converted result (incl. hamlet data) evolves with each
// data rebuild, and a long-lived browser cache would serve stale responses.
// React Query already dedupes these in-memory per session.
const CACHE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wardCode: string }> },
) {
  const { wardCode } = await params;
  const result = convertOldToNew(wardCode);
  if (!result) {
    return NextResponse.json({ error: "Ward not found" }, { status: 404 });
  }
  return NextResponse.json(result, { headers: CACHE_HEADERS });
}
