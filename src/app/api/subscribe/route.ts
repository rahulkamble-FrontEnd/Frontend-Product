import { NextResponse } from "next/server";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const PYTHON_API_HOST =
  process.env.PYTHON_API_HOST ||
  process.env.NEXT_PUBLIC_PYTHON_API_HOST ||
  "https://www.customfurnish.com";

const SUBSCRIBE_ENDPOINT = `${PYTHON_API_HOST}/java/api/subscribe/create`;
const CSRF_BOOTSTRAP_URL = `${PYTHON_API_HOST}/`;

type Bootstrap = { csrfToken: string; cookieHeader: string };

async function bootstrapCsrf(): Promise<Bootstrap> {
  try {
    const res = await fetch(CSRF_BOOTSTRAP_URL, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": BROWSER_UA,
      },
      cache: "no-store",
    });

    const setCookieList =
      (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];

    let csrfToken = "";
    const cookiePairs: string[] = [];

    for (const sc of setCookieList) {
      const pair = sc.split(";")[0]?.trim();
      if (!pair) continue;
      cookiePairs.push(pair);
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) {
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        if (name === "csrftoken") csrfToken = value;
      }
    }

    return { csrfToken, cookieHeader: cookiePairs.join("; ") };
  } catch (err) {
    console.error("CSRF Bootstrap Error:", err);
    return { csrfToken: "", cookieHeader: "" };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Bootstrap CSRF just like contact-us route
    const { csrfToken, cookieHeader } = await bootstrapCsrf();

    const response = await fetch(SUBSCRIBE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/plain, */*",
        "User-Agent": BROWSER_UA,
        "X-CSRFToken": csrfToken,
        "Cookie": cookieHeader,
        "Referer": `${PYTHON_API_HOST}/`,
        "Origin": PYTHON_API_HOST,
      },
      body: JSON.stringify({ email }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
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
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
