"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { deleteProductCategory, deleteProductImage, getProductBySlug, type ProductDetailsResponse, type ProductImageUploadResponse } from "@/lib/api";

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function pickBestImageUrl(images: ProductImageUploadResponse[] | null | undefined) {
  const list = Array.isArray(images) ? images : [];
  const primary = list.find((img) => img.isPrimary && typeof img.url === "string" && cleanUrl(img.url));
  if (primary?.url) return cleanUrl(primary.url);
  const byOrder = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const first = byOrder.find((img) => typeof img.url === "string" && cleanUrl(img.url));
  return first?.url ? cleanUrl(first.url) : null;
}

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const { slug } = React.use(params as unknown as Promise<{ slug: string }>);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [product, setProduct] = useState<ProductDetailsResponse | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [deleteImageMsg, setDeleteImageMsg] = useState("");
  const [deleteImageError, setDeleteImageError] = useState("");
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deleteCategoryMsg, setDeleteCategoryMsg] = useState("");
  const [deleteCategoryError, setDeleteCategoryError] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    if (!storedName) {
      router.push("/login");
      return;
    }
    setUserName(storedName);
    setUserRole(storedRole || "");
  }, [router]);

  useEffect(() => {
    if (!userName) return;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getProductBySlug(slug);
        setProduct(data);
        const best = pickBestImageUrl(data.images);
        setSelectedImageUrl(best);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load product.");
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, userName]);

  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product!.images : [];
    return list
      .map((img) => ({ ...img, url: cleanUrl(img.url) }))
      .filter((img) => Boolean(img.url));
  }, [product]);

  const handleDeleteImage = async (imageId: string) => {
    setDeleteImageMsg("");
    setDeleteImageError("");
    if (isDeletingImage) return;
    if (userRole !== "admin") {
      setDeleteImageError("Only admin can delete product images.");
      return;
    }
    const pid = product?.id || "";
    if (!pid || !imageId) return;
    const ok = window.confirm("Delete this image? This cannot be undone.");
    if (!ok) return;

    setIsDeletingImage(true);
    try {
      const res = await deleteProductImage(pid, imageId);
      setDeleteImageMsg(res.message || "Image deleted.");

      setProduct((prev) => {
        if (!prev) return prev;
        const nextImages = (Array.isArray(prev.images) ? prev.images : []).filter((img) => img.id !== imageId);
        return { ...prev, images: nextImages };
      });

      const removedUrl = images.find((img) => img.id === imageId)?.url || null;
      if (removedUrl && selectedImageUrl === removedUrl) {
        const nextList = images.filter((img) => img.id !== imageId);
        const nextBest = pickBestImageUrl(nextList);
        setSelectedImageUrl(nextBest);
      }
    } catch (err: unknown) {
      setDeleteImageError(err instanceof Error ? err.message : "Failed to delete image.");
    } finally {
      setIsDeletingImage(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    setDeleteCategoryMsg("");
    setDeleteCategoryError("");
    if (isDeletingCategory) return;
    if (userRole !== "admin") {
      setDeleteCategoryError("Only admin can unlink categories.");
      return;
    }
    const pid = product?.id || "";
    if (!pid || !categoryId) return;
    const ok = window.confirm("Unlink this category from the product?");
    if (!ok) return;

    setIsDeletingCategory(true);
    try {
      const res = await deleteProductCategory(pid, categoryId);
      setDeleteCategoryMsg(res.message || "Category unlinked.");
      setProduct((prev) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.categories) ? prev.categories : [];
        const next = list.filter((c) => c.categoryId !== categoryId && c.id !== categoryId);
        return { ...prev, categories: next };
      });
    } catch (err: unknown) {
      setDeleteCategoryError(err instanceof Error ? err.message : "Failed to unlink category.");
    } finally {
      setIsDeletingCategory(false);
    }
  };

  if (!userName) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border-2 border-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow-sm hover:bg-black hover:text-white transition-all"
          >
            Back
          </button>
          <div className="text-sm font-black uppercase tracking-widest text-gray-400">Product Details</div>
          <div className="text-sm font-bold text-gray-600">{userName}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {error && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {deleteImageError && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {deleteImageError}
          </div>
        )}
        {deleteImageMsg && (
          <div className="mb-6 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {deleteImageMsg}
          </div>
        )}
        {deleteCategoryError && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {deleteCategoryError}
          </div>
        )}
        {deleteCategoryMsg && (
          <div className="mb-6 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {deleteCategoryMsg}
          </div>
        )}

        {isLoading || !product ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-sm text-gray-500">
            {isLoading ? "Loading..." : "No product found."}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm">
                {selectedImageUrl ? (
                  <Image
                    src={selectedImageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageUrl(img.url)}
                      className={[
                        "relative aspect-square overflow-hidden rounded-xl border",
                        selectedImageUrl === img.url ? "border-black" : "border-gray-200"
                      ].join(" ")}
                    >
                      <Image src={img.url} alt={product.name} fill sizes="25vw" className="object-cover" />
                      {userRole === "admin" && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(img.id);
                          }}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm"
                          role="button"
                          tabIndex={0}
                          aria-label="Delete image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{product.materialType}</div>
                <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">{product.name}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    {product.status}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    SKU: {product.sku}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    {product.brand}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</div>
                <div className="text-sm text-gray-700 leading-6">{product.description}</div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Specs</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-500">Color</div>
                  <div className="font-bold text-gray-900">{product.colorName || "-"}</div>
                  <div className="text-gray-500">Dimensions</div>
                  <div className="font-bold text-gray-900">{product.dimensions || "-"}</div>
                  <div className="text-gray-500">Finish</div>
                  <div className="font-bold text-gray-900">{product.finishType || "-"}</div>
                  <div className="text-gray-500">Thickness</div>
                  <div className="font-bold text-gray-900">{product.thickness || "-"}</div>
                  <div className="text-gray-500">Performance</div>
                  <div className="font-bold text-gray-900">{String(product.performanceRating ?? 0)}</div>
                  <div className="text-gray-500">Durability</div>
                  <div className="font-bold text-gray-900">{String(product.durabilityRating ?? 0)}</div>
                  <div className="text-gray-500">Maintenance</div>
                  <div className="font-bold text-gray-900">{String(product.maintenanceRating ?? 0)}</div>
                  <div className="text-gray-500">Price Category</div>
                  <div className="font-bold text-gray-900">{String(product.priceCategory ?? 0)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Categories</div>
                <div className="flex flex-wrap gap-2">
                  {(product.categories || []).length > 0 ? (
                    (product.categories || []).map((c) => (
                      <span
                        key={c.id}
                        className={[
                          "relative inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        ].join(" ")}
                      >
                        {c.name}
                        {userRole === "admin" && (
                          <button
                            type="button"
                            disabled={isDeletingCategory}
                            onClick={() => handleDeleteCategory(c.categoryId || c.id)}
                            className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-gray-900 disabled:opacity-50"
                            aria-label="Unlink category"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No categories</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">IDs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Product ID</span>
                    <span className="font-bold text-gray-900 break-all">{product.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Slug</span>
                    <span className="font-bold text-gray-900 break-all">{product.slug}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
