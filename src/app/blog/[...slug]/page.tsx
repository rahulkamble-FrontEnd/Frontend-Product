import type { Metadata } from "next";
import { cache } from "react";
import { redirect } from "next/navigation";
import { BlogDetailsClient } from "./BlogDetailsClient";
import type { BlogItem } from "@/lib/api";
import { getServerApiUrl, serverFetchJson } from "@/lib/server-api-base";

type RouteParams = { slug?: string[] };
type BlogMetadataResponse = BlogItem & {
  title?: string;
  body?: string;
  slug?: string;
  category?: { slug?: string | null } | null;
  metaDescription?: string | null;
  socialImageS3Key?: string | null;
  featuredImageUrl?: string | null;
  featuredImageS3Key?: string | null;
};

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseCanonicalUrl(value: string | null | undefined) {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function buildKeywords(blog: BlogMetadataResponse): string[] {
  const keywords: string[] = [];
  const focus = blog.seoKeyword?.trim();
  if (focus) keywords.push(focus);

  const secondary = blog.secondaryKeywords?.trim();
  if (secondary) {
    for (const piece of secondary.split(",")) {
      const keyword = piece.trim();
      if (keyword) keywords.push(keyword);
    }
  }
  return Array.from(new Set(keywords));
}

function getSiteBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4200").replace(/\/+$/, "");
}

function makeBlogImageUrl(blog: BlogMetadataResponse) {
  const socialKey = blog.socialImageS3Key?.trim() || "";
  if (socialKey) {
    if (socialKey.startsWith("http://") || socialKey.startsWith("https://")) return socialKey;
    return `${BLOG_IMAGE_BASE_URL}/${socialKey.replace(/^\/+/, "")}`;
  }
  const directUrl = blog.featuredImageUrl?.trim() || "";
  if (directUrl) return directUrl;
  const key = blog.featuredImageS3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

const fetchBlogForMetadata = cache(async (segments: string[]): Promise<BlogMetadataResponse | null> => {
  if (segments.length < 1 || segments.length > 2) return null;
  const url =
    segments.length === 2
      ? getServerApiUrl(
          `/blog/by-category/${encodeURIComponent(segments[0]!)}/${encodeURIComponent(segments[1]!)}`,
        )
      : getServerApiUrl(`/blog/${encodeURIComponent(segments[0]!)}`);

  return serverFetchJson<BlogMetadataResponse>(url);
});

const fetchRelevantBlogsForSlug = cache(async (slug: string): Promise<BlogItem[]> => {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return [];
  const data = await serverFetchJson<unknown>(
    getServerApiUrl(`/blog/${encodeURIComponent(cleanSlug)}/relevant?limit=3`),
  );
  return Array.isArray(data) ? (data as BlogItem[]) : [];
});

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const resolved = await params;
  const segments = Array.isArray(resolved?.slug) ? resolved.slug : [];
  const blog = await fetchBlogForMetadata(segments);

  const fallbackTitle = "Blog | Custom Furnish";
  const fallbackDescription = "Read the latest insights from Custom Furnish blog.";
  if (!blog) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
      },
    };
  }

  const title = blog.metaTitle?.trim() || blog.title?.trim() || fallbackTitle;
  const description = (blog.metaDescription || "").trim() || stripHtml(blog.body || "").slice(0, 160) || fallbackDescription;
  const canonicalPath = blog.category?.slug
    ? `/blog/${encodeURIComponent(blog.category.slug)}/${encodeURIComponent(blog.slug || "")}`
    : `/blog/${encodeURIComponent(blog.slug || "")}`;
  const canonicalUrl = parseCanonicalUrl(blog.canonicalUrl) || `${getSiteBaseUrl()}${canonicalPath}`;
  const imageUrl = makeBlogImageUrl(blog);
  const robotsIndex = blog.metaRobots === "noindex" ? false : true;
  const keywords = buildKeywords(blog);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: robotsIndex,
      follow: robotsIndex,
      googleBot: {
        index: robotsIndex,
        follow: robotsIndex,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      images: imageUrl ? [{ url: imageUrl, alt: title }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolved = await params;
  const segments = Array.isArray(resolved?.slug) ? resolved.slug : [];
  if (segments.length < 1 || segments.length > 2) {
    return (
      <BlogDetailsClient
        initialBlog={null}
        initialRelevantBlogs={[]}
        initialError="Invalid blog URL."
      />
    );
  }

  const blog = await fetchBlogForMetadata(segments);
  if (!blog) {
    return (
      <BlogDetailsClient
        initialBlog={null}
        initialRelevantBlogs={[]}
        initialError="Blog not found."
      />
    );
  }

  if (segments.length === 1 && blog.category?.slug) {
    redirect(`/blog/${encodeURIComponent(blog.category.slug)}/${encodeURIComponent(blog.slug || "")}`);
  }

  const relevant = await fetchRelevantBlogsForSlug(blog.slug || "");
  return (
    <BlogDetailsClient
      initialBlog={blog}
      initialRelevantBlogs={relevant}
      initialError=""
    />
  );
}
