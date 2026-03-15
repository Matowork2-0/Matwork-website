import type { Express, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { type Server } from "http";

const SESSION_COOKIE_NAME = "mw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = {
  email: string;
  name: string;
  picture: string;
  exp: number;
};

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(input: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(input).digest();
}

function buildSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_TTL_SECONDS}`,
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

function clearSessionCookie(): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    ...(isProd ? ["Secure"] : []),
  ].join("; ");
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
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

function createSessionToken(payload: SessionPayload, secret: string): string {
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signaturePart = sign(payloadPart, secret).toString("hex");
  return `${payloadPart}.${signaturePart}`;
}

function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) return null;

  const expectedSig = sign(payloadPart, secret);
  const providedSig = Buffer.from(signaturePart, "hex");
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (!payload?.email || !payload?.exp) return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Rate Limiter (in-memory sliding window) ─────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 5; // max requests per window per IP

const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  // Remove expired entries
  const valid = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, valid);
    return true;
  }
  valid.push(now);
  rateLimitMap.set(ip, valid);
  return false;
}

// Periodically clean up old entries (every 10 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of Array.from(rateLimitMap.entries())) {
    const valid = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, valid);
    }
  }
}, 10 * 60 * 1000);

// ── Content Validation ──────────────────────────────────────────────────────
const PROFANITY_LIST = [
  "fuck", "shit", "ass", "damn", "bitch", "bastard", "crap",
  "dick", "piss", "slut", "whore", "cunt",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

function isGibberish(text: string): boolean {
  if (!text || text.trim().length === 0) return false;

  const cleaned = text.replace(/\s+/g, "").toLowerCase();
  if (cleaned.length < 2) return false;

  // Check for excessive repeated characters (e.g., "aaaaaaa")
  const repeatedPattern = /(.)\1{4,}/;
  if (repeatedPattern.test(cleaned)) return true;

  // Check for excessive consonant clusters (e.g., "bcdfghjklmnp")
  const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{6,}/i;
  if (consonantCluster.test(cleaned)) return true;

  // Check if text is mostly non-letter characters (special char spam)
  const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
  if (cleaned.length > 5 && letterCount / cleaned.length < 0.3) return true;

  // Check for keyboard mashing patterns
  const keyboardPatterns = [
    "asdf", "qwer", "zxcv", "hjkl", "yuio", "bnm,",
    "fdsa", "rewq", "vcxz", "lkjh",
  ];
  const lowerText = text.toLowerCase();
  const keyboardHits = keyboardPatterns.filter((p) => lowerText.includes(p));
  if (keyboardHits.length >= 2) return true;

  return false;
}

function validateContent(fields: { name: string; outlet: string; contact: string; address: string }): string | null {
  // Name checks
  if (!fields.name || fields.name.trim().length < 2) {
    return "Please enter a valid name (at least 2 characters).";
  }
  if (fields.name.trim().length > 100) {
    return "Name is too long.";
  }
  if (isGibberish(fields.name)) {
    return "The name you entered doesn't look valid. Please enter your real name.";
  }
  if (containsProfanity(fields.name)) {
    return "Please use appropriate language in the name field.";
  }

  // Contact checks
  if (!fields.contact || fields.contact.trim().length < 5) {
    return "Please enter a valid contact number.";
  }
  // Allow digits, spaces, dashes, plus, parentheses
  const contactRegex = /^[\d\s\-+()]{5,20}$/;
  if (!contactRegex.test(fields.contact.trim())) {
    return "Please enter a valid contact number.";
  }

  // Outlet / Business Name checks (required)
  if (!fields.outlet || fields.outlet.trim().length < 2) {
    return "Please enter your outlet or business name (at least 2 characters).";
  }
  if (fields.outlet.trim().length > 200) return "Outlet name is too long.";
  if (isGibberish(fields.outlet)) {
    return "The outlet name doesn't look valid.";
  }
  if (containsProfanity(fields.outlet)) {
    return "Please use appropriate language in the outlet field.";
  }

  // Address checks (optional, only validate if present)
  if (fields.address && fields.address.trim().length > 0) {
    if (fields.address.trim().length > 500) return "Address is too long.";
    if (containsProfanity(fields.address)) {
      return "Please use appropriate language in the address field.";
    }
  }

  return null; // all good
}

// ── Routes ──────────────────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // POST /api/auth-session — verifies Google credential and sets secure session cookie.
  app.post("/api/auth-session", async (req: Request, res: Response) => {
    try {
      const credential = String(req.body?.credential || "");
      if (!credential) {
        return res.status(400).json({ message: "Missing credential" });
      }

      const expectedClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      const sessionSecret = process.env.AUTH_SESSION_SECRET;
      if (!expectedClientId || !sessionSecret) {
        return res.status(500).json({ message: "Server config error" });
      }

      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
        { method: "GET" },
      );
      if (!verifyRes.ok) {
        const reason = await verifyRes.text().catch(() => "");
        console.warn("[auth-session] Invalid Google credential:", reason.substring(0, 200));
        return res.status(401).json({ message: "Invalid Google credential" });
      }

      const tokenInfo: any = await verifyRes.json();
      const issuer = String(tokenInfo.iss || "");
      const audience = String(tokenInfo.aud || "");
      const exp = Number(tokenInfo.exp || 0);
      const email = String(tokenInfo.email || "");
      const emailVerified = String(tokenInfo.email_verified || "") === "true";

      if (!email || !emailVerified) {
        return res.status(403).json({ message: "Google account email is not verified" });
      }
      if (audience !== expectedClientId) {
        return res.status(401).json({ message: "Google client mismatch" });
      }
      if (!["https://accounts.google.com", "accounts.google.com"].includes(issuer)) {
        return res.status(401).json({ message: "Invalid Google issuer" });
      }
      if (!exp || exp * 1000 <= Date.now()) {
        return res.status(401).json({ message: "Google token expired" });
      }
      if (!isAllowedEmail(email)) {
        return res.status(403).json({ message: "Your account is not allowed to access this site" });
      }

      const payload: SessionPayload = {
        email,
        name: String(tokenInfo.name || ""),
        picture: String(tokenInfo.picture || "/favicon.png"),
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      };

      const sessionToken = createSessionToken(payload, sessionSecret);
      res.setHeader("Set-Cookie", buildSessionCookie(sessionToken));

      const logUrl = process.env.GOOGLE_ACTIVITY_LOG_URL;
      if (!logUrl) {
        console.warn("[auth-session] GOOGLE_ACTIVITY_LOG_URL is not set. Login activity not logged.");
      } else {
        void fetch(logUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            name: payload.name,
            email: payload.email,
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

      return res.status(200).json({
        ok: true,
        user: {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        },
      });
    } catch (err: any) {
      console.error("[auth-session] Error:", err?.message || err);
      return res.status(500).json({ message: "Sign-in failed" });
    }
  });

  // GET /api/auth-me — returns current session user from HttpOnly cookie.
  app.get("/api/auth-me", async (req: Request, res: Response) => {
    const sessionSecret = process.env.AUTH_SESSION_SECRET;
    if (!sessionSecret) {
      return res.status(500).json({ message: "Server config error" });
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const payload = verifySessionToken(token, sessionSecret);
    if (!payload) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    return res.status(200).json({
      ok: true,
      user: {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
    });
  });

  // POST /api/auth-logout — clears session cookie.
  app.post("/api/auth-logout", async (_req: Request, res: Response) => {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ ok: true });
  });

  // POST /api/contact — secure proxy to Google Sheets
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      // Rate limiting
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      if (isRateLimited(clientIp)) {
        return res.status(429).json({
          message: "Too many requests. Please wait a few minutes before trying again.",
        });
      }

      const { name, outlet, contact, address } = req.body;

      // Content validation
      const validationError = validateContent({ name, outlet, contact, address });
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }

      // Google Sheets proxy
      const sheetUrl = process.env.GOOGLE_SHEET_URL;
      if (!sheetUrl) {
        console.error("[contact] GOOGLE_SHEET_URL is NOT set. Form data lost.");
        return res.status(500).json({
          message: "Server configuration error. Please try again later.",
        });
      }

      // Forward to Google Apps Script
      // Column order: Name | Outlet | Contact | Address | Timestamp
      const payload = {
        name: name.trim(),
        outlet: outlet?.trim() || "",
        contact: contact.trim(),
        address: address?.trim() || "",
        timestamp: new Date().toISOString(),
      };

      console.log("[contact] Posting to Google Sheet URL:", sheetUrl.substring(0, 60) + "...");

      const sheetRes = await fetch(sheetUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const sheetBody = await sheetRes.text().catch(() => "");
      console.log("[contact] Google Sheets response:", sheetRes.status, sheetRes.url, sheetBody.substring(0, 500));

      if (!sheetRes.ok) {
        console.error("[contact] Google Sheets error:", sheetRes.status, sheetBody.substring(0, 500));
        return res.status(502).json({
          message: "Failed to save inquiry. Please try again later.",
        });
      }

      return res.status(200).json({
        message: "Inquiry received. Thank you!",
      });
    } catch (err: any) {
      console.error("[contact] Error processing contact form:", err?.message || err);
      return res.status(500).json({
        message: "Something went wrong. Please try again later.",
      });
    }
  });

  // POST /api/log-visit — log page visits to Google Sheets
  app.post("/api/log-visit", async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const sheetUrl = process.env.GOOGLE_SHEET_URL;

      if (!sheetUrl) {
        console.error("[log-visit] GOOGLE_SHEET_URL is not set.");
        return res.status(500).json({ ok: false });
      }

      const ua = String(body.userAgent || "");
      let device = "Unknown";
      if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        device = /iPad/i.test(ua) ? "Tablet" : "Mobile";
      } else {
        device = "Desktop";
      }
      let os = "Unknown";
      if (/Windows/i.test(ua)) os = "Windows";
      else if (/Mac OS/i.test(ua)) os = "macOS";
      else if (/Android/i.test(ua)) os = "Android";
      else if (/iPhone|iPad/i.test(ua)) os = "iOS";
      else if (/Linux/i.test(ua)) os = "Linux";

      let browser = "Unknown";
      if (/Edg\//i.test(ua)) browser = "Edge";
      else if (/Chrome/i.test(ua)) browser = "Chrome";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Firefox/i.test(ua)) browser = "Firefox";

      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const payload = {
        action: "visit",
        timestamp: body.timestamp || new Date().toISOString(),
        page: body.page || "",
        ip: clientIp,
        device: `${device} — ${os} — ${browser}`,
        screen: body.screen || "",
        referrer: body.referrer || "",
        language: body.language || "",
      };

      console.log("[log-visit] Sending payload:", JSON.stringify(payload));

      const sheetRes = await fetch(sheetUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const sheetBody = await sheetRes.text().catch(() => "");
      console.log("[log-visit] Google Sheets response:", sheetRes.status, sheetBody.substring(0, 500));

      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("[log-visit] Error:", err?.message || err);
      return res.status(500).json({ ok: false });
    }
  });

  return httpServer;
}
