"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryMenu, type CategoryMenuItem } from "@/lib/api";

type CommonStoreHeaderProps = {
  pageTitle: string;
  breadcrumbText: string;
  rightText?: string;
};

export default function CommonStoreHeader({
  pageTitle,
  breadcrumbText,
  rightText,
}: CommonStoreHeaderProps) {
  const [categories, setCategories] = useState<CategoryMenuItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadMenu = async () => {
      try {
        const menu = await getCategoryMenu({ includeChildren: true, productLimit: 8 });
        if (isMounted) {
          setCategories(Array.isArray(menu) ? menu : []);
        }
      } catch {
        if (isMounted) setCategories([]);
      }
    };
    loadMenu();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-[#d9cab5] bg-white">
      <div className="mx-auto w-full max-w-[1680px] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-[34px] leading-none text-[#1f1f1f]">
            <span className="font-serif">CustomFurnish</span>
          </Link>
          {rightText ? (
            <div className="text-xs font-semibold text-gray-500">{rightText}</div>
          ) : (
            <div />
          )}
        </div>
      </div>

      <nav
        style={{
          background:
            "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-center gap-6 overflow-x-auto whitespace-nowrap px-4 py-2 sm:px-6 lg:px-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.slug ? `/categories/${category.slug}` : "#"}
              className="text-[16px] font-semibold leading-6 tracking-normal text-white/95 hover:text-white"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#d9cab5] bg-white">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-2 sm:px-6 lg:px-8">
          <div className="text-sm font-semibold text-[#1f1f1f]">{pageTitle}</div>
          <div className="mt-0.5 text-[10px] text-gray-500">{breadcrumbText}</div>
        </div>
      </div>
    </header>
  );
}
