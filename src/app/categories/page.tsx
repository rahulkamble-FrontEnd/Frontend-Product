"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCategories, createCategory, deleteCategory, updateCategory } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug: string;
  type: 'material' | 'furniture';
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userRole, setUserRole] = useState("");

  // Create Category Modal State (Reusing from dashboard for convenience)
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: "",
    type: "material" as "material" | "furniture",
    parent_id: ""
  });
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [catMsg, setCatMsg] = useState("");

  // Edit Category Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("userName");

    if (!storedName || storedRole !== "admin") {
      router.push("/dashboard");
    } else {
      setUserRole(storedRole);
      fetchCategories();
    }
  }, [router]);

  const fetchCategories = async (type?: string) => {
    setLoading(true);
    setError("");
    try {
      const filter = type === "all" ? undefined : (type as any);
      const data = await getCategories(filter);
      setCategories(data);
    } catch (err: any) {
      setError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type: string) => {
    setTypeFilter(type);
    fetchCategories(type);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCat(true);
    setCatMsg("");
    setError("");
    try {
      const payload: any = { 
        name: newCatData.name, 
        type: newCatData.type 
      };
      if (newCatData.parent_id.trim()) {
        payload.parent_id = newCatData.parent_id.trim();
      }
      
      await createCategory(payload);
      setCatMsg("Category created successfully!");
      setNewCatData({ name: "", type: "material", parent_id: "" });
      fetchCategories(typeFilter);
      setTimeout(() => {
        setIsCatModalOpen(false);
        setCatMsg("");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create category.");
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to deactivate this category?")) return;
    try {
      await deleteCategory(id);
      fetchCategories(typeFilter);
    } catch (err: any) {
      setError(err.message || "Failed to deactivate category.");
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsUpdatingCat(true);
    setUpdateMsg("");
    setError("");
    try {
      const payload: any = { 
        name: editingCategory.name, 
        type: editingCategory.type 
      };
      // parent_id can be added if your API supports it on partial updates
      if ((editingCategory as any).parent_id) {
         payload.parent_id = (editingCategory as any).parent_id;
      }
      
      await updateCategory(editingCategory.id, payload);
      setUpdateMsg("Category updated successfully!");
      fetchCategories(typeFilter);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setUpdateMsg("");
        setEditingCategory(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update category.");
    } finally {
      setIsUpdatingCat(false);
    }
  };

  if (userRole !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Header */}
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
              <h1 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Category Management</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-2">Type:</span>
                <div className="flex gap-1 rounded-full bg-gray-100 p-1">
                   {['all', 'material', 'furniture'].map((type) => (
                     <button
                       key={type}
                       onClick={() => handleFilterChange(type)}
                       className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                         typeFilter === type 
                           ? "bg-black text-[#ffde59] shadow-md" 
                           : "text-gray-500 hover:text-black"
                       }`}
                     >
                       {type}
                     </button>
                   ))}
                </div>
             </div>
             <button 
                onClick={() => setIsCatModalOpen(true)}
                className="rounded-md bg-black px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffde59] shadow-md hover:opacity-90 transition-all"
             >
                Add Category
             </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm font-bold text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Slug</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Date Created</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-100" /></td>
                    </tr>
                  ))
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4d2c1e] text-[10px] font-bold text-[#ffde59]">
                            {cat.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">{cat.slug}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          cat.type === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {cat.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-bold text-gray-400">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => {
                              setEditingCategory({ ...cat });
                              setIsEditModalOpen(true);
                              setError("");
                              setUpdateMsg("");
                            }}
                            className="text-[10px] font-black uppercase tracking-widest text-[#4d2c1e] hover:underline"
                          >
                            Edit
                          </button>
                          {cat.isActive ? (
                            <button 
                              onClick={() => handleDeactivate(cat.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:underline"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 italic">
                              Deactivated
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-400">
                      No categories found for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Create New Category</h2>
              <button 
                onClick={() => {
                   setIsCatModalOpen(false);
                   setCatMsg("");
                }}
                className="text-gray-400 hover:text-black"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  placeholder="e.g. Laminates"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.type}
                  onChange={(e) => setNewCatData({ ...newCatData, type: e.target.value as any })}
                >
                  <option value="material">Material</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent ID (Optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={newCatData.parent_id}
                  onChange={(e) => setNewCatData({ ...newCatData, parent_id: e.target.value })}
                  placeholder="e.g. csaaa1scasa"
                />
              </div>

              {catMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{catMsg}</div>}
              {error && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>}

              <button
                type="submit"
                disabled={isCreatingCat}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isCreatingCat ? "Creating Category..." : "Confirm & Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#4d2c1e]">Edit Category</h2>
              <button 
                onClick={() => {
                   setIsEditModalOpen(false);
                   setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-black"
                disabled={isUpdatingCat}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category Name</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. Laminates"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</label>
                <select
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={editingCategory.type}
                  onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value as any })}
                >
                  <option value="material">Material</option>
                  <option value="furniture">Furniture</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parent ID (Optional)</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black shadow-inner"
                  value={(editingCategory as any).parent_id || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, parent_id: e.target.value } as any)}
                  placeholder="e.g. csaaa1scasa"
                />
              </div>

              {updateMsg && <div className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-lg text-center">{updateMsg}</div>}
              {error && <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">{error}</div>}

              <button
                type="submit"
                disabled={isUpdatingCat}
                className="w-full rounded-full bg-[#ffcb05] py-3.5 text-sm font-black uppercase tracking-widest text-black shadow-md transition-transform active:scale-95 disabled:opacity-50 mt-4"
              >
                {isUpdatingCat ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
