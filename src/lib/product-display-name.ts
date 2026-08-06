/**
 * Customer-facing product title:
 * - strips leading product-code tokens (digits, alphanumeric SKUs, short ALL-CAPS codes)
 * - appends category serial from slug (e.g. "FN0519")
 * Admin/other roles should keep showing the raw product name.
 *
 * Examples:
 * - "APM 120 Silver Grey" + slug → "SILVER GREY FN0519"
 * - "1E220 KK Slate Grey" + slug → "SLATE GREY FN0490"
 */
function isLeadingProductCodeToken(token: string): boolean {
  const value = token.trim();
  if (!value) return false;

  // Pure digits: 120, 8, 191
  if (/^\d+$/.test(value)) return true;

  // Mixed alphanumeric codes: 1E220, 2B4702, 2BBR
  if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/i.test(value)) return true;

  // Short ALL-CAPS letter codes only: APM, APG, KK, GL, A
  // (title-case words like "Silver" / "Ash" are kept)
  if (/^[A-Z]{1,3}$/.test(value)) return true;

  return false;
}

export function formatCustomerProductTitle(
  name: string | null | undefined,
  productSlug: string | null | undefined,
): string {
  const tokens = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);

  let start = 0;
  while (start < tokens.length && isLeadingProductCodeToken(tokens[start])) {
    start += 1;
  }

  const remaining = tokens.slice(start);
  const base = (remaining.length > 0 ? remaining : tokens)
    .join(" ")
    .trim()
    .toUpperCase();

  const slug = (productSlug ?? "").trim();
  const codeMatch = slug.match(/-([a-z]{2}\d{4})$/i);
  const code = codeMatch?.[1]?.toUpperCase() ?? "";

  if (!base) return code;
  return code ? `${base} ${code}` : base;
}
