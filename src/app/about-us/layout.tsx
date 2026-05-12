import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | CustomFurnish",
  description:
    "Learn about CustomFurnish \u2014 dedicated to transforming your living spaces with full house interiors, modular kitchens, wardrobes, and more. Discover our in-house factory and MyDeziner 3D design platform.",
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
