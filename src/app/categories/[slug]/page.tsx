"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import CommonStoreHeader from "@/components/common-store-header";
import {
  getCategoryBySlug,
  getPortfolios,
  getProducts,
  type CategoryDetails,
  type PortfolioResponse,
  type ProductImageUploadResponse,
  type ProductListItem,
} from "@/lib/api";

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function getProductImageUrls(product: ProductListItem) {
  const raw = product as ProductListItem & {
    images?: ProductImageUploadResponse[] | null;
    imageUrl?: string | null;
    primaryImageUrl?: string | null;
  };

  const fromCollection = (Array.isArray(raw.images) ? raw.images : [])
    .filter((img) => typeof img.url === "string" && cleanUrl(img.url).length > 0)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((img) => cleanUrl(img.url));

  const preferred = [raw.primaryImageUrl, raw.imageUrl]
    .filter((url): url is string => typeof url === "string" && cleanUrl(url).length > 0)
    .map((url) => cleanUrl(url));

  const all = [...preferred, ...fromCollection];
  return Array.from(new Set(all));
}

function formatProductName(value: string | null | undefined) {
  const text = (value ?? "").trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type SortValue = "newest" | "name_asc" | "name_desc";
const PRODUCTS_PAGE_LIMIT = 100;

export default function CategoryProductsPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [category, setCategory] = useState<CategoryDetails | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [portfolioArticles, setPortfolioArticles] = useState<PortfolioResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");

  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedThicknesses, setSelectedThicknesses] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string, number>>({});

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (!storedName) {
      router.push("/login");
      return;
    }
    setUserName(storedName);
    setUserRole(localStorage.getItem("userRole") || "");
  }, [router]);

  useEffect(() => {
    if (!userName || !slug) return;
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const categoryData = await getCategoryBySlug(slug);
        setCategory(categoryData);

        const categoryId = categoryData?.id?.trim();
        if (!categoryId) {
          setProducts([]);
          return;
        }
        const fetchAllProductsForCategory = async (targetCategoryId: string) => {
          const firstPage = await getProducts({
            categoryId: targetCategoryId,
            status: "active",
            includeImages: true,
            includeCategories: true,
            page: 1,
            limit: PRODUCTS_PAGE_LIMIT,
          });

          let allItems = [...(Array.isArray(firstPage.items) ? firstPage.items : [])];
          const total = Number(firstPage.total ?? allItems.length);
          const limit = Number(firstPage.limit ?? PRODUCTS_PAGE_LIMIT);

          if (total > allItems.length && limit > 0) {
            const totalPages = Math.ceil(total / limit);
            for (let page = 2; page <= totalPages; page++) {
              const nextPage = await getProducts({
                categoryId: targetCategoryId,
                status: "active",
                includeImages: true,
                includeCategories: true,
                page,
                limit,
              });
              allItems = allItems.concat(
                Array.isArray(nextPage.items) ? nextPage.items : [],
              );
            }
          }

          return allItems;
        };

        const childCategoryIds = Array.isArray(categoryData.children)
          ? categoryData.children
              .map((child) => child?.id?.trim())
              .filter((value): value is string => Boolean(value))
          : [];
        const categoryIdsToLoad = Array.from(
          new Set([categoryId, ...childCategoryIds]),
        );

        const productsByCategory = await Promise.all(
          categoryIdsToLoad.map((targetCategoryId) =>
            fetchAllProductsForCategory(targetCategoryId),
          ),
        );

        const merged = productsByCategory.flat();
        const deduped = Array.from(
          new Map(merged.map((item) => [item.id, item])).values(),
        );
        setProducts(deduped);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load category products.");
        setCategory(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [slug, userName]);

  useEffect(() => {
    if (!userName || !slug) return;

    const loadPortfolioArticles = async () => {
      setIsLoadingPortfolio(true);
      setPortfolioError("");
      try {
        const records = await getPortfolios({ category: slug });
        setPortfolioArticles(Array.isArray(records) ? records : []);
      } catch (err: unknown) {
        setPortfolioArticles([]);
        setPortfolioError(
          err instanceof Error ? err.message : "Failed to load relevant articles.",
        );
      } finally {
        setIsLoadingPortfolio(false);
      }
    };

    loadPortfolioArticles();
  }, [slug, userName]);

  const shouldShowBrand = userRole !== "customer";

  const availableBrands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.brand ?? "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableThicknesses = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.thickness ?? "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let next = [...products];

    if (shouldShowBrand && selectedBrands.size > 0) {
      next = next.filter((product) => {
        const brand = (product.brand ?? "").trim();
        return brand ? selectedBrands.has(brand) : false;
      });
    }

    if (selectedThicknesses.size > 0) {
      next = next.filter((product) => {
        const thickness = (product.thickness ?? "").trim();
        return thickness ? selectedThicknesses.has(thickness) : false;
      });
    }

    next.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [products, selectedBrands, selectedThicknesses, sortBy, shouldShowBrand]);

  const productImageMap = useMemo(() => {
    return Object.fromEntries(
      filteredProducts.map((product) => [product.id, getProductImageUrls(product)]),
    ) as Record<string, string[]>;
  }, [filteredProducts]);

  useEffect(() => {
    if (Object.keys(productImageMap).length === 0) {
      setProductImageIndexes({});
      return;
    }

    const timer = window.setInterval(() => {
      setProductImageIndexes((prev) => {
        const next: Record<string, number> = {};
        Object.entries(productImageMap).forEach(([productId, urls]) => {
          if (urls.length <= 1) {
            next[productId] = 0;
            return;
          }
          const current = prev[productId] ?? 0;
          next[productId] = (current + 1) % urls.length;
        });
        return next;
      });
    }, 2500);

    return () => {
      window.clearInterval(timer);
    };
  }, [productImageMap]);

  const toggleSetValue = (prev: Set<string>, value: string) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  if (!userName) return null;

  return (
    <div className="min-h-screen bg-[#f4eee5] text-gray-900">
      <CommonStoreHeader
        pageTitle="CustomFurnish"
        breadcrumbText={`Home  >  ${category?.name ?? "Category"}`}
        breadcrumbItems={[
          { label: "Home", href: "/dashboard" },
          { label: category?.name ?? "Category" },
        ]}
        userName={userName}
        userRole={userRole}
      />

      <main className="mx-auto grid w-full max-w-[1680px] grid-cols-[280px_minmax(0,1fr)] gap-0 px-0">
        <aside className="border-r border-[#d9cab5] bg-[#efe7db] p-5">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#8b6b45]">
            Filter
          </div>
          <div className="mt-1 text-xs font-bold text-gray-500">
            {category?.name ?? "Products"}
          </div>

          {shouldShowBrand ? (
            <div className="mt-6 border-t border-[#d9cab5] pt-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#8b6b45]">
                Brand
              </div>
              <div className="mt-3 space-y-2">
                {availableBrands.length === 0 ? (
                  <div className="text-xs text-gray-400">No brand options</div>
                ) : (
                  availableBrands.map((brand) => (
                    <label key={brand} className="flex cursor-pointer items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand)}
                        onChange={() =>
                          setSelectedBrands((prev) => toggleSetValue(prev, brand))
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      <span>{brand}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-[#d9cab5] pt-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#8b6b45]">
              Thickness
            </div>
            <div className="mt-3 space-y-2">
              {availableThicknesses.length === 0 ? (
                <div className="text-xs text-gray-400">No thickness options</div>
              ) : (
                availableThicknesses.map((thickness) => (
                  <label
                    key={thickness}
                    className="flex cursor-pointer items-center gap-2 text-xs text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedThicknesses.has(thickness)}
                      onChange={() =>
                        setSelectedThicknesses((prev) =>
                          toggleSetValue(prev, thickness),
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-gray-300"
                    />
                    <span>{thickness}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="bg-[#f4eee5] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-black uppercase tracking-wider text-[#8b6b45]">
              {category?.name ?? "Category"} Products
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortValue)}
                className="rounded-md border border-[#d9cab5] bg-white px-2 py-1.5 text-xs font-semibold text-gray-700"
              >
                <option value="newest">Newest</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-lg border border-[#d9cab5] bg-white p-6 text-sm text-gray-500">
              Loading category products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-lg border border-[#d9cab5] bg-white p-6 text-sm text-gray-500">
              No products found for this category/filter.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const imageUrls = productImageMap[product.id] ?? [];
                  const activeImageIndex =
                    imageUrls.length > 0
                      ? (productImageIndexes[product.id] ?? 0) % imageUrls.length
                      : 0;
                  return (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-xl border border-[#d9cab5] bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/products/${product.slug}`)}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e8dfd0]">
                          {imageUrls.length > 0 ? (
                            <>
                              <div
                                className="flex h-full transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${activeImageIndex * 100}%)` }}
                              >
                                {imageUrls.map((url, index) => (
                                  <div
                                    key={`${product.id}-img-${index}`}
                                    className="relative h-full w-full shrink-0"
                                  >
                                    <Image
                                      src={url}
                                      alt={`${product.name} ${index + 1}`}
                                      fill
                                      sizes="(max-width: 1200px) 50vw, 25vw"
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                              {imageUrls.length > 1 ? (
                                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                                  {imageUrls.map((_, index) => (
                                    <span
                                      key={`${product.id}-dot-${index}`}
                                      className={[
                                        "h-1.5 w-1.5 rounded-full transition-all",
                                        index === activeImageIndex
                                          ? "bg-white"
                                          : "bg-white/50",
                                      ].join(" ")}
                                    />
                                  ))}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-black uppercase tracking-wider text-gray-800">
                            {formatProductName(product.name)}
                          </div>
                          <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            {shouldShowBrand
                              ? `${product.brand ?? "-"} | ${product.finishType ?? "-"}`
                              : `${product.finishType ?? "-"}`
                            }
                          </div>
                          <div className="mt-1 text-[10px] text-gray-500">
                            Thickness: {product.thickness || "-"}
                          </div>
                          <div className="mt-3 rounded-full bg-[#b38a50] px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-white">
                            View Details
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-black tracking-tight text-[#b38a50]">
                    Relevant Articles
                  </h3>
                </div>

                {portfolioError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
                    {portfolioError}
                  </div>
                )}

                {isLoadingPortfolio ? (
                  <div className="rounded-lg border border-[#d9cab5] bg-white p-4 text-sm text-gray-500">
                    Loading relevant articles...
                  </div>
                ) : portfolioArticles.length === 0 ? (
                  <div className="rounded-lg border border-[#d9cab5] bg-white p-4 text-sm text-gray-500">
                    No relevant articles found for this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {portfolioArticles.slice(0, 8).map((item) => {
                      const firstImageUrl =
                        item.images.find((image) => image.url)?.url ?? null;
                      return (
                        <article
                          key={item.portfolio.id}
                          className="overflow-hidden rounded-xl border border-[#d9cab5] bg-white shadow-sm"
                        >
                          <div className="relative aspect-[4/3] w-full bg-[#e8dfd0]">
                            {firstImageUrl ? (
                              <Image
                                src={firstImageUrl}
                                alt={item.portfolio.title}
                                fill
                                sizes="(max-width: 1200px) 50vw, 25vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="line-clamp-1 text-xs font-black uppercase tracking-wider text-gray-800">
                              {item.portfolio.title}
                            </div>
                            <div className="mt-1 line-clamp-2 text-[10px] text-gray-500">
                              {item.portfolio.description || "Portfolio article"}
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push("/blog")}
                              className="mt-3 w-full rounded-full bg-[#b38a50] px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-white"
                            >
                              Read Now
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
