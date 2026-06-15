import type { Context } from "@netlify/functions";

// ── Rate Limiter (in-memory sliding window) ─────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length >= RATE_LIMIT_MAX) {
        rateLimitMap.set(ip, valid);
        return true;
    }
    valid.push(now);
    rateLimitMap.set(ip, valid);
    return false;
}

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

    if (/(.)\1{4,}/.test(cleaned)) return true;
    if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(cleaned)) return true;

    const letterCount = (cleaned.match(/[a-zA-Z]/g) || []).length;
    if (cleaned.length > 5 && letterCount / cleaned.length < 0.3) return true;

    const keyboardPatterns = [
        "asdf", "qwer", "zxcv", "hjkl", "yuio", "bnm,",
        "fdsa", "rewq", "vcxz", "lkjh",
    ];
    const lowerText = text.toLowerCase();
    const keyboardHits = keyboardPatterns.filter((p) => lowerText.includes(p));
    if (keyboardHits.length >= 2) return true;

    return false;
}

// ── Phone Verification ──────────────────────────────────────────────────────
function normalizeIndianPhone(raw: string): string | null {
    const digits = raw.replace(/[\s\-+()]/g, "");
    // Remove leading 91 country code if present
    const cleaned = digits.startsWith("91") && digits.length === 12
        ? digits.slice(2)
        : digits;
    // Must be 10 digits starting with 6-9
    if (/^[6-9]\d{9}$/.test(cleaned)) return cleaned;
    return null;
}

function isObviousFakePhone(phone10: string): string | null {
    // All same digits: 9999999999, 8888888888, etc.
    if (/^(\d)\1{9}$/.test(phone10)) return "This doesn't look like a real phone number.";
    // Sequential ascending: 6789012345, 9876543210, etc.
    const ascending = "0123456789012345";
    const descending = "9876543210987654";
    if (ascending.includes(phone10) || descending.includes(phone10))
        return "This doesn't look like a real phone number.";
    // Repeated 2-digit pattern: 9898989898, 7878787878
    if (/^(\d{2})\1{4}$/.test(phone10)) return "This doesn't look like a real phone number.";
    // Repeated 3-digit pattern: 9879879870 (close enough)
    if (/^(\d{3})\1{2}\d$/.test(phone10)) return "This doesn't look like a real phone number.";
    // Starts with 6-9 but rest all zeros: 9000000000
    if (/^[6-9]0{9}$/.test(phone10)) return "This doesn't look like a real phone number.";
    // All digits after first are same: 9111111111
    if (/^[6-9](\d)\1{8}$/.test(phone10)) return "This doesn't look like a real phone number.";
    // Common test numbers
    const testNumbers = ["9876543210", "8765432109", "7654321098", "6543210987", "9123456789", "9012345678"];
    if (testNumbers.includes(phone10)) return "This doesn't look like a real phone number.";
    return null;
}

async function verifyPhone(phone10: string): Promise<{ valid: boolean; reason?: string }> {
    // Always run pattern check first
    const fakeReason = isObviousFakePhone(phone10);
    if (fakeReason) return { valid: false, reason: fakeReason };

    // Try NumVerify API if key is set
    const apiKey = process.env.NUMVERIFY_API_KEY;
    if (apiKey) {
        try {
            const fullNumber = `91${phone10}`;
            const res = await fetch(
                `http://apilayer.net/api/validate?access_key=${apiKey}&number=${fullNumber}&country_code=IN&format=1`
            );
            const data = await res.json();

            console.log("[verify-lead] NumVerify response:", JSON.stringify(data).substring(0, 300));

            if (data.error) {
                console.warn("[verify-lead] NumVerify API error:", JSON.stringify(data.error));
                // Fall through to pattern-only validation (already passed above)
            } else if (!data.valid) {
                return { valid: false, reason: "This phone number could not be verified. Please enter a real number." };
            }
        } catch (err: any) {
            console.warn("[verify-lead] NumVerify call failed:", err?.message);
        }
    } else {
        console.warn("[verify-lead] NUMVERIFY_API_KEY not set, using pattern-only phone validation");
    }

    return { valid: true };
}

