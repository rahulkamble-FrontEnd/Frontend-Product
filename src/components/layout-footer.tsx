"use client";

import { usePathname } from "next/navigation";
import CommonFooter from "@/components/common-footer";

const SHOW_STAY_UPDATED = false;

export default function LayoutFooter() {
  const pathname = usePathname();
  const isPublicTrendingDetail =
    pathname.startsWith("/trending/") &&
    pathname !== "/trending/manage" &&
    pathname !== "/trending/create";
  const shouldHideFooter = pathname === "/login" || pathname === "/blog" || isPublicTrendingDetail;
  const shouldHideNewsletter = !SHOW_STAY_UPDATED || pathname === "/blog" || isPublicTrendingDetail;

  if (shouldHideFooter) {
    return null;
  }

  return <CommonFooter hideNewsletter={shouldHideNewsletter} />;
}
