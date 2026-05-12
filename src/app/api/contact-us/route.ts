import { NextResponse } from "next/server";

/**
 * Server-side proxy for the Contact Us form -> Django schedule-design-session.
 *
 * Why this exists:
 *   - In production (www.customfurnish.com -> Django) the form is same-origin and
 *     calls the API directly, so CSRF + session cookies are sent by the browser.
 *   - In dev (localhost:4200) the browser blocks the cross-origin POST (CORS) and
 *     wouldn't send Django's csrftoken cookie even if CORS were open.
 *
 * This route runs on the Next.js server (no CORS), bootstraps a fresh csrftoken
 * by hitting the Django site once, then forwards the form payload with the
 * matching `X-CSRFToken` header + `Cookie` jar. Net effect: same end-result as
 * a logged-in user submitting the Angular form, regardless of where the Next.js
 * app is hosted.
 */

export const runtime = "nodejs";

const PYTHON_API_HOST =
  process.env.PYTHON_API_HOST ||
  process.env.NEXT_PUBLIC_PYTHON_API_HOST ||
  "https://www.customfurnish.com";

const CONTACT_ENDPOINT = `${PYTHON_API_HOST}/api/schedule-design-session`;
const CSRF_BOOTSTRAP_URL = `${PYTHON_API_HOST}/`;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";

type Bootstrap = { csrfToken: string; cookieHeader: string };

async function bootstrapCsrf(): Promise<Bootstrap> {
  const res = await fetch(CSRF_BOOTSTRAP_URL, {
    method: "GET",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": BROWSER_UA,
    },
    cache: "no-store",
  });

  // Node 19.7+ exposes headers.getSetCookie() which returns every Set-Cookie
  // header separately (a normal headers.get returns them folded).
  const setCookieList =
    (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.() ??
    [];

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
}

type ContactPayload = {
  userName?: unknown;
  userMail?: unknown;
  phoneNumber?: unknown;
  city?: unknown;
  comments?: unknown;
  isLandingPage?: unknown;
};

function sanitize(payload: ContactPayload) {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    userName: str(payload.userName),
    userMail: str(payload.userMail),
    phoneNumber: str(payload.phoneNumber),
    city: str(payload.city),
    comments: str(payload.comments),
    isLandingPage: payload.isLandingPage === undefined ? null : payload.isLandingPage,
  };
}

const MOBILE_PATTERN = /^((\+91-?)|0)?[0-9]{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(p: ReturnType<typeof sanitize>): string | null {
  if (!p.userName) return "full name is required";
  if (!p.userMail) return "email is required";
  if (!EMAIL_PATTERN.test(p.userMail)) return "please enter a vaild email";
  if (!p.phoneNumber) return "phone number is required";
  if (!MOBILE_PATTERN.test(p.phoneNumber))
    return "please enter a valid phone number";
  if (!p.city) return "location is required";
  return null;
}

export async function POST(req: Request) {
  let payload: ContactPayload;
  try {
    payload = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const clean = sanitize(payload);
  const validationError = validate(clean);
  if (validationError) {
    return NextResponse.json(
      { ok: false, error: validationError },
      { status: 400 },
    );
  }

  try {
    const { csrfToken, cookieHeader } = await bootstrapCsrf();

    const upstream = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "User-Agent": BROWSER_UA,
        "X-CSRFToken": csrfToken,
        // Django CSRF middleware checks Origin/Referer match Host for HTTPS.
        Origin: PYTHON_API_HOST,
        Referer: `${PYTHON_API_HOST}/contact-us`,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(clean),
      cache: "no-store",
    });

    const upstreamText = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "";

    if (!upstream.ok) {
      let message = "";
      if (contentType.includes("application/json")) {
        try {
          const j = JSON.parse(upstreamText) as {
            message?: string;
            detail?: string;
            error?: string;
          };
          message = j.message || j.detail || j.error || "";
        } catch {
          message = upstreamText;
        }
      } else {
        message = upstreamText;
      }
      return NextResponse.json(
        {
          ok: false,
          error:
            message ||
            `Upstream responded with ${upstream.status} ${upstream.statusText}`.trim(),
          status: upstream.status,
        },
        { status: 502 },
      );
    }

    // Successful upstream call. Surface upstream body if any, else a clean ok.
    let upstreamJson: unknown = null;
    if (contentType.includes("application/json")) {
      try {
        upstreamJson = JSON.parse(upstreamText);
      } catch {
        upstreamJson = null;
      }
    }

    return NextResponse.json({ ok: true, upstream: upstreamJson });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Network error while contacting backend",
      },
      { status: 502 },
    );
  }
}
