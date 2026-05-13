"use client";

import { useCallback, useEffect, useState } from "react";
import { bulkUpdateProducts } from "@/lib/api";

const ALLOWED_STATUSES = ["draft", "active", "archived"] as const;

type BulkEditEnabledKey =
  | "brandEnabled"
  | "materialTypeEnabled"
  | "finishTypeEnabled"
  | "colorNameEnabled"
  | "thicknessEnabled"
  | "dimensionsEnabled"
  | "performanceEnabled"
  | "durabilityEnabled"
  | "maintenanceEnabled";

type BulkEditValueKey =
  | "brand"
  | "materialType"
  | "finishType"
  | "colorName"
  | "thickness"
  | "dimensions"
  | "performance"
  | "durability"
  | "maintenance";

const BULK_EDIT_FIELD_ROWS: Array<{
  key: string;
  label: string;
  enabledKey: BulkEditEnabledKey;
  valueKey: BulkEditValueKey;
  placeholder: string;
}> = [
  { key: "brand", label: "Brand", enabledKey: "brandEnabled", valueKey: "brand", placeholder: "Enter brand" },
  {
    key: "materialType",
    label: "Material Type",
    enabledKey: "materialTypeEnabled",
    valueKey: "materialType",
    placeholder: "Enter material type",
  },
  {
    key: "finishType",
    label: "Finish Type",
    enabledKey: "finishTypeEnabled",
    valueKey: "finishType",
    placeholder: "Enter finish type",
  },
  {
    key: "colorName",
    label: "Color Name",
    enabledKey: "colorNameEnabled",
    valueKey: "colorName",
    placeholder: "Enter color name",
  },
  {
    key: "thickness",
    label: "Thickness",
    enabledKey: "thicknessEnabled",
    valueKey: "thickness",
    placeholder: "Enter thickness",
  },
  {
    key: "dimensions",
    label: "Dimensions",
    enabledKey: "dimensionsEnabled",
    valueKey: "dimensions",
    placeholder: "Enter dimensions",
  },
  {
    key: "performance",
    label: "Performance",
    enabledKey: "performanceEnabled",
    valueKey: "performance",
    placeholder: "0-10",
  },
  {
    key: "durability",
    label: "Durability",
    enabledKey: "durabilityEnabled",
    valueKey: "durability",
    placeholder: "0-10",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    enabledKey: "maintenanceEnabled",
    valueKey: "maintenance",
    placeholder: "0-10",
  },
];

const initialForm = () => ({
  statusEnabled: false,
  status: "draft",
  brandEnabled: false,
  brand: "",
  materialTypeEnabled: false,
  materialType: "",
  finishTypeEnabled: false,
  finishType: "",
  colorNameEnabled: false,
  colorName: "",
  thicknessEnabled: false,
  thickness: "",
  dimensionsEnabled: false,
  dimensions: "",
  performanceEnabled: false,
  performance: "",
  durabilityEnabled: false,
  durability: "",
  maintenanceEnabled: false,
  maintenance: "",
});

export type BulkEditProductsModalProps = {
  open: boolean;
  onClose: () => void;
  productIds: string[];
  onApplied: (info: { updated: number; failed: number }) => void | Promise<void>;
};

