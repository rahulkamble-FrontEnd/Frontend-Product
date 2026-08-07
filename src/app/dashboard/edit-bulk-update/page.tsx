"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bulkUpdateProducts,
  getProducts,
  type BulkUpdateProductsPayload,
  type ProductListItem,
} from "@/lib/api";

const PAGE_LIMIT_OPTIONS = [10, 20, 50, 100, 300, 400] as const;
const ALLOWED_STATUSES = ["draft", "active", "archived"] as const;

type StringFieldKey =
  | "brand"
  | "description"
  | "bookName"
  | "pageNumber"
  | "application"
  | "materialType"
  | "finishType"
  | "colorName"
  | "colorHex"
  | "thickness"
  | "dimensions";

type NumberFieldKey =
  | "performanceRating"
  | "durabilityRating"
  | "priceCategory"
  | "maintenanceRating";

type ArrayFieldKey = "bestUsedFor" | "pros" | "cons";

type FormState = {
  statusEnabled: boolean;
  status: (typeof ALLOWED_STATUSES)[number];
} & Record<`${StringFieldKey}Enabled`, boolean> &
  Record<StringFieldKey, string> &
  Record<`${NumberFieldKey}Enabled`, boolean> &
  Record<NumberFieldKey, string> &
  Record<`${ArrayFieldKey}Enabled`, boolean> &
  Record<ArrayFieldKey, string>;

const STRING_FIELDS: Array<{ key: StringFieldKey; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "brand", label: "Brand", placeholder: "Enter brand" },
  { key: "bookName", label: "Book Name", placeholder: "Enter book name" },
  { key: "pageNumber", label: "Page Number", placeholder: "Enter page number" },
  { key: "materialType", label: "Material Type", placeholder: "Enter material type" },
  { key: "finishType", label: "Finish Type", placeholder: "Enter finish type" },
  { key: "colorName", label: "Color Name", placeholder: "Enter color name" },
  { key: "colorHex", label: "Color Hex", placeholder: "#RRGGBB" },
  { key: "thickness", label: "Thickness", placeholder: "Enter thickness" },
  { key: "dimensions", label: "Dimensions", placeholder: "Enter dimensions" },
  { key: "application", label: "Application", placeholder: "Enter application" },
  { key: "description", label: "Description", placeholder: "Enter description", multiline: true },
];

const NUMBER_FIELDS: Array<{ key: NumberFieldKey; label: string; placeholder: string }> = [
  { key: "performanceRating", label: "Performance Rating", placeholder: "0-10" },
  { key: "durabilityRating", label: "Durability Rating", placeholder: "0-10" },
  { key: "priceCategory", label: "Price Category", placeholder: "0-10" },
  { key: "maintenanceRating", label: "Maintenance Rating", placeholder: "0-10" },
];

const ARRAY_FIELDS: Array<{ key: ArrayFieldKey; label: string; placeholder: string }> = [
  { key: "bestUsedFor", label: "Best Used For", placeholder: "One value per line" },
  { key: "pros", label: "Pros", placeholder: "One value per line" },
  { key: "cons", label: "Cons", placeholder: "One value per line" },
];

function initialForm(): FormState {
  return {
    statusEnabled: false,
    status: "draft",
    brandEnabled: false,
    brand: "",
    descriptionEnabled: false,
    description: "",
    bookNameEnabled: false,
    bookName: "",
    pageNumberEnabled: false,
    pageNumber: "",
    applicationEnabled: false,
    application: "",
    materialTypeEnabled: false,
    materialType: "",
    finishTypeEnabled: false,
    finishType: "",
    colorNameEnabled: false,
    colorName: "",
    colorHexEnabled: false,
    colorHex: "",
    thicknessEnabled: false,
    thickness: "",
    dimensionsEnabled: false,
    dimensions: "",
    performanceRatingEnabled: false,
    performanceRating: "",
    durabilityRatingEnabled: false,
    durabilityRating: "",
    priceCategoryEnabled: false,
    priceCategory: "",
    maintenanceRatingEnabled: false,
    maintenanceRating: "",
    bestUsedForEnabled: false,
    bestUsedFor: "",
    prosEnabled: false,
    pros: "",
    consEnabled: false,
    cons: "",
  };
}

