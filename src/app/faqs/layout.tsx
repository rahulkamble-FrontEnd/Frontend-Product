import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | CustomFurnish",
  description:
    "Frequently asked questions about CustomFurnish.com \u2014 modular kitchens, wardrobes, home interiors, 21-day delivery promise, design process, pricing, service areas, and post-installation support.",
};

export default function FaqsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
