import { createHmac, timingSafeEqual } from "node:crypto";
import type { Context } from "@netlify/functions";

const SESSION_COOKIE_NAME = "mw_session";

type SessionPayload = {
  email: string;
  name: string;
  picture: string;
  exp: number;
};

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(input: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(input).digest();
}

function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = sign(payloadPart, secret);
  const providedSignature = Buffer.from(signaturePart, "hex");
  if (providedSignature.length !== expectedSignature.length) return null;
  if (!timingSafeEqual(providedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    return new Response(JSON.stringify({ message: "Server config error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cookies = parseCookies(req.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = verifySessionToken(token, secret);
  if (!payload) {
    return new Response(JSON.stringify({ message: "Unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user: {
        email: payload.email,
        name: payload.name || "",
        picture: payload.picture || "/favicon.png",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};