function formatStatusLabel(status: string) {
  const s = status.trim().toLowerCase();
  if (s === "draft") return "Draft";
  if (s === "active") return "Active";
  if (s === "archived") return "Archived";
  if (s === "published") return "Published";
  return status || "—";
}

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

type PresenceMode = "any" | "with" | "without";
type ValueFilterKey =
  | "brand"
  | "materialType"
  | "finishType"
  | "thickness"
  | "colorName"
  | "description"
  | "bookName"
  | "pageNumber"
  | "application"
  | "colorHex"
  | "dimensions";
type PresenceFieldKey = ValueFilterKey;

const VALUE_FILTER_SECTIONS: Array<{
  key: ValueFilterKey;
  label: string;
  searchPlaceholder: string;
}> = [
  { key: "brand", label: "Brand", searchPlaceholder: "Search brands" },
  {
    key: "bookName",
    label: "Book Name",
    searchPlaceholder: "Search book names",
  },
  {
    key: "pageNumber",
    label: "Page Number",
    searchPlaceholder: "Search page numbers",
  },
  {
    key: "materialType",
    label: "Material Type",
    searchPlaceholder: "Search material types",
  },
  {
    key: "finishType",
    label: "Finish Type",
    searchPlaceholder: "Search finish types",
  },
  {
    key: "colorName",
    label: "Color Name",
    searchPlaceholder: "Search colors",
  },
  {
    key: "colorHex",
    label: "Color Hex",
    searchPlaceholder: "Search color hex",
  },
  {
    key: "thickness",
    label: "Thickness",
    searchPlaceholder: "Search thickness",
  },
  {
    key: "dimensions",
    label: "Dimensions",
    searchPlaceholder: "Search dimensions",
  },
  {
    key: "application",
    label: "Application",
    searchPlaceholder: "Search applications",
  },
  {
    key: "description",
    label: "Description",
    searchPlaceholder: "Search descriptions",
  },
];

const emptyValueFilters = (): Record<ValueFilterKey, Set<string>> => ({
  brand: new Set(),
  materialType: new Set(),
  finishType: new Set(),
  thickness: new Set(),
  colorName: new Set(),
  description: new Set(),
  bookName: new Set(),
  pageNumber: new Set(),
  application: new Set(),
  colorHex: new Set(),
  dimensions: new Set(),
});

const emptyPresence = (): Record<PresenceFieldKey, PresenceMode> => ({
  brand: "any",
  materialType: "any",
  finishType: "any",
  thickness: "any",
  colorName: "any",
  description: "any",
  bookName: "any",
  pageNumber: "any",
  application: "any",
  colorHex: "any",
  dimensions: "any",
});

const emptyFacetOptions = (): Record<ValueFilterKey, string[]> => ({
  brand: [],
  materialType: [],
  finishType: [],
  thickness: [],
  colorName: [],
  description: [],
  bookName: [],
  pageNumber: [],
  application: [],
  colorHex: [],
  dimensions: [],
});

const emptyFacetSearch = (): Record<ValueFilterKey, string> => ({
  brand: "",
  materialType: "",
  finishType: "",
  thickness: "",
  colorName: "",
  description: "",
  bookName: "",
  pageNumber: "",
  application: "",
  colorHex: "",
  dimensions: "",
});

function setToCsv(values: Set<string>): string {
  return Array.from(values)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
}

function setToJsonFilter(values: Set<string>): string {
  const list = Array.from(values)
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  return list.length ? JSON.stringify(list) : "";
}

function pruneSet(prev: Set<string>, allowed: string[]): Set<string> {
  if (prev.size === 0) return prev;
  const allowedSet = new Set(allowed);
  const next = new Set<string>();
  prev.forEach((value) => {
    if (allowedSet.has(value)) next.add(value);
  });
  return next.size === prev.size ? prev : next;
}

