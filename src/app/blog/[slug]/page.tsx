import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";

import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { DataFreshness } from "@/components/common/data-freshness";
import { mdxComponents } from "@/components/blog/mdx-components";
import { Faq } from "@/components/seo/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllPostSlugs, getPost } from "@/lib/blog";
import { SITE_NAME, absoluteUrl } from "@/lib/site-config";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const canonical = `/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    // Drafts are previewable by URL but must not be indexed.
    robots: post.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.title,
      url: canonical,
      publishedTime: post.date,
      modifiedTime: post.updated,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(`/blog/${slug}`),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <JsonLd data={articleJsonLd} />
      <Breadcrumbs
        items={[
          { name: "Trang chủ", href: "/" },
          { name: "Cẩm nang", href: "/blog" },
          { name: post.title },
        ]}
      />

      {post.draft && (
        <p className="border-brand/40 bg-brand/5 text-brand mt-6 rounded-md border px-4 py-2 text-sm">
          Bản nháp — nội dung thủ tục cần được kiểm chứng với văn bản chính thức
          trước khi xuất bản.
        </p>
      )}

      <header className="mt-6">
        <p className="text-brand text-xs font-medium tracking-wide uppercase">
          {post.category}
        </p>
        <h1 className="mt-1 text-[clamp(26px,4.5vw,38px)] leading-tight font-bold tracking-tight text-balance">
          {post.title}
        </h1>
        <p className="text-muted-foreground mt-3 font-mono text-xs">
          Đăng {formatDate(post.date)}
          {post.updated !== post.date &&
            ` · Cập nhật ${formatDate(post.updated)}`}
        </p>
      </header>

      <article className="mt-2">
        <MDXRemote source={post.content} components={mdxComponents} />
      </article>

      <Faq items={post.faq} />

      <section className="border-border mt-10 border-t pt-6">
        <h2 className="text-foreground/70 mb-3 text-sm font-semibold tracking-wide uppercase">
          Công cụ liên quan
        </h2>
        <ul className="text-[15px] leading-relaxed">
          <li>
            <Link
              href="/"
              className="text-brand underline-offset-2 hover:underline"
            >
              Chuyển đổi địa chỉ cũ ↔ mới
            </Link>
          </li>
          <li>
            <Link
              href="/tra-cuu"
              className="text-brand underline-offset-2 hover:underline"
            >
              Tra cứu phường/xã theo tỉnh thành
            </Link>
          </li>
        </ul>
      </section>

      <DataFreshness className="border-border mt-8 border-t pt-6" />
    </main>
  );
}
