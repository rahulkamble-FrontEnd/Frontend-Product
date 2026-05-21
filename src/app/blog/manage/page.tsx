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
  ensureAuthenticated,
  getMe,
  publishBlog,
  updateBlog,
  uploadBlogBodyImage,
  type BlogItem,
  type BlogStatus,
} from "@/lib/api";
import { blogPublicPath } from "@/lib/blog-path";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

const SEO_META_TITLE_MAX = 60;
const SEO_META_DESCRIPTION_MAX = 160;
const BLOG_IMAGE_BASE_URL = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

function makeBlogImageUrl(blog: Pick<BlogItem, "featuredImageUrl" | "featuredImageS3Key">) {
  const directUrl = blog.featuredImageUrl?.trim() || "";
  if (directUrl) return directUrl;
  const key = blog.featuredImageS3Key?.trim() || "";
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${BLOG_IMAGE_BASE_URL}/${key.replace(/^\/+/, "")}`;
}

type BlogEditForm = {
  title: string;
  slug: string;
  body: string;
  publishedAt: string;
  categoryId: string;
  featuredImageS3Key: string;
  featuredImageAlt: string;
  featuredImageTitle: string;
  socialImageS3Key: string;
  metaTitle: string;
  metaDescription: string;
  seoKeyword: string;
  secondaryKeywords: string;
  canonicalUrl: string;
  metaRobots: "index" | "noindex";
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

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function isValidCanonicalUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

type BlogListStatus = "draft" | "published" | "scheduled" | "archived";
type StatusFilter = "all" | BlogListStatus;

function blogListStatus(blog: BlogItem): BlogListStatus {
  if (
    blog.status === "published" &&
    Boolean(blog.publishedAt) &&
    new Date(blog.publishedAt as string).getTime() > Date.now()
  ) {
    return "scheduled";
  }
  if (blog.status === "published") return "published";
  if (blog.status === "archived") return "archived";
  return "draft";
}

const STATUS_FILTER_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "scheduled", label: "Scheduled" },
  { id: "archived", label: "Archived" },
];

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreviewUrl, setFeaturedImagePreviewUrl] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [form, setForm] = useState<BlogEditForm>({
    title: "",
    slug: "",
    body: "",
    publishedAt: "",
    categoryId: "",
    featuredImageS3Key: "",
    featuredImageAlt: "",
    featuredImageTitle: "",
    socialImageS3Key: "",
    metaTitle: "",
    metaDescription: "",
    seoKeyword: "",
    secondaryKeywords: "",
    canonicalUrl: "",
    metaRobots: "index",
    status: "draft",
  });

  useEffect(() => {
    let active = true;
    const verifySession = async () => {
      const name = localStorage.getItem("userName") || "";
      if (!name) {
        router.push("/login");
        return;
      }
      try {
        await ensureAuthenticated();
        const user = await getMe();
        if (!active) return;
        if (user.role !== "blogadmin") {
          router.push("/dashboard");
          return;
        }
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userName", user.name);
        setUserRole(user.role);
      } catch {
        if (!active) return;
        router.push("/login");
      }
    };
    void verifySession();
    return () => {
      active = false;
    };
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
    if (form.metaTitle.length > SEO_META_TITLE_MAX) return false;
    if (form.metaDescription.length > SEO_META_DESCRIPTION_MAX) return false;
    if (!isValidCanonicalUrl(form.canonicalUrl)) return false;
    return true;
  }, [editingBlogId, isSaving, form.title, form.slug, form.body, slugAvailability, form.metaTitle, form.metaDescription, form.canonicalUrl]);

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

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: blogs.length,
      draft: 0,
      published: 0,
      scheduled: 0,
      archived: 0,
    };
    for (const blog of blogs) {
      counts[blogListStatus(blog)] += 1;
    }
    return counts;
  }, [blogs]);

  const visibleStatusFilters = useMemo(
    () =>
      STATUS_FILTER_OPTIONS.filter(
        (option) =>
          option.id === "all" ||
          option.id === "draft" ||
          option.id === "published" ||
          statusCounts[option.id] > 0
      ),
    [statusCounts]
  );

  const filteredBlogs = useMemo(() => {
    if (statusFilter === "all") return orderedBlogs;
    return orderedBlogs.filter((blog) => blogListStatus(blog) === statusFilter);
  }, [orderedBlogs, statusFilter]);

  useEffect(() => {
    if (statusFilter === "all") return;
    if (statusCounts[statusFilter] === 0) setStatusFilter("all");
  }, [statusCounts, statusFilter]);

  useEffect(() => {
    if (!featuredImageFile) {
      setFeaturedImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(featuredImageFile);
    setFeaturedImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [featuredImageFile]);

  const editingBlog = useMemo(
    () => blogs.find((item) => item.id === editingBlogId) ?? null,
    [blogs, editingBlogId],
  );

  const currentFeaturedImageUrl = editingBlog ? makeBlogImageUrl(editingBlog) : null;
  const displayFeaturedImageUrl = featuredImagePreviewUrl || currentFeaturedImageUrl;

  const openEdit = (blog: BlogItem) => {
    setEditingBlogId(blog.id);
    setSlugEdited(true);
    setForm({
      title: blog.title || "",
      slug: blog.slug || "",
      body: blog.body || "<p></p>",
      publishedAt: toDateTimeLocalValue(blog.publishedAt),
      categoryId: blog.categoryId || "",
      featuredImageS3Key: blog.featuredImageS3Key || "",
      featuredImageAlt: blog.featuredImageAlt || "",
      featuredImageTitle: blog.featuredImageTitle || "",
      socialImageS3Key: blog.socialImageS3Key || "",
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || "",
      seoKeyword: blog.seoKeyword || "",
      secondaryKeywords: blog.secondaryKeywords || "",
      canonicalUrl: blog.canonicalUrl || "",
      metaRobots: blog.metaRobots === "noindex" ? "noindex" : "index",
      status: blog.status === "published" ? "published" : "draft",
    });
    setSocialImageFile(null);
    setFeaturedImageFile(null);
    setError("");
    setSuccess("");
  };

  const closeEdit = () => {
    if (isSaving) return;
    setEditingBlogId(null);
    setFeaturedImageFile(null);
  };

  const applyBlogUpdate = (updated: BlogItem) => {
    setBlogs((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const persistBlogEdit = async (options: { publish?: boolean; closeOnSuccess?: boolean }) => {
    if (!editingBlogId || !canSaveEdit) return null;

    if (form.metaTitle.length > SEO_META_TITLE_MAX) {
      throw new Error(`Meta title must be ${SEO_META_TITLE_MAX} characters or fewer.`);
    }
    if (form.metaDescription.length > SEO_META_DESCRIPTION_MAX) {
      throw new Error(`Meta description must be ${SEO_META_DESCRIPTION_MAX} characters or fewer.`);
    }
    if (!isValidCanonicalUrl(form.canonicalUrl)) {
      throw new Error("Canonical URL must be a valid http/https URL.");
    }

    const nextStatus: BlogStatus = options.publish ? "published" : form.status;
    const publishedAtIso =
      nextStatus === "published" && form.publishedAt ? new Date(form.publishedAt).toISOString() : null;

    const uploadedSocialImageKey =
      socialImageFile instanceof File ? (await uploadBlogBodyImage(socialImageFile)).key : null;

    const updated = await updateBlog(
      editingBlogId,
      {
        title: form.title,
        slug: form.slug,
        body: form.body,
        publishedAt: publishedAtIso,
        categoryId: form.categoryId || null,
        featuredImageS3Key: featuredImageFile ? null : form.featuredImageS3Key || null,
        featuredImageAlt: form.featuredImageAlt || null,
        featuredImageTitle: form.featuredImageTitle || null,
        socialImageS3Key: uploadedSocialImageKey || form.socialImageS3Key || null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        seoKeyword: form.seoKeyword || null,
        secondaryKeywords: form.secondaryKeywords || null,
        canonicalUrl: form.canonicalUrl || null,
        metaRobots: form.metaRobots,
        status: nextStatus,
      },
      featuredImageFile ?? undefined,
    );

    applyBlogUpdate(updated);
    setFeaturedImageFile(null);
    setSocialImageFile(null);
    if (options.closeOnSuccess !== false) {
      setEditingBlogId(null);
    }
    return updated;
  };

  const handleSave = async () => {
    if (!editingBlogId || isSaving || !canSaveEdit) return;
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await persistBlogEdit({ closeOnSuccess: true });
      setSuccess("Blog updated successfully.");
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
      if (editingBlogId === blogId) {
        if (!canSaveEdit) {
          throw new Error("Fix validation errors before publishing.");
        }
        setIsSaving(true);
        await persistBlogEdit({ publish: true, closeOnSuccess: true });
        setSuccess("Blog published successfully.");
        return;
      }

      const updated = await publishBlog(blogId);
      applyBlogUpdate(updated);
      setSuccess("Blog published successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish blog.");
    } finally {
      setPublishingBlogId(null);
      setIsSaving(false);
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
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Blogadmin</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#3b322d]">Manage Blogs</h1>
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
              onClick={() => router.push("/blog/create")}
              className="w-full rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#a58d74] sm:w-auto"
            >
              Create Blog
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>}
        {success && <div className="mb-6 rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">{success}</div>}

        {!isLoading && blogs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {visibleStatusFilters.map((option) => {
              const isActive = statusFilter === option.id;
              const count = statusCounts[option.id];
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStatusFilter(option.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${
                    isActive
                      ? "border-[#bba892] bg-[#bca58c] text-white"
                      : "border-[#d9d2ca] bg-white text-[#6c625c] hover:bg-[#f7f4ef]"
                  }`}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading blogs...
          </div>
        ) : blogs.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No blogs found.
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            No {statusFilter === "all" ? "" : `${statusFilter} `}blogs match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <table className="w-full min-w-[1020px] text-left">
              <thead className="border-b border-[#eee8df] bg-[#faf8f5]">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Title</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Slug</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Status</th>
                  <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Updated</th>
                  <th className="min-w-[300px] px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="border-b border-[#f2ede7] last:border-b-0">
                    <td className="px-4 py-3 text-sm font-semibold text-[#362f2a]">{blog.title}</td>
                    <td className="px-4 py-3 text-xs text-[#7a7069]">{blog.slug}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f3eee7] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7c716a]">
                        {blogListStatus(blog)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7a7069]">{new Date(blog.updatedAt).toLocaleString()}</td>
                    <td className="min-w-[300px] px-4 py-3">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(blogPublicPath(blog), "_blank", "noopener,noreferrer")}
                          className="shrink-0 whitespace-nowrap rounded-md border border-[#d9d2ca] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c625c] hover:bg-[#f7f4ef]"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(blog)}
                          className="shrink-0 whitespace-nowrap rounded-md border border-[#d9d2ca] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c625c] hover:bg-[#f7f4ef]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={publishingBlogId === blog.id || deletingBlogId === blog.id || blog.status === "published"}
                          onClick={() => handlePublish(blog.id)}
                          className="shrink-0 whitespace-nowrap rounded-md border border-[#bba892] bg-[#bca58c] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white disabled:opacity-50"
                        >
                          {publishingBlogId === blog.id ? "Publishing..." : "Publish"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingBlogId === blog.id || publishingBlogId === blog.id}
                          onClick={() => handleDelete(blog.id)}
                          className="shrink-0 whitespace-nowrap rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-red-700 disabled:opacity-50"
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
                        status: e.target.value === "published" ? "published" : "draft",
                      }))
                    }
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
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
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">
                    Schedule publish date & time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.publishedAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">
                    Replace featured image
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setFeaturedImageFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                  {featuredImageFile && (
                    <p className="mt-1 text-xs font-semibold text-[#9b9088]">
                      Selected file: {featuredImageFile.name}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[#9b9088]">
                    Upload a new featured image for draft or published posts. Use Publish to save the image and go live.
                  </p>
                </div>
              </div>

              {displayFeaturedImageUrl && (
                <div className="rounded-lg border border-[#e6dfd7] bg-[#fbfaf8] p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Featured image preview</p>
                  <img
                    src={displayFeaturedImageUrl}
                    alt={form.featuredImageAlt || form.title || "Featured image preview"}
                    className="mt-2 max-h-48 w-auto rounded-md border border-[#e3ddd5] object-contain"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">
                  Social image file (optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSocialImageFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                />
                {socialImageFile && (
                  <p className="mt-1 text-xs font-semibold text-[#9b9088]">
                    Selected social image file: {socialImageFile.name}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#9b9088]">
                  If selected, uploaded image is used for social preview (Open Graph/Twitter).
                </p>
              </div>

              <section className="space-y-4 rounded-lg border border-[#e6dfd7] bg-[#fbfaf8] p-4">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7f7167]">SEO</h3>
                  <p className="mt-1 text-xs text-[#9b9088]">Set search metadata for this blog post.</p>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Meta title</label>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    maxLength={SEO_META_TITLE_MAX}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-[#9b9088]">
                    {form.metaTitle.length} / {SEO_META_TITLE_MAX} characters
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Meta description</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                    rows={2}
                    maxLength={SEO_META_DESCRIPTION_MAX}
                    className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-[#9b9088]">
                    {form.metaDescription.length} / {SEO_META_DESCRIPTION_MAX} characters
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Focus keyword</label>
                    <input
                      type="text"
                      value={form.seoKeyword}
                      onChange={(e) => setForm((prev) => ({ ...prev, seoKeyword: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">
                      Secondary keywords
                    </label>
                    <input
                      type="text"
                      value={form.secondaryKeywords}
                      onChange={(e) => setForm((prev) => ({ ...prev, secondaryKeywords: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Canonical URL</label>
                    <input
                      type="url"
                      value={form.canonicalUrl}
                      onChange={(e) => setForm((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                    />
                    {!!form.canonicalUrl.trim() && !isValidCanonicalUrl(form.canonicalUrl) && (
                      <p className="mt-1 text-xs font-semibold text-red-600">Enter a valid http/https canonical URL.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9b9088]">Meta robots</label>
                    <select
                      value={form.metaRobots}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, metaRobots: e.target.value === "noindex" ? "noindex" : "index" }))
                      }
                      className="mt-1 block w-full rounded-md border border-[#e3ddd5] bg-white px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="index">index</option>
                      <option value="noindex">noindex</option>
                    </select>
                  </div>
                </div>
              </section>

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
                <div className="mt-2">
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
              {form.status !== "published" && (
                <button
                  type="button"
                  disabled={
                    !canSaveEdit ||
                    isSaving ||
                    deletingBlogId === editingBlogId ||
                    publishingBlogId === editingBlogId
                  }
                  onClick={() => void handlePublish(editingBlogId)}
                  className="rounded-md border border-[#bba892] bg-[#bca58c] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:opacity-50"
                >
                  {publishingBlogId === editingBlogId ? "Publishing..." : "Save & publish"}
                </button>
              )}
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
                onClick={() => void handleSave()}
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
