import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

// Upstream subscribe endpoint is fixed in production:
// https://www.customfurnish.com/java/api/subscribe/create
//
// On Amplify, env vars can be misconfigured and cause the proxy fetch to fail.
// To avoid 500s due to wrong host, we default to the correct upstream host
// unless the env value clearly matches the expected domain.
const ENV_HOST =
  process.env.PYTHON_API_HOST || process.env.NEXT_PUBLIC_PYTHON_API_HOST;

const PYTHON_API_HOST =
  ENV_HOST && ENV_HOST.includes("customfurnish.com")
    ? ENV_HOST
    : "https://www.customfurnish.com";

// Production subscribe endpoint (Java backend):
// https://www.customfurnish.com/java/api/subscribe/create
const SUBSCRIBE_ENDPOINT = `${PYTHON_API_HOST.replace(/\/$/, "")}/java/api/subscribe/create`;

export async function POST(request: Request) {
  try {
    // Be defensive: some clients/proxies may send an empty body or invalid JSON.
    // Never 500 on bad input; return 400 instead.
    let bodyText = "";
    try {
      bodyText = await request.text();
    } catch {
      bodyText = "";
    }

    let body: unknown = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        return NextResponse.json(
          { message: "Invalid JSON body" },
          { status: 400 },
        );
      }
    }

    const email =
      typeof (body as { email?: unknown })?.email === "string"
        ? (body as { email: string }).email
        : "";

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const response = await fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": BROWSER_UA,
        "Referer": `${PYTHON_API_HOST}/`,
        "Origin": PYTHON_API_HOST,
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Subscription failed on external server" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Newsletter Proxy Error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        // Helps confirm which upstream URL was attempted during debugging.
        upstreamUrl: SUBSCRIBE_ENDPOINT,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
