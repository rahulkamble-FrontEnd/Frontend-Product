"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { formatCustomerProductTitle } from "@/lib/product-display-name";
import { RelevantArticleCard } from "@/components/relevant-article-card";

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";
const DEFAULT_CATEGORY_BANNER_URL = "/handle.jpg";

/** S3 object names under `category banner/categories banner/` (must match bucket keys exactly). */
const CATEGORY_BANNER_FILE_BY_KEY: Record<string, string> = {
  finishes: "finishes2.webp",
  finish: "finishes2.webp",
  fabrics: "fabrics2.webp",
  fabric: "fabrics2.webp",
  glass: "glass.webp",
  hardware: "hardware.webp",
  mirrors: "Mirrors.webp",
  mirror: "Mirrors.webp",
  lighting: "ligting1.webp",
  lights: "ligting1.webp",
  handles: "Handels.webp",
  "handles-knobs": "Handels.webp",
  "handles-and-knobs": "Handels.webp",
  knobs: "Handels.webp",
  "wall-decorative": "wall panels1.webp",
  "wall-decorative-panels": "wall panels1.webp",
  "wall-panels": "wall panels1.webp",
  "wall-panels-and-cladding": "wall panels1.webp",
  "counter-tops": "Counter tops.webp",
  countertops: "Counter tops.webp",
  flooring: "Flooring1.webp",
  "flooring-tiles": "Flooring1.webp",
  "flooring-and-tiles": "Flooring1.webp",
  tiles: "Flooring1.webp",
  "core-materials": "Core material.webp",
  "core-material": "Core material.webp",
  core: "Core material.webp",
  ceiling: "False celings1.webp",
  ceilings: "False celings1.webp",
  "false-ceiling": "False celings1.webp",
  "false-ceilings": "False celings1.webp",
};

function normalizeCategoryBannerKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function categoryBannerS3Url(fileName: string) {
  const path = ["category banner", "categories banner", fileName]
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${BLOG_IMAGE_BASE_URL}/${path}`;
}

function resolveCategoryBannerUrl(slug: string, categoryName?: string | null) {
  const keys = [slug, categoryName ?? ""].filter((v) => v.trim().length > 0).map(normalizeCategoryBannerKey);
  for (const key of keys) {
    const file = CATEGORY_BANNER_FILE_BY_KEY[key];
    if (file) return categoryBannerS3Url(file);
  }
  return DEFAULT_CATEGORY_BANNER_URL;
}

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

function formatProductCardTitle(product: ProductListItem) {
  return formatCustomerProductTitle(product.name, product.slug);
}

type SortValue = "newest" | "name_asc" | "name_desc";
const PRODUCTS_PAGE_LIMIT = 48;

type ProductListFilters = NonNullable<
  Awaited<ReturnType<typeof getProducts>>["filters"]
>;

function setToCsv(values: Set<string>) {
  const items = Array.from(values).map((value) => value.trim()).filter(Boolean);
  return items.length > 0 ? items.join(",") : undefined;
}

function sortParamsForValue(sortBy: SortValue) {
  if (sortBy === "name_asc") return { sortBy: "name" as const, sortOrder: "asc" as const };
  if (sortBy === "name_desc") return { sortBy: "name" as const, sortOrder: "desc" as const };
  return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
}

export default function CategoryProductsPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const router = useRouter();

  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [category, setCategory] = useState<CategoryDetails | null>(null);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);
  const [apiFilters, setApiFilters] = useState<ProductListFilters>({});
  const [relevantBlogs, setRelevantBlogs] = useState<BlogItem[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingRelevantBlogs, setIsLoadingRelevantBlogs] = useState(false);
  const [relevantBlogsError, setRelevantBlogsError] = useState("");
  const relevantBlogsScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollRelevantBlogs = (direction: "left" | "right") => {
    if (!relevantBlogsScrollRef.current) return;
    relevantBlogsScrollRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [selectedFinishTypes, setSelectedFinishTypes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedThicknesses, setSelectedThicknesses] = useState<Set<string>>(new Set());
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [sortBy, setSortBy] = useState<SortValue>("newest");
  const [productImageIndexes, setProductImageIndexes] = useState<Record<string, number>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const shouldShowBrand = userRole !== "customer";
  const totalProductPages = Math.max(1, Math.ceil(productsTotal / PRODUCTS_PAGE_LIMIT));

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

    let cancelled = false;
    const loadCategory = async () => {
      setIsCategoryLoading(true);
      setError("");
      setCategory(null);
      setProducts([]);
      setProductsTotal(0);
      setProductsPage(1);
      setApiFilters({});
      setSelectedBrands(new Set());
      setSelectedFinishTypes(new Set());
      setSelectedColors(new Set());
      setSelectedThicknesses(new Set());
      setSelectedSubcategoryId("");

      try {
        const categoryData = await getCategoryBySlug(slug);
        if (!cancelled) {
          setCategory(categoryData);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load category.");
          setCategory(null);
        }
      } finally {
        if (!cancelled) {
          setIsCategoryLoading(false);
        }
      }
    };

    loadCategory();
    return () => {
      cancelled = true;
    };
  }, [slug, userName]);

  useEffect(() => {
    const categoryId = category?.id?.trim();
    if (!userName || !categoryId) return;

    let cancelled = false;
    const loadProducts = async () => {
      setIsProductsLoading(true);
      setError("");

      try {
        const activeCategoryId = selectedSubcategoryId || categoryId;
        const response = await getProducts({
          categoryId: activeCategoryId,
          status: "active",
          includeImages: true,
          page: productsPage,
          limit: PRODUCTS_PAGE_LIMIT,
          brand: shouldShowBrand ? setToCsv(selectedBrands) : undefined,
          finishType: setToCsv(selectedFinishTypes),
          thickness: setToCsv(selectedThicknesses),
          colorName: setToCsv(selectedColors),
          ...sortParamsForValue(sortBy),
        });

        if (!cancelled) {
          setProducts(Array.isArray(response.items) ? response.items : []);
          setProductsTotal(Number(response.total ?? 0));
          setApiFilters(response.filters ?? {});
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setProducts([]);
          setProductsTotal(0);
          setError(err instanceof Error ? err.message : "Failed to load category products.");
        }
      } finally {
        if (!cancelled) {
          setIsProductsLoading(false);
        }
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [
    userName,
    category?.id,
    productsPage,
    selectedSubcategoryId,
    selectedBrands,
    selectedFinishTypes,
    selectedColors,
    selectedThicknesses,
    sortBy,
    shouldShowBrand,
  ]);

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

  const availableSubcategories = useMemo(() => {
    const children = Array.isArray(category?.children) ? category.children : [];
    return children
      .map((child) => ({
        id: child?.id?.trim() ?? "",
        name: child?.name?.trim() ?? "",
      }))
      .filter((item) => item.id && item.name);
  }, [category]);

  const availableBrands = useMemo(
    () => [...(apiFilters?.brands ?? [])].sort((a, b) => a.localeCompare(b)),
    [apiFilters],
  );

  const availableThicknesses = useMemo(
    () => [...(apiFilters?.thicknesses ?? [])].sort((a, b) => a.localeCompare(b)),
    [apiFilters],
  );

  const availableFinishTypes = useMemo(
    () => [...(apiFilters?.finishes ?? [])].sort((a, b) => a.localeCompare(b)),
    [apiFilters],
  );

  const availableColors = useMemo(
    () => [...(apiFilters?.colors ?? [])].sort((a, b) => a.localeCompare(b)),
    [apiFilters],
  );

  const productImageMap = useMemo(() => {
    return Object.fromEntries(
      products.map((product) => [product.id, getProductImageUrls(product)]),
    ) as Record<string, string[]>;
  }, [products]);

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

  const resetProductsPage = () => setProductsPage(1);

  if (!userName) return null;

  const activeFilterCount =
    selectedBrands.size +
    selectedFinishTypes.size +
    selectedColors.size +
    selectedThicknesses.size;
  const categoryBannerUrl = resolveCategoryBannerUrl(slug, category?.name);

  return (
    <div className="min-h-screen bg-[#f4eee5] text-gray-900">
      <CommonStoreHeader
        pageTitle=""
        breadcrumbText={`HOME  >  ${category?.name ?? "Category"}`}
        breadcrumbItems={[
          { label: "HOME", href: "/dashboard" },
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

          {shouldShowBrand ? (
            <div className="mt-6 border-t border-[#cbbca6] pt-5">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
                Brand
              </div>
              <div className="mt-4 space-y-3">
                {availableBrands.length === 0 ? (
                  <div className="text-xs text-gray-400">
                    {isProductsLoading ? "Loading brand options..." : "No brand options"}
                  </div>
                ) : (
                  availableBrands.map((brand) => (
                    <label key={brand} className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]">
                      <input
                        type="checkbox"
                        checked={selectedBrands.has(brand)}
                        onChange={() => {
                          setSelectedBrands((prev) => toggleSetValue(prev, brand));
                          resetProductsPage();
                        }}
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
                <div className="text-xs text-gray-400">
                  {isProductsLoading ? "Loading finish options..." : "No finish options"}
                </div>
              ) : (
                availableFinishTypes.map((finishType) => (
                  <label
                    key={finishType}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFinishTypes.has(finishType)}
                      onChange={() => {
                        setSelectedFinishTypes((prev) =>
                          toggleSetValue(prev, finishType),
                        );
                        resetProductsPage();
                      }}
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
                <div className="text-xs text-gray-400">
                  {isProductsLoading ? "Loading thickness options..." : "No thickness options"}
                </div>
              ) : (
                availableThicknesses.map((thickness) => (
                  <label
                    key={thickness}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedThicknesses.has(thickness)}
                      onChange={() => {
                        setSelectedThicknesses((prev) =>
                          toggleSetValue(prev, thickness),
                        );
                        resetProductsPage();
                      }}
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
                <div className="text-xs text-gray-400">
                  {isProductsLoading ? "Loading color options..." : "No color options"}
                </div>
              ) : (
                availableColors.map((color) => (
                  <label
                    key={color}
                    className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColors.has(color)}
                      onChange={() => {
                        setSelectedColors((prev) => toggleSetValue(prev, color));
                        resetProductsPage();
                      }}
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
              {/* Category banners have a natural ~3.84:1 aspect ratio (4489x1170).
                  Below lg we keep fixed pixel heights so the banner doesn't get too
                  short on phones/tablets; from lg upward we honour the image ratio so
                  the full banner is visible on wide laptops and desktops (no top/bottom crop). */}
              <div className="relative h-[220px] w-full sm:h-[300px] lg:h-auto lg:aspect-[4489/1170]">
                <Image
                  src={categoryBannerUrl}
                  alt={`${category?.name ?? "Category"} banner`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 1200px"
                  loading="eager"
                  fetchPriority="high"
                  className="object-cover object-center"
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
                  onChange={(e) => {
                    setSortBy(e.target.value as SortValue);
                    resetProductsPage();
                  }}
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
                  onClick={() => {
                    setSelectedSubcategoryId("");
                    resetProductsPage();
                  }}
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
                      onClick={() => {
                        setSelectedSubcategoryId(subcat.id);
                        resetProductsPage();
                      }}
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

          {isCategoryLoading ? (
            <div className="rounded-lg border border-[#d9cab5] bg-white p-6 text-sm text-gray-500">
              Loading category...
            </div>
          ) : isProductsLoading && products.length === 0 ? (
            <div className="rounded-lg border border-[#d9cab5] bg-white p-6 text-sm text-gray-500">
              Loading category products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-[#d9cab5] bg-white p-6 text-sm text-gray-500">
              No products found for this category/filter.
            </div>
          ) : (
            <>
              {productsTotal > 0 ? (
                <div className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Showing {(productsPage - 1) * PRODUCTS_PAGE_LIMIT + 1}-
                  {Math.min(productsPage * PRODUCTS_PAGE_LIMIT, productsTotal)} of {productsTotal} products
                </div>
              ) : null}

              <div className={isProductsLoading ? "opacity-60" : ""}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {products.map((product) => {
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
                            {userRole === "customer"
                              ? formatProductCardTitle(product)
                              : formatProductName(product.name)}
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
              </div>

              {totalProductPages > 1 ? (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    disabled={productsPage <= 1 || isProductsLoading}
                    onClick={() => setProductsPage((page) => Math.max(1, page - 1))}
                    className="rounded-full border border-[#d9cab5] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#4d2c1e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Page {productsPage} of {totalProductPages}
                  </span>
                  <button
                    type="button"
                    disabled={productsPage >= totalProductPages || isProductsLoading}
                    onClick={() => setProductsPage((page) => Math.min(totalProductPages, page + 1))}
                    className="rounded-full border border-[#d9cab5] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#4d2c1e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : null}

              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-black tracking-tight text-[#b38a50] sm:text-lg">
                    Relevant Articles
                  </h3>
                  {relevantBlogs.length > 0 && (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => scrollRelevantBlogs("left")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9f7a47] text-white transition-colors hover:bg-[#8A6A3A] sm:h-10 sm:w-10"
                        aria-label="Previous relevant article"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollRelevantBlogs("right")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9f7a47] text-white transition-colors hover:bg-[#8A6A3A] sm:h-10 sm:w-10"
                        aria-label="Next relevant article"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-[18px] sm:w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {relevantBlogsError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600">
                    {relevantBlogsError}
                  </div>
                )}

                {isLoadingRelevantBlogs ? (
                  <div className="flex gap-3 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div
                        key={`relevant-blog-loading-${idx}`}
                        className="h-[220px] w-[150px] flex-shrink-0 animate-pulse rounded-[14px] bg-[#d8ccbb] sm:h-[332px] sm:w-[280px] sm:rounded-[18px]"
                      />
                    ))}
                  </div>
                ) : relevantBlogs.length === 0 ? (
                  <div className="rounded-lg border border-[#d9cab5] bg-white p-4 text-sm text-gray-500">
                    No relevant articles found for this category.
                  </div>
                ) : (
                  <div
                    ref={relevantBlogsScrollRef}
                    className="flex gap-3 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5"
                  >
                    {relevantBlogs.slice(0, 8).map((item, idx) => (
                      <RelevantArticleCard
                        key={item.id}
                        className="h-[220px] w-[150px] max-w-[calc(100vw-2rem)] flex-shrink-0 sm:h-[332px] sm:w-[280px] sm:max-w-[280px]"
                        title={item.title}
                        imageUrl={getBlogImageUrl(item)}
                        imageAlt={item.title}
                        href={blogPublicPath(item)}
                        priority={idx === 0}
                        unoptimized
                        sizes="(max-width: 1024px) 150px, 280px"
                      />
                    ))}
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
