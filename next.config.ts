import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Only applies when /backend-api rewrites are active (local + Amplify staging).
   * Production Amplify calls pmsapi directly (no rewrite), so this does not change prod traffic.
   * Default proxy body limit is 10MB; bulk-upload xlsx+zip is often much larger.
   */
  experimental: {
    proxyClientMaxBodySize: "300mb",
    proxyTimeout: 10 * 60 * 1000, // 10 minutes for large multipart bulk uploads
  },
  async rewrites() {
    const backend =
      process.env.API_PROXY_TARGET ||
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : "");
    const rewrites = [];
    if (process.env.NODE_ENV === "development") {
      rewrites.push({
        source: "/local-backend-api/:path*",
        destination: "http://127.0.0.1:3000/api/:path*",
      });
    }
    if (backend) {
      const target = backend.replace(/\/$/, "");
      rewrites.push({
        source: "/backend-api/:path*",
        destination: `${target}/api/:path*`,
      });
    }
    return rewrites;
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
        hostname: "test-products-customfurnish.s3.ap-southeast-1.amazonaws.com",
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
