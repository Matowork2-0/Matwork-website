const SESSION_COOKIE_NAME = "mw_session";

type SessionPayload = {
  email: string;
  exp: number;
};

const PUBLIC_EXACT_PATHS = new Set([
  "/login",
  "/favicon.png",
  "/opengraph.jpg",
  "/robots.txt",
  "/sitemap.xml",
  "/google14d06fe42e383511.html",
]);

const PUBLIC_PREFIX_PATHS = [
  "/assets/",
  "/api/auth-session",
  "/api/auth-me",
  "/api/auth-logout",
  "/.netlify/functions/auth-session",
  "/.netlify/functions/auth-me",
  "/.netlify/functions/auth-logout",
];

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}

function base64UrlToUint8Array(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function base64UrlDecode(input: string): string {
  const bytes = base64UrlToUint8Array(input);
  return new TextDecoder().decode(bytes);
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const value = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(value)) return null;
    out[i / 2] = value;
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function hmacSha256(input: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return new Uint8Array(signature);
}

async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expected = await hmacSha256(payloadPart, secret);
  const provided = hexToBytes(signaturePart);
  if (!provided || !constantTimeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIX_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export default async (request: Request, context: any) => {
  const url = new URL(request.url);
  const { pathname, search } = url;

  if (request.method === "OPTIONS") return context.next();
  if (isPublicPath(pathname)) return context.next();

  const sessionSecret = Netlify.env.get("AUTH_SESSION_SECRET");
  if (!sessionSecret) {
    return new Response("AUTH_SESSION_SECRET is not configured.", { status: 500 });
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies[SESSION_COOKIE_NAME];
  const payload = token ? await verifySessionToken(token, sessionSecret) : null;

  if (payload) {
    if (pathname === "/login") {
      return Response.redirect(new URL("/", url.origin).toString(), 302);
    }
    return context.next();
  }

  // For API routes, return a JSON 401 instead of redirecting.
  if (pathname.startsWith("/api/") || pathname.startsWith("/.netlify/functions/")) {
    return new Response(JSON.stringify({ message: "Unauthenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const redirectUrl = new URL("/login", url.origin);
  if (pathname !== "/") {
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
  }
  return Response.redirect(redirectUrl.toString(), 302);
};

