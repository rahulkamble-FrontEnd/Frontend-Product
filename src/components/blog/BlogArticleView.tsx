"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { BlogItem } from "@/lib/api";
import { blogPublicPath } from "@/lib/blog-path";

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function makeBlogImageUrl(blog: BlogItem | null) {
  if (!blog) return null;
  const directUrl = blog.featuredImageUrl?.trim() || "";
  if (directUrl) return directUrl;
  const key = blog.featuredImageS3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

type Props = {
  blog: BlogItem;
  relevantBlogs: BlogItem[];
  imageFailed: boolean;
  onImageError: () => void;
};

export function BlogArticleView({ blog, relevantBlogs, imageFailed, onImageError }: Props) {
  const imageUrl = useMemo(() => makeBlogImageUrl(blog), [blog]);
  const canShowImage = Boolean(imageUrl) && !imageFailed;
  const metaDescription = (blog.metaDescription || "").trim() || stripHtml(blog.body).slice(0, 160);
  const canonicalPath = useMemo(() => blogPublicPath(blog), [blog]);
  const authorDisplayName = blog.author?.name?.trim() || blog.author?.id?.trim() || "Custom Furnish";
  const publishedDate = blog.publishedAt || blog.createdAt;
  const publishedDateLabel = new Date(publishedDate).toLocaleDateString();
  const updatedDateLabel = new Date(blog.updatedAt).toLocaleDateString();
  const showUpdatedDate = blog.updatedAt !== publishedDate;

  const articleSchema = useMemo(() => {
    const siteOrigin =
      (typeof window !== "undefined" ? window.location.origin : "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:4200";
    const normalizedOrigin = siteOrigin.replace(/\/+$/, "");
    const canonicalUrl = `${normalizedOrigin}${canonicalPath}`;
    const publishedAt = blog.publishedAt || blog.createdAt;
    const authorName = authorDisplayName;
    const schema: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: blog.title,
      description: metaDescription,
      datePublished: publishedAt,
      dateModified: blog.updatedAt,
      mainEntityOfPage: canonicalUrl,
      author: {
        "@type": "Person",
        name: authorName,
      },
      publisher: {
        "@type": "Organization",
        name: "Custom Furnish",
      },
    };

    if (imageUrl) {
      schema.image = [imageUrl];
    }
    return schema;
  }, [canonicalPath, blog.title, blog.publishedAt, blog.createdAt, blog.updatedAt, authorDisplayName, metaDescription, imageUrl]);

  return (
    <article className="overflow-x-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="space-y-3 border-b border-[#eee8df] px-6 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
          <span>Published: {publishedDateLabel}</span>
          <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[#7c716a]">{blog.status}</span>
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
          By {authorDisplayName}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
          Last updated: {showUpdatedDate ? updatedDateLabel : "Same as published"}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#302824]">{blog.title}</h1>
        {blog.category?.name && (
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d958d]">
            Category: {blog.category.name}
          </div>
        )}
      </div>

      <div className="px-6 py-6 sm:px-8">
        <div
          className="relative mb-7 h-72 w-full overflow-hidden rounded-md bg-[#f1ede8] sm:h-96"
          title={blog.featuredImageTitle?.trim() || undefined}
        >
          {canShowImage ? (
            <Image
              src={imageUrl!}
              alt={blog.featuredImageAlt?.trim() || blog.title}
              fill
              priority
              loading="eager"
              unoptimized
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover"
              onError={onImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b1a79f]">
              No Image
            </div>
          )}
        </div>

        <div
          className="prose prose-sm max-w-none text-[#534a44] prose-p:leading-7 prose-headings:text-[#302824] prose-img:rounded-md prose-img:border prose-img:border-[#e6dfd7] prose-a:text-[#0468a3] prose-a:underline hover:prose-a:text-[#035382] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-inside [&_ol]:list-inside [&_ul]:pl-0 [&_ol]:pl-0 [&_li]:my-1"
          dangerouslySetInnerHTML={{ __html: blog.body }}
        />

        {relevantBlogs.length > 0 && (
          <div className="mt-10 border-t border-[#eee8df] pt-8">
            <h2 className="text-2xl font-semibold tracking-tight text-[#302824]">Relevant Articles</h2>
            <div className="mt-4 grid gap-3">
              {relevantBlogs.map((item) => (
                <Link
                  key={item.id}
                  href={blogPublicPath(item)}
                  className="rounded-md border border-[#e6dfd7] bg-[#faf8f5] px-4 py-3 text-sm font-semibold text-[#3b322d] hover:bg-white"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
