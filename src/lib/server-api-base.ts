import { getApiRoot } from "@/lib/api";

/** Origin for resolving relative API bases (e.g. Amplify staging `/backend-api`). */
function getServerOrigin(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/+$/, "");

  const host = process.env.AMPLIFY_HOSTNAME?.trim();
  if (host) {
    const cleaned = host.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${cleaned}`;
  }

  if (process.env.NODE_ENV === "development") return "http://127.0.0.1:4200";
  return "https://pmsapi.customfurnish.com";
}

/** Absolute API root for server-side fetch (RSC). Relative `/backend-api` must not be passed to Node fetch. */
export function getServerApiBaseUrl(): string {
  const root = getApiRoot();
  if (/^https?:\/\//i.test(root)) return root.replace(/\/$/, "");

  const path = root.startsWith("/") ? root : `/${root}`;
  return `${getServerOrigin()}${path}`.replace(/\/$/, "");
}

export function getServerApiUrl(apiPath: string): string {
  const base = getServerApiBaseUrl();
  const normalized = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return `${base}${normalized}`;
}

export async function serverFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
