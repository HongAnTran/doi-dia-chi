import { NextResponse } from "next/server";

import { convertNewToOld } from "@/lib/converter";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wardCode: string }> },
) {
  const { wardCode } = await params;
  const result = convertNewToOld(wardCode);
  if (!result) {
    return NextResponse.json({ error: "Ward not found" }, { status: 404 });
  }
  return NextResponse.json(result, { headers: CACHE_HEADERS });
}
