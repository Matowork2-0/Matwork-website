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

// ── Lead Verification Helpers ────────────────────────────────────────────────
function isObviousFakePhoneLead(phone10: string): string | null {
  if (/^(\d)\1{9}$/.test(phone10)) return "This doesn't look like a real phone number.";
  const ascending = "0123456789012345";
  const descending = "9876543210987654";
  if (ascending.includes(phone10) || descending.includes(phone10))
    return "This doesn't look like a real phone number.";
  if (/^(\d{2})\1{4}$/.test(phone10)) return "This doesn't look like a real phone number.";
  if (/^(\d{3})\1{2}\d$/.test(phone10)) return "This doesn't look like a real phone number.";
  if (/^[6-9]0{9}$/.test(phone10)) return "This doesn't look like a real phone number.";
  if (/^[6-9](\d)\1{8}$/.test(phone10)) return "This doesn't look like a real phone number.";
  const testNumbers = ["9876543210", "8765432109", "7654321098", "6543210987", "9123456789", "9012345678"];
  if (testNumbers.includes(phone10)) return "This doesn't look like a real phone number.";
  return null;
}

function isObviousFakeEmailLead(email: string): string | null {
  const localPart = email.split("@")[0]?.toLowerCase() || "";
  const fakeLocalParts = [
    "test", "testing", "test123", "fake", "example", "sample",
    "demo", "abc", "xyz", "asdf", "qwerty", "admin", "user",
    "nobody", "noreply", "no-reply", "null", "void", "temp",
    "aaa", "bbb", "ccc", "xxx", "yyy", "zzz", "foobar", "foo",
  ];
  if (fakeLocalParts.includes(localPart)) return "Please use your real email address.";
  if (localPart.length >= 3 && /^(.)\1+$/.test(localPart)) return "Please use your real email address.";
  if (/^\d+$/.test(localPart) && localPart.length <= 6) return "Please use your real email address.";
  const keyboardPatterns = ["asdfgh", "qwerty", "zxcvbn", "hjkl", "qazwsx"];
  if (keyboardPatterns.some((p) => localPart.startsWith(p))) return "Please use your real email address.";
  return null;
}

