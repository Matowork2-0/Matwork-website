import { useLocation } from "wouter";
import { Check, Minus, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, getUserInfo } from "@/components/AuthGate";

const logoImg = "/favicon.png";

const plans = [
  { name: "Starter", price: "₹18,000", period: "/month" },
  { name: "Growth", price: "₹45,000", period: "/month" },
  { name: "Enterprise", price: "₹92,000", period: "/month" },
];

type CellValue = "YES" | "NO" | "Basic AI" | "Advanced AI";

const features: { name: string; values: CellValue[] }[] = [
  { name: "Offline-First System Architecture",                     values: ["YES", "YES", "YES"] },
  { name: "Real-Time Operational Analytics & Business Intelligence", values: ["YES", "YES", "YES"] },
  { name: "High-Performance Billing Engine",                       values: ["YES", "YES", "YES"] },
  { name: "Multi-Device Synchronization",                          values: ["YES", "YES", "YES"] },
  { name: "Intelligent Inventory Management",                      values: ["YES", "YES", "YES"] },
  { name: "Enterprise Security Layer",                             values: ["YES", "YES", "YES"] },
  { name: "Productivity-Optimized User Interface",                 values: ["YES", "YES", "YES"] },
  { name: "AI-Powered Order Intelligence",                         values: ["NO", "Basic AI", "Advanced AI"] },
  { name: "Automatic Error Recovery",                              values: ["NO", "NO", "YES"] },
  { name: "Enterprise-Grade Multi-Outlet Management",              values: ["NO", "NO", "YES"] },
  { name: "Advanced Customer Intelligence & CRM Engine",           values: ["NO", "NO", "YES"] },
  { name: "Automated Operational Monitoring & Optimization",       values: ["NO", "NO", "YES"] },
  { name: "Scalable Architecture & Business Expansion",            values: ["NO", "NO", "YES"] },
  { name: "Predictive AI Evolution Suite",                         values: ["NO", "NO", "YES"] },
  { name: "Voice Integration for Owner Dashboard",                 values: ["NO", "NO", "YES"] },
  { name: "Open Connectivity Framework",                           values: ["NO", "YES", "YES"] },
  { name: "Fault-Tolerant System Design",                          values: ["NO", "YES", "YES"] },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "YES") return <Check className="w-4 h-4 text-slate-900 mx-auto" strokeWidth={2.5} />;
  if (value === "NO")  return <Minus className="w-4 h-4 text-slate-300 mx-auto" strokeWidth={2} />;
  return <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">{value}</span>;
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
              onClick={() => navigate("/")}
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

      {/* Page header */}
      <div className="bg-[#fafafa] border-b border-slate-100 py-14 md:py-20 text-center px-4">
        <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400">Plans & Pricing</span>
        <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 font-heading">
          Simple, transparent pricing.
        </h1>
        <p className="mt-4 text-slate-500 text-base md:text-lg font-medium max-w-xl mx-auto">
          Every plan includes our core POS infrastructure. Scale up as your business grows.
        </p>
      </div>

      {/* Pricing table */}
      <div className="container mx-auto px-4 sm:px-6 py-12 md:py-20 max-w-5xl">

        {/* Plan cards */}
        <div className="grid grid-cols-3 gap-4 mb-2">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`rounded-sm p-6 md:p-8 text-center ${
                i === 2
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200"
              }`}
            >
              <p className={`text-[11px] uppercase tracking-[0.25em] font-bold mb-3 ${i === 2 ? "text-slate-400" : "text-slate-400"}`}>
                {plan.name}
              </p>
              <p className={`text-3xl md:text-4xl font-bold font-heading tracking-tight ${i === 2 ? "text-white" : "text-slate-900"}`}>
                {plan.price}
              </p>
              <p className={`text-xs font-medium mt-1 ${i === 2 ? "text-slate-400" : "text-slate-400"}`}>
                {plan.period}
              </p>
              <Button
                onClick={() => navigate("/#contact")}
                className={`mt-5 w-full h-10 text-[11px] uppercase tracking-widest font-bold rounded-none shadow-none ${
                  i === 2
                    ? "bg-white text-slate-900 hover:bg-slate-100"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="overflow-x-auto rounded-sm border border-slate-100">
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
              {features.map((feature, i) => (
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
            </tbody>
          </table>
        </div>

        <p className="text-center text-slate-400 text-sm font-medium italic mt-6">
          * Custom pricing available upon consultation. Contact us for volume discounts.
        </p>

        <div className="text-center mt-10">
          <Button
            onClick={() => navigate("/")}
            className="bg-slate-900 text-white hover:bg-slate-800 h-14 px-10 text-[13px] uppercase tracking-widest font-bold rounded-none shadow-none"
          >
            Book a Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