function cleanFacetList(values?: string[]): string[] {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

export default function EditBulkUpdatePage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState("");
  const [items, setItems] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filterValues, setFilterValues] = useState(emptyValueFilters);
  const [filterPresence, setFilterPresence] = useState(emptyPresence);
  const [facetOptions, setFacetOptions] = useState(emptyFacetOptions);
  const [facetSearch, setFacetSearch] = useState(emptyFacetSearch);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const name = localStorage.getItem("userName") || "";
    if (!name) {
      router.push("/login");
      return;
    }
    if (role !== "admin" && role !== "dataadmin") {
      router.push("/dashboard");
      return;
    }
    setUserRole(role);
  }, [router]);

  const withFieldsCsv = useMemo(
    () =>
      (Object.keys(filterPresence) as PresenceFieldKey[])
        .filter((key) => filterPresence[key] === "with")
        .join(","),
    [filterPresence],
  );

  const withoutFieldsCsv = useMemo(
    () =>
      (Object.keys(filterPresence) as PresenceFieldKey[])
        .filter((key) => filterPresence[key] === "without")
        .join(","),
    [filterPresence],
  );

  const brandCsv = useMemo(
    () => (filterPresence.brand === "without" ? "" : setToCsv(filterValues.brand)),
    [filterPresence.brand, filterValues.brand],
  );
  const materialTypeCsv = useMemo(
    () => (filterPresence.materialType === "without" ? "" : setToCsv(filterValues.materialType)),
    [filterPresence.materialType, filterValues.materialType],
  );
  const finishTypeCsv = useMemo(
    () => (filterPresence.finishType === "without" ? "" : setToCsv(filterValues.finishType)),
    [filterPresence.finishType, filterValues.finishType],
  );
  const thicknessCsv = useMemo(
    () => (filterPresence.thickness === "without" ? "" : setToCsv(filterValues.thickness)),
    [filterPresence.thickness, filterValues.thickness],
  );
  const colorNameCsv = useMemo(
    () => (filterPresence.colorName === "without" ? "" : setToCsv(filterValues.colorName)),
    [filterPresence.colorName, filterValues.colorName],
  );
  const descriptionFilter = useMemo(
    () => (filterPresence.description === "without" ? "" : setToJsonFilter(filterValues.description)),
    [filterPresence.description, filterValues.description],
  );
  const bookNameFilter = useMemo(
    () => (filterPresence.bookName === "without" ? "" : setToJsonFilter(filterValues.bookName)),
    [filterPresence.bookName, filterValues.bookName],
  );
  const pageNumberFilter = useMemo(
    () => (filterPresence.pageNumber === "without" ? "" : setToJsonFilter(filterValues.pageNumber)),
    [filterPresence.pageNumber, filterValues.pageNumber],
  );
  const applicationFilter = useMemo(
    () => (filterPresence.application === "without" ? "" : setToJsonFilter(filterValues.application)),
    [filterPresence.application, filterValues.application],
  );
  const colorHexFilter = useMemo(
    () => (filterPresence.colorHex === "without" ? "" : setToJsonFilter(filterValues.colorHex)),
    [filterPresence.colorHex, filterValues.colorHex],
  );
  const dimensionsFilter = useMemo(
    () => (filterPresence.dimensions === "without" ? "" : setToJsonFilter(filterValues.dimensions)),
    [filterPresence.dimensions, filterValues.dimensions],
  );

  const hasActiveSidebarFilters = useMemo(() => {
    if (withFieldsCsv || withoutFieldsCsv) return true;
    return VALUE_FILTER_SECTIONS.some((section) => filterValues[section.key].size > 0);
  }, [filterValues, withFieldsCsv, withoutFieldsCsv]);

  const loadFacets = useCallback(async () => {
    if (userRole !== "admin" && userRole !== "dataadmin") return;
    try {
      const data = await getProducts({
        page: 1,
        limit: 1,
        status: statusFilter || undefined,
        q: appliedSearch.trim() || undefined,
        includeImages: false,
        includeCategories: false,
      });
      const nextOptions: Record<ValueFilterKey, string[]> = {
        brand: cleanFacetList(data.filters?.brands),
        materialType: cleanFacetList(data.filters?.materialTypes),
        finishType: cleanFacetList(data.filters?.finishes),
        thickness: cleanFacetList(data.filters?.thicknesses),
        colorName: cleanFacetList(data.filters?.colors),
        description: cleanFacetList(data.filters?.descriptions),
        bookName: cleanFacetList(data.filters?.bookNames),
        pageNumber: cleanFacetList(data.filters?.pageNumbers),
        application: cleanFacetList(data.filters?.applications),
        colorHex: cleanFacetList(data.filters?.colorHexes),
        dimensions: cleanFacetList(data.filters?.dimensions),
      };
      setFacetOptions(nextOptions);
      setFilterValues((prev) => {
        const next = { ...prev };
        (Object.keys(nextOptions) as ValueFilterKey[]).forEach((key) => {
          next[key] = pruneSet(prev[key], nextOptions[key]);
        });
        return next;
      });
    } catch {
      setFacetOptions(emptyFacetOptions());
    }
  }, [userRole, statusFilter, appliedSearch]);

  const loadProducts = useCallback(async () => {
    if (userRole !== "admin" && userRole !== "dataadmin") return;
    setIsLoading(true);
    setError("");
    try {
      const data = await getProducts({
        page,
        limit,
        status: statusFilter || undefined,
        q: appliedSearch.trim() || undefined,
        brand: brandCsv || undefined,
        materialType: materialTypeCsv || undefined,
        finishType: finishTypeCsv || undefined,
        thickness: thicknessCsv || undefined,
        colorName: colorNameCsv || undefined,
        description: descriptionFilter || undefined,
        bookName: bookNameFilter || undefined,
        pageNumber: pageNumberFilter || undefined,
        application: applicationFilter || undefined,
        colorHex: colorHexFilter || undefined,
        dimensions: dimensionsFilter || undefined,
        withFields: withFieldsCsv || undefined,
        withoutFields: withoutFieldsCsv || undefined,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (err: unknown) {
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  }, [
    userRole,
    page,
    limit,
    statusFilter,
    appliedSearch,
    brandCsv,
    materialTypeCsv,
    finishTypeCsv,
    thicknessCsv,
    colorNameCsv,
    descriptionFilter,
    bookNameFilter,
    pageNumberFilter,
    applicationFilter,
    colorHexFilter,
    dimensionsFilter,
    withFieldsCsv,
    withoutFieldsCsv,
  ]);

  useEffect(() => {
    void loadFacets();
  }, [loadFacets]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(total, 1) / limit)),
    [total, limit],
  );

  const pageIds = useMemo(() => items.map((row) => row.id), [items]);
  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const pageSelectedCount = useMemo(
    () => pageIds.filter((id) => selectedIds.has(id)).length,
    [pageIds, selectedIds],
  );
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const applySearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const setPresence = (key: PresenceFieldKey, mode: PresenceMode) => {
    setSuccessMsg("");
    setFormError("");
    setPage(1);
    setFilterPresence((prev) => ({ ...prev, [key]: mode }));
    if (mode === "without" && key in filterValues) {
      const valueKey = key as ValueFilterKey;
      setFilterValues((prev) => ({ ...prev, [valueKey]: new Set() }));
    }
  };

  const toggleValueFilter = (key: ValueFilterKey, value: string) => {
    setSuccessMsg("");
    setFormError("");
    setPage(1);
    setFilterPresence((prev) => (prev[key] === "without" ? { ...prev, [key]: "with" } : prev));
    setFilterValues((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  };

  const clearSidebarFilters = () => {
    setSuccessMsg("");
    setFormError("");
    setPage(1);
    setFilterValues(emptyValueFilters());
    setFilterPresence(emptyPresence());
    setFacetSearch(emptyFacetSearch());
  };

  const toggleRow = (id: string) => {
    setSuccessMsg("");
    setFormError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllOnPage = () => {
    setSuccessMsg("");
    setFormError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const deselectPage = () => {
    setSuccessMsg("");
    setFormError("");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSuccessMsg("");
    setFormError("");
    setSelectedIds(new Set());
  };

  const handleApply = async () => {
    setFormError("");
    setSuccessMsg("");

    const ids = selectedList.filter(Boolean);
    if (ids.length === 0) {
      setFormError("Select at least one product.");
      return;
    }

    const payload: BulkUpdateProductsPayload = { productIds: ids };
    let enabledCount = 0;

    if (form.statusEnabled) {
      payload.status = form.status;
      enabledCount += 1;
    }

    for (const field of STRING_FIELDS) {
      const enabledKey = `${field.key}Enabled` as const;
      if (!form[enabledKey]) continue;
      const value = form[field.key].trim();
      if (!value) {
        setFormError(`${field.label} cannot be empty when enabled.`);
        return;
      }
      if (field.key === "colorHex" && !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
        setFormError("Color Hex must be #RGB or #RRGGBB.");
        return;
      }
      payload[field.key] = value;
      enabledCount += 1;
    }

    for (const field of NUMBER_FIELDS) {
      const enabledKey = `${field.key}Enabled` as const;
      if (!form[enabledKey]) continue;
      const num = Number(form[field.key]);
      if (!Number.isFinite(num)) {
        setFormError(`${field.label} must be a valid number.`);
        return;
      }
      if (num < 0 || num > 10) {
        setFormError(`${field.label} should be between 0 and 10.`);
        return;
      }
      payload[field.key] = num;
      enabledCount += 1;
    }

    for (const field of ARRAY_FIELDS) {
      const enabledKey = `${field.key}Enabled` as const;
      if (!form[enabledKey]) continue;
      const lines = parseLines(form[field.key]);
      if (lines.length === 0) {
        setFormError(`${field.label} needs at least one non-empty line when enabled.`);
        return;
      }
      payload[field.key] = lines;
      enabledCount += 1;
    }

    if (enabledCount === 0) {
      setFormError("Enable at least one field to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkUpdateProducts(payload);
      const updated = result.updatedCount ?? 0;
      const matched = result.matchedCount ?? 0;
      setSuccessMsg(
        `Updated ${updated} of ${matched} matched product(s). Selected total: ${ids.length}.`,
      );
      setForm(initialForm());
      await loadProducts();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to bulk update products.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userRole !== "admin" && userRole !== "dataadmin") return null;

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9d958d]">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#3b322d] sm:text-3xl">
              Edit Bulk Product
            </h1>
            <p className="mt-1 text-sm text-[#7a7069]">
              Mark products across pages, enable fields, and apply the same values to all selected.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/products/manage"
              className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
            >
              Manage products
            </Link>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div>
        ) : null}
        {formError ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{formError}</div>
        ) : null}
        {successMsg ? (
          <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm font-semibold text-green-700">
            {successMsg}
          </div>
        ) : null}

        <section className="rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-[1fr_160px_120px]">
              <div>
                <label htmlFor="bulk-search" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  Search
                </label>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <input
                    id="bulk-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applySearch();
                    }}
                    placeholder="Name, SKU, or brand"
                    className="min-w-0 flex-1 rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applySearch}
                    className="w-full shrink-0 rounded-md bg-[#bca58c] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:opacity-95 sm:w-auto"
                  >
                    Search
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="bulk-status" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  Status filter
                </label>
                <select
                  id="bulk-status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label htmlFor="bulk-limit" className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  Per page
                </label>
                <select
                  id="bulk-limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                >
                  {PAGE_LIMIT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm font-semibold text-[#6c625c]">
              {isLoading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
            </p>
          </div>
        </section>

        <section className="rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="text-[11px] font-black uppercase tracking-widest text-[#6c625c]">
              Selected: {selectedIds.size} total · This page: {pageSelectedCount}/{pageIds.length}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                disabled={pageIds.length === 0}
                onClick={selectAllOnPage}
                className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
              >
                {allPageSelected ? "Page selected" : "Select page"}
              </button>
              <button
                type="button"
                disabled={pageSelectedCount === 0}
                onClick={deselectPage}
                className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
              >
                Deselect page
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={clearSelection}
                className="col-span-2 rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50 sm:col-auto"
              >
                Clear all selection
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:h-[calc(100vh-11rem)] lg:grid-cols-[260px_minmax(0,1.1fr)_minmax(0,0.85fr)] lg:items-stretch">
          <aside className="flex min-h-[60vh] flex-col overflow-hidden rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:min-h-0 lg:h-full">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">Filters</h2>
              <button
                type="button"
                disabled={!hasActiveSidebarFilters}
                onClick={clearSidebarFilters}
                className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73] disabled:opacity-40"
              >
                Clear all
              </button>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-1">
              {VALUE_FILTER_SECTIONS.map((section) => {
                const presence = filterPresence[section.key];
                const selectedCount = filterValues[section.key].size;
                const q = facetSearch[section.key].trim().toLowerCase();
                const options = facetOptions[section.key].filter((value) =>
                  q ? value.toLowerCase().includes(q) : true,
                );
                return (
                  <div key={section.key} className="border-t border-[#ebe4dc] pt-4 first:border-t-0 first:pt-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8b6b45]">
                      {section.label}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      {(
                        [
                          ["any", "All"],
                          ["with", "With"],
                          ["without", "Without"],
                        ] as const
                      ).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setPresence(section.key, mode)}
                          className={[
                            "rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
                            presence === mode
                              ? "bg-[#3d4f67] text-white"
                              : "border border-[#d9d2ca] bg-white text-[#6c625c]",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[#9d958d]">
                      {presence === "without"
                        ? `Only products without ${section.label.toLowerCase()}`
                        : presence === "with" && selectedCount === 0
                          ? `Only products with ${section.label.toLowerCase()}`
                          : selectedCount > 0
                            ? `${selectedCount} value(s) selected`
                            : "Any value"}
                    </p>
                    {presence !== "without" ? (
                      <>
                        <input
                          type="search"
                          value={facetSearch[section.key]}
                          onChange={(e) =>
                            setFacetSearch((prev) => ({ ...prev, [section.key]: e.target.value }))
                          }
                          placeholder={section.searchPlaceholder}
                          className="mt-2 w-full rounded-md border border-[#ddd4ca] bg-[#fbfaf8] px-3 py-2 text-sm focus:outline-none"
                        />
                        <div className="mt-2 max-h-36 space-y-2 overflow-y-auto pr-1">
                          {options.length === 0 ? (
                            <div className="text-xs text-[#9d958d]">No options</div>
                          ) : (
                            options.map((value) => (
                              <label
                                key={value}
                                className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3d4f67]"
                              >
                                <input
                                  type="checkbox"
                                  checked={filterValues[section.key].has(value)}
                                  onChange={() => toggleValueFilter(section.key, value)}
                                  className="h-4 w-4 rounded-[3px] border border-[#8f8a80] bg-white accent-[#3d4f67]"
                                />
                                <span className="truncate" title={value}>
                                  {value}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] lg:min-h-0 lg:h-full">
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-[#ebe4dc] bg-[#fbfaf8] text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a7d73]">
                  <tr>
                    <th className="px-4 py-3">Mark</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#7a7069]">
                        Loading products…
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#7a7069]">
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    items.map((product) => {
                      const checked = selectedIds.has(product.id);
                      return (
                        <tr key={product.id} className="border-b border-[#f0ebe4] last:border-0">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleRow(product.id)}
                              className="h-4 w-4 accent-[#A9844F]"
                              aria-label={`Select ${product.name}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#3b322d]">{product.name}</div>
                            <div className="mt-0.5 text-xs text-[#8a7d73]">{product.materialType || "—"}</div>
                          </td>
                          <td className="px-4 py-3 text-[#6c625c]">{product.sku || "—"}</td>
                          <td className="px-4 py-3 text-[#6c625c]">{product.brand || "—"}</td>
                          <td className="px-4 py-3 text-[#6c625c]">{formatStatusLabel(product.status)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t border-[#ebe4dc] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-[#7a7069]">
                Page {page} of {totalPages}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || isLoading || items.length < limit}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-[#d9d2ca] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <section className="flex min-h-[60vh] flex-col overflow-hidden rounded-md border border-[#e6dfd7] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:p-5 lg:min-h-0 lg:h-full">
            <div className="mb-4 shrink-0">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#3b322d]">Update fields</h2>
              <p className="mt-1 text-xs text-[#7a7069]">
                Enable only the fields you want to change. Same values apply to all {selectedIds.size} selected
                product(s).
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
              <div className="rounded-md border border-[#ebe4dc] bg-[#faf7f1] p-3">
                <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-widest text-[#6c625c] sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.statusEnabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, statusEnabled: e.target.checked }))}
                      className="h-4 w-4 accent-[#A9844F]"
                    />
                    Status
                  </span>
                  <select
                    value={form.status}
                    disabled={!form.statusEnabled}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        status: e.target.value as FormState["status"],
                      }))
                    }
                    className="rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-xs font-bold text-[#3b322d] disabled:opacity-50"
                  >
                    {ALLOWED_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s === "draft" ? "unactive" : s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {STRING_FIELDS.map((field) => {
                const enabledKey = `${field.key}Enabled` as const;
                return (
                  <div key={field.key} className="rounded-md border border-[#ebe4dc] p-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#6c625c]">
                      <input
                        type="checkbox"
                        checked={form[enabledKey]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [enabledKey]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#A9844F]"
                      />
                      {field.label}
                    </label>
                    {field.multiline ? (
                      <textarea
                        value={form[field.key]}
                        disabled={!form[enabledKey]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        rows={3}
                        className="mt-2 w-full rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-sm font-semibold text-[#3b322d] placeholder:text-[#b0a79f] disabled:opacity-50"
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[field.key]}
                        disabled={!form[enabledKey]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="mt-2 w-full rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-sm font-semibold text-[#3b322d] placeholder:text-[#b0a79f] disabled:opacity-50"
                      />
                    )}
                  </div>
                );
              })}

              {NUMBER_FIELDS.map((field) => {
                const enabledKey = `${field.key}Enabled` as const;
                return (
                  <div key={field.key} className="rounded-md border border-[#ebe4dc] p-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#6c625c]">
                      <input
                        type="checkbox"
                        checked={form[enabledKey]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [enabledKey]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#A9844F]"
                      />
                      {field.label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      step="0.1"
                      value={form[field.key]}
                      disabled={!form[enabledKey]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-sm font-semibold text-[#3b322d] placeholder:text-[#b0a79f] disabled:opacity-50"
                    />
                  </div>
                );
              })}

              {ARRAY_FIELDS.map((field) => {
                const enabledKey = `${field.key}Enabled` as const;
                return (
                  <div key={field.key} className="rounded-md border border-[#ebe4dc] p-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#6c625c]">
                      <input
                        type="checkbox"
                        checked={form[enabledKey]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            [enabledKey]: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#A9844F]"
                      />
                      {field.label}
                    </label>
                    <textarea
                      value={form[field.key]}
                      disabled={!form[enabledKey]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={4}
                      className="mt-2 w-full rounded-md border border-[#ddd4ca] bg-white px-3 py-2 text-sm font-semibold text-[#3b322d] placeholder:text-[#b0a79f] disabled:opacity-50"
                    />
                    <p className="mt-1 text-[11px] text-[#9d958d]">One value per line</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid shrink-0 grid-cols-2 gap-2 border-t border-[#ebe4dc] pt-4">
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm());
                  setFormError("");
                }}
                disabled={isSubmitting}
                className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c625c] disabled:opacity-50"
              >
                Reset form
              </button>
              <button
                type="button"
                onClick={() => void handleApply()}
                disabled={isSubmitting || selectedIds.size === 0}
                className="rounded-md bg-[#1f2a3d] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#151d2b] disabled:opacity-50"
              >
                {isSubmitting ? "Updating…" : `Apply to ${selectedIds.size}`}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
