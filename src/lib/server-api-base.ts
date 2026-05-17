/** API root for server-side fetch (RSC). Use 127.0.0.1 in dev — Node on Windows often fails with localhost. */
export function getServerApiBaseUrl(): string {
  const authBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://127.0.0.1:3000/api/auth"
      : "https://pmsapi.customfurnish.com/api/auth");
  return authBase.replace(/\/auth\/?$/, "");
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
