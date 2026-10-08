"use client";

import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addWishlistItem, getWishlist, removeWishlistItem } from "@/lib/api";

const WISHLIST_ITEM_LIMIT = 25;

type WishlistContextValue = {
  productIds: Set<string>;
  count: number;
  isCustomer: boolean;
  pendingProductId: string | null;
  toggle: (productId: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [isCustomer, setIsCustomer] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    const role = window.localStorage.getItem("userRole") || "";
    const customer = role === "customer";
    setIsCustomer(customer);
    if (!customer) {
      setProductIds(new Set());
      return;
    }
    try {
      const items = await getWishlist();
      setProductIds(new Set(items.map((item) => item.productId).filter(Boolean)));
    } catch {
      setProductIds(new Set());
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, pathname]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggle = useCallback(
    async (productId: string) => {
      const role = window.localStorage.getItem("userRole") || "";
      if (role !== "customer") {
        router.push("/login");
        return;
      }
      const id = productId.trim();
      if (!id || pendingProductId === id) return;
      const alreadySaved = productIds.has(id);
      if (!alreadySaved && productIds.size >= WISHLIST_ITEM_LIMIT) {
        setNotice("You can wishlist only 25 products.");
        return;
      }
      setPendingProductId(id);
      setProductIds((prev) => {
        const next = new Set(prev);
        if (alreadySaved) next.delete(id);
        else next.add(id);
        return next;
      });
      try {
        if (alreadySaved) await removeWishlistItem(id);
        else await addWishlistItem(id);
      } catch (err: unknown) {
        setProductIds((prev) => {
          const next = new Set(prev);
          if (alreadySaved) next.add(id);
          else next.delete(id);
          return next;
        });
        setNotice(err instanceof Error ? err.message : "Could not update wishlist.");
      } finally {
        setPendingProductId(null);
      }
    },
    [pendingProductId, productIds, router],
  );

  const value = useMemo(
    () => ({
      productIds,
      count: productIds.size,
      isCustomer,
      pendingProductId,
      toggle,
    }),
    [productIds, isCustomer, pendingProductId, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      {notice ? (
        <div className="fixed bottom-4 left-1/2 z-[400] flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#e7c7c7] bg-white px-4 py-3 shadow-2xl sm:bottom-6 sm:px-5 sm:py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9b2c2c] text-white sm:h-11 sm:w-11">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </span>
          <div className="min-w-0 text-left">
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#9b2c2c]">Wishlist</div>
            <div className="mt-1 text-sm font-semibold leading-5 text-[#4d2c1e]">{notice}</div>
          </div>
        </div>
      ) : null}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return value;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function WishlistHeartButton({
  productId,
  className = "",
}: {
  productId: string;
  className?: string;
}) {
  const { productIds, isCustomer, pendingProductId, toggle } = useWishlist();
  if (!isCustomer || !productId) return null;
  const saved = productIds.has(productId);
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      disabled={pendingProductId === productId}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggle(productId);
      }}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm sm:h-9 sm:w-9",
        saved ? "border-[#9b2c2c] bg-[#9b2c2c] text-white" : "border-gray-200 bg-white/95 text-[#9b2c2c]",
        className,
      ].join(" ")}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}

export function WishlistHeaderButton() {
  const router = useRouter();
  const { count, isCustomer } = useWishlist();
  if (!isCustomer) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        router.push("/wishlist");
      }}
      className="relative p-0.5 sm:p-0"
      aria-label="Open wishlist"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        className="h-[22px] w-[22px] sm:h-6 sm:w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white sm:-right-2 sm:-top-2">
        {count}
      </span>
    </button>
  );
}
