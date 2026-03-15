import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const sheetUrl = process.env.GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      console.error("[log-visit] GOOGLE_SHEET_URL is not set.");
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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

    const payload = {
      action: "visit",
      timestamp: body.timestamp || new Date().toISOString(),
      page: body.page || "",
      ip: context.ip || "unknown",
      device: `${device} — ${os} — ${browser}`,
      screen: body.screen || "",
      referrer: body.referrer || "",
      language: body.language || "",
    };

    await fetch(sheetUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[log-visit] Error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
