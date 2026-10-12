import ProductDetailsPage from "./product-detail-client";
import { getServerApiUrl, serverFetchJson } from "@/lib/server-api-base";
import ReactDOM from "react-dom";

type ProductImage = {
  url?: string | null;
  isPrimary?: boolean;
};

type ProductImageResponse = {
  images?: ProductImage[] | null;
};

function pickImageUrl(images: ProductImage[] | null | undefined) {
  const list = Array.isArray(images) ? images : [];
  const withUrl = list.filter((img) => typeof img.url === "string" && img.url.trim());
  const primary = withUrl.find((img) => img.isPrimary);
  return (primary ?? withUrl[0])?.url?.trim() || null;
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await serverFetchJson<ProductImageResponse>(
    getServerApiUrl(`/products/${encodeURIComponent(slug)}`),
  );
  const initialImageUrl = pickImageUrl(product?.images);
  if (initialImageUrl) {
    ReactDOM.preload(initialImageUrl, { as: "image", fetchPriority: "high" });
  }

  return <ProductDetailsPage initialImageUrl={initialImageUrl} />;
}
