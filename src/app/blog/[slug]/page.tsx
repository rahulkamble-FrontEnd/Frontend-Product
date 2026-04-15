"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogBySlug, type BlogItem } from "@/lib/api";

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

export default function BlogDetailsPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBlogBySlug(slug, { publishedOnly: true });
        if (!active) return;
        setBlog(data);
        setImageFailed(false);
      } catch (err: unknown) {
        if (!active) return;
        setBlog(null);
        setError(err instanceof Error ? err.message : "Failed to load blog.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const imageUrl = useMemo(() => makeBlogImageUrl(blog), [blog]);
  const canShowImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/blog")}
            className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
          >
            Back to Blog
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading blog...
          </div>
        ) : error || !blog ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">
            {error || "Blog not found."}
          </div>
        ) : (
          <article className="overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-3 border-b border-[#eee8df] px-6 py-6 sm:px-8">
              <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[#7c716a]">{blog.status}</span>
              </div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#302824]">{blog.title}</h1>
              {blog.categoryTag && (
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9d958d]">
                  Category: {blog.categoryTag}
                </div>
              )}
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="relative mb-7 h-72 w-full overflow-hidden rounded-md bg-[#f1ede8] sm:h-96">
                {canShowImage ? (
                  <Image
                    src={imageUrl!}
                    alt={blog.title}
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 1000px"
                    className="object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b1a79f]">
                    No Image
                  </div>
                )}
              </div>

              <div
                className="prose prose-sm max-w-none text-[#534a44] prose-p:leading-7 prose-headings:text-[#302824]"
                dangerouslySetInnerHTML={{ __html: blog.body }}
              />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