// ── Email Verification ──────────────────────────────────────────────────────
const DISPOSABLE_DOMAINS = [
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "dispostable.com", "trashmail.com", "maildrop.cc", "temp-mail.org",
    "fakeinbox.com", "mailnesia.com", "tempinbox.com", "mohmal.com",
    "getnada.com", "emailondeck.com", "crazymailing.com", "tmail.ws",
];

function isObviousFakeEmail(email: string): string | null {
    const localPart = email.split("@")[0]?.toLowerCase() || "";
    // Common test/fake local parts
    const fakeLocalParts = [
        "test", "testing", "test123", "fake", "example", "sample",
        "demo", "abc", "xyz", "asdf", "qwerty", "admin", "user",
        "nobody", "noreply", "no-reply", "null", "void", "temp",
        "aaa", "bbb", "ccc", "xxx", "yyy", "zzz", "foobar", "foo",
    ];
    if (fakeLocalParts.includes(localPart)) return "Please use your real email address.";
    // All same character: aaaa@, 1111@
    if (localPart.length >= 3 && /^(.)\1+$/.test(localPart)) return "Please use your real email address.";
    // Pure numbers: 123456@gmail.com
    if (/^\d+$/.test(localPart) && localPart.length <= 6) return "Please use your real email address.";
    // Keyboard mash: asdfgh@, qwerty@
    const keyboardPatterns = ["asdfgh", "qwerty", "zxcvbn", "hjkl", "qazwsx"];
    if (keyboardPatterns.some((p) => localPart.startsWith(p))) return "Please use your real email address.";
    return null;
}

async function verifyEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return { valid: false, reason: "Invalid email format." };

    // Check disposable domains
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        return { valid: false, reason: "Disposable email addresses are not accepted. Please use your work email." };
    }

    // Check obvious fake local parts
    const fakeReason = isObviousFakeEmail(email);
    if (fakeReason) return { valid: false, reason: fakeReason };

    // Try AbstractAPI if key is set
    const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
    if (apiKey) {
        try {
            const res = await fetch(
                `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`
            );
            const data = await res.json();

            console.log("[verify-lead] AbstractAPI response:", JSON.stringify(data).substring(0, 300));

            if (data.error) {
                console.warn("[verify-lead] AbstractAPI error:", JSON.stringify(data.error));
                // Fall through to MX check
            } else {
                if (data.deliverability === "UNDELIVERABLE") {
                    return { valid: false, reason: "This email address could not be verified. Please use a valid email." };
                }
                if (data.is_disposable_email?.value) {
                    return { valid: false, reason: "Disposable email addresses are not accepted. Please use your work email." };
                }
                if (data.is_valid_format?.value === false) {
                    return { valid: false, reason: "Invalid email format." };
                }
                // If API returned a result, trust it
                return { valid: true };
            }
        } catch (err: any) {
            console.warn("[verify-lead] AbstractAPI call failed:", err?.message);
            // Fall through to MX check
        }
    }

    // Fallback: MX record check via Cloudflare DNS-over-HTTPS
    try {
        const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
            headers: { Accept: "application/dns-json" },
        });
        const data = await res.json();
        if (!data.Answer || data.Answer.length === 0) {
            return { valid: false, reason: "This email domain does not accept mail. Please use a valid email." };
        }
        return { valid: true };
    } catch {
        // If even DNS fails, reject rather than accept blindly
        return { valid: false, reason: "Could not verify this email address. Please try again." };
    }
}

// ── Token Generation ────────────────────────────────────────────────────────
async function generateLeadToken(email: string, secret: string): Promise<string> {
    const payload = {
        email,
        ts: Date.now(),
        exp: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
    };
    const encoded = btoa(JSON.stringify(payload));

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encoded));
    const hex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return `${encoded}.${hex}`;
}

