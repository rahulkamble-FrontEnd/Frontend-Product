import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutFooter from "@/components/layout-footer";
import { WishlistProvider } from "@/components/wishlist-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4200").replace(/\/+$/, "");
const SITE_TITLE = "CF Studio by CustomFurnish";
const SITE_DESCRIPTION =
  "Explore premium interior materials at CF Studio: core materials, laminates and finishes, wall decoratives, counter tops, flooring and tiles, lighting, hardware, glass and more.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "CF Studio",
  openGraph: {
    type: "website",
    siteName: "CF Studio",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preconnect"
          href="https://products-customfurnish.s3.ap-south-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://products-customfurnish.s3.ap-south-1.amazonaws.com" />
      </head>
      <body className="flex min-h-full min-w-0 flex-col overflow-x-hidden">
        <WishlistProvider>
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
          <LayoutFooter />
        </WishlistProvider>
      </body>
    </html>
  );
}
