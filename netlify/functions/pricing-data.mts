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
    { name: "Starter", monthlyPrice: "₹1,499", yearlyPrice: "₹14,399", yearlyEquivalent: "₹1,200/mo", monthlyPeriod: "/outlet/month", yearlyPeriod: "/outlet/year", yearlySaving: "Save 20%", idealFor: "Small restaurants", description: "Full billing, ordering, KDS, and menu management for a single outlet.", seats: "1", extraSeat: "₹499/mo", badge: null, highlight: false },
    { name: "Growth", monthlyPrice: "₹2,999", yearlyPrice: "₹28,790", yearlyEquivalent: "₹2,399/mo", monthlyPeriod: "/outlet/month", yearlyPeriod: "/outlet/year", yearlySaving: "Save 20%", idealFor: "Growing restaurants", description: "Add inventory management, food costing, promotions, and loyalty to your operations.", seats: "2", extraSeat: "₹499/mo", badge: "Most Popular", highlight: true },
    { name: "Pro", monthlyPrice: "₹4,999", yearlyPrice: "₹47,990", yearlyEquivalent: "₹3,999/mo", monthlyPeriod: "/outlet/month", yearlyPeriod: "/outlet/year", yearlySaving: "Save 20%", idealFor: "Multi-feature outlets", description: "Full suite with AI imports, advanced analytics, compliance, CRM, and WhatsApp campaigns.", seats: "3", extraSeat: "₹499/mo", badge: null, highlight: false },
    { name: "Enterprise", monthlyPrice: "₹7,999", yearlyPrice: "₹76,790", yearlyEquivalent: "₹6,399/mo", monthlyPeriod: "/outlet/month", yearlyPeriod: "/outlet/year", yearlySaving: "Save 20%", idealFor: "10+ outlet chains", description: "Everything in Pro plus aggregator integration, franchise management, and multi-outlet intelligence.", seats: "5", extraSeat: "₹399/mo", badge: null, highlight: false },
  ],
  standalonePlans: [
    { tier: "Starter", outlets: "1–2", license: "₹50,000", setup: "₹15,000", total: "₹65,000", amc: "₹12,000", seats: "1/outlet", extraSeat: "₹5,000" },
    { tier: "Growth", outlets: "3–10", license: "₹1,20,000 (3 outlets)\n+ ₹25,000/extra", setup: "₹30,000\n+ ₹8,000/extra", total: "₹1,50,000\n(3 outlets)", amc: "₹15,000", seats: "2/outlet", extraSeat: "₹5,000" },
    { tier: "Pro", outlets: "3–10", license: "₹1,80,000 (3 outlets)\n+ ₹35,000/extra", setup: "₹40,000\n+ ₹10,000/extra", total: "₹2,20,000\n(3 outlets)", amc: "₹18,000", seats: "3/outlet", extraSeat: "₹5,000" },
    { tier: "Enterprise", outlets: "10–25+", license: "₹3,25,000 (10 outlets)\n+ ₹20,000/extra", setup: "₹75,000\n+ ₹5,000/extra", total: "₹4,00,000\n(10 outlets)", amc: "₹24,000", seats: "5/outlet", extraSeat: "₹4,000" },
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
    { group: "Core (All Tiers)", features: [
      { name: "Ordering (Captain + QR)", values: ["YES", "YES", "YES", "YES"] },
      { name: "KDS (Kitchen Display)", values: ["YES", "YES", "YES", "YES"] },
      { name: "Billing & Payments", values: ["YES", "YES", "YES", "YES"] },
      { name: "Menu/Table/Staff Management", values: ["YES", "YES", "YES", "YES"] },
      { name: "Basic Analytics (today's revenue/orders)", values: ["YES", "YES", "YES", "YES"] },
      { name: "Help & Support", values: ["YES", "YES", "YES", "YES"] },
    ]},
    { group: "Growth+", features: [
      { name: "Inventory & Food Costing", values: ["NO", "YES", "YES", "YES"] },
      { name: "Promotions & Coupons", values: ["NO", "YES", "YES", "YES"] },
      { name: "Loyalty & Memberships", values: ["NO", "YES", "YES", "YES"] },
    ]},
    { group: "Pro+", features: [
      { name: "Smart Import (AI)", values: ["NO", "NO", "YES", "YES"] },
      { name: "Advanced Analytics & Intelligence", values: ["NO", "NO", "YES", "YES"] },
      { name: "Compliance (FSSAI/GST/e-invoice)", values: ["NO", "NO", "YES", "YES"] },
      { name: "CRM & Reservations & Waitlist", values: ["NO", "NO", "YES", "YES"] },
      { name: "WhatsApp Campaigns", values: ["NO", "NO", "YES", "YES"] },
      { name: "Reporting Engine", values: ["NO", "NO", "YES", "YES"] },
      { name: "Staff HR & Finance", values: ["NO", "NO", "YES", "YES"] },
      { name: "B2B/GST Invoicing", values: ["NO", "NO", "YES", "YES"] },
    ]},
    { group: "Enterprise Only", features: [
      { name: "Aggregator Integration (Zomato/Swiggy)", values: ["NO", "NO", "NO", "YES"] },
      { name: "Franchise Management", values: ["NO", "NO", "NO", "YES"] },
      { name: "Multi-outlet Intelligence", values: ["NO", "NO", "NO", "YES"] },
    ]},
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