// ── Device Detection ────────────────────────────────────────────────────────
function getDeviceInfo(ua: string): string {
    const device = /mobile/i.test(ua) ? "Mobile" : /tablet/i.test(ua) ? "Tablet" : "Desktop";
    let os = "Unknown";
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";

    let browser = "Unknown";
    if (/edg/i.test(ua)) browser = "Edge";
    else if (/chrome/i.test(ua)) browser = "Chrome";
    else if (/safari/i.test(ua)) browser = "Safari";
    else if (/firefox/i.test(ua)) browser = "Firefox";

    return `${device} | ${os} | ${browser}`;
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async (req: Request, context: Context) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ message: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const clientIp = context.ip || "unknown";

        if (isRateLimited(clientIp)) {
            return new Response(
                JSON.stringify({ message: "Too many attempts. Please wait a few minutes before trying again." }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { name, email, phone, business } = body;

        // ── Input validation ────────────────────────────────────────────
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return new Response(
                JSON.stringify({ message: "Please enter a valid name (at least 2 characters).", field: "name" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        if (name.trim().length > 100) {
            return new Response(
                JSON.stringify({ message: "Name is too long.", field: "name" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        if (isGibberish(name)) {
            return new Response(
                JSON.stringify({ message: "The name you entered doesn't look valid.", field: "name" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        if (containsProfanity(name)) {
            return new Response(
                JSON.stringify({ message: "Please use appropriate language.", field: "name" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Email format
        if (!email || typeof email !== "string") {
            return new Response(
                JSON.stringify({ message: "Please enter your email address.", field: "email" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return new Response(
                JSON.stringify({ message: "Please enter a valid email address.", field: "email" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Phone format
        if (!phone || typeof phone !== "string") {
            return new Response(
                JSON.stringify({ message: "Please enter your phone number.", field: "phone" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        const phone10 = normalizeIndianPhone(phone);
        if (!phone10) {
            return new Response(
                JSON.stringify({ message: "Please enter a valid 10-digit Indian phone number.", field: "phone" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Business (optional)
        if (business && typeof business === "string" && business.trim().length > 200) {
            return new Response(
                JSON.stringify({ message: "Business name is too long.", field: "business" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
        if (business && isGibberish(business)) {
            return new Response(
                JSON.stringify({ message: "The business name doesn't look valid.", field: "business" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── Phone verification ──────────────────────────────────────────
        const phoneResult = await verifyPhone(phone10);
        if (!phoneResult.valid) {
            return new Response(
                JSON.stringify({ message: phoneResult.reason, field: "phone" }),
                { status: 422, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── Email verification ──────────────────────────────────────────
        const emailResult = await verifyEmail(email.trim());
        if (!emailResult.valid) {
            return new Response(
                JSON.stringify({ message: emailResult.reason, field: "email" }),
                { status: 422, headers: { "Content-Type": "application/json" } }
            );
        }

        // ── Store lead to Google Sheets (Inquiries tab) ─────────────────
        const sheetUrl = process.env.GOOGLE_SHEET_URL;
        if (sheetUrl) {
            const ua = req.headers.get("user-agent") || "";
            const payload = {
                name: name.trim(),
                outlet: business?.trim() || "",
                contact: phone10,
                address: `Email: ${email.trim()}`,
                timestamp: new Date().toISOString(),
                source: "pricing-gate",
                ip: clientIp,
                device: getDeviceInfo(ua),
            };

            try {
                const sheetRes = await fetch(sheetUrl, {
                    method: "POST",
                    body: JSON.stringify(payload),
                    redirect: "follow",
                });
                if (!sheetRes.ok) {
                    console.warn("[verify-lead] Google Sheets returned non-2xx:", sheetRes.status);
                }
            } catch (err: any) {
                console.warn("[verify-lead] Google Sheets POST failed:", err?.message);
            }
        } else {
            console.warn("[verify-lead] GOOGLE_SHEET_URL not set. Lead not stored.");
        }

        // ── Generate token ──────────────────────────────────────────────
        const secret = process.env.AUTH_SESSION_SECRET;
        if (!secret) {
            console.error("[verify-lead] AUTH_SESSION_SECRET not set.");
            return new Response(
                JSON.stringify({ message: "Server configuration error." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

        const token = await generateLeadToken(email.trim(), secret);

        return new Response(
            JSON.stringify({ success: true, token }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err: any) {
        console.error("[verify-lead] Error:", err?.message || err);
        return new Response(
            JSON.stringify({ message: "Something went wrong. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
