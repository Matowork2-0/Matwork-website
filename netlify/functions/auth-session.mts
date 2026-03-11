import { createHmac } from "node:crypto";
import type { Context } from "@netlify/functions";

const SESSION_COOKIE_NAME = "mw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionUser = {
  email: string;
  name: string;
  picture: string;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function sign(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

function createSessionToken(user: SessionUser, secret: string): string {
  const payload = {
    email: user.email,
    name: user.name,
    picture: user.picture,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  return `${payloadPart}.${sign(payloadPart, secret)}`;
}

function parseList(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedEmail(email: string): boolean {
  const normalized = email.toLowerCase();
  const emailAllowList = parseList(process.env.ALLOWED_LOGIN_EMAILS);
  const domainAllowList = parseList(process.env.ALLOWED_LOGIN_DOMAINS);

  if (emailAllowList.length === 0 && domainAllowList.length === 0) return true;
  if (emailAllowList.includes(normalized)) return true;

  const domain = normalized.split("@")[1] || "";
  return domainAllowList.includes(domain);
}

function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production" || process.env.CONTEXT === "production";
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { credential } = await req.json();
    if (!credential || typeof credential !== "string") {
      return new Response(JSON.stringify({ message: "Missing credential" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (!expectedClientId) {
      console.error("[auth-session] Missing GOOGLE_CLIENT_ID/VITE_GOOGLE_CLIENT_ID env.");
      return new Response(JSON.stringify({ message: "Server config error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionSecret = process.env.AUTH_SESSION_SECRET;
    if (!sessionSecret) {
      console.error("[auth-session] Missing AUTH_SESSION_SECRET env.");
      return new Response(JSON.stringify({ message: "Server config error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { method: "GET" },
    );

    if (!verifyRes.ok) {
      const reason = await verifyRes.text().catch(() => "");
      console.warn("[auth-session] Invalid Google credential:", reason.substring(0, 200));
      return new Response(JSON.stringify({ message: "Invalid Google credential" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tokenInfo: any = await verifyRes.json();
    const issuer = String(tokenInfo.iss || "");
    const audience = String(tokenInfo.aud || "");
    const exp = Number(tokenInfo.exp || 0);
    const email = String(tokenInfo.email || "");
    const emailVerified = String(tokenInfo.email_verified || "") === "true";

    if (!email || !emailVerified) {
      return new Response(JSON.stringify({ message: "Google account email is not verified" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (audience !== expectedClientId) {
      return new Response(JSON.stringify({ message: "Google client mismatch" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!["https://accounts.google.com", "accounts.google.com"].includes(issuer)) {
      return new Response(JSON.stringify({ message: "Invalid Google issuer" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!exp || exp * 1000 <= Date.now()) {
      return new Response(JSON.stringify({ message: "Google token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAllowedEmail(email)) {
      return new Response(JSON.stringify({ message: "Your account is not allowed to access this site" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user: SessionUser = {
      email,
      name: String(tokenInfo.name || ""),
      picture: String(tokenInfo.picture || "/favicon.png"),
    };

    const sessionToken = createSessionToken(user, sessionSecret);
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", buildSessionCookie(sessionToken));

    const logUrl = process.env.GOOGLE_ACTIVITY_LOG_URL;
    if (!logUrl) {
      console.warn("[auth-session] GOOGLE_ACTIVITY_LOG_URL is not set. Login activity not logged.");
    } else {
      void fetch(logUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name: user.name,
          email: user.email,
          action: "login",
        }),
        redirect: "follow",
      })
        .then(async (logRes) => {
          if (logRes.ok) return;
          const reason = await logRes.text().catch(() => "");
          console.warn(
            `[auth-session] Login activity log failed: ${logRes.status} ${reason.substring(0, 200)}`,
          );
        })
        .catch((logErr: any) => {
          console.error("[auth-session] Login activity request error:", logErr?.message || logErr);
        });
    }

    return new Response(JSON.stringify({ ok: true, user }), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[auth-session] Error:", err?.message || err);
    return new Response(JSON.stringify({ message: "Sign-in failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
