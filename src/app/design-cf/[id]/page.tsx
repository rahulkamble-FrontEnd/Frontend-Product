"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getDesignCfEntryById, type DesignCfEntry } from "@/lib/api";

export default function DesignCfDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [entry, setEntry] = useState<DesignCfEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getDesignCfEntryById(id);
        if (!active) return;
        setEntry(data);
      } catch (err: unknown) {
        if (!active) return;
        setEntry(null);
        setError(err instanceof Error ? err.message : "Failed to load Design CF details.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#312b27]">
      <header className="border-b border-[#e8e3dc] bg-[#fbfaf8] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-md border border-[#d9d2ca] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6c625c] transition hover:bg-[#f7f4ef]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="rounded-md border border-[#e6dfd7] bg-white p-8 text-center text-sm font-semibold text-[#847a72] shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            Loading design details...
          </div>
        ) : error || !entry ? (
          <div className="rounded-md border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-600">
            {error || "Design not found."}
          </div>
        ) : (
          <article className="overflow-hidden rounded-md border border-[#e6dfd7] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="space-y-3 border-b border-[#eee8df] px-6 py-6 sm:px-8">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#302824]">{entry.title}</h1>
              <p className="text-sm text-[#625852]">{entry.description || "No description available."}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8">
              {(entry.images ?? []).map((img) => (
                <div key={img.id} className="relative h-64 overflow-hidden rounded-lg bg-[#f1ede8] sm:h-72">
                  <Image
                    src={img.imageUrl || ""}
                    alt={entry.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