// ── Routes ──────────────────────────────────────────────────────────────────
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // POST /api/auth-session - verifies Google credential and sets secure session cookie.
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

  // GET /api/auth-me - returns current session user from HttpOnly cookie.
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

  // POST /api/auth-logout - clears session cookie.
  app.post("/api/auth-logout", async (_req: Request, res: Response) => {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ ok: true });
  });

  // POST /api/contact - secure proxy to Google Sheets
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

  // POST /api/log-visit - log page visits to Google Sheets
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
        device: `${device} | ${os} | ${browser}`,
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

  // POST /api/verify-lead - verify lead info and return token (local dev parity with Netlify function)
  app.post("/api/verify-lead", async (req: Request, res: Response) => {
    try {
      // Rate limiting
      const clientIp =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress || "unknown";

      if (isRateLimited(clientIp)) {
        return res.status(429).json({
          message: "Too many attempts. Please wait a few minutes before trying again.",
        });
      }

      const { name, email, phone, business } = req.body;

      // ── Input validation ────────────────────────────────────────────
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ message: "Please enter a valid name (at least 2 characters).", field: "name" });
      }
      if (name.trim().length > 100) {
        return res.status(400).json({ message: "Name is too long.", field: "name" });
      }
      if (isGibberish(name)) {
        return res.status(400).json({ message: "The name you entered doesn't look valid.", field: "name" });
      }
      if (containsProfanity(name)) {
        return res.status(400).json({ message: "Please use appropriate language.", field: "name" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Please enter a valid email address.", field: "email" });
      }

      // Normalize phone
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Please enter your phone number.", field: "phone" });
      }
      const digits = phone.replace(/[\s\-+()]/g, "");
      const phone10 = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
      if (!/^[6-9]\d{9}$/.test(phone10)) {
        return res.status(400).json({ message: "Please enter a valid 10-digit Indian phone number.", field: "phone" });
      }

      // Business (optional)
      if (business && typeof business === "string" && business.trim().length > 200) {
        return res.status(400).json({ message: "Business name is too long.", field: "business" });
      }
      if (business && isGibberish(business)) {
        return res.status(400).json({ message: "The business name doesn't look valid.", field: "business" });
      }

      // ── Phone verification (pattern + NumVerify API) ────────────────
      const phoneFakeReason = isObviousFakePhoneLead(phone10);
      if (phoneFakeReason) {
        return res.status(422).json({ message: phoneFakeReason, field: "phone" });
      }

      const numverifyKey = process.env.NUMVERIFY_API_KEY;
      if (numverifyKey) {
        try {
          const fullNumber = `91${phone10}`;
          const nvRes = await fetch(
            `http://apilayer.net/api/validate?access_key=${numverifyKey}&number=${fullNumber}&country_code=IN&format=1`
          );
          const nvData: any = await nvRes.json();
          console.log("[verify-lead] NumVerify response:", JSON.stringify(nvData).substring(0, 300));
          if (nvData.error) {
            console.warn("[verify-lead] NumVerify API error:", JSON.stringify(nvData.error));
          } else if (!nvData.valid) {
            return res.status(422).json({
              message: "This phone number could not be verified. Please enter a real number.",
              field: "phone",
            });
          }
        } catch (err: any) {
          console.warn("[verify-lead] NumVerify call failed:", err?.message);
        }
      }

      // ── Email verification (pattern + disposable + AbstractAPI + MX) ─
      const emailDomain = email.trim().split("@")[1]?.toLowerCase() || "";
      const DISPOSABLE_DOMAINS = [
        "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
        "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
        "dispostable.com", "trashmail.com", "maildrop.cc", "temp-mail.org",
        "fakeinbox.com", "mailnesia.com", "tempinbox.com", "mohmal.com",
        "getnada.com", "emailondeck.com", "crazymailing.com", "tmail.ws",
      ];
      if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
        return res.status(422).json({
          message: "Disposable email addresses are not accepted. Please use your work email.",
          field: "email",
        });
      }

      const emailFakeReason = isObviousFakeEmailLead(email.trim());
      if (emailFakeReason) {
        return res.status(422).json({ message: emailFakeReason, field: "email" });
      }

      const abstractKey = process.env.ABSTRACT_EMAIL_API_KEY;
      let emailVerifiedByApi = false;
      if (abstractKey) {
        try {
          const aeRes = await fetch(
            `https://emailreputation.abstractapi.com/v1/?api_key=${abstractKey}&email=${encodeURIComponent(email.trim())}`
          );
          const aeData: any = await aeRes.json();
          console.log("[verify-lead] AbstractAPI response:", JSON.stringify(aeData).substring(0, 500));
          if (aeData.error) {
            console.warn("[verify-lead] AbstractAPI error:", JSON.stringify(aeData.error));
          } else {
            const d = aeData.email_deliverability;
            if (d?.status === "undeliverable" || d?.is_smtp_valid === false) {
              return res.status(422).json({
                message: "This email address could not be verified. Please use a valid email.",
                field: "email",
              });
            }
            if (d?.is_format_valid === false) {
              return res.status(422).json({ message: "Invalid email format.", field: "email" });
            }
            if (d?.is_mx_valid === false) {
              return res.status(422).json({
                message: "This email domain does not accept mail. Please use a valid email.",
                field: "email",
              });
            }
            emailVerifiedByApi = true;
          }
        } catch (err: any) {
          console.warn("[verify-lead] AbstractAPI call failed:", err?.message);
        }
      }

      // Fallback: MX record check via Cloudflare DNS-over-HTTPS
      if (!emailVerifiedByApi) {
        try {
          const mxRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${emailDomain}&type=MX`, {
            headers: { Accept: "application/dns-json" },
          });
          const mxData: any = await mxRes.json();
          if (!mxData.Answer || mxData.Answer.length === 0) {
            return res.status(422).json({
              message: "This email domain does not accept mail. Please use a valid email.",
              field: "email",
            });
          }
        } catch {
          return res.status(422).json({
            message: "Could not verify this email address. Please try again.",
            field: "email",
          });
        }
      }

      // ── Store lead to Google Sheets ─────────────────────────────────
      const sheetUrl = process.env.GOOGLE_SHEET_URL;
      if (sheetUrl) {
        const payload = {
          name: name.trim(),
          outlet: business?.trim() || "",
          contact: phone10,
          address: `Email: ${email.trim()}`,
          timestamp: new Date().toISOString(),
          source: "pricing-gate",
          ip: clientIp,
        };
        try {
          await fetch(sheetUrl, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
        } catch (err: any) {
          console.warn("[verify-lead] Google Sheets POST failed:", err?.message);
        }
      }

      // ── Generate token ──────────────────────────────────────────────
      const secret = process.env.AUTH_SESSION_SECRET;
      if (!secret) {
        return res.status(500).json({ message: "Server configuration error." });
      }
      const tokenPayload = { email: email.trim(), ts: Date.now(), exp: Date.now() + 90 * 24 * 60 * 60 * 1000 };
      const encoded = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
      const signature = createHmac("sha256", secret).update(encoded).digest("hex");
      const token = `${encoded}.${signature}`;

      return res.status(200).json({ success: true, token });
    } catch (err: any) {
      console.error("[verify-lead] Error:", err?.message || err);
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  // GET /api/pricing-data - returns pricing data only with a valid lead token
  app.get("/api/pricing-data", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing lead token." });
    }

    const secret = process.env.AUTH_SESSION_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server configuration error." });
    }

    // Verify HMAC signature
    const [payloadPart, sigPart] = token.split(".");
    if (!payloadPart || !sigPart) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const expectedSig = createHmac("sha256", secret).update(payloadPart).digest("hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    const providedBuf = Buffer.from(sigPart, "hex");
    if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Check expiry
    try {
      const payload = JSON.parse(Buffer.from(payloadPart, "base64").toString("utf8"));
      if (!payload.exp || payload.exp <= Date.now()) {
        return res.status(401).json({ message: "Token expired." });
      }
    } catch {
      return res.status(401).json({ message: "Invalid token." });
    }

    return res.status(200).json({
      plans: [
        {
          name: "Starter",
          monthlyPrice: "₹1,499",
          yearlyPrice: "₹14,399",
          yearlyEquivalent: "₹1,200/mo",
          monthlyPeriod: "/outlet/month",
          yearlyPeriod: "/outlet/year",
          yearlySaving: "Save 20%",
          idealFor: "Small restaurants",
          description: "Full billing, ordering, KDS, and menu management for a single outlet.",
          seats: "1",
          extraSeat: "₹499/mo",
          badge: null,
          highlight: false,
        },
        {
          name: "Growth",
          monthlyPrice: "₹2,999",
          yearlyPrice: "₹28,790",
          yearlyEquivalent: "₹2,399/mo",
          monthlyPeriod: "/outlet/month",
          yearlyPeriod: "/outlet/year",
          yearlySaving: "Save 20%",
          idealFor: "Growing restaurants",
          description: "Add inventory management, food costing, promotions, and loyalty to your operations.",
          seats: "2",
          extraSeat: "₹499/mo",
          badge: "Most Popular",
          highlight: true,
        },
        {
          name: "Pro",
          monthlyPrice: "₹4,999",
          yearlyPrice: "₹47,990",
          yearlyEquivalent: "₹3,999/mo",
          monthlyPeriod: "/outlet/month",
          yearlyPeriod: "/outlet/year",
          yearlySaving: "Save 20%",
          idealFor: "Multi-feature outlets",
          description: "Full suite with AI imports, advanced analytics, compliance, CRM, and WhatsApp campaigns.",
          seats: "3",
          extraSeat: "₹499/mo",
          badge: null,
          highlight: false,
        },
        {
          name: "Enterprise",
          monthlyPrice: "₹7,999",
          yearlyPrice: "₹76,790",
          yearlyEquivalent: "₹6,399/mo",
          monthlyPeriod: "/outlet/month",
          yearlyPeriod: "/outlet/year",
          yearlySaving: "Save 20%",
          idealFor: "10+ outlet chains",
          description: "Everything in Pro plus aggregator integration, franchise management, and multi-outlet intelligence.",
          seats: "5",
          extraSeat: "₹399/mo",
          badge: null,
          highlight: false,
        },
      ],
      standalonePlans: [
        {
          tier: "Starter",
          outlets: "1–2",
          license: "₹50,000",
          setup: "₹15,000",
          total: "₹65,000",
          amc: "₹12,000",
          seats: "1/outlet",
          extraSeat: "₹5,000",
        },
        {
          tier: "Growth",
          outlets: "3–10",
          license: "₹1,20,000 (3 outlets)\n+ ₹25,000/extra",
          setup: "₹30,000\n+ ₹8,000/extra",
          total: "₹1,50,000\n(3 outlets)",
          amc: "₹15,000",
          seats: "2/outlet",
          extraSeat: "₹5,000",
        },
        {
          tier: "Pro",
          outlets: "3–10",
          license: "₹1,80,000 (3 outlets)\n+ ₹35,000/extra",
          setup: "₹40,000\n+ ₹10,000/extra",
          total: "₹2,20,000\n(3 outlets)",
          amc: "₹18,000",
          seats: "3/outlet",
          extraSeat: "₹5,000",
        },
        {
          tier: "Enterprise",
          outlets: "10–25+",
          license: "₹3,25,000 (10 outlets)\n+ ₹20,000/extra",
          setup: "₹75,000\n+ ₹5,000/extra",
          total: "₹4,00,000\n(10 outlets)",
          amc: "₹24,000",
          seats: "5/outlet",
          extraSeat: "₹4,000",
        },
      ],
      perFeatureModules: [
        { name: "Inventory & Food Costing", standalonePrice: "₹10,000", subscriptionPrice: "₹499/mo" },
        { name: "Promotions & Coupons", standalonePrice: "₹7,000", subscriptionPrice: "₹399/mo" },
        { name: "Loyalty & Memberships", standalonePrice: "₹5,000", subscriptionPrice: "₹299/mo" },
        { name: "Smart Import (AI)", standalonePrice: "₹5,000", subscriptionPrice: "₹299/mo" },
        { name: "Advanced Analytics", standalonePrice: "₹7,000", subscriptionPrice: "₹499/mo" },
        { name: "Compliance (FSSAI/GST)", standalonePrice: "₹5,000", subscriptionPrice: "₹399/mo" },
        { name: "CRM & Reservations", standalonePrice: "₹7,000", subscriptionPrice: "₹499/mo" },
        { name: "WhatsApp Campaigns", standalonePrice: "₹5,000", subscriptionPrice: "₹399/mo" },
        { name: "Reporting Engine", standalonePrice: "₹7,000", subscriptionPrice: "₹499/mo" },
        { name: "Staff HR & Finance", standalonePrice: "₹5,000", subscriptionPrice: "₹399/mo" },
        { name: "B2B/GST Invoicing", standalonePrice: "₹5,000", subscriptionPrice: "₹299/mo" },
        { name: "Aggregator Integration", standalonePrice: "₹8,000", subscriptionPrice: "₹499/mo" },
        { name: "Franchise Management", standalonePrice: "₹12,000", subscriptionPrice: "₹999/mo" },
      ],
      featureGroups: [
        {
          group: "Core (All Tiers)",
          features: [
            { name: "Ordering (Captain + QR)", values: ["YES", "YES", "YES", "YES"] },
            { name: "KDS (Kitchen Display)", values: ["YES", "YES", "YES", "YES"] },
            { name: "Billing & Payments", values: ["YES", "YES", "YES", "YES"] },
            { name: "Menu/Table/Staff Management", values: ["YES", "YES", "YES", "YES"] },
            { name: "Basic Analytics (today's revenue/orders)", values: ["YES", "YES", "YES", "YES"] },
            { name: "Help & Support", values: ["YES", "YES", "YES", "YES"] },
          ],
        },
        {
          group: "Growth+",
          features: [
            { name: "Inventory & Food Costing", values: ["NO", "YES", "YES", "YES"] },
            { name: "Promotions & Coupons", values: ["NO", "YES", "YES", "YES"] },
            { name: "Loyalty & Memberships", values: ["NO", "YES", "YES", "YES"] },
          ],
        },
        {
          group: "Pro+",
          features: [
            { name: "Smart Import (AI)", values: ["NO", "NO", "YES", "YES"] },
            { name: "Advanced Analytics & Intelligence", values: ["NO", "NO", "YES", "YES"] },
            { name: "Compliance (FSSAI/GST/e-invoice)", values: ["NO", "NO", "YES", "YES"] },
            { name: "CRM & Reservations & Waitlist", values: ["NO", "NO", "YES", "YES"] },
            { name: "WhatsApp Campaigns", values: ["NO", "NO", "YES", "YES"] },
            { name: "Reporting Engine", values: ["NO", "NO", "YES", "YES"] },
            { name: "Staff HR & Finance", values: ["NO", "NO", "YES", "YES"] },
            { name: "B2B/GST Invoicing", values: ["NO", "NO", "YES", "YES"] },
          ],
        },
        {
          group: "Enterprise Only",
          features: [
            { name: "Aggregator Integration (Zomato/Swiggy)", values: ["NO", "NO", "NO", "YES"] },
            { name: "Franchise Management", values: ["NO", "NO", "NO", "YES"] },
            { name: "Multi-outlet Intelligence", values: ["NO", "NO", "NO", "YES"] },
          ],
        },
      ],
      costComparison: {
        title: "7-Year Cost Comparison (Single Outlet)",
        columns: ["", "Standalone Starter", "Subscription Starter", "Petpooja", "POSist"],
        rows: [
          { label: "Year 1", values: ["₹65,000", "₹17,988", "₹18,000–60,000", "₹36,000"] },
          { label: "Year 2", values: ["₹12,000", "₹17,988", "Same", "Same"] },
          { label: "Year 3", values: ["₹12,000", "₹17,988", "Same", "Same"] },
          { label: "Year 4", values: ["₹12,000", "₹17,988", "Same", "Same"] },
          { label: "Year 5+", values: ["₹12,000", "₹17,988", "Same", "Same"] },
          { label: "7-yr Total", values: ["₹1,01,000", "₹1,25,916", "₹1,26,000–4,20,000", "₹2,52,000"] },
        ],
        note: "Standalone saves ₹25K over subscription and ₹1.5L+ over POSist in 7 years.",
      },
    });
  });

  return httpServer;
}
