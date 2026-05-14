"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deletePortfolio,
  getCategories,
  getPortfolios,
  updatePortfolio,
  type PortfolioResponse,
} from "@/lib/api";

const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function makePortfolioImageUrl(input: { url?: string | null; s3Key?: string | null }) {
  const direct = input.url?.trim() || "";
  if (direct) return direct;
  const key = input.s3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type EditForm = {
  title: string;
  roomType: string;
  category: string;
  description: string;
};

export default function ManagePortfolioPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<PortfolioResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [form, setForm] = useState<EditForm>({
    title: "",
    roomType: "",
    category: "",
    description: "",
  });

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
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const [materialCategories, furnitureCategories] = await Promise.all([
          getCategories("material"),
          getCategories("furniture"),
        ]);
        const raw = [
          ...(Array.isArray(materialCategories) ? materialCategories : []),
          ...(Array.isArray(furnitureCategories) ? furnitureCategories : []),
        ];
        const parsed = raw
          .map((item) => {
            const obj = item as Record<string, unknown>;
            const id = typeof obj.id === "string" ? obj.id : "";
            const name = typeof obj.name === "string" ? obj.name : "";
            const slug = typeof obj.slug === "string" ? obj.slug : "";
            return { id, name, slug };
          })
          .filter((item) => item.id && item.name && item.slug);
        const deduped = Array.from(new Map(parsed.map((item) => [item.id, item])).values());
        if (active) setCategoryOptions(deduped);
      } catch {
        if (active) setCategoryOptions([]);
      } finally {
        if (active) setIsLoadingCategories(false);
      }
    };

    void loadCategories();
    return () => {
      active = false;
    };
  }, [userRole]);

  useEffect(() => {
    if (userRole !== "blogadmin") return;

    let active = true;
    const loadPortfolios = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getPortfolios();
        if (!active) return;
        setItems(data);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load portfolio entries.");
        setItems([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadPortfolios();
    return () => {
      active = false;
    };
  }, [userRole]);

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = new Date(a.portfolio.createdAt).getTime();
        const bTime = new Date(b.portfolio.createdAt).getTime();
        return bTime - aTime;
      }),
    [items]
  );

  const openEdit = (entry: PortfolioResponse) => {
    const id = entry.portfolio.id?.trim();
    if (!id) return;
    setEditingId(id);
    setForm({
      title: entry.portfolio.title || "",
      roomType: entry.portfolio.roomType || "",
      category: entry.portfolio.category || "",
      description: entry.portfolio.description || "",
    });
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditingId(null);
  };

  const canSaveEdit = useMemo(() => {
    if (!editingId || isSaving) return false;
    return Boolean(
      form.title.trim() && form.roomType.trim() && form.category.trim() && form.description.trim()
    );
  }, [editingId, isSaving, form.title, form.roomType, form.category, form.description]);

  const handleSave = async () => {
    if (!editingId || !canSaveEdit) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updatePortfolio(editingId, {
        title: form.title.trim(),
        roomType: form.roomType.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
      });
      setItems((prev) => prev.map((row) => (row.portfolio.id === editingId ? updated : row)));
      setSuccess("Portfolio updated successfully.");
      setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update portfolio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (portfolioId: string) => {
    if (!portfolioId || deletingId) return;
    const confirmed = window.confirm("Delete this portfolio entry and all of its images? This cannot be undone.");
    if (!confirmed) return;

    setDeletingId(portfolioId);
    setError("");
    setSuccess("");
    try {
      const res = await deletePortfolio(portfolioId);
      setItems((prev) => prev.filter((row) => row.portfolio.id !== portfolioId));
      setSuccess(res.message || "Portfolio deleted successfully.");
      if (editingId === portfolioId) setEditingId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete portfolio.");
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
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Manage Portfolio</h1>
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
              onClick={() => router.push("/blog")}
              className="w-full rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef] sm:w-auto"
            >
              View Blog
            </button>
            <button
              type="button"
              onClick={() => router.push("/portfolio/create")}
              className="w-full rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a58d74] sm:w-auto"
            >
              Create Portfolio
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && <div className="mb-6 rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</div>}

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading portfolio entries...
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No portfolio entries found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <table className="w-full min-w-[980px] text-left">
              <thead className="border-b border-[#eee8df] bg-[#faf8f5]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Preview</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Title</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Room</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Category</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Description</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Created</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((entry) => {
                  const id = entry.portfolio.id?.trim() || "";
                  const sortedImages = [...entry.images].sort((a, b) => a.displayOrder - b.displayOrder);
                  const firstImage = sortedImages[0];
                  const imageUrl = firstImage ? makePortfolioImageUrl(firstImage) : null;
                  return (
                    <tr key={id || entry.portfolio.title} className="border-b border-[#f2ede7] last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-20 overflow-hidden rounded border border-[#e7dfd4] bg-[#f4eee7]">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={entry.portfolio.title || "Portfolio"} fill unoptimized className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9d9187]">
                              No image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#362f2a]">{entry.portfolio.title || "-"}</td>
                      <td className="px-4 py-3 text-xs text-[#7a7069]">{entry.portfolio.roomType || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#efe9f8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7f6d9f]">
                          {entry.portfolio.category || "NA"}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-xs text-[#7a7069]">
                        {(entry.portfolio.description || "-").slice(0, 120)}
                        {(entry.portfolio.description || "").length > 120 ? "…" : ""}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#7a7069]">{new Date(entry.portfolio.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!id}
                            onClick={() => openEdit(entry)}
                            className="rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] hover:bg-[#f7f4ef] disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={!id || deletingId === id}
                            onClick={() => handleDelete(id)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
                          >
                            {deletingId === id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#e6dfd7] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-[#3b322d]">Edit Portfolio</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Room type</label>
                <input
                  type="text"
                  value={form.roomType}
                  onChange={(e) => setForm((prev) => ({ ...prev, roomType: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">{isLoadingCategories ? "Loading…" : "Select category"}</option>
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                  {form.category && !categoryOptions.some((o) => o.slug === form.category) && (
                    <option value={form.category}>{form.category} (current)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <p className="text-xs text-[#9b9088]">Images are not changed here. Delete the entry and recreate to replace images.</p>

              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canSaveEdit}
                  onClick={() => void handleSave()}
                  className="rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