export function BulkEditProductsModal({ open, onClose, productIds, onApplied }: BulkEditProductsModalProps) {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initialForm());
      setError("");
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setForm(initialForm());
    setError("");
    setIsSubmitting(false);
    onClose();
  }, [onClose]);

  const handleApply = async () => {
    setError("");

    const selectedIds = productIds.map((id) => id.trim()).filter(Boolean);
    if (selectedIds.length === 0) {
      setError("Select at least one product.");
      return;
    }

    const safeTrim = (v: string) => v.trim();
    const updates: Record<string, string> = {};

    let statusToUpdate: "draft" | "active" | "archived" | "published" | undefined;
    if (form.statusEnabled) {
      statusToUpdate = form.status as "draft" | "active" | "archived" | "published";
    }
    if (form.brandEnabled) {
      const value = safeTrim(form.brand);
      if (!value) return setError("Brand cannot be empty.");
      updates.brand = value;
    }
    if (form.materialTypeEnabled) {
      const value = safeTrim(form.materialType);
      if (!value) return setError("Material type cannot be empty.");
      updates.materialType = value;
    }
    if (form.finishTypeEnabled) {
      const value = safeTrim(form.finishType);
      if (!value) return setError("Finish type cannot be empty.");
      updates.finishType = value;
    }
    if (form.colorNameEnabled) {
      const value = safeTrim(form.colorName);
      if (!value) return setError("Color name cannot be empty.");
      updates.colorName = value;
    }
    if (form.thicknessEnabled) {
      const value = safeTrim(form.thickness);
      if (!value) return setError("Thickness cannot be empty.");
      updates.thickness = value;
    }
    if (form.dimensionsEnabled) {
      const value = safeTrim(form.dimensions);
      if (!value) return setError("Dimensions cannot be empty.");
      updates.dimensions = value;
    }
    if (form.performanceEnabled) {
      const num = Number(form.performance);
      if (!Number.isFinite(num)) return setError("Performance must be a valid number.");
      if (num < 0 || num > 10) return setError("Performance should be between 0 and 10.");
      updates.performanceRating = String(num);
    }
    if (form.durabilityEnabled) {
      const num = Number(form.durability);
      if (!Number.isFinite(num)) return setError("Durability must be a valid number.");
      if (num < 0 || num > 10) return setError("Durability should be between 0 and 10.");
      updates.durabilityRating = String(num);
    }
    if (form.maintenanceEnabled) {
      const num = Number(form.maintenance);
      if (!Number.isFinite(num)) return setError("Maintenance must be a valid number.");
      if (num < 0 || num > 10) return setError("Maintenance should be between 0 and 10.");
      updates.maintenanceRating = String(num);
    }

    if (Object.keys(updates).length === 0 && !statusToUpdate) {
      setError("Enable at least one field to update.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkUpdateProducts({
        productIds: selectedIds,
        ...(statusToUpdate ? { status: statusToUpdate } : {}),
        ...(updates.brand ? { brand: updates.brand } : {}),
        ...(updates.materialType ? { materialType: updates.materialType } : {}),
        ...(updates.finishType ? { finishType: updates.finishType } : {}),
        ...(updates.colorName ? { colorName: updates.colorName } : {}),
        ...(updates.thickness ? { thickness: updates.thickness } : {}),
        ...(updates.dimensions ? { dimensions: updates.dimensions } : {}),
        ...(updates.performanceRating ? { performanceRating: Number(updates.performanceRating) } : {}),
        ...(updates.durabilityRating ? { durabilityRating: Number(updates.durabilityRating) } : {}),
        ...(updates.maintenanceRating ? { maintenanceRating: Number(updates.maintenanceRating) } : {}),
      });

      const failCount = Math.max(0, selectedIds.length - (result.updatedCount ?? result.matchedCount ?? 0));
      const updated = result.updatedCount ?? 0;
      try {
        await onApplied({ updated, failed: failCount });
      } catch {
        // Parent refetch failed; bulk update already succeeded
      }
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to bulk edit products.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:py-10"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[min(90dvh,calc(100vh-2rem))] w-full max-w-xl flex-col rounded-2xl bg-white p-4 shadow-xl sm:max-h-[min(85dvh,calc(100vh-3rem))] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <div className="text-sm font-black uppercase tracking-widest text-gray-800">Bulk Edit Products</div>
            <div className="mt-1 text-xs font-bold text-gray-500">Selected: {productIds.length}</div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</div>
        ) : null}

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
          <div className="rounded-xl border border-gray-100 bg-[#faf7f1] p-3">
            <label className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-gray-700">
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
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 disabled:opacity-50"
              >
                {ALLOWED_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "draft" ? "unactive" : s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {BULK_EDIT_FIELD_ROWS.map((row) => (
            <div key={row.key} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-700">
                  <input
                    type="checkbox"
                    checked={form[row.enabledKey]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [row.enabledKey]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#A9844F]"
                  />
                  {row.label}
                </label>
                <input
                  type={
                    row.key === "performance" || row.key === "durability" || row.key === "maintenance" ? "number" : "text"
                  }
                  min={row.key === "performance" || row.key === "durability" || row.key === "maintenance" ? 0 : undefined}
                  max={row.key === "performance" || row.key === "durability" || row.key === "maintenance" ? 10 : undefined}
                  step={row.key === "performance" || row.key === "durability" || row.key === "maintenance" ? "0.1" : undefined}
                  value={form[row.valueKey]}
                  disabled={!form[row.enabledKey]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [row.valueKey]: e.target.value,
                    }))
                  }
                  placeholder={row.placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-900 placeholder:text-gray-400 disabled:opacity-50 sm:max-w-[320px]"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid shrink-0 grid-cols-2 gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-800 shadow-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={isSubmitting}
            className="rounded-full bg-[#1f2a3d] px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-[#151d2b] disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Apply Bulk Edit"}
          </button>
        </div>
      </div>
    </div>
  );
}
