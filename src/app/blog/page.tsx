"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlogs, type BlogItem } from "@/lib/api";

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function makeBlogImageUrl(blog: BlogItem) {
  const directUrl = blog.featuredImageUrl?.trim() || "";
  if (directUrl) return directUrl;
  const key = blog.featuredImageS3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState("");
  const [failedImageBlogIds, setFailedImageBlogIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "");
  }, []);

  useEffect(() => {
    let active = true;

    const loadBlogs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBlogs();
        if (!active) return;
        setBlogs(data);
        setFailedImageBlogIds(new Set());
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load blogs.");
        setBlogs([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadBlogs();
    return () => {
      active = false;
    };
  }, []);

  const orderedBlogs = useMemo(
    () =>
      [...blogs].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [blogs]
  );

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-gray-900">
      <header className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#4d2c1e]">Blog</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Latest Articles</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-700 hover:bg-gray-50"
            >
              Dashboard
            </button>
            {userRole === "blogadmin" && (
              <button
                type="button"
                onClick={() => router.push("/blog/create")}
                className="rounded-md bg-[#0468a3] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white shadow-sm hover:opacity-95"
              >
                Create Blog
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="h-56 animate-pulse bg-gray-100" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
                  <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : orderedBlogs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm font-semibold text-gray-500 shadow-sm">
            No blogs available yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {orderedBlogs.map((blog) => {
              const imageUrl = makeBlogImageUrl(blog);
              const canRenderImage = Boolean(imageUrl) && !failedImageBlogIds.has(blog.id);
              const preview = stripHtml(blog.body).slice(0, 150);

              return (
                <article
                  key={blog.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-56 w-full bg-gray-100">
                    {canRenderImage ? (
                      <Image
                        src={imageUrl!}
                        alt={blog.title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover"
                        onError={() =>
                          setFailedImageBlogIds((prev) => {
                            const next = new Set(prev);
                            next.add(blog.id);
                            return next;
                          })
                        }
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{blog.status}</span>
                    </div>
                    <h2 className="line-clamp-2 text-lg font-black leading-tight text-gray-900">{blog.title}</h2>
                    <p className="line-clamp-3 text-sm leading-6 text-gray-600">{preview || "No blog content added yet."}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
