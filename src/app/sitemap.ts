import type { MetadataRoute } from "next";
import { getServerApiUrl, serverFetchJson } from "@/lib/server-api-base";

type BlogSitemapItem = {
  slug?: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  category?: {
    slug?: string | null;
  } | null;
};

function getSiteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4200").replace(/\/+$/, "");
}

function blogPath(item: BlogSitemapItem) {
  const slug = (item.slug || "").trim();
  if (!slug) return null;
  const categorySlug = item.category?.slug?.trim();
  if (categorySlug) {
    return `/blog/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`;
  }
  return `/blog/${encodeURIComponent(slug)}`;
}

async function fetchPublishedBlogs(): Promise<BlogSitemapItem[]> {
  const data = await serverFetchJson<unknown>(getServerApiUrl("/blog"));
  if (!Array.isArray(data)) return [];
  return data as BlogSitemapItem[];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();
  const blogs = await fetchPublishedBlogs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogs.reduce<MetadataRoute.Sitemap>((acc, item) => {
    const path = blogPath(item);
    if (!path) return acc;
    const dateText = item.updatedAt || item.createdAt || null;
    const lastModified = dateText ? new Date(dateText) : now;
    acc.push({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    return acc;
  }, []);

  return [...staticRoutes, ...blogRoutes];
}
