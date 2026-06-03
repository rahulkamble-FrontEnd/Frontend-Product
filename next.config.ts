import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend =
      process.env.API_PROXY_TARGET ||
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : "");
    if (!backend) return [];
    const target = backend.replace(/\/$/, "");
    return [
      {
        source: "/backend-api/:path*",
        destination: `${target}/api/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [256, 384, 535, 640],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "products-customfurnish.s3.ap-south-1.amazonaws.com",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**"
      }
    ]
  }
};

export default nextConfig;
