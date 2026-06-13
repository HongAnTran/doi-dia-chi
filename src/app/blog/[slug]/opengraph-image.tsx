import { getAllPostSlugs, getPost } from "@/lib/blog";
import { ogContentType, ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Cẩm nang sáp nhập địa chỉ — Đổi Địa Chỉ";
export const size = ogSize;
export const contentType = ogContentType;

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  return renderOgImage({
    eyebrow: post?.category ?? "Cẩm nang",
    title: post?.title ?? "Cẩm nang sáp nhập địa chỉ",
  });
}
