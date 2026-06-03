/** Public S3 base for building image URLs from keys only. Set per env in Amplify / .env.test */
export const PRODUCT_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_S3_IMAGE_BASE_URL?.replace(/\/$/, "") ??
  "https://products-customfurnish.s3.ap-south-1.amazonaws.com";

export function isTestS3Url(url?: string | null): boolean {
  return Boolean(url?.includes("test-products-customfurnish"));
}
