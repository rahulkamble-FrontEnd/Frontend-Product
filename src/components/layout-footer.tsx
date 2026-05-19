"use client";

import { usePathname } from "next/navigation";
import CommonFooter from "@/components/common-footer";

export default function LayoutFooter() {
  const pathname = usePathname();
  const isPublicTrendingDetail =
    pathname.startsWith("/trending/") &&
    pathname !== "/trending/manage" &&
    pathname !== "/trending/create";
  const shouldHideFooter = pathname === "/login" || pathname === "/blog" || isPublicTrendingDetail;
  const shouldHideNewsletter = pathname === "/blog" || isPublicTrendingDetail;

  if (shouldHideFooter) {
    return null;
  }

  return <CommonFooter hideNewsletter={shouldHideNewsletter} />;
}
