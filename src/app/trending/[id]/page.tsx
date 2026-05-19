"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTrendingById, type TrendingItem } from "@/lib/api";

const IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function makeTrendingImageUrl(item: Pick<TrendingItem, "imageUrl" | "s3Key">) {
  const direct = item.imageUrl?.trim() || "";
  if (direct) return direct;
  const key = item.s3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

export default function TrendingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [item, setItem] = useState<TrendingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError("");
      setImageFailed(false);
      try {
        const data = await getTrendingById(id);
        if (!active) return;
        setItem(data);
      } catch (err: unknown) {
        if (!active) return;
        setItem(null);
        setError(err instanceof Error ? err.message : "Failed to load trending design.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const imageUrl = item ? makeTrendingImageUrl(item) : null;

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Inspiration</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#3b322d] sm:text-2xl md:text-3xl">
              Trending Design
            </h1>
          </div>
          <Link
            href="/blog#trending"
            className="inline-flex shrink-0 self-start rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] transition hover:bg-[#f7f4ef] sm:px-4 sm:text-[11px] sm:tracking-[0.14em]"
          >
            Back to blog
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isLoading ? (
          <div className="rounded-3xl border border-[#e6dfd7] bg-white p-6 text-center text-sm font-semibold text-[#847a72] shadow-[0_8px_28px_rgba(41,35,30,0.08)] sm:p-10">
            Loading trending design...
          </div>
        ) : error || !item ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center text-sm font-semibold text-red-600 sm:p-10">
            {error || "Trending design not found."}
          </div>
        ) : (
          <article className="overflow-hidden rounded-3xl border border-[#e6dfd7] bg-white shadow-[0_8px_28px_rgba(41,35,30,0.08)]">
            <div className="relative h-56 w-full bg-[#ece7df] sm:h-[420px]">
              {imageUrl && !imageFailed ? (
                <Image
                  src={imageUrl}
                  alt={item.title || "Trending design"}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f9389]">
                  Image unavailable
                </div>
              )}
            </div>
            <div className="space-y-4 p-4 sm:p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b9088]">
                <span className="rounded-full bg-[#f4efe8] px-2.5 py-1 text-[#7d7269]">Trending</span>
                {item.styleTag ? (
                  <span className="rounded-full bg-[#efe9f8] px-2.5 py-1 text-[#7f6d9f]">{item.styleTag}</span>
                ) : null}
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h2 className="break-words text-2xl font-semibold leading-tight text-[#2d2622] sm:text-3xl md:text-4xl">
                {item.title || "Untitled trend"}
              </h2>
              <p className="break-words text-sm leading-7 text-[#625852] sm:text-base sm:leading-8 md:text-lg">
                {item.caption || "No description available for this trending design yet."}
              </p>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
