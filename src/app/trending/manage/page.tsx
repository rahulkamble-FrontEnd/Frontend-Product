"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTrending, getTrendings, type TrendingItem } from "@/lib/api";

const IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function makeTrendingImageUrl(item: TrendingItem) {
  const direct = item.imageUrl?.trim() || "";
  if (direct) return direct;
  const key = item.s3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

export default function ManageTrendingPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const name = localStorage.getItem("userName") || "";
    if (!name) {
      router.push("/login");
      return;
    }
    if (role !== "blogadmin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
  }, [router]);

  useEffect(() => {
    if (userRole !== "blogadmin") return;

    let active = true;
    const loadTrendings = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getTrendings();
        if (!active) return;
        setItems(data);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load trending entries.");
        setItems([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadTrendings();
    return () => {
      active = false;
    };
  }, [userRole]);

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [items]
  );

  const handleDelete = async (id: string) => {
    if (!id || deletingId) return;
    const confirmed = window.confirm("Delete this trending entry? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      const res = await deleteTrending(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess(res.message || "Trending entry deleted successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete trending entry.");
    } finally {
      setDeletingId(null);
    }
  };

  if (userRole !== "blogadmin") return null;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Blogadmin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Manage Trending</h1>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef] sm:w-auto"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/trending/create")}
              className="w-full rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a58d74] sm:w-auto"
            >
              Create Trending
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && <div className="mb-6 rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</div>}

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading trending entries...
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No trending entries found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-[#eee8df] bg-[#faf8f5]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Preview</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Title</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Style Tag</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Caption</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Created</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((item) => {
                  const imageUrl = makeTrendingImageUrl(item);
                  return (
                    <tr key={item.id} className="border-b border-[#f2ede7] last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-20 overflow-hidden rounded border border-[#e7dfd4] bg-[#f4eee7]">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={item.title || "Trending image"}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9d9187]">
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#362f2a]">{item.title || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#efe9f8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7f6d9f]">
                          {item.styleTag || "NA"}
                        </span>
                      </td>
                      <td className="max-w-[320px] px-4 py-3 text-xs text-[#7a7069]">{item.caption || "-"}</td>
                      <td className="px-4 py-3 text-xs text-[#7a7069]">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
