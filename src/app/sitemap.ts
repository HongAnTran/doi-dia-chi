import type { MetadataRoute } from "next";

import { getPublishedPosts } from "@/lib/blog";
import {
  getAllNewWards,
  getAllOldWards,
  getNewProvinceOptions,
  getOldProvinceOptions,
} from "@/lib/converter";
import { DATA_UPDATED_ISO, absoluteUrl } from "@/lib/site-config";
import { buildSlug } from "@/lib/slug";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = DATA_UPDATED_ISO;

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified, priority: 1 },
    { url: absoluteUrl("/bulk"), lastModified, priority: 0.8 },
    { url: absoluteUrl("/tra-cuu"), lastModified, priority: 0.8 },
    { url: absoluteUrl("/blog"), lastModified, priority: 0.6 },
  ];

  const oldProvinces = getOldProvinceOptions().map((p) => ({
    url: absoluteUrl(`/tinh-cu/${buildSlug(p.name, p.code)}`),
    lastModified,
    priority: 0.5,
  }));

  const newProvinces = getNewProvinceOptions().map((p) => ({
    url: absoluteUrl(`/tinh-moi/${buildSlug(p.name, p.code)}`),
    lastModified,
    priority: 0.6,
  }));

  const oldWards = getAllOldWards().map((w) => ({
    url: absoluteUrl(`/xa-cu/${buildSlug(w.name, w.code)}`),
    lastModified,
    priority: 0.5,
  }));

  const newWards = getAllNewWards().map((w) => ({
    url: absoluteUrl(`/xa-moi/${buildSlug(w.name, w.code)}`),
    lastModified,
    priority: 0.5,
  }));

  const posts = getPublishedPosts().map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: p.updated,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...newProvinces,
    ...oldProvinces,
    ...newWards,
    ...oldWards,
    ...posts,
  ];
}
