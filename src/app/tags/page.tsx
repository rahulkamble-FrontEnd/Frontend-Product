"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, deleteTag, getTags, updateTag, type TagItem } from "@/lib/api";

type TagFormState = {
  name: string;
  hex_code: string;
};

export default function TagsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [createForm, setCreateForm] = useState<TagFormState>({
    name: "",
    hex_code: "",
  });

  const [editTagId, setEditTagId] = useState("");
  const [editForm, setEditForm] = useState<TagFormState>({
    name: "",
    hex_code: "",
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");

    if (!storedName || storedRole !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(storedRole);
    void loadTags();
  }, [router]);

  const loadTags = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTags();
      setTags(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tags.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await createTag({
        name: createForm.name,
        hex_code: createForm.hex_code,
      });
      setSuccess("Tag created successfully.");
      setCreateForm({ name: "", hex_code: "" });
      setIsCreateOpen(false);
      await loadTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (tag: TagItem) => {
    setEditTagId(tag.id);
    setEditForm({
      name: tag.name,
      hex_code: tag.hexCode,
    });
    setIsEditOpen(true);
    setError("");
    setSuccess("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTagId) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateTag(editTagId, {
        name: editForm.name,
        hex_code: editForm.hex_code,
      });
      setSuccess("Tag updated successfully.");
      setIsEditOpen(false);
      setEditTagId("");
      await loadTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update tag.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tag?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await deleteTag(id);
      setSuccess(res.message || "Tag deleted successfully.");
      await loadTags();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete tag.");
    }
  };

  if (userRole !== "admin") return null;

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
              <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Tags Management</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setError("");
              setSuccess("");
            }}
            className="rounded-md bg-black px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffde59] shadow-md transition-all hover:opacity-90"
          >
            Add Tag
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-green-100 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
            {success}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Hex</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 w-full rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : tags.length > 0 ? (
                  tags.map((tag) => (
                    <tr key={tag.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{tag.name}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">{tag.slug}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">{tag.hexCode}</td>
                      <td className="px-6 py-4">
                        <div
                          className="h-6 w-14 rounded border border-gray-200"
                          style={{ backgroundColor: tag.hexCode || "#ffffff" }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(tag)}
                            className="text-[10px] font-black uppercase tracking-widest text-[#4d2c1e] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tag.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                      No tags found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Create Tag</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-black"
                disabled={isSaving}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tag Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Mint Green"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hex Code</label>
                <input
                  type="text"
                  required
                  value={createForm.hex_code}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, hex_code: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono shadow-inner focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="#B6FCD5"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="mt-4 w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Creating..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Edit Tag</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-gray-400 hover:text-black"
                disabled={isSaving}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tag Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-inner focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="e.g. Dark Navy"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Hex Code</label>
                <input
                  type="text"
                  required
                  value={editForm.hex_code}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, hex_code: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-mono shadow-inner focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="#102A56"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="mt-4 w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
