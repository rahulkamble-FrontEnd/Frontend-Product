"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import CommonStoreHeader from "@/components/common-store-header";
import CompareProductsDialog from "@/components/compare-products-dialog";
import { formatCustomerProductTitle } from "@/lib/product-display-name";
import { PRODUCT_IMAGE_BASE_URL } from "@/lib/s3-image-base";
import {
  deleteShortlist,
  getProductsCompare,
  getShortlist,
  requestShortlistSample,
  updateShortlistNote,
  type ProductCompareResponse,
  type ProductImageUploadResponse,
  type ShortlistItem,
} from "@/lib/api";

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function buildProductImageUrl(value?: string | null) {
  const clean = typeof value === "string" ? cleanUrl(value) : "";
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `${PRODUCT_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
}

function pickBestImageUrl(images: ProductImageUploadResponse[] | null | undefined) {
  const list = Array.isArray(images) ? images : [];
  const primary = list.find((img) => img.isPrimary && Boolean(buildProductImageUrl(img.url ?? img.s3Key)));
  if (primary) return buildProductImageUrl(primary.url ?? primary.s3Key);
  const byOrder = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const first = byOrder.find((img) => Boolean(buildProductImageUrl(img.url ?? img.s3Key)));
  return first ? buildProductImageUrl(first.url ?? first.s3Key) : null;
}

function productImageUrl(product: ShortlistItem["product"]) {
  if (!product) return null;
  const obj = product as unknown as Record<string, unknown>;
  if (typeof obj.imageUrl === "string") {
    const direct = buildProductImageUrl(obj.imageUrl);
    if (direct) return direct;
  }
  if (typeof obj.primaryImageUrl === "string") {
    const primary = buildProductImageUrl(obj.primaryImageUrl);
    if (primary) return primary;
  }
  const images = obj.images;
  if (Array.isArray(images)) {
    const normalized = images.map((raw) => {
      const img = raw as ProductImageUploadResponse & { s3_key?: string | null };
      return {
        ...img,
        s3Key: img.s3Key ?? img.s3_key ?? "",
        url: typeof img.url === "string" ? img.url : null,
      } as ProductImageUploadResponse;
    });
    if (normalized.length > 0) return pickBestImageUrl(normalized);
  }
  return null;
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("button, textarea, input, select, a"));
}

export default function ShortlistPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestingSampleId, setRequestingSampleId] = useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shortlistRefreshKey, setShortlistRefreshKey] = useState(0);
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
      setIsLoading(true);
      setError("");
      try {
        const shortlist = await getShortlist();
        if (cancelled) return;
        const next = Array.isArray(shortlist) ? shortlist : [];
        setItems(next);
        setNoteDrafts(
          next.reduce<Record<string, string>>((acc, item) => {
            acc[item.id] = item.customerNote || "";
            return acc;
          }, {}),
        );
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch shortlist.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

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

  const requestSample = async (shortlistId: string) => {
    setError("");
    setMessage("");
    setRequestingSampleId(shortlistId);
    try {
      const updated = await requestShortlistSample(shortlistId);
      setItems((prev) =>
        prev.map((item) =>
          item.id === shortlistId
            ? {
                ...item,
                sampleRequested: updated.sampleRequested,
                sampleRequestedAt: updated.sampleRequestedAt,
                sampleStatus: updated.sampleStatus,
              }
            : item,
        ),
      );
      setMessage("Physical sample requested successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to request physical sample.");
    } finally {
      setRequestingSampleId(null);
    }
  };

  const saveNote = async (shortlistId: string) => {
    setError("");
    setMessage("");
    setSavingNoteId(shortlistId);
    try {
      const updated = await updateShortlistNote(shortlistId, {
        customerNote: (noteDrafts[shortlistId] ?? "").trim(),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === shortlistId ? { ...item, customerNote: updated.customerNote } : item)),
      );
      setNoteDrafts((prev) => ({ ...prev, [shortlistId]: updated.customerNote || "" }));
      setMessage("Shortlist note updated successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist note.");
    } finally {
      setSavingNoteId(null);
    }
  };

  const removeItem = async (shortlistId: string) => {
    setError("");
    setMessage("");
    if (!window.confirm("Remove this item from shortlist?")) return;
    setDeletingId(shortlistId);
    try {
      const result = await deleteShortlist(shortlistId);
      const deleted = items.find((item) => item.id === shortlistId);
      setItems((prev) => prev.filter((item) => item.id !== shortlistId));
      setNoteDrafts((prev) => {
        const next = { ...prev };
        delete next[shortlistId];
        return next;
      });
      if (deleted?.productId) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deleted.productId);
          return next;
        });
      }
      setShortlistRefreshKey((value) => value + 1);
      setMessage(result.message || "Removed from shortlist.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to remove shortlist item.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!userName || userRole !== "customer") return null;

  return (
    <div className="min-h-screen bg-[#f4eee5] text-gray-900">
      <CommonStoreHeader
        pageTitle="My Shortlist"
        breadcrumbText="HOME  >  SHORTLIST"
        breadcrumbItems={[
          { label: "HOME", href: "/dashboard" },
          { label: "SHORTLIST" },
        ]}
        userName={userName}
        userRole={userRole}
        shortlistRefreshKey={shortlistRefreshKey}
      />

      <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h1 className="text-2xl font-black uppercase tracking-tight text-[#4d2c1e] sm:text-3xl">My Shortlist</h1>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">{items.length} Saved</div>
        </div>

        {message ? (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-xs font-bold text-green-600">{message}</div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</div>
        ) : null}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d9cab5] bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <div className="text-[12px] font-black uppercase tracking-widest text-gray-500">Compare</div>
            {compareError === "You can compare only 4 products." ? (
              <div className="mt-1 text-sm font-semibold text-[#9b2c2c]">You can compare only 4 products.</div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedList.length < 2 || isComparing}
              onClick={() => void openCompare()}
              className="rounded-full bg-black px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
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
              className="rounded-full border border-gray-200 bg-white px-5 py-2 text-[11px] font-black uppercase tracking-widest text-gray-800 disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-[420px] animate-pulse rounded-2xl bg-[#e8dfd0]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#d9cab5] bg-white p-10 text-center text-sm text-gray-500">
            No shortlist items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const product = item.product ?? null;
              const imageUrl = productImageUrl(product);
              const recommendations = Array.isArray(item.recommendations) ? item.recommendations : [];
              const sampleStatus = (item.sampleStatus ?? "").trim();
              const showSampleStatus = sampleStatus.length > 0 && sampleStatus.toLowerCase() !== "none";
              return (
                <article
                  key={item.id}
                  role={product?.slug ? "button" : undefined}
                  tabIndex={product?.slug ? 0 : -1}
                  onClick={(e) => {
                    if (!product?.slug || isInteractiveTarget(e.target)) return;
                    router.push(`/products/${product.slug}`);
                  }}
                  onKeyDown={(e) => {
                    if (!product?.slug || isInteractiveTarget(e.target)) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/products/${product.slug}`);
                    }
                  }}
                  className={[
                    "flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm",
                    product?.slug ? "cursor-pointer" : "",
                  ].join(" ")}
                >
                  <div className="relative aspect-[4/3] w-full shrink-0 bg-white">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={product?.name || "Shortlisted product"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      {showSampleStatus ? (
                        <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                          {sampleStatus}
                        </span>
                      ) : null}
                      {item.sampleRequested && sampleStatus.toLowerCase() !== "ready" ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-700">
                          Sample Requested
                        </span>
                      ) : null}
                    </div>
                    {product?.id ? (
                      <button
                        type="button"
                        aria-label={selectedIds.has(product.id) ? "Untick from compare" : "Tick for compare"}
                        className={[
                          "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm",
                          selectedIds.has(product.id) ? "border-black bg-black text-white" : "border-gray-200 bg-white/95 text-gray-800",
                        ].join(" ")}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompare(product.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          className="pointer-events-none h-4 w-4 accent-black"
                          checked={selectedIds.has(product.id)}
                          readOnly
                          tabIndex={-1}
                          aria-hidden="true"
                        />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 bg-[#e8dfd0] p-4">
                    <div>
                      <div className="truncate text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {product?.materialType || "Shortlisted Product"}
                      </div>
                      <div className="mt-1 line-clamp-2 min-h-[3.5rem] break-words text-xl font-black leading-snug text-gray-900">
                        {product ? formatCustomerProductTitle(product.name, product.slug) : item.productId}
                      </div>
                      <div className="mt-1 line-clamp-2 min-h-[2rem] break-words text-[12px] font-bold leading-4 text-gray-600">
                        {product ? `SKU: ${product.sku}` : "\u00a0"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={Boolean(item.sampleRequested) || requestingSampleId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void requestSample(item.id);
                        }}
                        className="rounded-full bg-[#0468a3] px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {requestingSampleId === item.id ? "Requesting..." : item.sampleRequested ? "Sample Requested" : "Request Sample"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeItem(item.id);
                        }}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Removing..." : "Remove"}
                      </button>
                    </div>

                    <div className="rounded-xl bg-white p-3 text-sm text-gray-700" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Note</div>
                        <button
                          type="button"
                          disabled={savingNoteId === item.id}
                          onClick={() => void saveNote(item.id)}
                          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-800 disabled:opacity-50"
                        >
                          {savingNoteId === item.id ? "Saving..." : "Save Note"}
                        </button>
                      </div>
                      <textarea
                        value={noteDrafts[item.id] ?? item.customerNote ?? ""}
                        onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Updated note text"
                        className="mt-2 block min-h-[96px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      />
                    </div>

                    <div className="rounded-xl bg-[#f4f8fb] p-3 text-sm text-gray-700">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Designer Reply</div>
                      <div className="mt-1 min-h-[1.25rem] whitespace-pre-wrap break-words">{item.designerReplyNote?.trim() || "-"}</div>
                      <div className="mt-2 text-[11px] font-bold text-gray-600">
                        Updated: {item.designerReplyUpdatedAt ? new Date(item.designerReplyUpdatedAt).toLocaleDateString() : "-"}
                      </div>
                    </div>

                    <div className="rounded-xl bg-[#f4f8fb] p-3 text-sm text-gray-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 text-[10px] font-black uppercase tracking-widest text-gray-400">Recommended By Designer</div>
                        <div className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-600">
                          {recommendations.length} Added
                        </div>
                      </div>
                      <div className="mt-2 space-y-2">
                        {recommendations.length === 0 ? (
                          <div className="break-words rounded-lg bg-white p-3 text-xs leading-5 text-gray-500">No recommendations from designer yet.</div>
                        ) : (
                          recommendations.map((recommendation) => (
                            <button
                              key={recommendation.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const slug = recommendation.product?.slug;
                                if (slug) router.push(`/products/${slug}`);
                              }}
                              className="w-full rounded-lg bg-white p-3 text-left transition hover:bg-gray-100"
                            >
                              <div className="text-sm font-semibold text-gray-900">{recommendation.note}</div>
                              <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[#0468a3]">
                                Recommended Product:{" "}
                                {recommendation.product
                                  ? [recommendation.product.name, recommendation.product.sku].filter(Boolean).join(" • ")
                                  : recommendation.productId}
                              </div>
                              <div className="mt-1 text-[11px] font-bold text-gray-500">
                                Recommended on {new Date(recommendation.createdAt).toLocaleString()}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3 pt-1 text-[11px] font-bold leading-4 text-gray-600">
                      <div className="min-w-0 break-words">Created: {new Date(item.createdAt).toLocaleDateString()}</div>
                      <div className="min-w-0 break-words text-right">
                        Requested: {item.sampleRequestedAt ? new Date(item.sampleRequestedAt).toLocaleDateString() : "-"}
                      </div>
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
