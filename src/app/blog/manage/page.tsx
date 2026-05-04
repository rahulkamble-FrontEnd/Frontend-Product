"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogRichTextEditor } from "@/components/blog/BlogRichTextEditor";
import { BlogSeoPanel } from "@/components/blog/BlogSeoPanel";
import {
  checkBlogSlugAvailable,
  deleteBlog,
  getBlogs,
  getCategories,
  publishBlog,
  updateBlog,
  uploadBlogBodyImage,
  type BlogItem,
  type BlogStatus,
} from "@/lib/api";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type BlogEditForm = {
  title: string;
  slug: string;
  body: string;
  categoryId: string;
  featuredImageS3Key: string;
  featuredImageAlt: string;
  featuredImageTitle: string;
  metaDescription: string;
  seoKeyword: string;
  status: BlogStatus;
};

function htmlHasText(html: string) {
  const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > 0;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function ManageBlogsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publishingBlogId, setPublishingBlogId] = useState<string | null>(null);
  const [deletingBlogId, setDeletingBlogId] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<BlogEditForm>({
    title: "",
    slug: "",
    body: "",
    categoryId: "",
    featuredImageS3Key: "",
    featuredImageAlt: "",
    featuredImageTitle: "",
    metaDescription: "",
    seoKeyword: "",
    status: "draft",
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
    const loadBlogs = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getBlogs({ includeCredentials: true, publishedOnly: false });
        if (!active) return;
        setBlogs(data);
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load blogs.");
        setBlogs([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadBlogs();
    return () => {
      active = false;
    };
  }, [userRole]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const data = (await getCategories()) as Array<{ id?: string; name?: string; slug?: string }>;
        if (!active) return;
        const normalized = Array.isArray(data)
          ? data
              .map((item) => ({
                id: item.id ?? "",
                name: item.name ?? "",
                slug: item.slug ?? "",
              }))
              .filter((item) => item.id && item.name)
          : [];
        setCategories(normalized);
      } catch {
        if (active) setCategories([]);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (slugEdited) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
  }, [form.title, slugEdited]);

  useEffect(() => {
    if (!editingBlogId) {
      setSlugAvailability("idle");
      return;
    }
    if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);
    const s = form.slug.trim();
    if (!s) {
      setSlugAvailability("idle");
      return;
    }
    setSlugAvailability("checking");
    slugCheckTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const { available } = await checkBlogSlugAvailable(s, { excludeId: editingBlogId });
          setSlugAvailability(available ? "available" : "taken");
        } catch {
          setSlugAvailability("idle");
        }
      })();
    }, 400);
    return () => {
      if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);
    };
  }, [form.slug, editingBlogId]);

  const canSaveEdit = useMemo(() => {
    if (!editingBlogId || isSaving) return false;
    if (!form.title.trim() || !form.slug.trim() || !htmlHasText(form.body)) return false;
    if (slugAvailability === "taken" || slugAvailability === "checking") return false;
    return true;
  }, [editingBlogId, isSaving, form.title, form.slug, form.body, slugAvailability]);

  const selectedCategoryEdit = useMemo(
    () => categories.find((c) => c.id === form.categoryId) ?? null,
    [categories, form.categoryId]
  );

  const seoPreviewEdit = useMemo((): Pick<BlogItem, "slug" | "category"> | null => {
    if (!form.slug.trim()) return null;
    if (selectedCategoryEdit?.slug) {
      return {
        slug: form.slug.trim(),
        category: {
          id: selectedCategoryEdit.id,
          name: selectedCategoryEdit.name,
          slug: selectedCategoryEdit.slug,
        },
      };
    }
    return { slug: form.slug.trim(), category: null };
  }, [form.slug, selectedCategoryEdit]);

  const orderedBlogs = useMemo(
    () =>
      [...blogs].sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      }),
    [blogs]
  );

  const openEdit = (blog: BlogItem) => {
    setEditingBlogId(blog.id);
    setSlugEdited(true);
    setForm({
      title: blog.title || "",
      slug: blog.slug || "",
      body: blog.body || "<p></p>",
      categoryId: blog.categoryId || "",
      featuredImageS3Key: blog.featuredImageS3Key || "",
      featuredImageAlt: blog.featuredImageAlt || "",
      featuredImageTitle: blog.featuredImageTitle || "",
      metaDescription: blog.metaDescription || "",
      seoKeyword: blog.seoKeyword || "",
      status: blog.status === "published" || blog.status === "archived" ? blog.status : "draft",
    });
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditingBlogId(null);
  };

  const applyBlogUpdate = (updated: BlogItem) => {
    setBlogs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSave = async () => {
    if (!editingBlogId || isSaving || !canSaveEdit) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const updated = await updateBlog(editingBlogId, {
        title: form.title,
        slug: form.slug,
        body: form.body,
        categoryId: form.categoryId || null,
        featuredImageS3Key: form.featuredImageS3Key || null,
        featuredImageAlt: form.featuredImageAlt || null,
        featuredImageTitle: form.featuredImageTitle || null,
        metaDescription: form.metaDescription || null,
        seoKeyword: form.seoKeyword || null,
        status: form.status,
      });
      applyBlogUpdate(updated);
      setSuccess("Blog updated successfully.");
      setEditingBlogId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update blog.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (blogId: string) => {
    if (!blogId || publishingBlogId) return;
    setPublishingBlogId(blogId);
    setError("");
    setSuccess("");
    try {
      const updated = await publishBlog(blogId);
      applyBlogUpdate(updated);
      setSuccess("Blog published successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish blog.");
    } finally {
      setPublishingBlogId(null);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!blogId || deletingBlogId) return;
    const confirmed = window.confirm("Delete this blog? This action cannot be undone.");
    if (!confirmed) return;

    setDeletingBlogId(blogId);
    setError("");
    setSuccess("");
    try {
      const res = await deleteBlog(blogId);
      setBlogs((prev) => prev.filter((item) => item.id !== blogId));
      setSuccess(res.message || "Blog deleted successfully.");
      if (editingBlogId === blogId) {
        setEditingBlogId(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete blog.");
    } finally {
      setDeletingBlogId(null);
    }
  };

  if (userRole !== "blogadmin") return null;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Blogadmin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Manage Blogs</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/blog/create")}
              className="rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a58d74]"
            >
              Create Blog
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && <div className="mb-6 rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</div>}

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading blogs...
          </div>
        ) : orderedBlogs.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No blogs found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <table className="w-full min-w-[860px] text-left">
              <thead className="border-b border-[#eee8df] bg-[#faf8f5]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Title</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Slug</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Updated</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedBlogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-[#f2ede7] last:border-b-0">
                    <td className="px-4 py-3 text-sm font-semibold text-[#362f2a]">{blog.title}</td>
                    <td className="px-4 py-3 text-xs text-[#7a7069]">{blog.slug}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c716a]">
                        {blog.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7a7069]">{new Date(blog.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(blog)}
                          className="rounded-md border border-[#d9d2ca] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] hover:bg-[#f7f4ef]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={publishingBlogId === blog.id || deletingBlogId === blog.id || blog.status === "published"}
                          onClick={() => handlePublish(blog.id)}
                          className="rounded-md border border-[#bba892] bg-[#bca58c] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                        >
                          {publishingBlogId === blog.id ? "Publishing..." : "Publish"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingBlogId === blog.id || publishingBlogId === blog.id}
                          onClick={() => handleDelete(blog.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
                        >
                          {deletingBlogId === blog.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {editingBlogId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-xl border border-[#e6dfd7] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-[#3b322d]">Edit Blog</h2>
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
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">URL slug</label>
                  <button
                    type="button"
                    onClick={() => setSlugEdited(false)}
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b7355] hover:underline"
                  >
                    Regenerate from title
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#9b9088]">
                  Public URL segment; use lowercase, numbers, and hyphens. Must be unique across all posts.
                </p>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  onBlur={() => {
                    const next = slugify(form.slug);
                    if (next !== form.slug) {
                      setForm((prev) => ({ ...prev, slug: next }));
                    }
                  }}
                  className="mt-2 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {slugAvailability === "checking" && (
                  <p className="mt-1.5 text-xs font-semibold text-[#9b9088]">Checking if this URL is available…</p>
                )}
                {slugAvailability === "taken" && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    This URL is already used by another post. Choose a different slug.
                  </p>
                )}
                {slugAvailability === "available" && form.slug.trim() && (
                  <p className="mt-1.5 text-xs font-semibold text-green-700">This URL is available.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value === "published" ? "published" : e.target.value === "archived" ? "archived" : "draft",
                      }))
                    }
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Image S3 Key</label>
                  <input
                    type="text"
                    value={form.featuredImageS3Key}
                    onChange={(e) => setForm((prev) => ({ ...prev, featuredImageS3Key: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Meta description</label>
                <textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                  rows={2}
                  maxLength={320}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Focus keyword</label>
                <input
                  type="text"
                  value={form.seoKeyword}
                  onChange={(e) => setForm((prev) => ({ ...prev, seoKeyword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <BlogSeoPanel
                title={form.title}
                metaDescription={form.metaDescription}
                bodyHtml={form.body}
                focusKeyword={form.seoKeyword}
                previewBlog={seoPreviewEdit}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Featured image alt</label>
                  <input
                    type="text"
                    value={form.featuredImageAlt}
                    onChange={(e) => setForm((prev) => ({ ...prev, featuredImageAlt: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Featured image title</label>
                  <input
                    type="text"
                    value={form.featuredImageTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, featuredImageTitle: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Article content</label>
                <div className="mt-2 max-h-[min(70vh,520px)] overflow-y-auto">
                  <BlogRichTextEditor
                    key={editingBlogId}
                    value={form.body}
                    onChange={(html) => setForm((prev) => ({ ...prev, body: html }))}
                    onUploadImage={(file) => uploadBlogBodyImage(file)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSaving || deletingBlogId === editingBlogId || publishingBlogId === editingBlogId}
                onClick={() => handlePublish(editingBlogId)}
                className="rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
              >
                {publishingBlogId === editingBlogId ? "Publishing..." : "Publish"}
              </button>
              <button
                type="button"
                disabled={deletingBlogId === editingBlogId || isSaving || publishingBlogId === editingBlogId}
                onClick={() => handleDelete(editingBlogId)}
                className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
              >
                {deletingBlogId === editingBlogId ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                disabled={isSaving || !canSaveEdit}
                onClick={handleSave}
                className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
