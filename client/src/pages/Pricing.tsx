import { Fragment, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Check, Minus, LogOut, Wrench, Menu, X } from "lucide-react";
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

type BillingCycle = "monthly" | "yearly";

const plans = [
  {
    name: "Starter",
    monthlyPrice: "₹1,999",
    yearlyPrice: "₹19,990",
    monthlyPeriod: "/month",
    yearlyPeriod: "/year",
    description: "Perfect for single-outlet businesses ready to modernize operations.",
    badge: null,
    highlight: false,
  },
  {
    name: "Growth",
    monthlyPrice: "₹3,999",
    yearlyPrice: "₹39,990",
    monthlyPeriod: "/month",
    yearlyPeriod: "/year",
    description: "For growing businesses that need smarter tools and connectivity.",
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: "₹7,999",
    yearlyPrice: "₹79,990",
    monthlyPeriod: "/month",
    yearlyPeriod: "/year",
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
      { name: "Fault-Tolerant System Design",                           values: ["YES", "YES", "YES"] },
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
      { name: "Scalable Architecture & Business Expansion",             values: ["NO", "YES", "YES"] },
    ],
  },
  {
    group: "Customer Loyalty & Insights",
    features: [
      { name: "Smart Loyalty & Rewards Program",                        values: ["NO", "YES", "YES"] },
      { name: "Cross-Outlet Customer Spending Intelligence",            values: ["NO", "NO", "YES"] },
    ],
  },
];

const FEATURE_PREVIEW_LIMIT = 10;

