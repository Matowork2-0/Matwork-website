import type { Context } from "@netlify/functions";

// ── Token Verification (Web Crypto API) ──────────────────────────────────────
async function verifyLeadToken(
  token: string,
  secret: string,
): Promise<boolean> {
  const [payloadPart, sigPart] = token.split(".");
  if (!payloadPart || !sigPart) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const expectedSig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadPart),
  );
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (expectedHex.length !== sigPart.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ sigPart.charCodeAt(i);
  }
  if (diff !== 0) return false;

  // Check expiry
  try {
    const payload = JSON.parse(atob(payloadPart));
    if (!payload.exp || payload.exp <= Date.now()) return false;
  } catch {
    return false;
  }

  return true;
}

// ── Pricing Data ─────────────────────────────────────────────────────────────
const PRICING_DATA = {
  plans: [
    {
      name: "Starter",
      monthlyPrice: "₹4,999",
      yearlyPrice: "₹49,990",
      monthlyPeriod: "/outlet/month",
      yearlyPeriod: "/outlet/year",
      yearlySaving: "Save ₹10,000",
      idealFor: "1–2 outlets",
      description:
        "Full offline-first control suite for single or dual-outlet operations.",
      badge: null,
      highlight: false,
    },
    {
      name: "Growth",
      monthlyPrice: "₹9,999",
      yearlyPrice: "₹99,990",
      monthlyPeriod: "/outlet/month",
      yearlyPeriod: "/outlet/year",
      yearlySaving: "Save ₹20,000",
      idealFor: "3–10 outlets",
      description:
        "Cross-outlet visibility, anomaly comparison, and centralized owner dashboard.",
      badge: "Most Popular",
      highlight: true,
    },
    {
      name: "Enterprise",
      monthlyPrice: "₹19,999",
      yearlyPrice: "₹1,99,990",
      monthlyPeriod: "/outlet/month",
      yearlyPeriod: "/outlet/year",
      yearlySaving: "Save ₹40,000",
      idealFor: "10+ outlet chains",
      description:
        "Advanced AI, fleet licensing, inter-outlet transfers, and dedicated support.",
      badge: null,
      highlight: false,
    },
  ],
  standalonePlans: [
    {
      tier: "Starter",
      outlets: "1–2 outlets",
      license: "₹1,50,000",
      setup: "₹50,000",
      total: "₹2,00,000",
      amc: "₹36,000 / outlet",
    },
    {
      tier: "Growth",
      outlets: "3–10 outlets",
      license: "₹3,50,000 (3 outlets)\n+ ₹40,000 / extra",
      setup: "₹1,00,000 (3 outlets)\n+ ₹20,000 / extra",
      total: "₹4,50,000\n(3 outlets)",
      amc: "₹42,000 / outlet",
    },
    {
      tier: "Enterprise",
      outlets: "10–25 outlets",
      license: "₹7,00,000 (10 outlets)\n+ ₹35,000 / extra",
      setup: "₹2,50,000 (10 outlets)\n+ ₹15,000 / extra",
      total: "₹9,50,000\n(10 outlets)",
      amc: "₹54,000 / outlet",
    },
    {
      tier: "Enterprise Plus",
      outlets: "25+ outlets",
      license: "Custom",
      setup: "Custom",
      total: "Custom",
      amc: "₹72,000 / outlet",
    },
  ],
  featureGroups: [
    {
      group: "Core Control",
      features: [
        {
          name: "Offline-First: Full Ops Without Internet",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Full Data Ownership (Local Postgres)",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Fraud Detection & Audit Trails",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Recipe-Level Food Costing (BOM)",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Dual QR Ordering (LAN + Cloud)",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Owner Dashboard on Any Device",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "Waste & Pilferage Tracking",
          values: ["YES", "YES", "YES"],
        },
        {
          name: "DPDP Compliance (PII Erasure & Consent)",
          values: ["YES", "YES", "YES"],
        },
      ],
    },
    {
      group: "Multi-Outlet & Scale",
      features: [
        {
          name: "Cross-Outlet Anomaly Comparison",
          values: ["NO", "YES", "YES"],
        },
        {
          name: "Inter-Outlet Stock Transfers",
          values: ["NO", "YES", "YES"],
        },
        {
          name: "Centralized Owner Dashboard",
          values: ["NO", "YES", "YES"],
        },
        { name: "B2B Invoicing with GST", values: ["NO", "YES", "YES"] },
        {
          name: "Loyalty & Promotions Engine",
          values: ["NO", "YES", "YES"],
        },
      ],
    },
    {
      group: "Intelligence & AI",
      features: [
        {
          name: "AI Anomaly Detection",
          values: ["NO", "Basic AI", "Advanced AI"],
        },
        {
          name: "Customer Spend & Retention Tracking",
          values: ["NO", "YES", "YES"],
        },
        {
          name: "Customer Profitability Analysis",
          values: ["NO", "NO", "YES"],
        },
        {
          name: "Predictive Demand & Cost Alerts",
          values: ["NO", "NO", "YES"],
        },
      ],
    },
    {
      group: "Enterprise",
      features: [
        {
          name: "Fleet Licensing (Ed25519 Signed Leases)",
          values: ["NO", "NO", "YES"],
        },
        {
          name: "Integration Adapters (Tally, SAP, Zoho)",
          values: ["NO", "NO", "YES"],
        },
        {
          name: "Dedicated Account Manager",
          values: ["NO", "NO", "YES"],
        },
        { name: "Voice Owner Dashboard", values: ["NO", "NO", "YES"] },
      ],
    },
  ],
};

// ── Handler ──────────────────────────────────────────────────────────────────
export default async (req: Request, _context: Context) => {
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ message: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return new Response(
      JSON.stringify({ message: "Missing lead token." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const secret = Netlify.env.get("AUTH_SESSION_SECRET");
  if (!secret) {
    return new Response(
      JSON.stringify({ message: "Server configuration error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const valid = await verifyLeadToken(token, secret);
  if (!valid) {
    return new Response(
      JSON.stringify({ message: "Invalid or expired token." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify(PRICING_DATA), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
