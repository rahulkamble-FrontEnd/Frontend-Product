"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBlog, getCategories, type BlogStatus } from "@/lib/api";

type CategoryOption = {
  id: string;
  name: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("<p>Rich text HTML content here</p>");
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [featuredImageS3Key, setFeaturedImageS3Key] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

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
    if (slugEdited) return;
    setSlug(slugify(title));
  }, [title, slugEdited]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const data = (await getCategories()) as Array<{ id?: string; name?: string }>;
        if (!active) return;
        const normalized = Array.isArray(data)
          ? data
              .map((item) => ({ id: item.id ?? "", name: item.name ?? "" }))
              .filter((item) => item.id && item.name)
          : [];
        setCategories(normalized);
      } catch {
        if (active) setCategories([]);
      } finally {
        if (active) setIsLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const isAllowed = userRole === "blogadmin";
  const canSubmit = useMemo(
    () => Boolean(isAllowed && title.trim() && slug.trim() && body.trim() && !isSaving),
    [isAllowed, title, slug, body, isSaving]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) {
      setError("Only blogadmin can create blog posts.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const created = await createBlog(
        {
          title: title.trim(),
          slug: slug.trim(),
          body: body.trim(),
          status,
          categoryId: categoryId || null,
          featuredImageS3Key: featuredImageS3Key.trim() || null,
        },
        imageFile || undefined
      );
      setSuccess(`Blog "${created.title}" created successfully.`);
      setTimeout(() => {
        router.push("/blog");
      }, 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create blog.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-[#0468a3]">Create Blog</h1>
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
            Only `blogadmin` is allowed to create blog posts.
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
                placeholder="Laminate vs Acrylic — Which is Better?"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Slug</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                placeholder="laminate-vs-acrylic"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogStatus)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category (optional)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                >
                  <option value="">
                    {isLoadingCategories ? "Loading categories..." : "Select category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Blog Body (HTML)</label>
              <textarea
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1 block min-h-[180px] w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                placeholder="<p>Rich text HTML content here</p>"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured Image File (optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
                {imageFile && <p className="mt-2 text-xs font-semibold text-gray-500">Selected file: {imageFile.name}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured Image S3 Key (optional fallback)</label>
                <input
                  type="text"
                  value={featuredImageS3Key}
                  onChange={(e) => setFeaturedImageS3Key(e.target.value)}
                  placeholder="blogs/1mob.jpg"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  If file is selected, it will be uploaded as `featuredImage`.
                </p>
              </div>
            </div>

            {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
            {success && <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-600">{success}</div>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-full bg-[#0468a3] py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-md transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Creating Blog..." : "Confirm & Create"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
