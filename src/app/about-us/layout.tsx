import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | CustomFurnish",
  description:
    "CustomFurnish Materials \u2014 explore premium interior materials, finishes, and design support. Learn about our manufacturing facility, what we offer, and our vision for modern home interiors.",
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