function getFeatureGroupsPreview(groups: FeatureGroup[], limit: number): FeatureGroup[] {
  const preview: FeatureGroup[] = [];
  let remaining = limit;

  for (const group of groups) {
    if (remaining <= 0) break;

    const visibleFeatures = group.features.slice(0, remaining);
    if (visibleFeatures.length > 0) {
      preview.push({
        group: group.group,
        features: visibleFeatures,
      });
      remaining -= visibleFeatures.length;
    }
  }

  return preview;
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showFullComparison, setShowFullComparison] = useState(false);

  const totalFeatureCount = featureGroups.reduce((sum, group) => sum + group.features.length, 0);
  const displayedFeatureGroups = showFullComparison
    ? featureGroups
    : getFeatureGroupsPreview(featureGroups, FEATURE_PREVIEW_LIMIT);
  const displayedFeatureCount = displayedFeatureGroups.reduce((sum, group) => sum + group.features.length, 0);
  const hasHiddenFeatures = displayedFeatureCount < totalFeatureCount;

  // Scroll to top on mount — prevents inheriting scroll offset from Home
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [mobileMenuOpen]);

  return (
    <motion.div
      className="min-h-screen bg-white font-sans selection:bg-slate-900 selection:text-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.21, 0.45, 0.32, 0.9] }}
    >
      {/* Header + hero share bg-[#fafafa] so transparent nav blends in */}
      <div className="bg-[#fafafa]">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 md:py-4 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)]"
          : "bg-transparent py-4 md:py-6"
      }`}>
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Left: logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate("/")}>
            <img src={logoImg} alt="MatoWork" className="w-9 h-9 rounded-lg object-contain transition-transform group-hover:scale-105" />
            <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
              Mato<span className="text-slate-500">Work</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: "Features", href: "/#features" },
              { label: "Services", href: "/#services" },
              { label: "About",    href: "/#about"    },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-[13px] uppercase tracking-widest font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                {label}
              </a>
            ))}
            {/* Pricing — active page */}
            <span className="relative text-[13px] uppercase tracking-widest font-semibold text-slate-900">
              Pricing
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
            </span>
          </nav>

          {/* Right: desktop CTA + avatar | mobile hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop only */}
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
                className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                <img src={user.picture} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-2xl py-8 px-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
            {/* Nav links */}
            {[
              { label: "Features", href: "/#features" },
              { label: "Services", href: "/#services" },
              { label: "About",    href: "/#about"    },
              { label: "Contact",  href: "/#contact"  },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-left text-lg font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                {label}
              </a>
            ))}

            {/* Active page — Pricing */}
            <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block shrink-0" />
              Pricing
            </span>

            <Button
              className="w-full bg-slate-900 py-6 text-[12px] uppercase tracking-widest font-bold rounded-none"
              onClick={() => { setMobileMenuOpen(false); window.location.href = "/#contact"; }}
            >
              Book Demo
            </Button>

            {/* Sign out with profile */}
            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <LogOut className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Page hero */}
      <div className="border-b border-slate-100 pt-32 pb-14 md:pt-48 md:pb-28 text-center px-4">
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
            className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold font-heading tracking-tight text-slate-900 leading-[1.02] sm:leading-[1.05]"
          >
            Simple, transparent<br />
            <span className="text-slate-400 italic font-serif">pricing.</span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="mt-5 text-slate-500 text-[15px] md:text-lg font-medium max-w-xl mx-auto leading-[1.75] md:leading-relaxed"
          >
            Every plan includes the full core POS infrastructure. Scale your capabilities as your business grows.
          </motion.p>

          <motion.div variants={fadeIn} className="mt-8 flex flex-col items-center gap-2">
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
              role="tablist"
              aria-label="Billing cycle"
            >
              <button
                type="button"
                role="tab"
                aria-selected={billingCycle === "monthly"}
                onClick={() => setBillingCycle("monthly")}
                className={`min-w-[126px] px-5 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={billingCycle === "yearly"}
                onClick={() => setBillingCycle("yearly")}
                className={`min-w-[126px] px-5 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-semibold transition-all ${
                  billingCycle === "yearly"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Yearly
              </button>
            </div>
            <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
              Annual billing saves ~2 months
            </p>
          </motion.div>

          {/* Installation fee callout */}
          <motion.div variants={fadeIn} className="mt-8 flex justify-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200 rounded-sm px-5 sm:px-6 py-4 shadow-sm text-center sm:text-left">
              <Wrench className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">One-Time Setup</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  ₹12,000 installation fee{" "}
                  <span className="font-normal text-slate-500">- Custom pricing available on consultation</span>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      </div>{/* end bg-[#fafafa] wrapper */}

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
                {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
              </p>
              <p className={`text-xs font-medium mt-1 ${i === 2 ? "text-slate-400" : "text-slate-400"}`}>
                {billingCycle === "monthly" ? plan.monthlyPeriod : plan.yearlyPeriod}
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
              {displayedFeatureGroups.map((group) => (
                <Fragment key={`group-${group.group}`}>
                  <tr className="bg-slate-50 border-b border-t border-slate-100">
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
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {(hasHiddenFeatures || showFullComparison) && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowFullComparison((prev) => !prev)}
              className="inline-flex items-center justify-center px-4 py-2 text-[11px] uppercase tracking-widest font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              {showFullComparison ? "Show Fewer Features" : `Show Full Comparison (${totalFeatureCount} Features)`}
            </button>
          </div>
        )}

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
            One-time installation: ₹12,000 &middot; Custom rates on consultation
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-12 md:py-20 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 md:gap-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-6 md:mb-8">
                <img src={logoImg} alt="MatoWork" className="w-8 h-8 rounded object-contain" />
                <span className="font-heading font-bold tracking-tight text-slate-900 text-lg">MatoWork</span>
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                Empowering modern retail through advanced software engineering and edge computing.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16">
              <div>
                <h5 className="text-[11px] uppercase tracking-widest font-bold text-slate-900 mb-4 md:mb-6">Product</h5>
                <ul className="space-y-3 md:space-y-4">
                  <li><a href="/#features" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Features</a></li>
                  <li><a href="/#services" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Technology</a></li>
                  <li><span className="text-slate-900 text-[13px] font-semibold">Pricing</span></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[11px] uppercase tracking-widest font-bold text-slate-900 mb-4 md:mb-6">Company</h5>
                <ul className="space-y-3 md:space-y-4">
                  <li><a href="/#about" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">About</a></li>
                  <li><a href="/#contact" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[11px] md:text-[12px] font-bold tracking-widest uppercase">
            <p>&copy; {new Date().getFullYear()} MatoWork. All rights reserved.</p>
            <div className="flex gap-6 md:gap-8">
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
