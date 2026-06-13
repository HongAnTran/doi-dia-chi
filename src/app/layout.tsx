import type { Metadata } from "next";
import Link from "next/link";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConfirmProvider } from "@/hooks/use-confirm";
import { ModeToggle } from "@/components/mode-toggle";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
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
      <body className={`${beVietnamPro.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <ConfirmProvider>
              <header className="border-b">
                <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
                  <Link
                    href="/"
                    className="text-sm font-semibold tracking-tight"
                  >
                    Đổi địa chỉ
                  </Link>
                  <nav className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-foreground text-sm"
                    >
                      Tra cứu
                    </Link>
                    <Link
                      href="/bulk"
                      className="text-muted-foreground hover:text-foreground text-sm"
                    >
                      Chuyển hàng loạt
                    </Link>
                    <ModeToggle />
                  </nav>
                </div>
              </header>
              {children}
            </ConfirmProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
