"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  convertDataPrepPack,
  getCategoryMenu,
  type CategoryMenuItem,
  type DataPrepSaveHandle,
} from "@/lib/api";

type SubCategoryOption = {
  id: string;
  name: string;
  parentName: string;
  label: string;
};

const FINISH_OPTIONS = ["", "MATTE", "GLOSSY", "TEXTURE", "OTHER"];
const STATUS_OPTIONS = ["ACTIVE", "DRAFT", "ARCHIVED"];
const MATERIAL_OPTIONS = ["", "LAMINATE", "ACRYLIC", "PLYWOOD", "MDF", "OTHER"];

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<DataPrepSaveHandle>;
};

function safePackFileName(value: string) {
  const base = (value || "vendor-pack")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "vendor-pack"}-pack.zip`;
}

function flattenSubCategories(menu: CategoryMenuItem[]): SubCategoryOption[] {
  const options: SubCategoryOption[] = [];
  for (const parent of menu) {
    for (const child of parent.children || []) {
      options.push({
        id: child.id,
        name: child.name,
        parentName: parent.name,
        label: `${parent.name} / ${child.name}`,
      });
    }
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export default function DataPrepPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategoryOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryLoadError, setCategoryLoadError] = useState("");

  const [xlsxFile, setXlsxFile] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [finishType, setFinishType] = useState("MATTE");
  const [status, setStatus] = useState("ACTIVE");
  const [materialType, setMaterialType] = useState("LAMINATE");
  const [description, setDescription] = useState("");
  const [bookName, setBookName] = useState("");
  const [packName, setPackName] = useState("vendor-pack");

  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [summary, setSummary] = useState<{
    matched: number;
    skippedNoImage: number;
    orphanImages: number;
    vendorRows: number;
    categoryName: string;
  } | null>(null);

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

  useEffect(() => {
    if (userRole !== "admin") return;
    let cancelled = false;
    const load = async () => {
      setIsLoadingCategories(true);
      setCategoryLoadError("");
      try {
        const menu = await getCategoryMenu({
          includeChildren: true,
          productLimit: 1,
        });
        if (cancelled) return;
        const options = flattenSubCategories(menu);
        setSubCategories(options);
        setCategoryId((prev) => {
          if (prev && options.some((o) => o.id === prev)) return prev;
          const laminates = options.find(
            (o) =>
              o.name.toLowerCase() === "laminates" &&
              o.parentName.toLowerCase().includes("finish"),
          );
          return laminates?.id || options[0]?.id || "";
        });
      } catch (err) {
        if (!cancelled) {
          setSubCategories([]);
          setCategoryLoadError(
            err instanceof Error ? err.message : "Failed to load categories",
          );
        }
      } finally {
        if (!cancelled) setIsLoadingCategories(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const selectedCategoryLabel = useMemo(() => {
    return subCategories.find((c) => c.id === categoryId)?.label || "";
  }, [subCategories, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setSummary(null);

    if (!xlsxFile) {
      setError("Vendor XLSX file is required");
      return;
    }
    if (!xlsxFile.name.toLowerCase().endsWith(".xlsx")) {
      setError("Spreadsheet must be .xlsx");
      return;
    }
    if (!imagesZip) {
      setError("Images ZIP is required (zip the vendor image folder first)");
      return;
    }
    if (!imagesZip.name.toLowerCase().endsWith(".zip")) {
      setError("Images file must be .zip");
      return;
    }
    if (!categoryId) {
      setError("Select a sub-category");
      return;
    }

    let saveHandle: DataPrepSaveHandle | null = null;
    const savePicker = (window as WindowWithSavePicker).showSaveFilePicker;
    if (savePicker) {
      try {
        saveHandle = await savePicker.call(window, {
          suggestedName: safePackFileName(packName),
          types: [
            {
              description: "ZIP archive",
              accept: { "application/zip": [".zip"] },
            },
          ],
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Could not open Save dialog",
        );
        return;
      }
    }

    setIsConverting(true);
    try {
      const result = await convertDataPrepPack(xlsxFile, imagesZip, {
        categoryId,
        finishType: finishType || undefined,
        status,
        materialType: materialType || undefined,
        description: description.trim() || undefined,
        bookName: bookName.trim() || undefined,
        packName: packName.trim() || "vendor-pack",
      }, saveHandle);

      if (result.blob) {
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }

      setSummary(result.summary);
      setSuccessMsg(
        `Pack ready. Matched ${result.summary.matched} of ${result.summary.vendorRows} rows. ${result.savedDirectly ? "Saved to your selected location" : "Download started"} — unzip, then use Bulk Upload.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  };

  if (userRole && userRole !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f4f6f8] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#5b6b7c]">
              Products
            </p>
            <h1 className="text-2xl font-black uppercase tracking-wide text-[#1f2a3d]">
              Data Prep Tool
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Convert vendor Excel + images ZIP into bulk-upload ready files.
              Does not create products — use Bulk Upload after download.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-md border-2 border-[#1f2a3d] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#1f2a3d] hover:bg-[#1f2a3d] hover:text-white"
          >
            Back to Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"
        >
          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
              Vendor XLSX
            </label>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setXlsxFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#1f2a3d] file:px-3 file:py-2 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Needs a <code>GROUP NAME</code> column. Rows without images are
              dropped.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
              Images ZIP
            </label>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setImagesZip(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#1f2a3d] file:px-3 file:py-2 file:text-[11px] file:font-black file:uppercase file:tracking-wider file:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Zip the vendor image folder first. Filenames should match group
              names (e.g. <code>A502 SF MATURED WOOD.jpg</code>).
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Sub-Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isLoadingCategories || !!categoryLoadError}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#1f2a3d]"
              >
                {isLoadingCategories ? (
                  <option value="">Loading categories…</option>
                ) : (
                  <>
                    <option value="">Select sub-category</option>
                    {subCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {categoryLoadError ? (
                <p className="mt-1 text-xs text-red-600">{categoryLoadError}</p>
              ) : selectedCategoryLabel ? (
                <p className="mt-1 text-xs text-gray-500">
                  Selected: {selectedCategoryLabel}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Finish Type
              </label>
              <select
                value={finishType}
                onChange={(e) => setFinishType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              >
                {FINISH_OPTIONS.map((opt) => (
                  <option key={opt || "empty"} value={opt}>
                    {opt || "—"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Material Type
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              >
                {MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt || "empty"} value={opt}>
                    {opt || "—"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Pack Name
              </label>
              <input
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="aroma-matte"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Book Name (optional)
              </label>
              <input
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-gray-500">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#1f2a3d]"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {successMsg ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {successMsg}
            </div>
          ) : null}
          {summary ? (
            <div className="grid grid-cols-2 gap-2 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 md:grid-cols-4">
              <div>
                <div className="font-black uppercase tracking-wider text-gray-500">
                  Vendor
                </div>
                <div className="text-base font-bold">{summary.vendorRows}</div>
              </div>
              <div>
                <div className="font-black uppercase tracking-wider text-gray-500">
                  Matched
                </div>
                <div className="text-base font-bold text-emerald-700">
                  {summary.matched}
                </div>
              </div>
              <div>
                <div className="font-black uppercase tracking-wider text-gray-500">
                  No Image
                </div>
                <div className="text-base font-bold text-amber-700">
                  {summary.skippedNoImage}
                </div>
              </div>
              <div>
                <div className="font-black uppercase tracking-wider text-gray-500">
                  Orphans
                </div>
                <div className="text-base font-bold">{summary.orphanImages}</div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isConverting || isLoadingCategories}
            className="w-full rounded-md bg-[#2563eb] px-4 py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConverting ? "Converting…" : "Convert & Download Pack"}
          </button>
        </form>
      </div>
    </main>
  );
}
