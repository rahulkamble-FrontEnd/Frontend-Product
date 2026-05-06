"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogBySlug, getRelevantBlogs, type BlogItem } from "@/lib/api";

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
  const [relevantBlogs, setRelevantBlogs] = useState<BlogItem[]>([]);

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
        try {
          const relevant = await getRelevantBlogs(slug, 3);
          if (active) {
            setRelevantBlogs(relevant);
          }
        } catch {
          if (active) {
            setRelevantBlogs([]);
          }
        }
      } catch (err: unknown) {
        if (!active) return;
        setBlog(null);
        setRelevantBlogs([]);
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
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => router.push("/blog")}
            className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] transition hover:bg-[#f7f4ef] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]"
          >
            Back to Blog
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] transition hover:bg-[#f7f4ef] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
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
            <div className="space-y-2.5 border-b border-[#eee8df] px-4 py-4 sm:space-y-3 sm:px-8 sm:py-6">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9b9088] sm:gap-3 sm:text-[11px] sm:tracking-[0.12em]">
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[#7c716a]">{blog.status}</span>
              </div>
              <h1 className="text-2xl font-semibold leading-[1.15] tracking-tight text-[#302824] sm:text-3xl sm:leading-tight">{blog.title}</h1>
              {blog.category?.name && (
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9d958d] sm:text-xs sm:tracking-[0.14em]">
                  Category: {blog.category.name}
                </div>
              )}
            </div>

            <div className="px-4 py-4 sm:px-8 sm:py-6">
              <div className="relative mb-5 h-52 w-full overflow-hidden rounded-md bg-[#f1ede8] sm:mb-7 sm:h-96">
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
                className="prose prose-sm max-w-none text-[#534a44] prose-p:leading-6 prose-headings:text-[#302824] sm:prose-p:leading-7"
                dangerouslySetInnerHTML={{ __html: blog.body }}
              />

              {relevantBlogs.length > 0 && (
                <div className="mt-7 border-t border-[#eee8df] pt-6 sm:mt-10 sm:pt-8">
                  <h2 className="text-xl font-semibold tracking-tight text-[#302824] sm:text-2xl">
                    Relevant Articles
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {relevantBlogs.map((item) => (
                      <Link
                        key={item.id}
                        href={`/blog/${encodeURIComponent(item.slug)}`}
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
        )}
      </main>
    </div>
  );
}
