import { Fragment, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Check, Minus, LogOut, Menu, X, ShoppingBag, RefreshCw, Layers, WifiOff, Database, ShieldCheck, UtensilsCrossed, QrCode, BarChart3, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { signOut, getUserInfo } from "@/components/AuthGate";
import { usePricingEngagement } from "@/hooks/use-pricing-engagement";
import PricingLeadGate, { checkLeadToken, LEAD_STORAGE_KEY } from "@/components/PricingLeadGate";

const logoImg = "/favicon.png";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] as [number, number, number, number] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

type PricingModel = "subscription" | "standalone" | "per-feature";
type BillingCycle = "monthly" | "yearly";

type CellValue = "YES" | "NO";

type Plan = {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  yearlyEquivalent: string;
  monthlyPeriod: string;
  yearlyPeriod: string;
  yearlySaving: string;
  idealFor: string;
  description: string;
  devices: string;
  extraDevice: string;
  badge: string | null;
  highlight: boolean;
};

type StandalonePlan = {
  tier: string;
  outlets: string;
  license: string;
  setup: string;
  total: string;
  amc: string;
  devices: string;
  extraDevice: string;
};

type PerFeatureModule = {
  name: string;
  standalonePrice: string;
  subscriptionPrice: string;
};

type FeatureGroup = {
  group: string;
  features: { name: string; values: CellValue[] }[];
};

type CostComparisonData = {
  title: string;
  columns: string[];
  rows: { label: string; values: string[] }[];
  note: string;
};

type PricingData = {
  plans: Plan[];
  standalonePlans: StandalonePlan[];
  perFeatureModules: PerFeatureModule[];
  featureGroups: FeatureGroup[];
  costComparison: CostComparisonData;
};

