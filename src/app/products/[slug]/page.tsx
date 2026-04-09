"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { getProductBySlug, type ProductDetailsResponse, type ProductImageUploadResponse } from "@/lib/api";

function cleanUrl(value: string) {
  return value.trim().replace(/^`+/, "").replace(/`+$/, "").replace(/^"+/, "").replace(/"+$/, "").trim();
}

function pickBestImageUrl(images: ProductImageUploadResponse[] | null | undefined) {
  const list = Array.isArray(images) ? images : [];
  const primary = list.find((img) => img.isPrimary && typeof img.url === "string" && cleanUrl(img.url));
  if (primary?.url) return cleanUrl(primary.url);
  const byOrder = [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const first = byOrder.find((img) => typeof img.url === "string" && cleanUrl(img.url));
  return first?.url ? cleanUrl(first.url) : null;
}

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const { slug } = React.use(params as unknown as Promise<{ slug: string }>);
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [product, setProduct] = useState<ProductDetailsResponse | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (!storedName) {
      router.push("/login");
      return;
    }
    setUserName(storedName);
  }, [router]);

  useEffect(() => {
    if (!userName) return;
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getProductBySlug(slug);
        setProduct(data);
        const best = pickBestImageUrl(data.images);
        setSelectedImageUrl(best);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load product.");
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, userName]);

  const images = useMemo(() => {
    const list = Array.isArray(product?.images) ? product!.images : [];
    return list
      .map((img) => ({ ...img, url: cleanUrl(img.url) }))
      .filter((img) => Boolean(img.url));
  }, [product]);

  if (!userName) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <header className="border-b border-gray-100 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border-2 border-black px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black shadow-sm hover:bg-black hover:text-white transition-all"
          >
            Back
          </button>
          <div className="text-sm font-black uppercase tracking-widest text-gray-400">Product Details</div>
          <div className="text-sm font-bold text-gray-600">{userName}</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {error && (
          <div className="mb-6 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg text-center">
            {error}
          </div>
        )}

        {isLoading || !product ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm text-sm text-gray-500">
            {isLoading ? "Loading..." : "No product found."}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm">
                {selectedImageUrl ? (
                  <Image
                    src={selectedImageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-black uppercase tracking-widest text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageUrl(img.url)}
                      className={[
                        "relative aspect-square overflow-hidden rounded-xl border",
                        selectedImageUrl === img.url ? "border-black" : "border-gray-200"
                      ].join(" ")}
                    >
                      <Image src={img.url} alt={product.name} fill sizes="25vw" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{product.materialType}</div>
                <h1 className="mt-1 text-3xl font-black uppercase tracking-tight">{product.name}</h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    {product.status}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    SKU: {product.sku}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-gray-700">
                    {product.brand}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</div>
                <div className="text-sm text-gray-700 leading-6">{product.description}</div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Specs</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-gray-500">Color</div>
                  <div className="font-bold text-gray-900">{product.colorName || "-"}</div>
                  <div className="text-gray-500">Dimensions</div>
                  <div className="font-bold text-gray-900">{product.dimensions || "-"}</div>
                  <div className="text-gray-500">Finish</div>
                  <div className="font-bold text-gray-900">{product.finishType || "-"}</div>
                  <div className="text-gray-500">Thickness</div>
                  <div className="font-bold text-gray-900">{product.thickness || "-"}</div>
                  <div className="text-gray-500">Performance</div>
                  <div className="font-bold text-gray-900">{String(product.performanceRating ?? 0)}</div>
                  <div className="text-gray-500">Durability</div>
                  <div className="font-bold text-gray-900">{String(product.durabilityRating ?? 0)}</div>
                  <div className="text-gray-500">Maintenance</div>
                  <div className="font-bold text-gray-900">{String(product.maintenanceRating ?? 0)}</div>
                  <div className="text-gray-500">Price Category</div>
                  <div className="font-bold text-gray-900">{String(product.priceCategory ?? 0)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Categories</div>
                <div className="flex flex-wrap gap-2">
                  {(product.categories || []).length > 0 ? (
                    (product.categories || []).map((c) => (
                      <span
                        key={c.id}
                        className={[
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
                          c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        ].join(" ")}
                      >
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No categories</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">IDs</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Product ID</span>
                    <span className="font-bold text-gray-900 break-all">{product.id}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-500">Slug</span>
                    <span className="font-bold text-gray-900 break-all">{product.slug}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
