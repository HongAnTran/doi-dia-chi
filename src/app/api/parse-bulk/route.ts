import { NextResponse } from "next/server";

import { convertFreeform } from "@/lib/converter";

const MAX_ROWS = 20000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { addresses, target } = (body ?? {}) as {
    addresses?: unknown;
    target?: unknown;
  };
  if (!Array.isArray(addresses)) {
    return NextResponse.json(
      { error: "Body must be { addresses: string[], target?: 'new'|'old' }" },
      { status: 400 },
    );
  }
  if (addresses.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Tối đa ${MAX_ROWS} dòng mỗi lần` },
      { status: 413 },
    );
  }
  const to = target === "old" ? "old" : "new";
  const results = addresses.map((a) =>
    convertFreeform(typeof a === "string" ? a : String(a ?? ""), to),
  );
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "no-store" } },
  );
}
