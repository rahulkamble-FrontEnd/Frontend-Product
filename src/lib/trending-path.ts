export const TRENDING_SECTION_ID = "trending";

export function trendingItemAnchorId(id?: string | null) {
  const clean = id?.trim();
  return clean ? `trending-${clean}` : TRENDING_SECTION_ID;
}

export function trendingItemHref(id?: string | null) {
  const clean = id?.trim();
  if (!clean) return `/blog#${TRENDING_SECTION_ID}`;
  return `/trending/${encodeURIComponent(clean)}`;
}
