import { useLocation } from "wouter";
import { Check, Minus, ArrowLeft, LogOut, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, getUserInfo } from "@/components/AuthGate";

const logoImg = "/favicon.png";

const plans = [
  {
    name: "Starter",
    price: "₹18,000",
    period: "/month",
    description: "Perfect for single-outlet businesses ready to modernize operations.",
    badge: null,
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹45,000",
    period: "/month",
    description: "For growing businesses that need smarter tools and connectivity.",
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "₹92,000",
    period: "/month",
    description: "Full-scale AI and automation for multi-outlet operations.",
    badge: null,
    highlight: false,
  },
];

type CellValue = "YES" | "NO" | "Basic AI" | "Advanced AI";

type FeatureGroup = {
  group: string;
  features: { name: string; values: CellValue[] }[];
};

const featureGroups: FeatureGroup[] = [
  {
    group: "Core Platform",
    features: [
      { name: "Offline-First System Architecture",                      values: ["YES", "YES", "YES"] },
      { name: "Real-Time Operational Analytics & Business Intelligence", values: ["YES", "YES", "YES"] },
      { name: "High-Performance Billing Engine",                        values: ["YES", "YES", "YES"] },
      { name: "Multi-Device Synchronization",                           values: ["YES", "YES", "YES"] },
      { name: "Intelligent Inventory Management",                       values: ["YES", "YES", "YES"] },
      { name: "Enterprise Security Layer",                              values: ["YES", "YES", "YES"] },
      { name: "Productivity-Optimized User Interface",                  values: ["YES", "YES", "YES"] },
    ],
  },
  {
    group: "Intelligence & AI",
    features: [
      { name: "AI-Powered Order Intelligence",                          values: ["NO", "Basic AI", "Advanced AI"] },
      { name: "Predictive AI Evolution Suite",                          values: ["NO", "NO", "YES"] },
      { name: "Voice Integration for Owner Dashboard",                  values: ["NO", "NO", "YES"] },
    ],
  },
  {
    group: "Reliability & Connectivity",
    features: [
      { name: "Fault-Tolerant System Design",                           values: ["NO", "YES", "YES"] },
      { name: "Open Connectivity Framework",                            values: ["NO", "YES", "YES"] },
      { name: "Automatic Error Recovery",                               values: ["NO", "NO", "YES"] },
    ],
  },
  {
    group: "Enterprise Scale",
    features: [
      { name: "Enterprise-Grade Multi-Outlet Management",               values: ["NO", "NO", "YES"] },
      { name: "Advanced Customer Intelligence & CRM Engine",            values: ["NO", "NO", "YES"] },
      { name: "Automated Operational Monitoring & Optimization",        values: ["NO", "NO", "YES"] },
      { name: "Scalable Architecture & Business Expansion",             values: ["NO", "NO", "YES"] },
    ],
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "YES") return <Check className="w-4 h-4 text-slate-900 mx-auto" strokeWidth={2.5} />;
  if (value === "NO")  return <Minus className="w-4 h-4 text-slate-200 mx-auto" strokeWidth={2} />;
  return (
    <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {value}
    </span>
  );
}

export default function Pricing() {
  const [, navigate] = useLocation();
  const user = getUserInfo();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-[12px] uppercase tracking-widest font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoImg} alt="MatoWork" className="w-7 h-7 rounded-md object-contain" />
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Mato<span className="text-slate-400">Work</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => { window.location.href = "/#contact"; }}
              className="bg-slate-900 text-white hover:bg-slate-800 px-5 py-4 rounded-md h-auto text-[12px] uppercase tracking-widest font-bold border-none shadow-none"
            >
              Book Demo
            </Button>
            {user && (
              <button
                onClick={signOut}
                title={`Signed in as ${user.email}`}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Page hero */}
      <div className="bg-[#fafafa] border-b border-slate-100 py-16 md:py-24 text-center px-4">
        <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400">Plans & Pricing</span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 font-heading">
          Simple, transparent pricing.
        </h1>
        <p className="mt-4 text-slate-500 text-base md:text-lg font-medium max-w-xl mx-auto">
          Every plan includes the full core POS infrastructure. Scale your capabilities as your business grows.
        </p>

        {/* Installation fee callout */}
        <div className="mt-8 inline-flex items-center gap-3 bg-white border border-slate-200 rounded-sm px-6 py-4 shadow-sm">
          <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="text-left">
            <p className="text-[12px] uppercase tracking-widest font-bold text-slate-400">One-Time Setup</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">
              ₹45,000 installation fee &mdash;{" "}
              <span className="font-normal text-slate-500">custom pricing available upon consultation</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-5xl">

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4 mb-1">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative rounded-sm p-6 md:p-8 text-center flex flex-col ${
                i === 2
                  ? "bg-slate-900 text-white"
                  : plan.highlight
                  ? "bg-white border-2 border-slate-900"
                  : "bg-white border border-slate-200"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm whitespace-nowrap">
                    {plan.badge}
                  </span>
                </div>
              )}

              <p className={`text-[11px] uppercase tracking-[0.25em] font-bold mb-2 ${i === 2 ? "text-slate-400" : "text-slate-400"}`}>
                {plan.name}
              </p>
              <p className={`text-3xl md:text-4xl font-bold font-heading tracking-tight ${i === 2 ? "text-white" : "text-slate-900"}`}>
                {plan.price}
              </p>
              <p className={`text-xs font-medium mt-1 ${i === 2 ? "text-slate-400" : "text-slate-400"}`}>
                {plan.period}
              </p>
              <p className={`text-[12px] leading-relaxed mt-3 mb-0 flex-1 ${i === 2 ? "text-slate-400" : "text-slate-500"}`}>
                {plan.description}
              </p>
              <Button
                onClick={() => { window.location.href = "/#contact"; }}
                className={`mt-5 w-full h-10 text-[11px] uppercase tracking-widest font-bold rounded-none shadow-none ${
                  i === 2
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : plan.highlight
                    ? "bg-slate-900 text-white hover:bg-slate-700"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="overflow-x-auto rounded-sm border border-slate-100 mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-4 px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400 w-1/2">
                  Features
                </th>
                {plans.map((p) => (
                  <th key={p.name} className="py-4 px-4 text-[11px] uppercase tracking-widest font-bold text-slate-900 text-center">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureGroups.map((group) => (
                <>
                  {/* Group header row */}
                  <tr key={`group-${group.group}`} className="bg-slate-50 border-b border-t border-slate-100">
                    <td
                      colSpan={4}
                      className="py-2.5 px-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {/* Feature rows */}
                  {group.features.map((feature, i) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}
                    >
                      <td className="py-3.5 px-5 text-slate-700 font-medium text-[13px]">
                        {feature.name}
                      </td>
                      {feature.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-4 text-center">
                          <Cell value={val} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 border border-slate-100 rounded-sm bg-[#fafafa] px-8 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">Ready to get started?</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Book a demo with our team.
          </h2>
          <p className="mt-3 text-slate-500 text-sm font-medium max-w-md mx-auto">
            All plans include dedicated onboarding support. Custom pricing available for volume and multi-outlet deployments.
          </p>
          <Button
            onClick={() => { window.location.href = "/#contact"; }}
            className="mt-7 bg-slate-900 text-white hover:bg-slate-800 h-13 px-10 text-[12px] uppercase tracking-widest font-bold rounded-none shadow-none"
          >
            Book a Demo
          </Button>
          <p className="mt-4 text-slate-400 text-xs font-medium">
            One-time installation: ₹45,000 &middot; Custom rates on consultation
          </p>
        </div>
      </div>
    </div>
  );
}
