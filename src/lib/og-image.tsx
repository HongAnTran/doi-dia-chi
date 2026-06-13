// Shared Open Graph image renderer (1200×630) used by the root default OG
// image and per-article blog images. Uses next/og (Satori) with bundled
// Be Vietnam Pro so Vietnamese diacritics render correctly.

import fs from "node:fs";
import path from "node:path";

import { ImageResponse } from "next/og";

import {
  DATA_UPDATED_DISPLAY,
  SITE_NAME,
  SOURCE_RESOLUTION,
} from "@/lib/site-config";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

const fontDir = path.join(process.cwd(), "src/assets/fonts");
const fontRegular = fs.readFileSync(
  path.join(fontDir, "BeVietnamPro-Regular.ttf"),
);
const fontSemiBold = fs.readFileSync(
  path.join(fontDir, "BeVietnamPro-SemiBold.ttf"),
);
const fontBold = fs.readFileSync(path.join(fontDir, "BeVietnamPro-Bold.ttf"));

// The seal mark, inlined as a data URI so Satori can render it as an <img>.
const SEAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="96" height="96"><circle cx="32" cy="32" r="27.5" fill="none" stroke="#AE3526" stroke-width="3"/><circle cx="32" cy="32" r="22.5" fill="none" stroke="#AE3526" stroke-width="1" opacity="0.55"/><g transform="translate(32 32) scale(0.64) translate(-36.5 -32)"><path fill-rule="evenodd" fill="#211D17" d="M16,11 H35 C50,11 57,21 57,32 C57,43 50,53 35,53 H16 Z M28,21 H35 C43,21 47,26 47,32 C47,38 43,43 35,43 H28 Z"/><rect x="9" y="28.5" width="22" height="7" rx="1.5" fill="#211D17"/></g></svg>`;
const sealDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(SEAL_SVG)}`;

export function renderOgImage({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#f3efe7",
        color: "#211d17",
        fontFamily: "BeVietnamPro",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", height: 12, width: "100%" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sealDataUri} width={96} height={96} alt="" />
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
          {SITE_NAME}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#ae3526",
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontSize: title.length > 56 ? 58 : 70,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1.5,
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 24,
          color: "#6a6253",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#ae3526",
          }}
        />
        <span>
          Nguồn {SOURCE_RESOLUTION} · Cập nhật {DATA_UPDATED_DISPLAY} ·
          doidiachi.vn
        </span>
      </div>
    </div>,
    {
      ...ogSize,
      fonts: [
        {
          name: "BeVietnamPro",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "BeVietnamPro",
          data: fontSemiBold,
          weight: 600,
          style: "normal",
        },
        { name: "BeVietnamPro", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );
}
