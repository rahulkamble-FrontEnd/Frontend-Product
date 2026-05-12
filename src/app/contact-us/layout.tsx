import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | CustomFurnish",
  description:
    "Get in touch with CustomFurnish \u2014 reach our customer support, business partnerships, or careers teams, or visit our experience center in Serilingampalle, Hyderabad.",
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
