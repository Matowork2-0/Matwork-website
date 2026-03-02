import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Check, Minus, ArrowLeft, LogOut, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut, getUserInfo } from "@/components/AuthGate";

const logoImg = "/favicon.png";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

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
      { name: "Enterprise-Grade Multi-Outlet Management",               values: ["NO", "YES", "YES"] },
      { name: "Advanced Customer Intelligence & CRM Engine",            values: ["NO", "NO", "YES"] },
      { name: "Automated Operational Monitoring & Optimization",        values: ["NO", "YES", "YES"] },
      { name: "Scalable Architecture & Business Expansion",             values: ["NO", "NO", "YES"] },
    ],
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value === "YES") return <Check className="w-4 h-4 text-slate-900 mx-auto" strokeWidth={2.5} />;
  if (value === "NO")  return <Minus className="w-4 h-4 text-slate-200 mx-auto" strokeWidth={2} />;
  return (
    <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">
      {value}
    </span>
  );
}

export default function Pricing() {
  const [, navigate] = useLocation();
  const user = getUserInfo();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-white font-sans"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.45, 0.32, 0.9] }}
    >
      {/* Header */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 md:py-4 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)]"
          : "bg-[#fafafa]/90 backdrop-blur-sm py-4 md:py-5"
      }`}>
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Left: back + logo */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-[13px] uppercase tracking-widest font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate("/")}>
              <img src={logoImg} alt="MatoWork" className="w-9 h-9 rounded-lg object-contain transition-transform group-hover:scale-105" />
              <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
                Mato<span className="text-slate-500">Work</span>
              </span>
            </div>
          </div>

          {/* Right: CTA + avatar */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Book Demo — hidden on mobile like Home page */}
            <Button
              onClick={() => { window.location.href = "/#contact"; }}
              className="hidden md:inline-flex bg-slate-900 text-white hover:bg-slate-800 px-6 py-5 rounded-md h-auto text-[13px] uppercase tracking-widest font-bold border-none shadow-none"
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

      {/* Page hero — same bg as nav so they merge seamlessly */}
      <div className="bg-[#fafafa] border-b border-slate-100 py-14 md:py-28 text-center px-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeIn}>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 border-b border-slate-200 pb-2">
              Plans & Pricing
            </span>
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="mt-6 text-3xl sm:text-5xl md:text-6xl font-bold font-heading tracking-tight text-slate-900 leading-[1.05]"
          >
            Simple, transparent<br />
            <span className="text-slate-400 italic font-serif">pricing.</span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="mt-5 text-slate-500 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed"
          >
            Every plan includes the full core POS infrastructure. Scale your capabilities as your business grows.
          </motion.p>

          {/* Installation fee callout */}
          <motion.div variants={fadeIn} className="mt-8 flex justify-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 rounded-sm px-5 sm:px-6 py-4 shadow-sm text-center sm:text-left">
              <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">One-Time Setup</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  ₹45,000 installation fee{" "}
                  <span className="font-normal text-slate-500 block sm:inline">— custom pricing on consultation</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-20 max-w-5xl">

        {/* Plan cards — stack on mobile, 3-col on md+ */}
        <div className="grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-4 mb-1">
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
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
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

        {/* Feature comparison table — horizontally scrollable on mobile */}
        <div className="overflow-x-auto rounded-sm border border-slate-100 mt-10">
          <table className="w-full text-sm min-w-[660px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400 w-[45%]">
                  Features
                </th>
                {plans.map((p) => (
                  <th key={p.name} className="py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-900 text-center">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureGroups.map((group) => (
                <>
                  <tr key={`group-${group.group}`} className="bg-slate-50 border-b border-t border-slate-100">
                    <td
                      colSpan={4}
                      className="py-2.5 px-4 sm:px-5 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.features.map((feature, i) => (
                    <tr
                      key={feature.name}
                      className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}
                    >
                      <td className="py-3.5 px-4 sm:px-5 text-slate-700 font-medium text-[12px] sm:text-[13px]">
                        {feature.name}
                      </td>
                      {feature.values.map((val, j) => (
                        <td key={j} className="py-3.5 px-3 sm:px-4 text-center">
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
        <div className="mt-14 border border-slate-100 rounded-sm bg-[#fafafa] px-6 sm:px-8 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">Ready to get started?</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            Book a demo with our team.
          </h2>
          <p className="mt-3 text-slate-500 text-sm font-medium max-w-md mx-auto">
            All plans include dedicated onboarding support. Custom pricing available for volume and multi-outlet deployments.
          </p>
          <Button
            onClick={() => { window.location.href = "/#contact"; }}
            className="mt-7 bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 sm:px-10 text-[12px] uppercase tracking-widest font-bold rounded-none shadow-none"
          >
            Book a Demo
          </Button>
          <p className="mt-4 text-slate-400 text-xs font-medium">
            One-time installation: ₹45,000 &middot; Custom rates on consultation
          </p>
        </div>
      </div>
    </motion.div>
  );
}
