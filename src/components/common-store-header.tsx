"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import StoreHeaderUserBar from "@/components/store-header-user-bar";
import { getCategoryMenu, type CategoryMenuItem } from "@/lib/api";

function formatLabel(value: string | null | undefined) {
  const text = (value ?? "").trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type CommonStoreHeaderProps = {
  pageTitle: string;
  breadcrumbText: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
  rightText?: string;
  userName?: string;
  userRole?: string;
  shortlistRefreshKey?: number;
};

export default function CommonStoreHeader({
  pageTitle,
  breadcrumbText,
  breadcrumbItems,
  rightText,
  userName,
  userRole = "",
  shortlistRefreshKey = 0,
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

  const showUserBar = Boolean(userName);

  return (
    <header className="relative z-[320] border-b border-[#d9cab5] bg-[#F8F0E4]">
      <div className="mx-auto w-full max-w-[1680px] px-3 py-3 sm:px-6 lg:px-8 2xl:max-w-[2200px] 2xl:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center pr-1 sm:pr-2">
            <Link
              href="/dashboard"
              className="ml-0 inline-flex max-w-full min-w-0 items-center sm:-ml-2 lg:-ml-4"
            >
              <Image
                src="/logo-cf.svg"
                alt="CustomFurnish"
                width={309}
                height={28}
                priority
                className="pointer-events-none block h-[26px] w-auto max-w-full object-contain object-left sm:h-[34px]"
              />
            </Link>
          </div>
          {showUserBar ? (
            <div className="shrink-0">
              <StoreHeaderUserBar userName={userName!} userRole={userRole} shortlistRefreshKey={shortlistRefreshKey} />
            </div>
          ) : rightText ? (
            <div className="shrink-0 text-xs font-semibold text-gray-500">{rightText}</div>
          ) : (
            <div className="shrink-0" />
          )}
        </div>
      </div>

      <nav
        style={{
          background:
            "linear-gradient(90deg, #8A6A3A 0%, #A9844F 25%, #C9A46A 50%, #B8925A 75%, #7A5C2E 100%)",
        }}
      >
        <div className="mx-auto flex w-full max-w-[1680px] items-center justify-start gap-4 overflow-x-auto whitespace-nowrap px-3 py-2 sm:justify-center sm:gap-6 sm:px-6 lg:px-8 2xl:max-w-[2200px] 2xl:px-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.slug ? `/categories/${category.slug}` : "#"}
              className="text-[14px] font-semibold leading-6 tracking-normal text-white/95 hover:text-white sm:text-[16px]"
            >
              {formatLabel(category.name)}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#d9cab5] bg-white">
        <div className="mx-auto w-full max-w-[1680px] px-4 py-2 sm:px-6 lg:px-8 2xl:max-w-[2200px] 2xl:px-6">
          <div className="text-sm font-semibold text-[#1f1f1f]">{pageTitle}</div>
          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
            {Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0 ? (
              breadcrumbItems.map((item, index) => (
                <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="hover:text-[#1f1f1f] hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {index < breadcrumbItems.length - 1 ? <span>&gt;</span> : null}
                </span>
              ))
            ) : (
              <span>{breadcrumbText}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
