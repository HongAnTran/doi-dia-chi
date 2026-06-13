import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Be_Vietnam_Pro, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { SiteNav } from "@/components/common/site-nav";

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
  title: "Đổi địa chỉ — Chuyển đổi địa chỉ hành chính Việt Nam",
  description:
    "Tra cứu chuyển đổi địa chỉ giữa hệ thống hành chính cũ (63 tỉnh) và mới (34 tỉnh) theo sáp nhập 01/07/2025, hai chiều cũ - mới.",
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
                    className="text-foreground inline-flex items-baseline text-lg font-bold tracking-tight"
                  >
                    Đổi<span className="text-brand">.</span>Địa
                    <span className="text-brand">.</span>Chỉ
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
            Nguồn dữ liệu: Cục Thống kê Việt Nam &middot; theo{" "}
            <span className="font-mono text-[13px]">NQ 202/2025/QH15</span>
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Cập nhật <span className="font-mono text-[13px]">01/07/2025</span>
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
