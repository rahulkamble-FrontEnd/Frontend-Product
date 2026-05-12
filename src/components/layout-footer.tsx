"use client";

import { usePathname } from "next/navigation";
import CommonFooter from "@/components/common-footer";

export default function LayoutFooter() {
  const pathname = usePathname();
  const shouldHideFooter = pathname === "/login" || pathname === "/blog";
  const shouldHideNewsletter = pathname === "/blog";

  if (shouldHideFooter) {
    return null;
  }

  return <CommonFooter hideNewsletter={shouldHideNewsletter} />;
}
