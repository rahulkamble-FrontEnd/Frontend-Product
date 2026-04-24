"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSubcategory,
  deleteSubcategory,
  getCategoryMenu,
  getSubcategories,
  updateSubcategory,
} from "@/lib/api";

type ParentCategory = {
  id: string;
  name: string;
  type: "material" | "furniture";
};

type SubcategoryItem = {
  id: string;
  name: string;
  slug: string;
  type: "material" | "furniture";
  parentId: string;
  parentName: string;
};

export default function SubcategoriesPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [parents, setParents] = useState<ParentCategory[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>([]);
  const [parentFilter, setParentFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "material" | "furniture">(
    "all",
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newData, setNewData] = useState({
    parentId: "",
    name: "",
    type: "material" as "material" | "furniture",
  });

  const [editing, setEditing] = useState<SubcategoryItem | null>(null);
  const filteredSubcategories = subcategories.filter((item) => {
    const matchesParent = parentFilter === "all" || item.parentId === parentFilter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesParent && matchesType;
  });

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");
    if (!storedName || storedRole !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(storedRole);
    void loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const menu = await getCategoryMenu({ includeChildren: true, productLimit: 1 });
      const parentItems: ParentCategory[] = [];
      const subItems: SubcategoryItem[] = [];

      for (const root of Array.isArray(menu) ? menu : []) {
        const parentType: ParentCategory["type"] =
          root.type === "furniture" ? "furniture" : "material";
        parentItems.push({ id: root.id, name: root.name, type: parentType });
      }

      const grouped = await Promise.all(
        parentItems.map(async (parent) => {
          const children = await getSubcategories(parent.id);
          return { parent, children: Array.isArray(children) ? children : [] };
        }),
      );

      for (const group of grouped) {
        for (const child of group.children as Array<Record<string, unknown>>) {
          const id = typeof child.id === "string" ? child.id : "";
          const name = typeof child.name === "string" ? child.name : "";
          const slug = typeof child.slug === "string" ? child.slug : "";
          const type =
            child.type === "furniture" ? "furniture" : "material";
          if (!id || !name) continue;
          subItems.push({
            id,
            name,
            slug,
            type,
            parentId: group.parent.id,
            parentName: group.parent.name,
          });
        }
      }

      setParents(parentItems);
      setSubcategories(subItems);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sub-categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError("");
    setMessage("");
    try {
      await createSubcategory(newData.parentId, {
        name: newData.name,
        type: newData.type,
      });
      setMessage("Sub-category created successfully.");
      setNewData({ parentId: "", name: "", type: "material" });
      setIsCreateOpen(false);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create sub-category.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setIsUpdating(true);
    setError("");
    setMessage("");
    try {
      await updateSubcategory(editing.parentId, editing.id, {
        name: editing.name,
        type: editing.type,
        parent_id: editing.parentId,
      });
      setMessage("Sub-category updated successfully.");
      setIsEditOpen(false);
      setEditing(null);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update sub-category.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (item: SubcategoryItem) => {
    if (!window.confirm(`Deactivate sub-category "${item.name}"?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteSubcategory(item.parentId, item.id);
      setMessage("Sub-category deactivated successfully.");
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete sub-category.");
    }
  };

  if (userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Sub-Category Management</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Create · Update · Delete · Manage</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value === "material"
                    ? "material"
                    : e.target.value === "furniture"
                      ? "furniture"
                      : "all",
                )
              }
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-700"
            >
              <option value="all">All Types</option>
              <option value="material">Material</option>
              <option value="furniture">Furniture</option>
            </select>
            <select
              value={parentFilter}
              onChange={(e) => setParentFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-gray-700"
            >
              <option value="all">All Categories</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="rounded-md bg-black px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffde59] shadow-md hover:opacity-90 transition-all"
            >
              Add Sub-Category
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}
        {message && <div className="mb-4 rounded-xl border border-green-100 bg-green-50 p-3 text-sm font-bold text-green-600">{message}</div>}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Sub-Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Parent Category</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : filteredSubcategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-sm text-gray-500">
                      No sub-categories found for selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredSubcategories.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.parentName}</td>
                      <td className="px-6 py-4 text-[11px] uppercase text-gray-600">{item.type}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">{item.slug}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            className="text-[10px] font-black uppercase tracking-widest text-[#4d2c1e] hover:underline"
                            onClick={() => {
                              setEditing(item);
                              setIsEditOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline"
                            onClick={() => void handleDelete(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-tight text-[#4d2c1e]">Create Sub-Category</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent Category</label>
                <select
                  required
                  value={newData.parentId}
                  onChange={(e) => setNewData((prev) => ({ ...prev, parentId: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                >
                  <option value="">Select parent category</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sub-Category Name</label>
                <input
                  required
                  value={newData.name}
                  onChange={(e) => setNewData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</label>
                <select
                  value={newData.type}
                  onChange={(e) =>
                    setNewData((prev) => ({
                      ...prev,
                      type: e.target.value === "furniture" ? "furniture" : "material",
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                >
                  <option value="material">Material</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="w-full rounded-full border border-gray-300 py-2 text-xs font-black uppercase tracking-widest text-gray-700">Cancel</button>
                <button disabled={isCreating} type="submit" className="w-full rounded-full bg-black py-2 text-xs font-black uppercase tracking-widest text-[#ffde59]">
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-tight text-[#4d2c1e]">Update Sub-Category</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent Category</label>
                <select
                  required
                  value={editing.parentId}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            parentId: e.target.value,
                            parentName:
                              parents.find((p) => p.id === e.target.value)?.name ?? prev.parentName,
                          }
                        : prev,
                    )
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                >
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sub-Category Name</label>
                <input
                  required
                  value={editing.name}
                  onChange={(e) => setEditing((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="w-full rounded-full border border-gray-300 py-2 text-xs font-black uppercase tracking-widest text-gray-700">Cancel</button>
                <button disabled={isUpdating} type="submit" className="w-full rounded-full bg-black py-2 text-xs font-black uppercase tracking-widest text-[#ffde59]">
                  {isUpdating ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
