"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import CommonStoreHeader from "@/components/common-store-header";
import {
  getBlogs,
  getCategoryBySlug,
  type BlogItem,
  getProducts,
  type CategoryDetails,
  type ProductImageUploadResponse,
  type ProductListItem,
} from "@/lib/api";
import { blogPublicPath } from "@/lib/blog-path";

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";
const DEFAULT_CATEGORY_BANNER_URL = "/handle.jpg";
const CATEGORY_BANNER_BY_SLUG: Record<string, string> = {
  "handles-knobs": "/handle.jpg",
};

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function getBlogImageUrl(blog: BlogItem) {
  const directUrl = (blog.featuredImageUrl ?? "").trim();
  if (directUrl) return directUrl;
  const key = (blog.featuredImageS3Key ?? "").trim();
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
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
  const [relevantBlogs, setRelevantBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingRelevantBlogs, setIsLoadingRelevantBlogs] = useState(false);
  const [relevantBlogsError, setRelevantBlogsError] = useState("");

  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedFinishTypes, setSelectedFinishTypes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedThicknesses, setSelectedThicknesses] = useState<Set<string>>(new Set());
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string, number>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
    if (!userName || !slug || !category?.id) return;

    const loadRelevantBlogs = async () => {
      setIsLoadingRelevantBlogs(true);
      setRelevantBlogsError("");
      try {
        const blogs = await getBlogs({ publishedOnly: true });
        const currentCategoryId = category.id.trim();
        const filtered = blogs.filter(
          (item) => (item.categoryId ?? "").trim() === currentCategoryId,
        );
        setRelevantBlogs(filtered);
      } catch (err: unknown) {
        setRelevantBlogs([]);
        setRelevantBlogsError(
          err instanceof Error ? err.message : "Failed to load relevant articles.",
        );
      } finally {
        setIsLoadingRelevantBlogs(false);
      }
    };

    loadRelevantBlogs();
  }, [slug, userName, category?.id]);

  const shouldShowBrand = userRole !== "customer";
  const availableSubcategories = useMemo(() => {
    const children = Array.isArray(category?.children) ? category.children : [];
    return children
      .map((child) => ({
        id: child?.id?.trim() ?? "",
        name: child?.name?.trim() ?? "",
      }))
      .filter((item) => item.id && item.name);
  }, [category]);

  const availableBrands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.brand ?? "").trim())
          .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableThicknesses = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.thickness ?? "").trim())
          .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableFinishTypes = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.finishType ?? "").trim())
          .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableColors = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => (product.colorName ?? "").trim())
          .filter((value) => Boolean(value) && /[a-z0-9]/i.test(value)),
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

    if (selectedFinishTypes.size > 0) {
      next = next.filter((product) => {
        const finishType = (product.finishType ?? "").trim();
        return finishType ? selectedFinishTypes.has(finishType) : false;
      });
    }

    if (selectedThicknesses.size > 0) {
      next = next.filter((product) => {
        const thickness = (product.thickness ?? "").trim();
        return thickness ? selectedThicknesses.has(thickness) : false;
      });
    }

    if (selectedColors.size > 0) {
      next = next.filter((product) => {
        const color = (product.colorName ?? "").trim();
        return color ? selectedColors.has(color) : false;
      });
    }

    if (selectedSubcategoryId) {
      next = next.filter((product) => {
        const productWithCategories = product as ProductListItem & {
          categories?: Array<{ categoryId?: string; id?: string }>;
        };
        const linkedCategoryIds = (productWithCategories.categories ?? [])
          .map((cat) => cat.categoryId || cat.id || "")
          .filter(Boolean);
        return linkedCategoryIds.includes(selectedSubcategoryId);
      });
    }

    next.sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return next;
  }, [
    products,
    selectedBrands,
    selectedFinishTypes,
    selectedColors,
    selectedThicknesses,
    selectedSubcategoryId,
    sortBy,
    shouldShowBrand,
  ]);

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

  const activeFilterCount =
    selectedBrands.size +
    selectedFinishTypes.size +
    selectedColors.size +
    selectedThicknesses.size;
  const categoryBannerUrl =
    CATEGORY_BANNER_BY_SLUG[slug] ?? DEFAULT_CATEGORY_BANNER_URL;

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

      <main className="mx-auto grid w-full max-w-[1680px] grid-cols-1 gap-0 px-0 lg:grid-cols-[280px_minmax(0,1fr)] 2xl:max-w-[2200px] 2xl:px-6">
        {isMobileFiltersOpen && (
          <div
            className="fixed inset-0 z-[680] bg-black/40 lg:hidden"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
        )}
        <aside
          className={[
            "border-b border-[#d5c7b1] bg-[#e7ded1] p-5 sm:p-6 lg:border-b-0 lg:border-r",
            "fixed inset-x-3 bottom-3 top-16 z-[700] overflow-y-auto rounded-2xl shadow-xl lg:static lg:inset-auto lg:z-auto lg:overflow-visible lg:rounded-none lg:shadow-none",
            isMobileFiltersOpen ? "block" : "hidden lg:block",
          ].join(" ")}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <div className="text-sm font-black uppercase tracking-wider text-[#3d4f67]">
              Filters
            </div>
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(false)}
              className="rounded-full border border-[#cbbca6] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#4d2c1e]"
            >
              Close
            </button>
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8b6b45]">
            Filter
          </div>
          <div className="mt-1 text-[28px] font-black uppercase leading-none tracking-tight text-[#3d4f67]">
            Finishes
          </div>

          {shouldShowBrand ? (
            <div className="mt-6 border-t border-[#cbbca6] pt-5">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
                Brand
              </div>
              <div className="mt-4 space-y-3">
                {availableBrands.length === 0 ? (
                  <div className="text-xs text-gray-400">No brand options</div>
                ) : (
                  availableBrands.map((brand) => (
                    <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand)}
                        onChange={() =>
                          setSelectedBrands((prev) => toggleSetValue(prev, brand))
                        }
                        className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white align-middle accent-[#3d4f67]"
                      />
                      <span className="text-[14px] font-semibold uppercase tracking-wide leading-5">{brand}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6 border-t border-[#cbbca6] pt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
              Finish Type
            </div>
            <div className="mt-4 space-y-3">
              {availableFinishTypes.length === 0 ? (
                <div className="text-xs text-gray-400">No finish options</div>
              ) : (
                availableFinishTypes.map((finishType) => (
                  <label
                    key={finishType}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFinishTypes.has(finishType)}
                      onChange={() =>
                        setSelectedFinishTypes((prev) =>
                          toggleSetValue(prev, finishType),
                        )
                      }
                      className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white align-middle accent-[#3d4f67]"
                    />
                    <span className="text-[14px] font-semibold uppercase tracking-wide leading-5">{finishType}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-[#cbbca6] pt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
              Thickness
            </div>
            <div className="mt-4 space-y-3">
              {availableThicknesses.length === 0 ? (
                <div className="text-xs text-gray-400">No thickness options</div>
              ) : (
                availableThicknesses.map((thickness) => (
                  <label
                    key={thickness}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedThicknesses.has(thickness)}
                      onChange={() =>
                        setSelectedThicknesses((prev) =>
                          toggleSetValue(prev, thickness),
                        )
                      }
                      className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white align-middle accent-[#3d4f67]"
                    />
                    <span className="text-[14px] font-semibold uppercase tracking-wide leading-5">{thickness}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-[#cbbca6] pt-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
              Color
            </div>
            <div className="mt-4 space-y-3">
              {availableColors.length === 0 ? (
                <div className="text-xs text-gray-400">No color options</div>
              ) : (
                availableColors.map((color) => (
                  <label
                    key={color}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColors.has(color)}
                      onChange={() =>
                        setSelectedColors((prev) => toggleSetValue(prev, color))
                      }
                      className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white align-middle accent-[#3d4f67]"
                    />
                    <span className="text-[14px] font-semibold uppercase tracking-wide leading-5">{color}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="bg-[#f4eee5] p-3.5 sm:p-5">
          {categoryBannerUrl ? (
            <div className="mb-4 overflow-hidden rounded-xl border border-[#d9cab5] bg-white">
              <div className="relative h-[220px] w-full sm:h-[300px]">
                <Image
                  src={categoryBannerUrl}
                  alt={`${category?.name ?? "Category"} banner`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  className="object-fill"
                />
              </div>
            </div>
          ) : null}

          <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="text-[13px] font-black uppercase tracking-wide text-[#8b6b45] sm:text-base">
              {category?.name ?? "Category"} Products
            </div>

            <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(true)}
                className="rounded-md border border-[#8b6b45] bg-[#f2e8d9] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-[#4d2c1e] shadow-sm lg:hidden"
              >
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
              <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
                <label className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-500">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortValue)}
                  className="h-8 w-[122px] rounded-md border border-[#d9cab5] bg-white px-2 text-[10px] font-semibold text-gray-700 sm:h-9 sm:w-auto sm:px-2.5 sm:text-xs"
                >
                  <option value="newest">Newest</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>
            </div>
          </div>

          {availableSubcategories.length > 0 ? (
            <div className="mb-4 border-b border-[#d9cab5] pb-3">
              <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#8b6b45]">
                Select Sub-Category
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategoryId("")}
                  className={[
                    "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors",
                    selectedSubcategoryId
                      ? "border-[#d9cab5] bg-white text-gray-600 hover:bg-[#efe7db]"
                      : "border-[#b38a50] bg-[#b38a50] text-white",
                  ].join(" ")}
                >
                  All
                </button>
                {availableSubcategories.map((subcat) => {
                  const isActive = selectedSubcategoryId === subcat.id;
                  return (
                    <button
                      key={subcat.id}
                      type="button"
                      onClick={() => setSelectedSubcategoryId(subcat.id)}
                      className={[
                        "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors",
                        isActive
                          ? "border-[#b38a50] bg-[#b38a50] text-white"
                          : "border-[#d9cab5] bg-white text-gray-600 hover:bg-[#efe7db]",
                      ].join(" ")}
                    >
                      {subcat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
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
                        <div className="relative aspect-square w-full overflow-hidden bg-[#ffffff] sm:aspect-[4/3]">
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
                                      className="object-contain object-center p-2"
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
                        <div className="p-2.5 sm:p-3 bg-[#e8dfd0]">
                          <div className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-gray-800 sm:text-xs">
                            {formatProductName(product.name)}
                          </div>
                          <div className="mt-1 line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[10px]">
                            {shouldShowBrand
                              ? `${product.brand ?? "-"} | ${product.finishType ?? "-"}`
                              : `${product.finishType ?? "-"}`
                            }
                          </div>
                          <div className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[10px]">
                            Thickness: {product.thickness || "-"}
                          </div>
                          <div className="mt-2 rounded-full bg-[#b38a50] px-2 py-1 text-center text-[9px] font-black uppercase tracking-widest text-white sm:mt-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
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
                  <h3 className="text-base font-black tracking-tight text-[#b38a50] sm:text-lg">
                    Relevant Articles
                  </h3>
                </div>

                {relevantBlogsError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
                    {relevantBlogsError}
                  </div>
                )}

                {isLoadingRelevantBlogs ? (
                  <div className="rounded-lg border border-[#d9cab5] bg-white p-4 text-sm text-gray-500">
                    Loading relevant articles...
                  </div>
                ) : relevantBlogs.length === 0 ? (
                  <div className="rounded-lg border border-[#d9cab5] bg-white p-4 text-sm text-gray-500">
                    No relevant articles found for this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
                    {relevantBlogs.slice(0, 8).map((item) => {
                      const contentText = item.body
                        .replace(/<[^>]*>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();
                      const imageUrl = getBlogImageUrl(item);
                      return (
                        <article
                          key={item.id}
                          className="overflow-hidden rounded-2xl border border-[#d9cab5] bg-[#efe8dc] shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                        >
                          <div className="p-2 pb-0">
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#d9cab5] bg-white">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={item.title}
                                fill
                                unoptimized
                                sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover object-center"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>
                          </div>
                          <div className="p-2.5 sm:p-3 bg-[#e8dfd0]">
                            <div className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-gray-800 sm:text-xs">
                              {item.title}
                            </div>
                            <div className="mt-1 line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[10px]">
                              {contentText || "Blog article"}
                            </div>
                            <button
                              type="button"
                              onClick={() => router.push(blogPublicPath(item))}
                              className="mt-2 w-full rounded-full bg-[#b38a50] px-2 py-1 text-center text-[9px] font-black uppercase tracking-widest text-white sm:mt-3 sm:px-3 sm:py-1.5 sm:text-[10px]"
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
