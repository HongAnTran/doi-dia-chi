import { NextResponse } from "next/server";

import { getNewProvince } from "@/lib/converter";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=86400",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provinceCode: string }> },
) {
  const { provinceCode } = await params;
  const province = getNewProvince(provinceCode);
  if (!province) {
    return NextResponse.json({ error: "Province not found" }, { status: 404 });
  }
  return NextResponse.json(province, { headers: CACHE_HEADERS });
}
