import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { SiteNav } from "@/components/common/site-nav";
import { MobileBottomNav } from "@/components/common/mobile-bottom-nav";
import { FooterFeedback } from "@/components/feedback/footer-feedback";
import { Toaster } from "@/components/ui/sonner";
import { WebVitals } from "@/components/analytics/web-vitals";
import Image from "next/image";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  SITE_NAME,
  SITE_URL,
  SOURCE_AUTHORITY,
  SOURCE_RESOLUTION,
  DATA_UPDATED_DISPLAY,
  GA_ID,
  GOOGLE_SITE_VERIFICATION,
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
  twitter: { card: "summary_large_image" },
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} ${ibmPlexMono.variable} pb-[calc(env(safe-area-inset-bottom)+3.75rem)] antialiased md:pb-0`}
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
                    <Image
                      src="/logo/doidiachi-seal-lockup.svg"
                      alt="Đổi Địa Chỉ"
                      width={372}
                      height={96}
                      priority
                      className="h-auto w-[150px] md:w-[188px]"
                    />
                  </Link>
                  <SiteNav />
                </div>
              </header>
              {children}
              <SiteFooter />
              <MobileBottomNav />
              <Toaster />
            </ConfirmProvider>
          </QueryProvider>
        </ThemeProvider>
        {GA_ID ? (
          <>
            <GoogleAnalytics gaId={GA_ID} />
            <WebVitals />
          </>
        ) : null}
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
        <div className="border-border flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <FooterFeedback />
          <span className="text-muted-foreground text-[13px]">
            ĐổiĐịaChỉ.vn
          </span>
        </div>
        <p className="text-muted-foreground mt-4 text-[13px]">
          Kết quả mang tính tham khảo — vui lòng đối chiếu văn bản chính thức.
        </p>
      </div>
    </footer>
  );
}
