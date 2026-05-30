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
    const engagementUrl = process.env.GOOGLE_ENGAGEMENT_URL;

    if (!engagementUrl) {
      console.error("[log-engagement] GOOGLE_ENGAGEMENT_URL is not set.");
      return new Response(JSON.stringify({ ok: false }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = {
      timestamp: body.timestamp || new Date().toISOString(),
      sessionId: body.sessionId || "",
      page: body.page || "/pricing",
      timeOnPage: body.timeOnPage || 0,
      timeBucketReached: body.timeBucketReached || "0s",
      maxScrollDepth: body.maxScrollDepth || 0,
      scrollMilestones: body.scrollMilestones || "",
      pricingModelsViewed: body.pricingModelsViewed || "",
      billingToggle: body.billingToggle ? "YES" : "NO",
      ctaClicks: body.ctaClicks || "",
      ctaClickCount: body.ctaClickCount || 0,
      featureTableExpanded: body.featureTableExpanded ? "YES" : "NO",
      tierInteractions: body.tierInteractions || "",
      device: body.device || "",
      screen: body.screen || "",
      referrer: body.referrer || "",
      ip: context.ip || "unknown",
    };

    await fetch(engagementUrl, {
      method: "POST",
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[log-engagement] Error:", err?.message || err);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
