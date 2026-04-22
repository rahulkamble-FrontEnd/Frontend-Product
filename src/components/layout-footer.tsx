"use client";

import { usePathname } from "next/navigation";
import CommonFooter from "@/components/common-footer";

export default function LayoutFooter() {
  const pathname = usePathname();
  const shouldHideFooter = pathname === "/login";

  if (shouldHideFooter) {
    return null;
  }

  return <CommonFooter />;
}
