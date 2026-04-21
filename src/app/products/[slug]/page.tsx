"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  createShortlist,
  deleteProductCategory,
  deleteProductImage,
  getProductBySlug,
  getProducts,
  updateProduct,
  type ProductDetailsResponse,
  type ProductImageUploadResponse,
  type ProductListItem,
  type ShortlistResponse,
  type UpdateProductPayload,
  type UpdateProductResponse,
} from "@/lib/api";

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

function pickListProductImageUrl(product: ProductListItem) {
  const raw = product as ProductListItem & {
    images?: ProductImageUploadResponse[] | null;
    imageUrl?: string | null;
    primaryImageUrl?: string | null;
  };
  if (typeof raw.imageUrl === "string" && cleanUrl(raw.imageUrl)) {
    return cleanUrl(raw.imageUrl);
  }
  if (typeof raw.primaryImageUrl === "string" && cleanUrl(raw.primaryImageUrl)) {
    return cleanUrl(raw.primaryImageUrl);
  }
  return pickBestImageUrl(raw.images);
}

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
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
  type UpdateProductFormState = {
    name: string;
    sku: string;
    brand: string;
    description: string;
    materialType: string;
    finishType: string;
    colorName: string;
    colorHex: string;
    thickness: string;
    dimensions: string;
    performanceRating: string;
    durabilityRating: string;
    priceCategory: string;
    maintenanceRating: string;
    bestUsedForText: string;
    prosText: string;
    consText: string;
    status: UpdateProductPayload["status"];
  };

  const [updateForm, setUpdateForm] = useState<UpdateProductFormState>({
    name: "",
    sku: "",
    brand: "",
    description: "",
    materialType: "",
    finishType: "",
    colorName: "",
    colorHex: "",
    thickness: "",
    dimensions: "",
    performanceRating: "0",
    durabilityRating: "0",
    priceCategory: "0",
    maintenanceRating: "0",
    bestUsedForText: "",
    prosText: "",
    consText: "",
    status: "draft",
  });
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [updateProductMsg, setUpdateProductMsg] = useState("");
  const [updateProductError, setUpdateProductError] = useState("");
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [isCreatingShortlist, setIsCreatingShortlist] = useState(false);
  const [shortlistMsg, setShortlistMsg] = useState("");
  const [shortlistError, setShortlistError] = useState("");
  const [shortlistItem, setShortlistItem] = useState<ShortlistResponse | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ProductListItem[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState("");

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
    if (!userName || !slug) return;
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

  const handleCreateShortlist = async () => {
    setShortlistMsg("");
    setShortlistError("");
    if (isCreatingShortlist) return;
    if (userRole !== "customer") {
      setShortlistError("Only customer login can add shortlist items.");
      return;
    }
    const productId = product?.id?.trim() || "";
    if (!productId) {
      setShortlistError("Product id is missing.");
      return;
    }

    setIsCreatingShortlist(true);
    try {
      const created = await createShortlist({
        productId,
        customerNote,
      });
      setShortlistItem(created);
      setShortlistMsg("Product added to shortlist.");
      setCustomerNote("");
    } catch (err: unknown) {
      setShortlistError(err instanceof Error ? err.message : "Failed to add shortlist item.");
    } finally {
      setIsCreatingShortlist(false);
    }
  };

  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product!.images : [];
    return list
      .map((img) => ({ ...img, url: cleanUrl(img.url) }))
      .filter((img) => Boolean(img.url));
  }, [product]);

  const normalizeTextList = (value: string) =>
    value
      .split(/\r?\n|,/g)
      .map((v) => v.trim())
      .filter(Boolean);

  useEffect(() => {
    if (!product) return;
    const status: UpdateProductPayload["status"] =
      product.status === "active" || product.status === "archived" || product.status === "published" || product.status === "draft"
        ? product.status
        : "draft";

    setUpdateForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      brand: product.brand ?? "",
      description: product.description ?? "",
      materialType: product.materialType ?? "",
      finishType: product.finishType ?? "",
      colorName: product.colorName ?? "",
      colorHex: product.colorHex ?? "",
      thickness: product.thickness ?? "",
      dimensions: product.dimensions ?? "",
      performanceRating: String(product.performanceRating ?? 0),
      durabilityRating: String(product.durabilityRating ?? 0),
      priceCategory: String(product.priceCategory ?? 0),
      maintenanceRating: String(product.maintenanceRating ?? 0),
      bestUsedForText: Array.isArray(product.bestUsedFor) ? product.bestUsedFor.join("\n") : "",
      prosText: Array.isArray(product.pros) ? product.pros.join("\n") : "",
      consText: Array.isArray(product.cons) ? product.cons.join("\n") : "",
      status,
    });
  }, [product]);

  useEffect(() => {
    if (!product?.id) return;

    const loadSimilarProducts = async () => {
      const categoryIds = Array.from(
        new Set(
          (product.categories ?? [])
            .map((category) => category.categoryId || category.id)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      if (categoryIds.length === 0) {
        setSimilarProducts([]);
        setSimilarError("");
        return;
      }

      setIsLoadingSimilar(true);
      setSimilarError("");
      try {
        const getByCategoryId = async (categoryId: string) => {
          const firstPage = await getProducts({
            categoryId,
            status: "active",
            includeImages: true,
            page: 1,
            limit: 100,
          });

          let items = [...(Array.isArray(firstPage.items) ? firstPage.items : [])];
          const total = Number(firstPage.total ?? items.length);
          const limit = Number(firstPage.limit ?? 100);

          if (total > items.length && limit > 0) {
            const totalPages = Math.ceil(total / limit);
            for (let page = 2; page <= totalPages; page++) {
              const nextPage = await getProducts({
                categoryId,
                status: "active",
                includeImages: true,
                page,
                limit,
              });
              items = items.concat(
                Array.isArray(nextPage.items) ? nextPage.items : [],
              );
            }
          }
          return items;
        };

        const grouped = await Promise.all(
          categoryIds.map((categoryId) => getByCategoryId(categoryId)),
        );
        const merged = grouped.flat();
        const deduped = Array.from(
          new Map(merged.map((item) => [item.id, item])).values(),
        ).filter((item) => item.id !== product.id);
        setSimilarProducts(deduped);
      } catch (err: unknown) {
        setSimilarProducts([]);
        setSimilarError(
          err instanceof Error ? err.message : "Failed to load similar products.",
        );
      } finally {
        setIsLoadingSimilar(false);
      }
    };

    loadSimilarProducts();
  }, [product]);

  const handleUpdateProduct = async () => {
    setUpdateProductMsg("");
    setUpdateProductError("");
    if (isUpdatingProduct) return;
    if (userRole !== "admin") {
      setUpdateProductError("Only admin can update products.");
      return;
    }
    const pid = product?.id || "";
    if (!pid) return;

    const payload: UpdateProductPayload = {
      name: updateForm.name.trim(),
      sku: updateForm.sku.trim(),
      brand: updateForm.brand.trim(),
      description: updateForm.description.trim(),
      materialType: updateForm.materialType.trim(),
      finishType: updateForm.finishType.trim() ? updateForm.finishType.trim() : null,
      colorName: updateForm.colorName.trim(),
      colorHex: updateForm.colorHex.trim() ? updateForm.colorHex.trim() : null,
      thickness: updateForm.thickness.trim() ? updateForm.thickness.trim() : null,
      dimensions: updateForm.dimensions.trim(),
      performanceRating: Number(updateForm.performanceRating),
      durabilityRating: Number(updateForm.durabilityRating),
      priceCategory: Number(updateForm.priceCategory),
      maintenanceRating: Number(updateForm.maintenanceRating),
      bestUsedFor: normalizeTextList(updateForm.bestUsedForText).length > 0 ? normalizeTextList(updateForm.bestUsedForText) : null,
      pros: normalizeTextList(updateForm.prosText),
      cons: normalizeTextList(updateForm.consText),
      status: updateForm.status,
    };

    setIsUpdatingProduct(true);
    try {
      const updated = await updateProduct(pid, payload);
      setUpdateProductMsg("Product updated successfully.");
      setProduct((prev) => {
        const keepImages = prev?.images ?? null;
        const keepCategories = prev?.categories ?? null;
        const merged: ProductDetailsResponse = {
          ...(prev ?? ({} as ProductDetailsResponse)),
          ...(updated as UpdateProductResponse),
          images: keepImages,
          categories: keepCategories,
        };
        return merged;
      });
      setIsUpdateOpen(false);
    } catch (err: unknown) {
      setUpdateProductError(err instanceof Error ? err.message : "Failed to update product.");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

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
    <div className="min-h-screen bg-[#f3eee5] font-sans text-gray-900">
      <header className="border-b border-[#e0d4c4] bg-white px-4 py-3 sm:px-6 lg:px-8">
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

      <main className="mx-auto max-w-[1680px] px-4 py-8 lg:px-8">
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
        {updateProductError && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {updateProductError}
          </div>
        )}
        {updateProductMsg && (
          <div className="mb-6 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {updateProductMsg}
          </div>
        )}
        {shortlistError && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {shortlistError}
          </div>
        )}
        {shortlistMsg && (
          <div className="mb-6 text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">
            {shortlistMsg}
          </div>
        )}

        {isLoading || !product ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-sm text-gray-500">
            {isLoading ? "Loading..." : "No product found."}
          </div>
        ) : (
          <>
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
                <div className="inline-flex rounded-full bg-[#b58d52] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                  {product.materialType || "Product"}
                </div>
                <h1 className="mt-2 text-[36px] font-bold leading-[40px] tracking-normal text-[#AE8953]">
                  {product.name}
                </h1>
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

              <div className="rounded-2xl border border-[#d8cab8] bg-[#f3ecdf] p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</div>
                <div className="text-[13px] leading-6 text-[#3f3a33]">{product.description}</div>
              </div>

              <div className="rounded-2xl border border-[#d6c8b5] bg-[#f3ecdf] p-5 shadow-sm">
                <div className="mb-3 text-[24px] font-semibold tracking-tight text-[#3e3a34]">Technical Specifications</div>
                <div className="grid grid-cols-2 gap-y-3 border-t border-[#dacdbb] pt-3 text-[12px]">
                  <div className="text-[#968e84]">Color</div>
                  <div className="font-semibold text-[#3f3a33]">{product.colorName || "-"}</div>
                  <div className="text-[#968e84]">Dimensions</div>
                  <div className="font-semibold text-[#3f3a33]">{product.dimensions || "-"}</div>
                  <div className="text-[#968e84]">Finish</div>
                  <div className="font-semibold text-[#3f3a33]">{product.finishType || "-"}</div>
                  <div className="text-[#968e84]">Thickness</div>
                  <div className="font-semibold text-[#3f3a33]">{product.thickness || "-"}</div>
                  <div className="text-[#968e84]">Performance</div>
                  <div className="font-semibold text-[#3f3a33]">{String(product.performanceRating ?? 0)}</div>
                  <div className="text-[#968e84]">Durability</div>
                  <div className="font-semibold text-[#3f3a33]">{String(product.durabilityRating ?? 0)}</div>
                  <div className="text-[#968e84]">Maintenance</div>
                  <div className="font-semibold text-[#3f3a33]">{String(product.maintenanceRating ?? 0)}</div>
                  <div className="text-[#968e84]">Price Category</div>
                  <div className="font-semibold text-[#3f3a33]">{String(product.priceCategory ?? 0)}</div>
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

              {userRole === "customer" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Shortlist</div>
                      <div className="mt-1 text-sm text-gray-600">Save this product with your note.</div>
                    </div>
                    <button
                      type="button"
                      disabled={isCreatingShortlist}
                      onClick={handleCreateShortlist}
                      className="rounded-full bg-[#b58d52] px-6 py-3 text-[15px] font-bold text-white disabled:opacity-50"
                    >
                      {isCreatingShortlist ? "Saving..." : "Short List Now"}
                    </button>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer Note</label>
                    <textarea
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      placeholder="For kitchen shutters"
                      className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-inner min-h-[100px]"
                    />
                  </div>
                  {shortlistItem && (
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                      <div><span className="font-bold text-gray-900">Shortlist ID:</span> {shortlistItem.id}</div>
                      <div><span className="font-bold text-gray-900">Sample Status:</span> {shortlistItem.sampleStatus}</div>
                      <div><span className="font-bold text-gray-900">Created At:</span> {new Date(shortlistItem.createdAt).toLocaleString()}</div>
                    </div>
                  )}
                </div>
              )}

              {userRole === "admin" && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Update Product (PUT)</div>
                    <div className="flex items-center gap-2">
                      {!isUpdateOpen ? (
                        <button
                          type="button"
                          onClick={() => setIsUpdateOpen(true)}
                          className="rounded-full bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                        >
                          Update
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={isUpdatingProduct}
                            onClick={handleUpdateProduct}
                            className="rounded-full bg-black px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                          >
                            {isUpdatingProduct ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            disabled={isUpdatingProduct}
                            onClick={() => {
                              setIsUpdateOpen(false);
                              if (product) {
                                const status: UpdateProductPayload["status"] =
                                  product.status === "active" || product.status === "archived" || product.status === "published" || product.status === "draft"
                                    ? product.status
                                    : "draft";
                                setUpdateForm({
                                  name: product.name ?? "",
                                  sku: product.sku ?? "",
                                  brand: product.brand ?? "",
                                  description: product.description ?? "",
                                  materialType: product.materialType ?? "",
                                  finishType: product.finishType ?? "",
                                  colorName: product.colorName ?? "",
                                  colorHex: product.colorHex ?? "",
                                  thickness: product.thickness ?? "",
                                  dimensions: product.dimensions ?? "",
                                  performanceRating: String(product.performanceRating ?? 0),
                                  durabilityRating: String(product.durabilityRating ?? 0),
                                  priceCategory: String(product.priceCategory ?? 0),
                                  maintenanceRating: String(product.maintenanceRating ?? 0),
                                  bestUsedForText: Array.isArray(product.bestUsedFor) ? product.bestUsedFor.join("\n") : "",
                                  prosText: Array.isArray(product.pros) ? product.pros.join("\n") : "",
                                  consText: Array.isArray(product.cons) ? product.cons.join("\n") : "",
                                  status,
                                });
                              }
                            }}
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isUpdateOpen && (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</label>
                      <input
                        value={updateForm.name}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, name: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">SKU</label>
                      <input
                        value={updateForm.sku}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, sku: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Brand</label>
                      <input
                        value={updateForm.brand}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, brand: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                      <textarea
                        value={updateForm.description}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-inner min-h-[90px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Material Type</label>
                      <input
                        value={updateForm.materialType}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, materialType: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Finish Type (optional)</label>
                      <input
                        value={updateForm.finishType}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, finishType: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color Name</label>
                      <input
                        value={updateForm.colorName}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, colorName: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color Hex (optional)</label>
                      <input
                        value={updateForm.colorHex}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, colorHex: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Thickness (optional)</label>
                      <input
                        value={updateForm.thickness}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, thickness: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Dimensions</label>
                      <input
                        value={updateForm.dimensions}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, dimensions: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Performance Rating</label>
                      <input
                        type="number"
                        value={updateForm.performanceRating}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, performanceRating: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Durability Rating</label>
                      <input
                        type="number"
                        value={updateForm.durabilityRating}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, durabilityRating: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Price Category</label>
                      <input
                        type="number"
                        value={updateForm.priceCategory}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, priceCategory: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Maintenance Rating</label>
                      <input
                        type="number"
                        value={updateForm.maintenanceRating}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, maintenanceRating: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                      <select
                        value={updateForm.status}
                        onChange={(e) =>
                          setUpdateForm((p) => ({
                            ...p,
                            status:
                              e.target.value === "active"
                                ? "active"
                                : e.target.value === "archived"
                                  ? "archived"
                                  : e.target.value === "published"
                                    ? "published"
                                    : "draft",
                          }))
                        }
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner"
                      >
                        <option value="draft">draft</option>
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                        <option value="published">published</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Best Used For (optional) (comma or new line)</label>
                      <textarea
                        value={updateForm.bestUsedForText}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, bestUsedForText: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-inner min-h-[80px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pros (comma or new line)</label>
                      <textarea
                        value={updateForm.prosText}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, prosText: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-inner min-h-[80px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cons (comma or new line)</label>
                      <textarea
                        value={updateForm.consText}
                        onChange={(e) => setUpdateForm((p) => ({ ...p, consText: e.target.value }))}
                        className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm shadow-inner min-h-[80px]"
                      />
                    </div>
                  </div>
                  )}
                </div>
              )}

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
          <section className="mt-14">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[36px] font-bold leading-[40px] tracking-normal text-[#AE8953]">
                View Similar
              </h2>
            </div>

            {similarError && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
                {similarError}
              </div>
            )}

            {isLoadingSimilar ? (
              <div className="rounded-xl border border-[#dfd2c1] bg-white p-4 text-sm text-gray-500">
                Loading similar products...
              </div>
            ) : similarProducts.length === 0 ? (
              <div className="rounded-xl border border-[#dfd2c1] bg-white p-4 text-sm text-gray-500">
                No similar products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {similarProducts.map((item) => {
                  const imageUrl = pickListProductImageUrl(item);
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-[#d6c8b6] bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/products/${item.slug}`)}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[4/3] w-full bg-[#ece2d3]">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={item.name}
                              fill
                              sizes="(max-width: 1024px) 50vw, 25vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="px-3 pb-3 pt-2">
                          <div className="text-[30px] font-semibold uppercase leading-tight tracking-tight text-[#2f2a24]">
                            {item.name}
                          </div>
                          <div className="mt-1 text-[12px] text-[#6d665d]">
                            {item.description || "Classic Oak Natural"}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-200 pt-2 text-[10px] uppercase text-[#8f877d]">
                            <div>
                              <div className="font-semibold">Thickness</div>
                              <div className="font-bold text-[#4b443c]">{item.thickness || "-"}</div>
                            </div>
                            <div>
                              <div className="font-semibold">Finish</div>
                              <div className="font-bold text-[#4b443c]">{item.finishType || "-"}</div>
                            </div>
                          </div>
                          <div className="mt-3 rounded-full bg-[#b58d52] py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
                            View Details
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          </>
        )}
      </main>
    </div>
  );
}
