import { NextResponse } from "next/server";

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

const PYTHON_API_HOST =
  process.env.PYTHON_API_HOST ||
  process.env.NEXT_PUBLIC_PYTHON_API_HOST ||
  "https://www.customfurnish.com";

const SUBSCRIBE_ENDPOINT = `${PYTHON_API_HOST}/java/api/subscribe/create`;

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
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
