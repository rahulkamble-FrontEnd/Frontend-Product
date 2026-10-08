"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CommonStoreHeader from "@/components/common-store-header";
import CompareProductsDialog from "@/components/compare-products-dialog";
import { useWishlist, WishlistHeartButton } from "@/components/wishlist-provider";
import { getProductsCompare, getWishlist, type ProductCompareResponse, type ProductImageUploadResponse, type WishlistItem } from "@/lib/api";
import { formatCustomerProductTitle } from "@/lib/product-display-name";
import { PRODUCT_IMAGE_BASE_URL } from "@/lib/s3-image-base";

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function buildProductImageUrl(value?: string | null) {
  const clean = typeof value === "string" ? cleanUrl(value) : "";
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `${PRODUCT_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
}

function productImageUrl(product: WishlistItem["product"]) {
  if (!product) return null;
  const images = Array.isArray(product.images) ? product.images : [];
  const sorted = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );
  const image = sorted[0] as (ProductImageUploadResponse & { s3_key?: string | null }) | undefined;
  if (!image) return null;
  return buildProductImageUrl(image.url ?? image.s3Key ?? image.s3_key);
}

export default function WishlistPage() {
  const router = useRouter();
  const { count } = useWishlist();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [compareData, setCompareData] = useState<ProductCompareResponse | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName") || "";
    const storedRole = localStorage.getItem("userRole") || "";
    if (!storedName) {
      router.push("/login");
      return;
    }
    if (storedRole !== "customer") {
      router.push("/dashboard");
      return;
    }
    setUserName(storedName);
    setUserRole(storedRole);
  }, [router]);

  useEffect(() => {
    if (userRole !== "customer") return;
    let cancelled = false;
    const load = async () => {
      setError("");
      try {
        const wishlist = await getWishlist();
        const nextItems = Array.isArray(wishlist) ? wishlist : [];
        if (cancelled) return;
        setItems(nextItems);
        setSelectedIds((prev) => {
          const allowed = new Set(nextItems.map((item) => item.productId));
          const next = new Set<string>();
          prev.forEach((id) => {
            if (allowed.has(id)) next.add(id);
          });
          return next;
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setItems([]);
          setError(err instanceof Error ? err.message : "Failed to fetch wishlist.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userRole, count]);

  const selectedList = Array.from(selectedIds);

  const toggleCompare = (productId: string) => {
    setError("");
    setCompareError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        return next;
      }
      if (next.size >= 4) {
        setCompareError("You can compare only 4 products.");
        return next;
      }
      next.add(productId);
      setCompareError("");
      return next;
    });
  };

  const openCompare = async () => {
    const ids = Array.from(new Set(selectedList.map((id) => id.trim()).filter(Boolean)));
    if (ids.length < 2) {
      setCompareError("Please select at least 2 products to compare.");
      setIsCompareOpen(true);
      return;
    }
    if (ids.length > 4) {
      setCompareError("You can compare only 4 products.");
      setIsCompareOpen(true);
      return;
    }
    setCompareError("");
    setIsCompareOpen(true);
    setIsComparing(true);
    setCompareData(null);
    try {
      setCompareData(await getProductsCompare(ids));
    } catch (err: unknown) {
      setCompareError(err instanceof Error ? err.message : "Failed to compare products.");
    } finally {
      setIsComparing(false);
    }
  };

  if (!userName || userRole !== "customer") return null;

  return (
    <div className="min-h-screen bg-[#f4eee5] text-gray-900">
      <CommonStoreHeader
        pageTitle="My Wishlist"
        breadcrumbText="HOME  >  WISHLIST"
        breadcrumbItems={[
          { label: "HOME", href: "/dashboard" },
          { label: "WISHLIST" },
        ]}
        userName={userName}
        userRole={userRole}
      />
      <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e] sm:text-3xl">My Wishlist</h1>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{items.length} Saved</div>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9cab5] bg-white p-3 shadow-sm sm:p-4">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 sm:text-[12px]">Compare</div>
            {compareError === "You can compare only 4 products." ? (
              <div className="mt-1 text-sm font-semibold text-[#9b2c2c]">You can compare only 4 products.</div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedList.length < 2 || isComparing}
              onClick={() => void openCompare()}
              className="rounded-full bg-black px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {isComparing ? "Comparing..." : "Compare"}
            </button>
            <button
              type="button"
              disabled={selectedList.length === 0}
              onClick={() => {
                setSelectedIds(new Set());
                setError("");
                setCompareError("");
                setCompareData(null);
              }}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-gray-800 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[240px] animate-pulse rounded-xl bg-[#e8dfd0]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#d9cab5] bg-white p-10 text-center text-sm text-gray-500">
            No wishlist items found.
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => {
              const product = item.product ?? null;
              const imageUrl = productImageUrl(product);
              return (
                <article
                  key={item.id}
                  className="relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-[#d9cab5] bg-white shadow-sm"
                  onClick={() => {
                    if (product?.slug) router.push(`/products/${product.slug}`);
                  }}
                >
                  <WishlistHeartButton productId={item.productId} className="absolute right-2 top-2 z-10" />
                  {product?.id ? (
                    <button
                      type="button"
                      aria-label={selectedIds.has(product.id) ? "Untick from compare" : "Tick for compare"}
                      className={[
                        "absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm sm:h-9 sm:w-9",
                        selectedIds.has(product.id) ? "border-black bg-black text-white" : "border-gray-200 bg-white/95 text-gray-800",
                      ].join(" ")}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleCompare(product.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        className="pointer-events-none h-3.5 w-3.5 accent-black sm:h-4 sm:w-4"
                        checked={selectedIds.has(product.id)}
                        readOnly
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                    </button>
                  ) : null}
                  <div className="relative aspect-square w-full shrink-0 bg-white sm:aspect-[4/3]">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product?.name || "Wishlist product"}
                        fill
                        sizes="(max-width: 1200px) 50vw, 25vw"
                        className="object-contain object-center p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col bg-[#e8dfd0] p-2 sm:p-3">
                    <div className="line-clamp-1 text-[11px] font-black uppercase tracking-wider text-gray-800 sm:text-xs">
                      {product ? formatCustomerProductTitle(product.name, product.slug) : item.productId}
                    </div>
                    <div className="mt-1 line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[10px]">
                      {product?.materialType || "Wishlist"}
                    </div>
                    <div className="mt-1 line-clamp-1 text-[9px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[10px]">
                      {product?.sku ? `SKU: ${product.sku}` : "\u00a0"}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <CompareProductsDialog
        open={isCompareOpen}
        isComparing={isComparing}
        error={compareError}
        data={compareData}
        onClose={() => {
          setIsCompareOpen(false);
          setCompareError("");
        }}
      />
    </div>
  );
}
