import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | CustomFurnish",
  description:
    "Contact CustomFurnish Materials for interior material guidance, visit our Hyderabad experience centre, or reach support@customfurnish.com. Monday\u2013Saturday, 10:00 AM\u20137:00 PM.",
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
