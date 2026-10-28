"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CommonStoreHeader from "@/components/common-store-header";
import {
  getCustomerWishlistForAdmin,
  getDesignerCustomerDetails,
  type ProductImageUploadResponse,
  type WishlistItem,
} from "@/lib/api";
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

const ALLOWED_ROLES = new Set(["designer", "admin", "useradmin"]);
const USER_MANAGER_ROLES = new Set(["admin", "useradmin"]);

export default function DesignerCustomerWishlistPage() {
  const router = useRouter();
  const params = useParams<{ customerId: string }>();
  const customerId = typeof params?.customerId === "string" ? params.customerId : "";
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName") || "";
    const storedRole = localStorage.getItem("userRole") || "";
    if (!storedName) {
      router.push("/login");
      return;
    }
    if (storedRole === "customer") {
      router.push("/wishlist");
      return;
    }
    if (!ALLOWED_ROLES.has(storedRole)) {
      router.push("/dashboard");
      return;
    }
    setUserName(storedName);
    setUserRole(storedRole);
  }, [router]);

  useEffect(() => {
    if (!ALLOWED_ROLES.has(userRole) || !customerId) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const details = USER_MANAGER_ROLES.has(userRole)
          ? await getCustomerWishlistForAdmin(customerId)
          : await getDesignerCustomerDetails(customerId);
        if (cancelled) return;
        setCustomerName(details.customer?.name?.trim() || "Customer");
        setItems(Array.isArray(details.wishlist) ? details.wishlist : []);
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
  }, [userRole, customerId]);

  if (!userName || !ALLOWED_ROLES.has(userRole)) return null;

  const pageTitle = customerName ? `${customerName} Wishlist` : "Wishlist";

  return (
    <div className="min-h-screen bg-[#f4eee5] text-gray-900">
      <CommonStoreHeader
        pageTitle={pageTitle}
        breadcrumbText="HOME  >  WISHLIST"
        breadcrumbItems={[
          { label: "HOME", href: "/dashboard" },
          ...(USER_MANAGER_ROLES.has(userRole) ? [{ label: "USERS", href: "/users" }] : []),
          { label: "WISHLIST" },
        ]}
        userName={userName}
        userRole={userRole}
      />
      <main className="mx-auto w-full max-w-[1680px] px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e] sm:text-3xl">{pageTitle}</h1>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{items.length} Saved</div>
        </div>
        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</div>
        ) : null}

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
                  <span className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#9b2c2c] bg-[#9b2c2c] text-white shadow-sm sm:h-9 sm:w-9">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </span>
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
    </div>
  );
}
