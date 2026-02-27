import type { Express, Request, Response } from "express";
import { type Server } from "http";

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

  // Outlet checks (optional, only validate if present)
  if (fields.outlet && fields.outlet.trim().length > 0) {
    if (fields.outlet.trim().length > 200) return "Outlet name is too long.";
    if (isGibberish(fields.outlet)) {
      return "The outlet name doesn't look valid.";
    }
    if (containsProfanity(fields.outlet)) {
      return "Please use appropriate language in the outlet field.";
    }
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

      const sheetRes = await fetch(sheetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
      });

      const sheetBody = await sheetRes.text().catch(() => "");
      console.log("[contact] Google Sheets response:", sheetRes.status, sheetBody);

      if (!sheetRes.ok) {
        console.error("[contact] Google Sheets error:", sheetRes.status, sheetBody);
        return res.status(502).json({
          message: "Failed to save inquiry. Please try again later.",
        });
      }

      return res.status(200).json({
        message: "Inquiry received. Thank you!",
      });
    } catch (err) {
      console.error("[contact] Error processing contact form:", err);
      return res.status(500).json({
        message: "Something went wrong. Please try again later.",
      });
    }
  });

  return httpServer;
}
