"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BlogArticleView } from "@/components/blog/BlogArticleView";
import {
  getBlogByCategoryAndSlug,
  getBlogBySlug,
  getRelevantBlogs,
  type BlogItem,
} from "@/lib/api";

function segmentsFromParams(slug: string | string[] | undefined): string[] {
  if (slug === undefined) return [];
  return Array.isArray(slug) ? slug : [slug];
}

export default function BlogDetailsPage() {
  const router = useRouter();
  const params = useParams<{ slug: string | string[] }>();
  const segments = useMemo(() => segmentsFromParams(params.slug), [params.slug]);

  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [relevantBlogs, setRelevantBlogs] = useState<BlogItem[]>([]);

  useEffect(() => {
    if (segments.length === 0) {
      setIsLoading(false);
      setBlog(null);
      setError("Blog not found.");
      return;
    }

    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        if (segments.length > 2) {
          setBlog(null);
          setRelevantBlogs([]);
          setError("Invalid blog URL.");
          return;
        }

        if (segments.length === 2) {
          const [categorySlug, postSlug] = segments;
          const data = await getBlogByCategoryAndSlug(categorySlug, postSlug, { publishedOnly: true });
          if (!active) return;
          setBlog(data);
          setImageFailed(false);
          try {
            const relevant = await getRelevantBlogs(postSlug, 3);
            if (active) setRelevantBlogs(relevant);
          } catch {
            if (active) setRelevantBlogs([]);
          }
          return;
        }

        const postSlug = segments[0]!;
        const data = await getBlogBySlug(postSlug, { publishedOnly: true });
        if (!active) return;
        if (data.category?.slug) {
          router.replace(`/blog/${encodeURIComponent(data.category.slug)}/${encodeURIComponent(data.slug)}`);
          return;
        }
        setBlog(data);
        setImageFailed(false);
        try {
          const relevant = await getRelevantBlogs(postSlug, 3);
          if (active) setRelevantBlogs(relevant);
        } catch {
          if (active) setRelevantBlogs([]);
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

    void load();
    return () => {
      active = false;
    };
  }, [segments, router]);

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
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
          <BlogArticleView
            blog={blog}
            relevantBlogs={relevantBlogs}
            imageFailed={imageFailed}
            onImageError={() => setImageFailed(true)}
          />
        )}
      </main>
    </div>
  );
}
