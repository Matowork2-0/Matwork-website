import type { Context } from "@netlify/functions";

// Logs user login activity to a Google Sheet via Apps Script.
// Columns written: Timestamp | Name | Email | Action
export default async (req: Request, _context: Context) => {
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ message: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    const logUrl = process.env.GOOGLE_ACTIVITY_LOG_URL;
    if (!logUrl) {
        // Silently succeed — logging is non-critical, don't block the user
        console.warn("[log-activity] GOOGLE_ACTIVITY_LOG_URL is not set. Login not logged.");
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const body = await req.json();
        const { name, email, action = "login" } = body;

        if (!email) {
            return new Response(JSON.stringify({ message: "Missing email" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const payload = {
            timestamp: new Date().toISOString(),
            name: name || "",
            email,
            action,
        };

        console.log(`[log-activity] Logging: ${email} — ${action}`);

        const res = await fetch(logUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            redirect: "follow",
        });

        const resText = await res.text().catch(() => "");
        console.log("[log-activity] Sheet response:", res.status, resText.substring(0, 200));
        if (!res.ok) {
            console.warn("[log-activity] Sheet endpoint returned non-2xx.");
        }

        // Non-critical — return 200 regardless so the UI is never blocked
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err: any) {
        console.error("[log-activity] Error:", err?.message || err);
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
};
