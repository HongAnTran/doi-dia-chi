import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Cẩm nang sáp nhập địa chỉ",
  description:
    "Hướng dẫn thủ tục sau sáp nhập (CCCD, sổ đỏ, hóa đơn, đăng ký kinh doanh) và phân tích dữ liệu sáp nhập đơn vị hành chính 01/07/2025.",
  alternates: { canonical: "/blog" },
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export default function BlogIndexPage() {
  const posts = getPublishedPosts();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <Breadcrumbs
        items={[{ name: "Trang chủ", href: "/" }, { name: "Cẩm nang" }]}
      />

      <header className="mt-6">
        <h1 className="text-[clamp(24px,4vw,34px)] leading-tight font-bold tracking-tight">
          Cẩm nang sáp nhập địa chỉ
        </h1>
        <p className="text-foreground/80 mt-3 text-[17px] leading-relaxed">
          Thủ tục cần làm sau khi đổi địa chỉ và những phân tích từ chính dữ
          liệu sáp nhập đơn vị hành chính.
        </p>
      </header>

      <section className="mt-8 space-y-5">
        {posts.map((p) => (
          <article
            key={p.slug}
            className="border-border bg-card hover:border-brand/60 rounded-lg border p-5 transition-colors"
          >
            <p className="text-brand text-xs font-medium tracking-wide uppercase">
              {p.category}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              <Link href={`/blog/${p.slug}`} className="hover:text-brand">
                {p.title}
              </Link>
            </h2>
            <p className="text-foreground/80 mt-2 text-[15px] leading-relaxed">
              {p.description}
            </p>
            <p className="text-muted-foreground mt-3 font-mono text-xs">
              {formatDate(p.date)}
            </p>
          </article>
        ))}
        {posts.length === 0 && (
          <p className="text-muted-foreground">Chưa có bài viết.</p>
        )}
      </section>
    </main>
  );
}
