import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { SiteNav } from "@/components/common/site-nav";
import {
  SITE_NAME,
  SITE_URL,
  SOURCE_AUTHORITY,
  SOURCE_RESOLUTION,
  DATA_UPDATED_DISPLAY,
} from "@/lib/site-config";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Đổi địa chỉ — Chuyển đổi địa chỉ hành chính Việt Nam",
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Tra cứu chuyển đổi địa chỉ giữa hệ thống hành chính cũ (63 tỉnh) và mới (34 tỉnh) theo sáp nhập 01/07/2025, hai chiều cũ - mới.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <QueryProvider>
            <ConfirmProvider>
              <header className="border-border bg-background/90 sticky top-0 z-50 border-b backdrop-blur-sm backdrop-saturate-150">
                <div className="mx-auto flex h-[60px] w-full max-w-5xl items-center gap-6 px-6">
                  <Link
                    href="/"
                    aria-label="Đổi Địa Chỉ — trang chủ"
                    className="text-foreground inline-flex items-center gap-2"
                  >
                    <svg
                      viewBox="0 0 64 64"
                      className="size-8 shrink-0"
                      aria-hidden
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="27.5"
                        fill="none"
                        stroke="#AE3526"
                        strokeWidth="3"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="22.5"
                        fill="none"
                        stroke="#AE3526"
                        strokeWidth="1"
                        opacity="0.55"
                      />
                      <g transform="translate(32 32) scale(0.64) translate(-36.5 -32)">
                        <path
                          fillRule="evenodd"
                          fill="#211D17"
                          d="M16,11 H35 C50,11 57,21 57,32 C57,43 50,53 35,53 H16 Z M28,21 H35 C43,21 47,26 47,32 C47,38 43,43 35,43 H28 Z"
                        />
                        <rect
                          x="9"
                          y="28.5"
                          width="22"
                          height="7"
                          rx="1.5"
                          fill="#211D17"
                        />
                      </g>
                    </svg>
                    <span className="inline-flex items-baseline text-lg font-bold tracking-tight">
                      Đổi<span className="text-brand">.</span>Địa
                      <span className="text-brand">.</span>Chỉ
                    </span>
                  </Link>
                  <SiteNav />
                </div>
              </header>
              {children}
              <SiteFooter />
            </ConfirmProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

function SiteFooter() {
  return (
    <footer className="border-border bg-secondary mt-20 border-t">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="text-foreground/80 mb-5 flex flex-wrap items-center gap-3 text-sm">
          <span className="bg-brand inline-block size-1.5 rounded-full" />
          <span>
            Nguồn dữ liệu: {SOURCE_AUTHORITY} &middot; theo{" "}
            <span className="font-mono text-[13px]">{SOURCE_RESOLUTION}</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Cập nhật{" "}
            <span className="font-mono text-[13px]">
              {DATA_UPDATED_DISPLAY}
            </span>
          </span>
        </div>
        <div className="text-muted-foreground border-border flex flex-wrap justify-between gap-4 border-t pt-5 text-[13px]">
          <span>
            Kết quả mang tính tham khảo — vui lòng đối chiếu văn bản chính thức.
          </span>
          <span>ĐổiĐịaChỉ.vn</span>
        </div>
      </div>
    </footer>
  );
}
