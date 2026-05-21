import type { ReactNode } from "react";

const S3_ORIGIN = "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href={S3_ORIGIN} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={S3_ORIGIN} />
      {children}
    </>
  );
}
