import type { BlogItem } from "@/lib/api";

/** Canonical public URL: `/blog/{categorySlug}/{postSlug}` when a category exists. */
export function blogPublicPath(blog: Pick<BlogItem, "slug" | "category">): string {
  const catSlug = blog.category?.slug?.trim();
  if (catSlug) {
    return `/blog/${encodeURIComponent(catSlug)}/${encodeURIComponent(blog.slug)}`;
  }
  return `/blog/${encodeURIComponent(blog.slug)}`;
}
