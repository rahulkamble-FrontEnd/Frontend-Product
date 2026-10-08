"use client";

import Image from "next/image";
import type { ProductCompareResponse } from "@/lib/api";
import { PRODUCT_IMAGE_BASE_URL } from "@/lib/s3-image-base";

const FIELD_LABELS: Record<string, string> = {
  brand: "Brand",
  imsId: "IMB ID",
  name: "Name",
  bookName: "Book Name",
  pageNumber: "Page Number",
  application: "Application",
  materialType: "Material Type",
  finishType: "Finish Type",
  colorName: "Color",
  thickness: "Thickness",
  watt: "Watt",
  dimensions: "Dimensions",
  performanceRating: "Performance",
  durabilityRating: "Durability",
  priceCategory: "Price Category",
  maintenanceRating: "Maintenance",
};

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function buildProductImageUrl(value?: string | null) {
  const clean = typeof value === "string" ? cleanUrl(value) : "";
  if (!clean) return null;
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  return `${PRODUCT_IMAGE_BASE_URL}/${clean.replace(/^\/+/, "")}`;
}

function fieldLabel(key: string) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: string | number | null | undefined) {
  if (value == null) return "—";
  const text = String(value).trim();
  return text ? text : "—";
}

type CompareProductsDialogProps = {
  open: boolean;
  isComparing: boolean;
  error: string;
  data: ProductCompareResponse | null;
  onClose: () => void;
};

export default function CompareProductsDialog({ open, isComparing, error, data, onClose }: CompareProductsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close compare" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[#eadfce] px-4 py-3 sm:px-5">
          <h2 className="text-base font-black uppercase tracking-tight text-[#4d2c1e] sm:text-lg">Compare Products</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9cab5] text-gray-600 hover:bg-[#f8f0e4] hover:text-black"
            aria-label="Close compare"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {isComparing ? <div className="py-16 text-center text-sm font-bold text-gray-600">Loading comparison...</div> : null}
          {!isComparing && error ? (
            <div className="m-4 rounded-lg bg-red-50 p-3 text-center text-xs font-bold text-red-600">{error}</div>
          ) : null}
          {!isComparing && data ? (
            <div className="p-3 sm:p-4">
              {data.missingIds?.length > 0 ? (
                <div className="mb-3 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-700">
                  Some products could not be loaded.
                </div>
              ) : null}
              <div className="overflow-x-auto rounded-xl border border-[#eadfce]">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead className="bg-[#f8f0e4]">
                    <tr>
                      <th className="sticky left-0 z-10 w-36 min-w-36 bg-[#f8f0e4] px-3 py-3 text-[11px] font-black uppercase tracking-widest text-[#4d2c1e] sm:w-40">
                        Detail
                      </th>
                      {data.products.map((product) => {
                        const url =
                          typeof product.primaryImageUrl === "string" && cleanUrl(product.primaryImageUrl)
                            ? buildProductImageUrl(product.primaryImageUrl)
                            : null;
                        return (
                          <th key={product.id} className="min-w-[180px] px-3 py-3 align-top">
                            <div className="flex flex-col items-center text-center">
                              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#eadfce] bg-white">
                                {url ? (
                                  <Image src={url} alt={product.name} fill sizes="80px" className="object-contain p-1" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center px-1 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="mt-2 line-clamp-2 text-[12px] font-black leading-snug text-gray-900">{product.name}</div>
                              <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">SKU: {product.sku}</div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {data.fields.map((field) => (
                      <tr key={field.key} className="border-t border-[#eadfce]">
                        <td className="sticky left-0 z-10 bg-white px-3 py-3 text-[11px] font-black uppercase tracking-wide text-gray-500">
                          {fieldLabel(field.key)}
                        </td>
                        {data.products.map((product, idx) => (
                          <td key={`${field.key}-${product.id}`} className="px-3 py-3 text-center text-[13px] font-semibold text-gray-800">
                            {displayValue(field.values?.[idx])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
