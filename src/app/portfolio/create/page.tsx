"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortfolio, getCategories } from "@/lib/api";

type ManualImageRow = {
  id: string;
  s3Key: string;
  displayOrder: number;
};

function makeRowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CreatePortfolioPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [roomType, setRoomType] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [manualImages, setManualImages] = useState<ManualImageRow[]>([{ id: makeRowId(), s3Key: "", displayOrder: 1 }]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName") || "";
    const storedRole = localStorage.getItem("userRole") || "";
    if (!storedName) {
      router.push("/login");
      return;
    }
    setUserName(storedName);
    setUserRole(storedRole);
  }, [router]);

  useEffect(() => {
    if (userRole !== "blogadmin") return;
    let isMounted = true;
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
        if (isMounted) setCategoryOptions(deduped);
      } catch {
        if (isMounted) setCategoryOptions([]);
      } finally {
        if (isMounted) setIsLoadingCategories(false);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [userRole]);

  const isAllowed = userRole === "blogadmin";
  const hasFiles = imageFiles.length > 0;
  const validManualImages = useMemo(
    () => manualImages.map((item) => ({ ...item, s3Key: item.s3Key.trim() })).filter((item) => item.s3Key),
    [manualImages]
  );
  const canSubmit = useMemo(
    () =>
      Boolean(
        isAllowed &&
          title.trim() &&
          roomType.trim() &&
          category.trim() &&
          description.trim() &&
          (hasFiles || validManualImages.length > 0) &&
          !isSaving,
      ),
    [isAllowed, title, roomType, category, description, hasFiles, validManualImages.length, isSaving]
  );

  const addManualImageRow = () => {
    setManualImages((prev) => [...prev, { id: makeRowId(), s3Key: "", displayOrder: prev.length + 1 }]);
  };

  const removeManualImageRow = (id: string) => {
    setManualImages((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      setError("Only blogadmin can create portfolio entries.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await createPortfolio(
        {
          title: title.trim(),
          roomType: roomType.trim(),
          category: category.trim(),
          description: description.trim(),
          images: validManualImages.map((item) => ({
            s3Key: item.s3Key,
            displayOrder: Number.isFinite(item.displayOrder) ? Math.max(1, Math.trunc(item.displayOrder)) : 1,
          })),
        },
        hasFiles ? imageFiles : undefined
      );
      setSuccess(`Portfolio "${response.portfolio.title}" created successfully.`);
      setTimeout(() => {
        router.push("/blog");
      }, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create portfolio.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#0468a3]">Create Portfolio</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              Logged in as {userName || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/blog")}
            className="hidden rounded-md border border-gray-300 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-700 hover:bg-gray-50"
          >
            Back to Blog
          </button>
        </div>

        {!isAllowed ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            Only `blogadmin` is allowed to create portfolio entries.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kitchen Transformation"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Room Type</label>
              <input
                type="text"
                required
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                placeholder="Kitchen"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              >
                <option value="">
                  {isLoadingCategories ? "Loading categories..." : "Select category"}
                </option>
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
              {!isLoadingCategories && categoryOptions.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  No categories found. Please create categories first.
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="makeover"
                className="mt-1 block min-h-[120px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Upload Images (from system)</label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
              {hasFiles && (
                <div className="mt-2 rounded-md border border-[#e7eef6] bg-[#f8fbff] p-3 text-xs text-[#4e6b89]">
                  {imageFiles.length} image(s) selected: {imageFiles.map((item) => item.name).join(", ")}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
              <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Manual S3 Keys (optional fallback)</label>
                <button
                  type="button"
                  onClick={addManualImageRow}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 sm:w-auto"
                >
                  Add Row
                </button>
              </div>
              <div className="space-y-3">
                {manualImages.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
                    <input
                      type="text"
                      value={item.s3Key}
                      onChange={(e) =>
                        setManualImages((prev) =>
                          prev.map((row) => (row.id === item.id ? { ...row, s3Key: e.target.value } : row))
                        )
                      }
                      placeholder="customfurnish-portal/portfolio/uuid-001/photo1.webp"
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3]"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.displayOrder}
                      onChange={(e) =>
                        setManualImages((prev) =>
                          prev.map((row) => (row.id === item.id ? { ...row, displayOrder: Number(e.target.value) || idx + 1 } : row))
                        )
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3]"
                    />
                    <button
                      type="button"
                      onClick={() => removeManualImageRow(item.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-700 disabled:opacity-40"
                      disabled={manualImages.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] font-semibold text-gray-500">Use either system uploads, manual S3 keys, or both.</p>
            </div>

            {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
            {success && <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-600">{success}</div>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-full bg-[#0468a3] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creating Portfolio..." : "Confirm & Create"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
