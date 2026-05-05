"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogRichTextEditor } from "@/components/blog/BlogRichTextEditor";
import { BlogSeoPanel } from "@/components/blog/BlogSeoPanel";
import {
  checkBlogSlugAvailable,
  createBlog,
  getCategories,
  uploadBlogBodyImage,
  type BlogItem,
  type BlogStatus,
} from "@/lib/api";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function htmlHasText(html: string) {
  const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > 0;
}

export default function CreateBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [status, setStatus] = useState<BlogStatus>("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [featuredImageS3Key, setFeaturedImageS3Key] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [featuredImageTitle, setFeaturedImageTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [seoKeyword, setSeoKeyword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [socialImageFile, setSocialImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);
    const s = slug.trim();
    if (!s) {
      setSlugAvailability("idle");
      return;
    }
    setSlugAvailability("checking");
    slugCheckTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const { available } = await checkBlogSlugAvailable(s);
          setSlugAvailability(available ? "available" : "taken");
        } catch {
          setSlugAvailability("idle");
        }
      })();
    }, 400);
    return () => {
      if (slugCheckTimerRef.current) clearTimeout(slugCheckTimerRef.current);
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
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
      } finally {
        if (active) setIsLoadingCategories(false);
      }
    };

    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const seoPreviewBlog = useMemo((): Pick<BlogItem, "slug" | "category"> | null => {
    if (!slug.trim()) return null;
    if (selectedCategory?.slug) {
      return {
        slug: slug.trim(),
        category: {
          id: selectedCategory.id,
          name: selectedCategory.name,
          slug: selectedCategory.slug,
        },
      };
    }
    return { slug: slug.trim(), category: null };
  }, [slug, selectedCategory]);

  const isAllowed = userRole === "blogadmin";
  const canSubmit = useMemo(
    () =>
      Boolean(
        isAllowed &&
          title.trim() &&
          slug.trim() &&
          htmlHasText(body) &&
          !isSaving &&
          slugAvailability !== "taken" &&
          slugAvailability !== "checking"
      ),
    [isAllowed, title, slug, body, isSaving, slugAvailability]
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
      const uploadedSocialImageKey =
        socialImageFile instanceof File
          ? (await uploadBlogBodyImage(socialImageFile)).key
          : null;
      const created = await createBlog(
        {
          title: title.trim(),
          slug: slug.trim(),
          body: body.trim(),
          status,
          publishedAt: status === "published" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          categoryId: categoryId || null,
          featuredImageS3Key: featuredImageS3Key.trim() || null,
          featuredImageAlt: featuredImageAlt.trim() || null,
          featuredImageTitle: featuredImageTitle.trim() || null,
          socialImageS3Key: uploadedSocialImageKey,
          metaDescription: metaDescription.trim() || null,
          seoKeyword: seoKeyword.trim() || null,
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
              <div className="flex flex-wrap items-end justify-between gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">URL slug</label>
                <button
                  type="button"
                  onClick={() => setSlugEdited(false)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#0468a3] hover:underline"
                >
                  Regenerate from title
                </button>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Public path is <span className="font-mono text-gray-700">/blog/(category)/(slug)</span> when a category is
                selected. Slug uses lowercase letters, numbers, and hyphens only.
              </p>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugEdited(true);
                }}
                onBlur={() => {
                  const next = slugify(slug);
                  if (next !== slug) setSlug(next);
                }}
                placeholder="laminate-vs-acrylic"
                className="mt-2 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                autoComplete="off"
                spellCheck={false}
              />
              {slugAvailability === "checking" && (
                <p className="mt-1.5 text-xs font-semibold text-gray-500">Checking if this URL is available…</p>
              )}
              {slugAvailability === "taken" && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">
                  This URL is already used by another post. Change the slug so each article has a unique address.
                </p>
              )}
              {slugAvailability === "available" && slug.trim() && (
                <p className="mt-1.5 text-xs font-semibold text-green-700">This URL is available.</p>
              )}
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
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Schedule publish date & time
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Works when status is published. If future time is selected, post stays hidden until that time.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category (for URL)</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                >
                  <option value="">
                    {isLoadingCategories ? "Loading categories..." : "Select category (recommended)"}
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
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Meta description</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                maxLength={320}
                placeholder="Short summary for search results (≈120–160 characters works well)."
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
              <p className="mt-1 text-xs text-gray-500">{metaDescription.length} / 320 characters</p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Focus keyword (optional)</label>
              <input
                type="text"
                value={seoKeyword}
                onChange={(e) => setSeoKeyword(e.target.value)}
                placeholder="e.g. laminate kitchen cabinets"
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
              <p className="mt-1 text-xs text-gray-500">Used only for the SEO checklist below (not shown on the live site).</p>
            </div>

            <BlogSeoPanel
              title={title}
              metaDescription={metaDescription}
              bodyHtml={body}
              focusKeyword={seoKeyword}
              previewBlog={seoPreviewBlog}
            />

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Article content</label>
              <p className="mt-1 text-xs text-gray-500">
                Headings, bold, lists, links, and images (with alt text). Images are compressed in the browser before upload.
              </p>
              <div className="mt-2">
                <BlogRichTextEditor
                  value={body}
                  onChange={setBody}
                  onUploadImage={(file) => uploadBlogBodyImage(file)}
                  placeholder="Write your article…"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured image file (optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
                {imageFile && <p className="mt-2 text-xs font-semibold text-gray-500">Selected file: {imageFile.name}</p>}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured image S3 key (optional)</label>
                <input
                  type="text"
                  value={featuredImageS3Key}
                  onChange={(e) => setFeaturedImageS3Key(e.target.value)}
                  placeholder="blogs/1mob.jpg"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured image alt text</label>
                <input
                  type="text"
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Describe the image for accessibility and SEO"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Featured image title</label>
                <input
                  type="text"
                  value={featuredImageTitle}
                  onChange={(e) => setFeaturedImageTitle(e.target.value)}
                  placeholder="Optional tooltip / image title attribute"
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Custom social image file (optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setSocialImageFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3] shadow-inner"
              />
              {socialImageFile && (
                <p className="mt-2 text-xs font-semibold text-gray-500">
                  Social image file selected: {socialImageFile.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                If selected, this uploaded file is used for Open Graph/Twitter preview image.
              </p>
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
