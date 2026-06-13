// File-based MDX blog. No database: posts live as .mdx files in
// src/content/blog with YAML frontmatter, read at build/server time.

import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import type { FaqItem } from "@/components/seo/faq";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date published. */
  date: string;
  /** ISO date last updated (defaults to `date`). */
  updated: string;
  category: string;
  /** Draft posts render (for review) but are noindex + hidden from lists. */
  draft: boolean;
  faq: FaqItem[];
}

export interface Post extends PostMeta {
  /** Raw MDX body. */
  content: string;
}

function parseFile(slug: string): Post {
  const raw = fs.readFileSync(path.join(BLOG_DIR, `${slug}.mdx`), "utf8");
  const { data, content } = matter(raw);
  const date = String(data.date ?? "");
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date,
    updated: String(data.updated ?? date),
    category: String(data.category ?? "Hướng dẫn"),
    draft: Boolean(data.draft),
    faq: Array.isArray(data.faq) ? (data.faq as FaqItem[]) : [],
    content,
  };
}

function allSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

/** Published posts (drafts excluded), newest first. For listings + sitemap. */
export function getPublishedPosts(): PostMeta[] {
  return allSlugs()
    .map(parseFile)
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post by slug, including drafts (so they can be previewed). */
export function getPost(slug: string): Post | null {
  if (!allSlugs().includes(slug)) return null;
  return parseFile(slug);
}

/** All slugs including drafts — for generateStaticParams. */
export function getAllPostSlugs(): string[] {
  return allSlugs();
}
