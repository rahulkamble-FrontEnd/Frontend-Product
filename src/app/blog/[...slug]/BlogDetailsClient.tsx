"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlogArticleView } from "@/components/blog/BlogArticleView";
import { type BlogItem } from "@/lib/api";

type Props = {
  initialBlog: BlogItem | null;
  initialRelevantBlogs: BlogItem[];
  initialError: string;
};

export function BlogDetailsClient({
  initialBlog,
  initialRelevantBlogs,
  initialError,
}: Props) {
  const router = useRouter();
  const [blog] = useState<BlogItem | null>(initialBlog);
  const [error] = useState(initialError);
  const [imageFailed, setImageFailed] = useState(false);
  const [relevantBlogs] = useState<BlogItem[]>(initialRelevantBlogs);

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
        {error || !blog ? (
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