async function fetchPricingData(): Promise<PricingData | null> {
  const token = localStorage.getItem(LEAD_STORAGE_KEY);
  if (!token) return null;

  try {
    const res = await fetch("/api/pricing-data", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem(LEAD_STORAGE_KEY);
      return null;
    }

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

const FEATURE_PREVIEW_LIMIT = 12;

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
  return <Minus className="w-4 h-4 text-slate-200 mx-auto" strokeWidth={2} />;
}

const TIER_NAMES = ["Starter", "Growth", "Pro", "Enterprise"];

const pricingModels: { id: PricingModel; label: string; icon: typeof ShoppingBag; tagline: string; desc: string }[] = [
  {
    id: "standalone",
    label: "Standalone",
    icon: ShoppingBag,
    tagline: "4-Year License",
    desc: "Buy the licence, own it for 4 years. AMC from Year 2 for updates & support.",
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: RefreshCw,
    tagline: "Monthly or Annual",
    desc: "Flexible monthly or annual plans. 20% off on annual billing.",
  },
  {
    id: "per-feature",
    label: "Per-Feature",
    icon: Layers,
    tagline: "Add-On Modules",
    desc: "Add individual modules to any plan. Pay only for what you need.",
  },
];

export default function Pricing() {
  const [, navigate] = useLocation();
  const user = getUserInfo();
  const {
    trackModelChange,
    trackBillingToggle,
    trackCtaClick,
    trackFeatureExpansion,
    trackTierInteraction,
  } = usePricingEngagement();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingModel, setPricingModel] = useState<PricingModel>("standalone");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [showFullComparison, setShowFullComparison] = useState(false);

  const loadPricingData = useCallback(async () => {
    if (!checkLeadToken()) {
      setIsUnlocked(false);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    const data = await fetchPricingData();
    if (data) {
      setPricingData(data);
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    loadPricingData();
  }, [loadPricingData]);

  const plans = pricingData?.plans || [];
  const standalonePlans = pricingData?.standalonePlans || [];
  const perFeatureModules = pricingData?.perFeatureModules || [];
  const featureGroups = pricingData?.featureGroups || [];
  const costComparison = pricingData?.costComparison || null;

  const totalFeatureCount = featureGroups.reduce((sum, group) => sum + group.features.length, 0);
  const displayedFeatureGroups = showFullComparison
    ? featureGroups
    : getFeatureGroupsPreview(featureGroups, FEATURE_PREVIEW_LIMIT);
  const displayedFeatureCount = displayedFeatureGroups.reduce((sum, group) => sum + group.features.length, 0);
  const hasHiddenFeatures = displayedFeatureCount < totalFeatureCount;

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
            {/* Pricing - active page */}
            <span className="relative text-[13px] uppercase tracking-widest font-semibold text-slate-900">
              Pricing
              <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
            </span>
          </nav>

          {/* Right: desktop CTA + avatar | mobile hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop only */}
            <Button
              onClick={() => { trackCtaClick("Book Demo - Header"); window.location.href = "/#contact"; }}
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

            {/* Active page - Pricing */}
            <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block shrink-0" />
              Pricing
            </span>

            <Button
              className="w-full bg-slate-900 py-6 text-[12px] uppercase tracking-widest font-bold rounded-none"
              onClick={() => { setMobileMenuOpen(false); trackCtaClick("Book Demo - Mobile"); window.location.href = "/#contact"; }}
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
            Every plan includes full core POS. Scale features as your business grows.
          </motion.p>

          {/* Pricing model selector */}
          <motion.div variants={fadeIn} className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {pricingModels.map((model) => {
                const Icon = model.icon;
                const isActive = pricingModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => { setPricingModel(model.id); trackModelChange(model.id); }}
                    className={`relative flex flex-col items-center gap-2 px-4 py-4 rounded-sm border transition-all text-center ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} strokeWidth={1.5} />
                    <span className="text-[11px] uppercase tracking-widest font-bold">{model.label}</span>
                    <span className={`text-[10px] font-medium leading-snug ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                      {model.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
      </div>{/* end bg-[#fafafa] wrapper */}

      {/* Main content - gated behind lead form */}
      {isUnlocked ? (
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-20 max-w-6xl">

        {/* ── SUBSCRIPTION MODEL ── */}
        {pricingModel === "subscription" && (
          <>
            {/* Billing cycle toggle */}
            <div className="flex flex-col items-center gap-2 mb-10">
              <div
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
                role="tablist"
                aria-label="Billing cycle"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === "monthly"}
                  onClick={() => { setBillingCycle("monthly"); trackBillingToggle(); }}
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
                  onClick={() => { setBillingCycle("yearly"); trackBillingToggle(); }}
                  className={`min-w-[126px] px-5 py-2.5 rounded-lg text-[11px] uppercase tracking-widest font-semibold transition-all ${
                    billingCycle === "yearly"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Annual
                </button>
              </div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">
                Annual billing saves 20%
              </p>
            </div>

            {/* Plan cards - 4 tiers */}
            <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 lg:grid-cols-4 md:gap-4 mb-1">
              {plans.map((plan, i) => {
                const isEnterprise = i === 3;
                return (
                <div
                  key={plan.name}
                  onMouseEnter={() => trackTierInteraction(plan.name)}
                  className={`relative rounded-sm p-6 md:p-7 text-center flex flex-col ${
                    isEnterprise
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

                  <p className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2 text-slate-400">
                    {plan.name}
                  </p>
                  <p className={`text-3xl md:text-3xl font-bold font-heading tracking-tight ${isEnterprise ? "text-white" : "text-slate-900"}`}>
                    {billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                  </p>
                  <p className="text-xs font-medium mt-1 text-slate-400">
                    {billingCycle === "monthly" ? plan.monthlyPeriod : plan.yearlyPeriod}
                  </p>
                  {billingCycle === "yearly" && (
                    <>
                      <p className="text-[10px] font-bold mt-1 text-emerald-500 uppercase tracking-wider">
                        {plan.yearlySaving}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {plan.yearlyEquivalent} equivalent
                      </p>
                    </>
                  )}
                  <p className={`text-[11px] uppercase tracking-widest font-semibold mt-2 text-slate-400`}>
                    {plan.idealFor}
                  </p>
                  <p className={`text-[12px] leading-relaxed mt-3 flex-1 ${isEnterprise ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.description}
                  </p>

                  {/* Devices info */}
                  <div className={`mt-3 flex items-center justify-center gap-1.5 text-[11px] font-medium ${isEnterprise ? "text-slate-400" : "text-slate-500"}`}>
                    <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{plan.devices} device{Number(plan.devices) > 1 ? "s" : ""} included</span>
                    <span className="text-slate-300">|</span>
                    <span>+{plan.extraDevice}/extra</span>
                  </div>

                  <Button
                    onClick={() => { trackCtaClick(`Get Started - ${plan.name}`); window.location.href = "/#contact"; }}
                    className={`mt-4 w-full h-10 text-[11px] uppercase tracking-widest font-bold rounded-none shadow-none ${
                      isEnterprise
                        ? "bg-white text-slate-900 hover:bg-slate-100"
                        : plan.highlight
                        ? "bg-slate-900 text-white hover:bg-slate-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    Get Started
                  </Button>
                </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── STANDALONE MODEL ── */}
        {pricingModel === "standalone" && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900">
                4-Year Software License
              </h2>
              <p className="mt-3 text-slate-500 text-sm font-medium max-w-lg mx-auto">
                Buy the licence outright and own it for 4 years. AMC from Year 2 covers updates, remote support & troubleshooting.
              </p>
            </div>

            {/* Standalone pricing table */}
            <div className="overflow-x-auto rounded-sm border border-slate-100">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400">Tier</th>
                    <th className="text-left py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Outlets</th>
                    <th className="text-right py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">License</th>
                    <th className="text-right py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Setup & Training</th>
                    <th className="text-right py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-900">Total Upfront</th>
                    <th className="text-right py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">AMC/yr/outlet</th>
                    <th className="text-center py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Devices</th>
                    <th className="text-right py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-400">Extra Device</th>
                  </tr>
                </thead>
                <tbody>
                  {standalonePlans.map((row, i) => (
                    <tr key={row.tier} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="py-4 px-4 sm:px-5 font-bold text-slate-900 text-[13px]">{row.tier}</td>
                      <td className="py-4 px-3 sm:px-4 text-slate-500 text-[13px] font-medium">{row.outlets}</td>
                      <td className="py-4 px-3 sm:px-4 text-right text-slate-700 text-[13px] font-medium whitespace-pre-line">{row.license}</td>
                      <td className="py-4 px-3 sm:px-4 text-right text-slate-700 text-[13px] font-medium whitespace-pre-line">{row.setup}</td>
                      <td className="py-4 px-3 sm:px-4 text-right text-slate-900 text-[13px] font-bold whitespace-pre-line">{row.total}</td>
                      <td className="py-4 px-3 sm:px-4 text-right text-slate-500 text-[12px] font-medium">{row.amc}</td>
                      <td className="py-4 px-3 sm:px-4 text-center text-slate-500 text-[12px] font-medium">{row.devices}</td>
                      <td className="py-4 px-3 sm:px-4 text-right text-slate-500 text-[12px] font-medium">{row.extraDevice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-slate-400 text-xs font-medium text-center">
              AMC covers software updates, remote support & troubleshooting. Extra device is a one-time fee. All prices exclusive of applicable taxes.
            </p>
          </>
        )}

        {/* ── PER-FEATURE ADD-ONS ── */}
        {pricingModel === "per-feature" && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900">
                Add-On Modules
              </h2>
              <p className="mt-3 text-slate-500 text-sm font-medium max-w-lg mx-auto">
                Extend any plan with individual feature modules. Available on top of both Standalone and Subscription models.
              </p>
            </div>

            <div className="overflow-x-auto rounded-sm border border-slate-100">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400 w-[50%]">Module</th>
                    <th className="text-right py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400">Standalone (one-time)</th>
                    <th className="text-right py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400">Subscription (/month)</th>
                  </tr>
                </thead>
                <tbody>
                  {perFeatureModules.map((mod, i) => (
                    <tr key={mod.name} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                      <td className="py-3.5 px-4 sm:px-5 text-slate-700 font-medium text-[13px]">{mod.name}</td>
                      <td className="py-3.5 px-4 sm:px-5 text-right text-slate-900 text-[13px] font-semibold">{mod.standalonePrice}</td>
                      <td className="py-3.5 px-4 sm:px-5 text-right text-slate-900 text-[13px] font-semibold">{mod.subscriptionPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-slate-400 text-xs font-medium text-center">
              Modules included in higher tiers at no extra cost. Add-on pricing is for lower tiers that want individual features.
            </p>
          </>
        )}

        {/* Feature comparison table */}
        <div className="overflow-x-auto rounded-sm border border-slate-100 mt-10">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold text-slate-400 w-[40%]">
                  Features
                </th>
                {TIER_NAMES.map((name) => (
                  <th key={name} className="py-4 px-3 sm:px-4 text-[11px] uppercase tracking-widest font-bold text-slate-900 text-center">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedFeatureGroups.map((group) => (
                <Fragment key={`group-${group.group}`}>
                  <tr className="bg-slate-50 border-b border-t border-slate-100">
                    <td
                      colSpan={5}
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
              onClick={() => { setShowFullComparison((prev) => !prev); trackFeatureExpansion(); }}
              className="inline-flex items-center justify-center px-4 py-2 text-[11px] uppercase tracking-widest font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              {showFullComparison ? "Show Fewer Features" : `Show Full Comparison (${totalFeatureCount} Features)`}
            </button>
          </div>
        )}

        {/* 7-Year Cost Comparison */}
        {costComparison && (
          <div className="mt-14 md:mt-20">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 text-center mb-3">How We Compare</h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900 text-center mb-10">
              {costComparison.title}
            </h3>

            <div className="overflow-x-auto rounded-sm border border-slate-100">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {costComparison.columns.map((col, i) => (
                      <th
                        key={i}
                        className={`py-4 px-4 sm:px-5 text-[11px] uppercase tracking-widest font-bold ${
                          i === 0 ? "text-left text-slate-400" :
                          i <= 2 ? "text-right text-slate-900" : "text-right text-slate-400"
                        }`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costComparison.rows.map((row, i) => {
                    const isTotal = row.label.includes("Total");
                    return (
                      <tr key={row.label} className={`border-b border-slate-50 ${isTotal ? "bg-slate-50" : i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                        <td className={`py-3.5 px-4 sm:px-5 text-[13px] font-medium ${isTotal ? "font-bold text-slate-900" : "text-slate-700"}`}>
                          {row.label}
                        </td>
                        {row.values.map((val, j) => (
                          <td key={j} className={`py-3.5 px-4 sm:px-5 text-right text-[13px] ${
                            isTotal ? "font-bold text-slate-900" :
                            j <= 1 ? "font-semibold text-slate-900" : "font-medium text-slate-500"
                          }`}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-slate-500 text-sm font-semibold text-center">
              {costComparison.note}
            </p>
          </div>
        )}

        {/* Why MatoWork */}
        <div className="mt-14 md:mt-20">
          <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 text-center mb-3">Why MatoWork</h2>
          <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-slate-900 text-center mb-10">
            What no other Indian POS <span className="text-slate-400 italic font-serif">offers.</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: WifiOff,          title: "True Offline-First",      desc: "Runs on local Postgres per outlet. Full billing, KDS, inventory, and staff ops with zero internet." },
              { icon: Database,         title: "Full Data Ownership",     desc: "Your data lives in your database. Export anytime. No vendor lock-in. No asking permission." },
              { icon: ShieldCheck,      title: "Anti-Fraud Built-In",     desc: "Void gating, cash variance tracking, discount authority, chargeback recording, and immutable audit trails." },
              { icon: UtensilsCrossed,  title: "Recipe-Level Costing",    desc: "Ingredient BOM per menu item. Cost classified as optimal, warning, or critical with threshold alerts." },
              { icon: QrCode,           title: "Dual QR Ordering",        desc: "LAN-based QR for dine-in (zero internet) + cloud QR for outside customers. Bypass aggregator fees." },
              { icon: BarChart3,        title: "Owner Dashboard",         desc: "Revenue trends, food cost health, menu performance, inventory alerts from any device, anywhere." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3.5 p-4 border border-slate-100 rounded-sm bg-white">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-lg shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-slate-700" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900 mb-1 font-heading tracking-tight">{item.title}</h4>
                  <p className="text-slate-500 text-[12px] leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 border border-slate-100 rounded-sm bg-[#fafafa] px-6 sm:px-8 py-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-slate-400 mb-3">Ready to take back control?</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-heading">
            See where your profits go.
          </h2>
          <p className="mt-3 text-slate-500 text-sm font-medium max-w-md mx-auto">
            All plans include dedicated onboarding support. Custom pricing available for multi-outlet deployments.
          </p>
          <Button
            onClick={() => { trackCtaClick("Book a Demo"); window.location.href = "/#contact"; }}
            className="mt-7 bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 sm:px-10 text-[12px] uppercase tracking-widest font-bold rounded-none shadow-none"
          >
            Book a Demo
          </Button>
        </div>
      </div>
      ) : isLoadingData ? (
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl py-20 flex justify-center">
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
      ) : (
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        <PricingLeadGate onUnlock={() => loadPricingData()} />
      </div>
      )}

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
                Restaurant control & profit visibility system. See where money leaks. Take back control.
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
