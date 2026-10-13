import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | CustomFurnish",
  description:
    "Frequently asked questions about CF Studio, CustomFurnish's material selection platform, the selection process, and pricing.",
};

export default function FaqsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
