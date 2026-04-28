"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDesignCf,
  deleteDesignCf,
  getDesignCfEntries,
  updateDesignCf,
  type DesignCfEntry,
} from "@/lib/api";

export default function ManageDesignCfPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<DesignCfEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const name = localStorage.getItem("userName") || "";
    if (!name) {
      router.push("/login");
      return;
    }
    if (role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
  }, [router]);

  const loadEntries = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await getDesignCfEntries();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load Design CF entries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== "admin") return;
    void loadEntries();
  }, [userRole]);

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [items],
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setSuccess("");

    try {
      setIsSubmitting(true);
      await createDesignCf(
        {
          title: title.trim(),
          description: description.trim() || null,
        },
        imageFiles,
      );
      setTitle("");
      setDescription("");
      setImageFiles([]);
      setSuccess("Design CF entry created successfully.");
      await loadEntries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create Design CF entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || deletingId) return;
    if (!window.confirm("Delete this Design CF entry?")) return;
    setDeletingId(id);
    setError("");
    setSuccess("");
    try {
      const response = await deleteDesignCf(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSuccess(response.message || "Design CF entry deleted successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete Design CF entry.");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (item: DesignCfEntry) => {
    setEditingId(item.id);
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    setEditImageFiles([]);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (id: string) => {
    if (!id || isSubmitting) return;
    setError("");
    setSuccess("");
    try {
      setIsSubmitting(true);
      await updateDesignCf(
        id,
        {
          title: editTitle.trim(),
          description: editDescription,
        },
        editImageFiles.length > 0 ? editImageFiles : undefined,
      );
      setEditingId(null);
      setEditTitle("");
      setEditDescription("");
      setEditImageFiles([]);
      setSuccess("Design CF entry updated successfully.");
      await loadEntries();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update Design CF entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Admin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Manage Design CF</h1>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</div>}

        <section className="rounded-md border border-[#e6dfd7] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h2 className="mb-4 text-lg font-semibold text-[#3b322d]">Add New Design</h2>
          <form className="grid grid-cols-1 gap-4 lg:grid-cols-2" onSubmit={handleCreate}>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">Images (1 to 3)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => setImageFiles(Array.from(e.target.files ?? []).slice(0, 3))}
                required
                className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Create Design"}
              </button>
            </div>
          </form>
        </section>

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading designs...
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No Design CF entries found.
          </div>
        ) : (
          <div className="space-y-4">
            {orderedItems.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <article key={item.id} className="rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm"
                          />
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm"
                          />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(e) => setEditImageFiles(Array.from(e.target.files ?? []).slice(0, 3))}
                            className="block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm"
                          />
                          <p className="text-xs text-[#7a7069]">
                            Upload 1-3 images only if you want to replace existing photos.
                          </p>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-semibold text-[#362f2a]">{item.title || "-"}</h3>
                          <p className="mt-1 text-sm text-[#7a7069]">{item.description || "No description"}</p>
                        </>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(item.images ?? []).map((img) => (
                          <div key={img.id} className="relative h-20 w-28 overflow-hidden rounded border border-[#e7dfd4] bg-[#f4eee7]">
                            <Image src={img.imageUrl || ""} alt={item.title} fill unoptimized className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void handleUpdate(item.id)}
                            className="rounded-md border border-[#bba892] bg-[#bca58c] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c]"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(item)}
                            className="rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => void handleDelete(item.id)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-60"
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
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
