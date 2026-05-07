"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { blogPublicPath } from "@/lib/blog-path";
import { getBlogs, getPortfolios, getTrendings, type BlogItem, type PortfolioResponse, type TrendingItem } from "@/lib/api";

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
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(true);
  const [error, setError] = useState("");
  const [trendingError, setTrendingError] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [failedImageBlogIds, setFailedImageBlogIds] = useState<Set<string>>(new Set());
  const [failedTrendingImageIds, setFailedTrendingImageIds] = useState<Set<string>>(new Set());
  const [failedPortfolioImageIds, setFailedPortfolioImageIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const loadBlogs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBlogs({ publishedOnly: true });
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

  useEffect(() => {
    let active = true;

    const loadTrendings = async () => {
      setIsLoadingTrending(true);
      setTrendingError("");
      try {
        const data = await getTrendings();
        if (!active) return;
        setTrendingItems(data);
        setFailedTrendingImageIds(new Set());
      } catch (err: unknown) {
        if (!active) return;
        setTrendingError(err instanceof Error ? err.message : "Failed to load trending entries.");
        setTrendingItems([]);
      } finally {
        if (active) setIsLoadingTrending(false);
      }
    };

    loadTrendings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadPortfolios = async () => {
      setIsLoadingPortfolio(true);
      setPortfolioError("");
      try {
        const data = await getPortfolios();
        if (!active) return;
        setPortfolioItems(data);
        setFailedPortfolioImageIds(new Set());
      } catch (err: unknown) {
        if (!active) return;
        setPortfolioError(err instanceof Error ? err.message : "Failed to load portfolio.");
        setPortfolioItems([]);
      } finally {
        if (active) setIsLoadingPortfolio(false);
      }
    };

    loadPortfolios();
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

  const orderedTrendings = useMemo(
    () =>
      [...trendingItems].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [trendingItems]
  );

  const orderedPortfolios = useMemo(
    () =>
      [...portfolioItems].sort((a, b) => {
        const aTime = new Date(a.portfolio.createdAt).getTime();
        const bTime = new Date(b.portfolio.createdAt).getTime();
        return bTime - aTime;
      }),
    [portfolioItems]
  );

  const makePortfolioImageUrl = (input: { url?: string | null; s3Key?: string | null }) => {
    const direct = (input.url || "").trim();
    if (direct) return direct;
    const clean = (input.s3Key || "").trim();
    if (!clean) return null;
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    return `${BLOG_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
  };

  const makeTrendingImageUrl = (input: { imageUrl?: string | null; s3Key?: string | null }) => {
    const direct = (input.imageUrl || "").trim();
    if (direct) return direct;
    const clean = (input.s3Key || "").trim();
    if (!clean) return null;
    if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
    return `${BLOG_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-3 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Editorial</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Blog Journal</h1>
          </div>
          {/* <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
            >
              Dashboard
            </button>
            {userRole === "blogadmin" && (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/blog/create")}
                  className="rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a58d74]"
                >
                  Create Blog
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/portfolio/create")}
                  className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
                >
                  Create Portfolio
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/trending/create")}
                  className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
                >
                  Create Trending
                </button>
              </>
            )}
          </div> */}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 lg:px-8">
        <section>
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Editorial</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Latest Blogs</h2>
          </div>
        {error && (
          <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="w-[270px] shrink-0 overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:w-auto sm:shrink">
                <div className="h-44 animate-pulse bg-[#f1ede8] sm:h-56" />
                <div className="space-y-3 p-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-[#f1ede8]" />
                  <div className="h-5 w-full animate-pulse rounded bg-[#f1ede8]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[#f1ede8]" />
                </div>
              </div>
            ))}
          </div>
        ) : orderedBlogs.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-10 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No blogs available yet.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible xl:grid-cols-3">
            {orderedBlogs.map((blog, idx) => {
              const imageUrl = makeBlogImageUrl(blog);
              const canRenderImage = Boolean(imageUrl) && !failedImageBlogIds.has(blog.id);
              const preview = stripHtml(blog.body).slice(0, 150);

              return (
                <Link
                  key={blog.id}
                  href={blogPublicPath(blog)}
                  className="block overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(41,35,30,0.08)]"
                >
                  <div className="relative h-40 w-full bg-[#f1ede8] sm:h-56">
                    {canRenderImage ? (
                      <Image
                        src={imageUrl!}
                        alt={blog.featuredImageAlt?.trim() || blog.title}
                        title={blog.featuredImageTitle?.trim() || undefined}
                        fill
                        loading={idx === 0 ? "eager" : "lazy"}
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
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b1a79f]">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9b9088]">
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[#7c716a]">{blog.status}</span>
                    </div>
                    <h2 className="line-clamp-2 text-[20px] font-semibold leading-[1.2] text-[#302824] sm:text-[27px] sm:leading-[1.15]">
                      {blog.title}
                    </h2>
                    <p className="line-clamp-3 text-[13px] leading-5 text-[#7a7069] sm:text-sm sm:leading-6">{preview || "No blog content added yet."}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        </section>

        <section className="mt-10 border-t border-[#e6dfd7] pt-10 sm:mt-16 sm:pt-14">
          <div className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Inspiration</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Trending</h2>
          </div>

          {trendingError && (
            <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
              {trendingError}
            </div>
          )}

          {isLoadingTrending ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:block sm:space-y-6 sm:overflow-visible sm:pb-0">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className="grid w-[290px] shrink-0 overflow-hidden rounded-3xl border border-[#e6dfd7] bg-white shadow-[0_8px_28px_rgba(41,35,30,0.08)] sm:w-full sm:shrink-0 lg:grid-cols-[1.06fr_1fr]"
                >
                  <div className="h-48 animate-pulse bg-[#f1ede8] sm:h-64 lg:h-full" />
                  <div className="space-y-4 p-6 sm:p-8">
                    <div className="h-4 w-28 animate-pulse rounded bg-[#f1ede8]" />
                    <div className="h-10 w-4/5 animate-pulse rounded bg-[#f1ede8]" />
                    <div className="h-4 w-full animate-pulse rounded bg-[#f1ede8]" />
                    <div className="h-4 w-4/5 animate-pulse rounded bg-[#f1ede8]" />
                  </div>
                </div>
              ))}
            </div>
          ) : orderedTrendings.length === 0 ? (
            <div className="rounded-md border border-[#e6dfd7] bg-white p-10 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              No trending stories available yet.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:block sm:space-y-6 sm:overflow-visible sm:pb-0">
              {orderedTrendings.map((item, idx) => {
                const imageUrl = makeTrendingImageUrl(item);
                const fallbackId = item.id?.trim() || `${item.title || "trending"}-${idx}`;
                const canRenderImage = Boolean(imageUrl) && !failedTrendingImageIds.has(fallbackId);

                return (
                  <article
                    key={fallbackId}
                    className="grid w-[290px] shrink-0 overflow-hidden rounded-3xl border border-[#e6dfd7] bg-white shadow-[0_8px_28px_rgba(41,35,30,0.08)] sm:w-full sm:shrink-0 lg:grid-cols-[1.06fr_1fr]"
                  >
                    <div className="relative h-48 w-full bg-[#ece7df] sm:h-72 lg:h-full">
                      {canRenderImage ? (
                        <Image
                          src={imageUrl!}
                          alt={item.title || "Trending image"}
                          fill
                          loading="eager"
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 52vw"
                          className="object-cover"
                          onError={() =>
                            setFailedTrendingImageIds((prev) => {
                              const next = new Set(prev);
                              next.add(fallbackId);
                              return next;
                            })
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9f9389]">
                          Image unavailable
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center p-4 sm:p-10">
                      <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#9b9088]">
                        <span className="rounded-full bg-[#f4efe8] px-2.5 py-1 text-[#7d7269]">News</span>
                        <span className="rounded-full bg-[#efe9f8] px-2.5 py-1 text-[#7f6d9f]">{item.styleTag || "Inspiration"}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl font-semibold leading-tight text-[#2d2622] sm:text-5xl">
                        {item.title || "Untitled trend"}
                      </h3>
                      <p className="mt-4 text-[13px] leading-6 text-[#746b64] sm:text-base sm:leading-8">
                        {item.caption || "No caption available for this trend yet."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-[#e6dfd7] pt-10 sm:mt-16 sm:pt-14">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black uppercase tracking-[0.06em] text-[#3b4762] sm:text-4xl">Portfolio</h2>
            <div className="mx-auto mt-3 h-0.5 w-16 bg-[#c7dbe9]" />
          </div>

          {portfolioError && (
            <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-center text-sm font-semibold text-red-600">
              {portfolioError}
            </div>
          )}

          {isLoadingPortfolio ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-56 overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                >
                  <div className="h-full animate-pulse bg-[#f1ede8]" />
                </div>
              ))}
            </div>
          ) : orderedPortfolios.length === 0 ? (
            <div className="rounded-md border border-[#e6dfd7] bg-white p-10 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              No portfolio entries available yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2">
              {orderedPortfolios.map((entry, idx) => {
                const sortedImages = [...entry.images].sort((a, b) => a.displayOrder - b.displayOrder);
                const firstImage = sortedImages[0];
                const imageUrl = firstImage ? makePortfolioImageUrl(firstImage) : null;
                const cardId =
                  entry.portfolio.id?.trim() ||
                  `${entry.portfolio.title?.trim() || "portfolio"}-${entry.portfolio.createdAt || "no-date"}-${idx}`;
                const canRenderImage = Boolean(imageUrl) && !failedPortfolioImageIds.has(cardId);

                return (
                  <article
                    key={cardId}
                    className="group relative overflow-hidden rounded-2xl border border-[#d7dde8] bg-[#0f1726] shadow-[0_10px_30px_rgba(15,23,38,0.22)]"
                  >
                    <div className="relative h-64 w-full bg-[#1a2336] sm:h-72">
                      {canRenderImage ? (
                        <Image
                          src={imageUrl!}
                          alt={entry.portfolio.title || "Portfolio image"}
                          fill
                          loading="eager"
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          onError={() =>
                            setFailedPortfolioImageIds((prev) => {
                              const next = new Set(prev);
                              next.add(cardId);
                              return next;
                            })
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#3555a8_0%,#1d2942_45%,#0f1726_100%)] text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d2d9e6]">
                          Image unavailable
                        </div>
                      )}
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#060b14]/92 via-[#060b14]/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-6">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#d8e3f7] sm:mb-3 sm:gap-3 sm:text-[10px] sm:tracking-[0.16em]">
                        <span className="rounded-full border border-[#d8e3f7]/45 bg-[#0b1324]/35 px-2 py-0.5 sm:px-2.5 sm:py-1">
                          {entry.portfolio.roomType || "General"}
                        </span>
                        <span>{new Date(entry.portfolio.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="line-clamp-2 text-[22px] font-semibold leading-[1.05] text-white sm:text-[30px] sm:leading-tight">
                        {entry.portfolio.title || "Portfolio"}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-4.5 text-[#d7dfef] sm:mt-2 sm:text-sm sm:leading-6">
                        {entry.portfolio.description || "No description provided."}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
