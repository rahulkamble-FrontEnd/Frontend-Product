"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BulkEditProductsModal } from "@/components/bulk-edit-products-modal";
import { getProducts, getTags, linkProductTag, type ProductListItem, type TagItem } from "@/lib/api";

const PAGE_LIMIT = 50;

function formatStatusLabel(status: string) {
  const s = status.trim().toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "active") return "Active";
  if (s === "archived") return "Archived";
  if (s === "published") return "Published";
  return status || "—";
}

export default function ManageProductsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkBannerMsg, setBulkBannerMsg] = useState("");
  const [bulkBannerError, setBulkBannerError] = useState("");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [bulkTagId, setBulkTagId] = useState("");
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [bulkTagMsg, setBulkTagMsg] = useState("");
  const [bulkTagError, setBulkTagError] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const name = localStorage.getItem("userName") || "";
    if (!name) {
      router.push("/login");
      return;
    }
    if (role !== "admin" && role !== "dataadmin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
  }, [router]);

  useEffect(() => {
    if (userRole !== "admin" && userRole !== "dataadmin") return;
    let cancelled = false;
    const loadTags = async () => {
      try {
        const data = await getTags();
        const tags = Array.isArray(data) ? data : [];
        if (cancelled) return;
        setAllTags(tags);
        setBulkTagId((prev) => {
          if (prev && tags.some((tag) => tag.id === prev)) return prev;
          return "";
        });
      } catch {
        if (!cancelled) {
          setAllTags([]);
          setBulkTagId("");
        }
      }
    };
    void loadTags();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const loadProducts = useCallback(async () => {
    if (userRole !== "admin" && userRole !== "dataadmin") return;
    setIsLoading(true);
    setError("");
    try {
      const data = await getProducts({
        page,
        limit: PAGE_LIMIT,
        status: statusFilter || undefined,
        q: appliedSearch.trim() || undefined,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (err: unknown) {
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, [userRole, page, statusFilter, appliedSearch]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(total, 1) / PAGE_LIMIT)),
    [total],
  );

  const applySearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const pageIds = useMemo(() => items.map((row) => row.id), [items]);

  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) => {
    setBulkBannerMsg("");
    setBulkBannerError("");
    setBulkTagMsg("");
    setBulkTagError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = () => {
    setBulkBannerMsg("");
    setBulkBannerError("");
    setBulkTagMsg("");
    setBulkTagError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const deselectPage = () => {
    setBulkBannerMsg("");
    setBulkBannerError("");
    setBulkTagMsg("");
    setBulkTagError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const clearSelection = () => {
    setBulkBannerMsg("");
    setBulkBannerError("");
    setBulkTagMsg("");
    setBulkTagError("");
    setSelectedIds(new Set());
  };

  const openBulkEdit = () => {
    setBulkBannerMsg("");
    setBulkBannerError("");
    setBulkTagMsg("");
    setBulkTagError("");
    if (selectedIds.size === 0) {
      setBulkBannerError("Select at least one product.");
      return;
    }
    setIsBulkEditOpen(true);
  };

  const closeBulkEdit = () => {
    setIsBulkEditOpen(false);
  };

  const handleBulkTagApply = async () => {
    setBulkTagMsg("");
    setBulkTagError("");
    setBulkBannerMsg("");
    setBulkBannerError("");
    if (userRole !== "admin" && userRole !== "dataadmin") {
      setBulkTagError("Only dataadmin and admin can bulk tag products.");
      return;
    }
    const selectedProductIds = Array.from(selectedIds);
    if (selectedProductIds.length === 0) {
      setBulkTagError("Select at least one product.");
      return;
    }
    const selectedTagId = bulkTagId.trim();
    if (!selectedTagId) {
      setBulkTagError("Please select a tag.");
      return;
    }

    const tag = allTags.find((t) => t.id === selectedTagId);
    if (!tag) {
      setBulkTagError("Selected tag not found.");
      return;
    }
    const tagName = tag.name || "Tag";

    setIsBulkTagging(true);
    try {
      const results = await Promise.all(
        selectedProductIds.map(async (productId) => {
          try {
            const res = await linkProductTag(productId, { tagId: selectedTagId });
            return { ok: true, linked: Boolean(res.linked) };
          } catch {
            return { ok: false, linked: false };
          }
        }),
      );

      const successCount = results.filter((item) => item.ok).length;
      const newlyLinkedCount = results.filter((item) => item.ok && item.linked).length;
      const failedCount = results.length - successCount;
      setBulkTagMsg(
        `"${tagName}" tag processed for ${results.length} selected products. Newly tagged: ${newlyLinkedCount}, already tagged: ${
          successCount - newlyLinkedCount
        }, failed: ${failedCount}.`,
      );
      if (failedCount > 0) {
        setBulkTagError(`${failedCount} product(s) failed while tagging.`);
      }
      await loadProducts();
    } catch (err: unknown) {
      setBulkTagError(err instanceof Error ? err.message : "Failed to bulk tag products.");
    } finally {
      setIsBulkTagging(false);
    }
  };

  if (userRole !== "admin" && userRole !== "dataadmin") return null;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#3b322d] sm:text-3xl">Manage products</h1>
            <p className="mt-1 text-sm text-[#7a7069]">Browse, select products, bulk tag, bulk edit, or open a detail page.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="shrink-0 rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>
        ) : null}
        {bulkBannerError ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{bulkBannerError}</div>
        ) : null}
        {bulkBannerMsg ? (
          <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{bulkBannerMsg}</div>
        ) : null}
        {bulkTagError ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{bulkTagError}</div>
        ) : null}
        {bulkTagMsg ? (
          <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{bulkTagMsg}</div>
        ) : null}

        <section className="rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-[1fr_160px]">
              <div>
                <label htmlFor="product-search" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  Search
                </label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="product-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applySearch();
                    }}
                    placeholder="Name, SKU, or brand"
                    className="min-w-0 flex-1 rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applySearch}
                    className="w-full shrink-0 rounded-md bg-[#bca58c] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-95 sm:w-auto"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="product-status" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  Status
                </label>
                <select
                  id="product-status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#6c625c]">
              {isLoading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </section>

        {!isLoading && items.length > 0 ? (
          <section className="flex flex-col gap-4 rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
              <div className="break-words text-[11px] font-black uppercase tracking-widest text-[#6c625c]">
                Bulk tag: {selectedIds.size} selected (this page: {pageIds.filter((id) => selectedIds.has(id)).length} of{" "}
                {pageIds.length})
              </div>
              <div className="flex w-full min-w-0 flex-col gap-2 sm:max-w-[280px]">
                <label htmlFor="manage-bulk-tag" className="sr-only">
                  Select tag
                </label>
                <select
                  id="manage-bulk-tag"
                  value={bulkTagId}
                  onChange={(e) => {
                    setBulkTagId(e.target.value);
                    setBulkTagError("");
                    setBulkTagMsg("");
                  }}
                  disabled={allTags.length === 0}
                  className="w-full rounded-full border border-gray-200 bg-white px-3 py-2.5 text-[11px] font-bold text-gray-800 shadow-sm disabled:opacity-50"
                >
                  <option value="">Select tag</option>
                  {allTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={selectedIds.size === 0 || isBulkTagging || !bulkTagId}
                onClick={() => void handleBulkTagApply()}
                className="w-full rounded-full bg-[#A9844F] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-[#8A6A3A] disabled:opacity-50 sm:w-auto sm:shrink-0"
              >
                {isBulkTagging ? "Tagging…" : "Apply selected tag"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[#ebe4dc] pt-3">
              <button
                type="button"
                disabled={pageIds.length === 0}
                onClick={toggleSelectAllOnPage}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                {allPageSelected ? "Deselect page" : "Select page"}
              </button>
              <button
                type="button"
                disabled={pageIds.length === 0 || !pageIds.some((id) => selectedIds.has(id))}
                onClick={deselectPage}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                Clear page
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={clearSelection}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm disabled:opacity-50"
              >
                Clear all
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={openBulkEdit}
                className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#1f2a3d] shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                Bulk edit
              </button>
            </div>
          </section>
        ) : null}

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading products…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No products match your filters.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#ebe4dc] bg-[#faf7f3] text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7a7069]">
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAllOnPage}
                          className="h-4 w-4 accent-[#A9844F]"
                          aria-label="Select all on this page"
                        />
                      </th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Brand</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0ebe6] last:border-0 hover:bg-[#fdfcfa]">
                        <td className="px-3 py-3 align-top">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            className="h-4 w-4 accent-[#A9844F]"
                            aria-label={`Select ${row.name}`}
                          />
                        </td>
                        <td className="max-w-[240px] px-4 py-3 font-semibold text-[#3b322d]">
                          <span className="line-clamp-2" title={row.name}>
                            {row.name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#5c534c]">{row.sku || "—"}</td>
                        <td className="max-w-[140px] truncate px-4 py-3 text-[#5c534c]" title={row.brand ?? ""}>
                          {row.brand ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#5c534c]">{formatStatusLabel(row.status)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[#5c534c]">
                          {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <Link
                            href={`/products/${encodeURIComponent(row.slug)}`}
                            className="inline-flex rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4a433d] transition hover:bg-[#f7f4ef]"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {total > PAGE_LIMIT ? (
              <div className="flex flex-col items-center justify-between gap-3 border border-[#e6dfd7] bg-white px-4 py-3 text-sm text-[#5c534c] sm:flex-row sm:px-5">
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4a433d] transition hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#4a433d] transition hover:bg-[#f7f4ef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      <BulkEditProductsModal
        open={isBulkEditOpen}
        onClose={closeBulkEdit}
        productIds={Array.from(selectedIds)}
        onApplied={async ({ updated, failed }) => {
          setBulkBannerError("");
          setBulkBannerMsg("");
          await loadProducts();
          if (failed > 0) {
            setBulkBannerMsg(`Bulk edit completed. Updated: ${updated}.`);
            setBulkBannerError(`${failed} product(s) may not have updated.`);
          } else {
            setBulkBannerMsg(`Bulk edit completed. Updated: ${updated} product(s). List refreshed.`);
          }
        }}
      />
    </div>
  );
}
