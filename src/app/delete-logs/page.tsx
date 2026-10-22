"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDeleteLogs, type DeleteLogItem } from "@/lib/api";

const PAGE_SIZE = 25;

const ENTITY_TYPE_LABELS: Record<string, string> = {
  product: "Product",
  product_image: "Product Image",
  product_category_link: "Product → Category Unlink",
  product_subcategory_link: "Product → Subcategory Unlink",
  product_tag_link: "Product → Tag Unlink",
  category: "Category",
  subcategory: "Sub-category",
  tag: "Tag",
  blog_post: "Blog Post",
  portfolio: "Portfolio",
  trending: "Trending",
  design_cf: "Design CF",
  user: "User",
};

const ACTION_LABELS: Record<string, string> = {
  delete: "Deleted",
  deactivate: "Deactivated",
  unlink: "Unlinked",
};

const ACTION_STYLES: Record<string, string> = {
  delete: "bg-red-50 text-red-600 border-red-100",
  deactivate: "bg-amber-50 text-amber-700 border-amber-100",
  unlink: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeleteLogsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [logs, setLogs] = useState<DeleteLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [type, setType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    if (!storedName || storedRole !== "admin") {
      router.push("/dashboard");
      return;
    }
    setIsAdmin(true);
  }, [router]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getDeleteLogs({
        type,
        search,
        from,
        to,
        page,
        limit: PAGE_SIZE,
      });
      setLogs(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load delete logs.");
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [type, search, from, to, page]);

  useEffect(() => {
    if (isAdmin) void loadLogs();
  }, [isAdmin, loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setType("");
    setSearchInput("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  if (!isAdmin) return null;

  const filterInputClass =
    "mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-black";
  const filterLabelClass = "text-[10px] font-bold uppercase tracking-widest text-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Delete Logs</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadLogs()}
            className="rounded-md bg-black px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffde59] shadow-md transition-all hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={applySearch}
          className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <div>
            <label className={filterLabelClass}>Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className={filterInputClass}
            >
              <option value="">All</option>
              {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className={filterLabelClass}>Search (item or user)</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. Oro Ply, rahul@..."
              className={filterInputClass}
            />
          </div>
          <div>
            <label className={filterLabelClass}>From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className={filterInputClass}
            />
          </div>
          <div>
            <label className={filterLabelClass}>To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className={filterInputClass}
            />
          </div>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-md bg-[#ffcb05] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-black shadow-sm hover:opacity-90"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-md border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">When</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Item</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Done By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 w-full rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top transition-colors hover:bg-gray-50/50">
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-gray-600">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-bold text-gray-700">
                        {ENTITY_TYPE_LABELS[log.entityType] ?? log.entityType}
                      </td>
                      <td className="px-6 py-4">
                        <p className="break-all text-sm font-bold text-gray-900">
                          {log.entityName || <span className="text-gray-400">(name not available)</span>}
                        </p>
                        {log.parentName && (
                          <p className="mt-1 text-[11px] text-gray-500">
                            {log.entityType === "subcategory" ? "Category: " : "Product: "}
                            {log.parentName}
                          </p>
                        )}
                        {log.entityId && (
                          <p className="mt-1 font-mono text-[10px] text-gray-400">{log.entityId}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            ACTION_STYLES[log.action] ?? ACTION_STYLES.unlink
                          }`}
                        >
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">
                          {log.deletedByCurrentName || log.deletedByName || "-"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {log.deletedByCurrentEmail || log.deletedByEmail || ""}
                        </p>
                        {log.deletedByRole && (
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {log.deletedByRole}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                      No delete logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-500">
          <span>
            {total} record{total === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 uppercase tracking-wider disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 uppercase tracking-wider disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
