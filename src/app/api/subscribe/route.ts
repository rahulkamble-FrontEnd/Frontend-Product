import { NextResponse } from "next/server";
import https from "node:https";

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

const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });

async function postJsonInsecure(url: string, body: unknown, headers: Record<string, string>) {
  return new Promise<{ statusCode: number; statusMessage: string; headers: Record<string, string | string[] | undefined>; text: string }>(
    (resolve, reject) => {
      const u = new URL(url);
      const req = https.request(
        {
          protocol: u.protocol,
          hostname: u.hostname,
          port: u.port || 443,
          path: `${u.pathname}${u.search}`,
          method: "POST",
          headers,
          agent: insecureHttpsAgent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on("end", () => {
            const text = Buffer.concat(chunks).toString("utf8");
            resolve({
              statusCode: res.statusCode ?? 0,
              statusMessage: res.statusMessage ?? "",
              headers: res.headers as Record<string, string | string[] | undefined>,
              text,
            });
          });
        }
      );

      req.on("error", reject);
      req.write(JSON.stringify(body));
      req.end();
    }
  );
}

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

    // Hardcoded headers to match the working curl request to customfurnish.com
    const upstream = await postJsonInsecure(
      SUBSCRIBE_ENDPOINT,
      { email },
      {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "User-Agent": BROWSER_UA,
        Referer: "https://www.customfurnish.com/",
        "sec-ch-ua":
          '"Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      }
    );

    const text = upstream.text;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      return NextResponse.json(
        { message: data.message || "Subscription failed on external server" },
        { status: upstream.statusCode || 502 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Newsletter Proxy Error:", error);
    const err = error as unknown as { message?: string; cause?: unknown };
    return NextResponse.json(
      {
        message: "Internal server error",
        // Helps confirm which upstream URL was attempted during debugging.
        upstreamUrl: SUBSCRIBE_ENDPOINT,
        error:
          error instanceof Error
            ? error.message
            : err?.message
              ? String(err.message)
              : String(error),
        cause: err?.cause ?? null,
      },
      { status: 500 }
    );
  }
}
