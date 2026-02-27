import type { Context } from "@netlify/functions";

// ── Rate Limiter (in-memory sliding window) ─────────────────────────────────
// NOTE: Netlify Functions are stateless — each cold start resets this.
// This still protects against rapid-fire bursts within a warm instance.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
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

function validateContent(fields: {
    name: string;
    outlet: string;
    contact: string;
    address: string;
}): string | null {
    if (!fields.name || fields.name.trim().length < 2)
        return "Please enter a valid name (at least 2 characters).";
    if (fields.name.trim().length > 100) return "Name is too long.";
    if (isGibberish(fields.name))
        return "The name you entered doesn't look valid. Please enter your real name.";
    if (containsProfanity(fields.name))
        return "Please use appropriate language in the name field.";

    if (!fields.contact || fields.contact.trim().length < 5)
        return "Please enter a valid contact number.";
    const contactRegex = /^[\d\s\-+()]{5,20}$/;
    if (!contactRegex.test(fields.contact.trim()))
        return "Please enter a valid contact number.";

    if (fields.outlet && fields.outlet.trim().length > 0) {
        if (fields.outlet.trim().length > 200) return "Outlet name is too long.";
        if (isGibberish(fields.outlet)) return "The outlet name doesn't look valid.";
        if (containsProfanity(fields.outlet))
            return "Please use appropriate language in the outlet field.";
    }

    if (fields.address && fields.address.trim().length > 0) {
        if (fields.address.trim().length > 500) return "Address is too long.";
        if (containsProfanity(fields.address))
            return "Please use appropriate language in the address field.";
    }

    return null;
}

// ── Handler ─────────────────────────────────────────────────────────────────
export default async (req: Request, context: Context) => {
    // Only allow POST
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
                JSON.stringify({
                    message: "Too many requests. Please wait a few minutes before trying again.",
                }),
                { status: 429, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await req.json();
        const { name, outlet, contact, address } = body;

        const validationError = validateContent({ name, outlet, contact, address });
        if (validationError) {
            return new Response(JSON.stringify({ message: validationError }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Google Sheets proxy
        const sheetUrl = process.env.GOOGLE_SHEET_URL;
        if (!sheetUrl) {
            console.error("[contact] GOOGLE_SHEET_URL is NOT set. Form data lost.");
            return new Response(
                JSON.stringify({ message: "Server configuration error. Please try again later." }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        }

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
            return new Response(
                JSON.stringify({ message: "Failed to save inquiry. Please try again later." }),
                { status: 502, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ message: "Inquiry received. Thank you!" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        console.error("[contact] Error processing contact form:", err);
        return new Response(
            JSON.stringify({
                message: "Something went wrong. Please try again later.",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
