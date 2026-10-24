import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  WifiOff,
  Zap,
  ShieldCheck,
  ArrowRight,
  Menu,
  X,
  Loader2,
  LogOut,
  Database,
  Scale,
  SearchCheck,
  UtensilsCrossed,
  QrCode,
  Plug,
  BarChart3,
  Receipt,
  Cloud,
  Award,
  Tag,
  Users,
  ArrowLeftRight,
  Lock,
  Mail,
  Phone,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { signOut, getUserInfo } from "@/components/AuthGate";
import { useLocation } from "wouter";

// Assets
import heroImg from "@/assets/images/hero-pos.webp";
import servicesImg from "@/assets/images/software-services.webp";

// Logo: served from client/public/favicon.png (same as mw_logo.png)
const logoImg = "/favicon.png";

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.21, 0.45, 0.32, 0.9] as [number, number, number, number] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const { toast } = useToast();
  const user = getUserInfo();
  const [, navigate] = useLocation();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    outlet: "",
    contact: "",
    email: "",
    city: "",
    role: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to hash section on initial load (e.g. navigating from /pricing)
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = el.getBoundingClientRect().top;
          const offsetPosition = elementRect - bodyRect - offset;
          window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        }
      }, 150);
    }
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const ids = ['features', 'ai', 'services', 'about', 'faq', 'contact'];
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.25, rootMargin: '-80px 0px -45% 0px' }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
  }, [mobileMenuOpen]);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim() || !formData.outlet.trim() || !formData.contact.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in your name, restaurant name, and contact number.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          outlet: formData.outlet.trim(),
          contact: formData.contact.trim(),
          email: formData.email.trim(),
          city: formData.city.trim(),
          role: formData.role,
          address: formData.address.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast({
          title: "Too many requests",
          description: data.message || "Please wait a few minutes before trying again.",
          variant: "destructive",
        });
        return;
      }

      if (res.status === 400) {
        toast({
          title: "Invalid input",
          description: data.message || "Please check your input and try again.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Server error");
      }

      toast({
        title: "Demo request received!",
        description: "Thank you. We'll reach out within a few hours.",
      });
      setIsSubmitted(true);
      setFormData({ name: "", outlet: "", contact: "", email: "", city: "", role: "", address: "" });
    } catch (err) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-slate-900 selection:text-white">
      {/* Navigation */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 md:py-4 shadow-[0_2px_20px_-10px_rgba(0,0,0,0.05)]" : "bg-transparent py-4 md:py-6"
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => scrollTo('hero')}>
            <img src={logoImg} alt="MatoWork" className="w-9 h-9 rounded-lg object-contain transition-transform group-hover:scale-105" />
            <span className="font-heading font-bold text-xl tracking-tight text-slate-900">
              Mato<span className="text-slate-500">Work</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10">
            {['Features', 'AI', 'Services', 'About'].map((item) => {
              const isActive = activeSection === item.toLowerCase();
              return (
                <button
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase())}
                  className={`text-[13px] uppercase tracking-widest font-semibold transition-colors relative ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  data-testid={`link-${item.toLowerCase()}`}
                >
                  {item}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => navigate('/pricing')}
              className="text-[13px] uppercase tracking-widest font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              Pricing
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={() => scrollTo('contact')}
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-5 rounded-md h-auto text-[13px] uppercase tracking-widest font-bold border-none shadow-none"
              data-testid="button-book-demo"
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

          <button
            className="md:hidden p-2 text-slate-900"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-2xl py-8 px-6 flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300">
            {['Features', 'AI', 'Services', 'About', 'Contact'].map((item) => {
              const isActive = activeSection === item.toLowerCase();
              return (
                <button
                  key={item}
                  onClick={() => scrollTo(item.toLowerCase())}
                  className={`text-left text-lg font-semibold flex items-center gap-2 transition-colors ${
                    isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block shrink-0" />}
                  {item}
                </button>
              );
            })}
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/pricing'); }}
              className="text-left text-lg font-semibold text-slate-500 transition-colors"
            >
              Pricing
            </button>
            <Button className="w-full bg-slate-900 py-6 text-[12px] uppercase tracking-widest font-bold rounded-none" onClick={() => scrollTo('contact')}>Book Demo</Button>
            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                <LogOut className="w-4 h-4 ml-auto text-slate-400" />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 md:pt-56 md:pb-40 overflow-hidden bg-[#fafafa]">
        {/* POS image as transparent background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15 }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fafafa]/80 via-[#fafafa]/40 to-[#fafafa] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeIn} className="inline-block mb-4 md:mb-6">
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 border-b border-slate-200 pb-2">
                  Restaurant Control Suite
                </span>
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-heading leading-[1.02] sm:leading-[1.05] tracking-tight mb-6 md:mb-8 text-slate-900">
                Your Data. Your<br />
                <span className="text-slate-400 italic font-serif">Hardware.</span> Your Control.
              </motion.h1>
              <motion.p variants={fadeIn} className="text-[15px] sm:text-lg md:text-xl text-slate-500 mb-8 md:mb-12 leading-[1.75] sm:leading-relaxed max-w-2xl mx-auto font-medium px-2">
                India's only POS that runs entirely on your local database — with a built-in AI analyst that answers from your own numbers. Billing, orders, inventory, and staff management without internet. No cloud dependency. No vendor lock-in. No data hostage.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Button
                  size="lg"
                  className="bg-slate-900 text-white hover:bg-slate-800 h-14 sm:h-16 px-8 sm:px-10 text-[12px] sm:text-[13px] uppercase tracking-widest font-bold rounded-none"
                  onClick={() => scrollTo('contact')}
                >
                  Book a Free Demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 h-14 sm:h-16 px-8 sm:px-10 text-[12px] sm:text-[13px] uppercase tracking-widest font-bold rounded-none"
                  onClick={() => scrollTo('features')}
                >
                  Explore Technology
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* POS Features Section */}
      <section id="features" className="py-16 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-12 md:mb-24">
            <div className="max-w-2xl">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">What No Other Indian POS Offers</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight">
                Capabilities you won't find<br className="hidden sm:inline" /> <span className="text-slate-400 italic font-serif">anywhere else.</span>
              </h3>
            </div>
            <div className="pb-2">
              <button
                onClick={() => scrollTo('contact')}
                className="group flex items-center gap-2 text-[13px] uppercase tracking-widest font-bold text-slate-900"
              >
                See it in action
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-12 lg:gap-y-20">
            {[
              { icon: WifiOff,      title: "True Offline-First Architecture",  desc: "Runs on local Postgres per outlet. Full billing, orders, KDS, payments, inventory, and staff management work with zero internet. Cloud is optional for owner analytics. Every other Indian POS is cloud-first with a degraded offline mode." },
              { icon: Database,     title: "Full Data Ownership & Zero Lock-In", desc: "All operational data lives in your restaurant's own local database. Export anytime in standard formats. No proprietary data jail. No asking permission to access your own sales history." },
              { icon: Scale,        title: "DPDP Act Compliance Built-In",     desc: "India's privacy law is in force today, with full enforcement by May 2027. MatoWork has customer PII erasure with SHA256 verification, consent tracking, immutable tax record preservation, and local data residency. No other Indian POS has this." },
              { icon: SearchCheck,  title: "Anti-Fraud & Loss Prevention",     desc: "Dedicated fraud detection dashboard. Chargeback recording, shift review approval, cash variance tracking, void and discount authority gating, and 9 immutable audit event types. See exactly where money leaks." },
              { icon: UtensilsCrossed, title: "Recipe-Level Food Costing",     desc: "Ingredient-level BOM cost tracking per menu item. Food cost classified as optimal, warning, or critical with threshold alerts. Auto-consumption deduction on bill payment. Most POS systems only offer flat cost-per-unit." },
              { icon: QrCode,       title: "Dual QR Ordering",                 desc: "LAN-based QR for dine-in (zero internet, private network) + cloud-based QR for customers outside restaurant WiFi. Bypass aggregator commissions. No other system offers both LAN and internet QR." },
            ].map((feature, i) => (
              <div key={i} className="group">
                <div className="w-12 h-12 flex items-center justify-center mb-6 md:mb-8 bg-slate-50 rounded-lg group-hover:bg-slate-900 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-slate-900 group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                </div>
                <h4 className="text-lg font-bold mb-3 md:mb-4 text-slate-900 font-heading tracking-tight">{feature.title}</h4>
                <p className="text-slate-500 leading-relaxed font-medium text-[15px]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section id="ai" className="py-16 md:py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-white/[0.03] rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Sparkles className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400">MatoWork AI — Your Personal Analyst</h2>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-heading tracking-tight leading-tight mb-6 md:mb-8">
                Ask your restaurant<br /><span className="text-slate-400 italic font-serif">anything.</span>
              </h3>
              <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed mb-8">
                Every MatoWork outlet includes a built-in AI assistant for the owner. Revenue, food cost, wastage, discounts, staff performance — ask in plain English or Hindi and get answers computed live from your own data. It is read-only, guardrailed, and runs on your hardware, so your numbers never leave the restaurant.
              </p>
              <div className="flex flex-wrap gap-2.5 mb-8 md:mb-10">
                {["Works offline", "Runs on your hardware", "Read-only by design", "Hindi + English"].map((badge, i) => (
                  <span key={i} className="text-[11px] uppercase tracking-widest font-bold text-slate-300 border border-slate-700 rounded-sm px-3 py-1.5">
                    {badge}
                  </span>
                ))}
              </div>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 md:mb-10 border-l-2 border-slate-700 pl-4">
                On the roadmap for Growth &amp; Enterprise: one assistant across your entire fleet — compare outlets, catch anomalies, and get a morning briefing.
              </p>
              <button
                onClick={() => scrollTo('contact')}
                className="group flex items-center gap-2 text-[13px] uppercase tracking-widest font-bold text-white"
              >
                See it answer live
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div>
              <div className="bg-white rounded-sm p-5 sm:p-6 md:p-8 space-y-5">
                {[
                  {
                    q: "Aaj ka revenue kitna hai?",
                    a: "₹48,250 net from 142 paid bills so far — 12% ahead of last Tuesday. UPI 61% · Cash 27% · Card 12%.",
                  },
                  {
                    q: "Which items are leaking margin?",
                    a: "3 items are at critical food cost: Paneer Tikka 41%, Veg Biryani 38%, Cold Coffee 36%. A ₹20 price revision on Paneer Tikka brings it back under threshold.",
                  },
                  {
                    q: "Any fraud signals this week?",
                    a: "7 bills were voided after printing — 5 by the same cashier on Saturday night. 2 discounts exceeded authority and needed manager override. Every event is in the audit trail.",
                  },
                ].map((chat, i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="flex justify-end">
                      <p className="bg-slate-900 text-white text-[13px] font-medium px-4 py-2.5 rounded-sm max-w-[85%]">
                        {chat.q}
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 bg-slate-100 rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3 h-3 text-slate-700" strokeWidth={2} />
                      </div>
                      <p className="bg-slate-50 text-slate-700 text-[13px] font-medium leading-relaxed px-4 py-2.5 rounded-sm">
                        {chat.a}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="text-slate-400 text-[11px] font-medium text-center pt-2 border-t border-slate-100">
                  Illustrative conversation — the assistant computes every answer live from your outlet's own database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="py-16 md:py-28 bg-[#fafafa] border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-20">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Beyond Standard POS</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight">
              Every edge that<br className="hidden sm:inline" /> <span className="text-slate-400 italic font-serif">matters.</span>
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              { icon: Plug,            title: "13 Integration Adapters",        desc: "Tally, Zoho, SAP B1, Swiggy, Zomato, UrbanPiper, WhatsApp, Google Sheets, and more from one system." },
              { icon: Receipt,         title: "B2B Invoicing with GST",         desc: "IGST vs CGST+SGST auto-determination, GSTIN binding, GSTR-1 export with B2B/B2CS/CDNR/HSN sections." },
              { icon: Cloud,           title: "Privacy-First Cloud Sync",       desc: "21 payload types sync to cloud as aggregates only. Owner sees revenue and trends. Customer PII never leaves local." },
              { icon: Award,           title: "Loyalty with Auto-Earn",         desc: "Points on payment, tier-based auto-discount, 4-tier system, and loyalty clawback on refunds. Works fully offline." },
              { icon: Tag,             title: "Promotions Engine",              desc: "Coupon codes with usage limits, BOGO, combo pricing, time-window happy hours with day-of-week rules." },
              { icon: Users,           title: "4-Tier Role Separation",         desc: "Operator controls licensing fleet. Owner sees analytics. Manager runs daily ops. Staff gets role-specific UI." },
              { icon: ArrowLeftRight,  title: "Inter-Outlet Transfers",         desc: "Idempotent ship/receive with approval workflow. Stock movements tracked locally, cloud matches source and destination." },
              { icon: Lock,            title: "Cryptographic Licensing",        desc: "Ed25519 signed leases with hash chains, clock rollback guards, and offline grace windows. Cannot be cloned or tampered." },
              { icon: BarChart3,       title: "Owner Dashboard Anywhere",       desc: "Revenue trends, food cost health, menu performance, inventory alerts, and operational KPIs from any device." },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 md:p-6 bg-white border border-slate-100 rounded-sm">
                <div className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-lg shrink-0">
                  <item.icon className="w-4 h-4 text-slate-700" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1.5 font-heading tracking-tight">{item.title}</h4>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-16 md:py-32 bg-white overflow-hidden">
        {/* Mobile: background image treatment (like hero) */}
        <div className="absolute inset-0 z-0 pointer-events-none lg:hidden" style={{ backgroundImage: `url(${servicesImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12, filter: 'grayscale(1)' }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/80 via-white/40 to-white pointer-events-none lg:hidden" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Desktop: show the image normally */}
            <div className="order-2 lg:order-1 hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-slate-200/50 rounded-sm translate-x-4 translate-y-4 -z-10" />
                <img
                  src={servicesImg}
                  alt="Software Engineering"
                  className="relative z-10 rounded-sm shadow-2xl w-full h-auto max-h-[600px] object-cover grayscale"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Engineering Services</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-6 md:mb-8 text-slate-900 tracking-tight leading-tight">
                We Also Build<br /><span className="text-slate-400 italic font-serif">Custom Software.</span>
              </h3>
              <p className="text-base md:text-lg text-slate-500 mb-8 md:mb-12 leading-relaxed font-medium">
                Beyond the POS platform, our team builds custom business applications, integrations, and data pipelines. If your operation needs something that doesn't exist off-the-shelf, we engineer it.
              </p>

              <div className="grid grid-cols-2 gap-y-5 md:gap-y-8 gap-x-6 md:gap-x-12">
                {[
                  "System Integration",
                  "Workflow Design",
                  "Custom Modules",
                  "Data Migration",
                  "Performance Tuning",
                  "Continuous Support"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 md:gap-4">
                    <div className="w-1.5 h-1.5 bg-slate-900 shrink-0" />
                    <span className="font-bold text-slate-900 text-[11px] md:text-[13px] uppercase tracking-widest">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-slate-200">
                <p className="text-slate-400 text-sm font-medium italic">
                  * <strong>Custom pricing available upon consultation.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">About MatoWork</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight mb-6 md:mb-8">
              A control suite, not<br className="hidden sm:inline" /> <span className="text-slate-400 italic font-serif">just a POS.</span>
            </h3>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto mb-10 md:mb-16">
              Most POS systems are billing machines with bolted-on features. MatoWork is a restaurant control suite: billing, inventory, recipes, loyalty, promotions, anti-fraud, staff oversight, B2B invoicing, and owner analytics in one local-first system. Your data stays on your hardware. Your operations run without internet. You export and leave whenever you want.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: "100%", label: "Offline Capable" },
                { value: "13", label: "Integration Adapters" },
                { value: "30+", label: "AI Data Tools" },
                { value: "0", label: "Customer PII in Cloud" },
              ].map((stat, i) => (
                <div key={i} className="py-6 md:py-8">
                  <div className="text-2xl md:text-3xl font-bold font-heading text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-[11px] md:text-[12px] uppercase tracking-widest font-bold text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-32 bg-[#fafafa] border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Common Questions</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight">
                Asked before<br className="sm:hidden" /> <span className="text-slate-400 italic font-serif">every demo.</span>
              </h3>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "Does MatoWork POS work without internet?",
                  a: "Yes. MatoWork runs on a local Postgres database per outlet. Full billing, orders, KDS, payments, inventory, and staff management work with zero internet. Cloud sync is optional and sends only aggregate data — customer PII never leaves local.",
                },
                {
                  q: "What is the AI assistant, and is my data safe with it?",
                  a: "Every outlet includes a built-in AI assistant for the owner and manager. Ask about revenue, food cost, wastage, discounts, refunds, or staff performance in plain English or Hindi, and it computes answers live from your own database. It is read-only and guardrailed — it cannot modify data — and it runs on your hardware, so your numbers never leave the restaurant.",
                },
                {
                  q: "Is MatoWork POS GST compliant?",
                  a: "Yes. MatoWork handles IGST vs CGST+SGST auto-determination, GSTIN binding, HSN codes, and generates GSTR-1 export with B2B, B2CS, CDNR, and HSN sections. It also supports full B2B invoicing.",
                },
                {
                  q: "Can I export my data and leave whenever I want?",
                  a: "Yes. All operational data lives in your restaurant's own local database, and you can export it anytime in standard formats. There is no proprietary data jail and no exit penalty — full data ownership is the point.",
                },
                {
                  q: "Which businesses can use MatoWork POS?",
                  a: "MatoWork is built for Indian food businesses including restaurants, cafes, cloud kitchens, QSR chains, and multi-outlet food operations. It offers recipe-level food costing, dual QR ordering, anti-fraud detection, and inter-outlet stock transfers.",
                },
                {
                  q: "What happens in the demo?",
                  a: "A free 15-minute walkthrough on a live system. We bill, fire orders to the kitchen, and ask the AI assistant real questions — then we pull the internet connection mid-bill so you can watch everything keep running. Bring your toughest questions.",
                },
              ].map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-slate-200">
                  <AccordionTrigger className="text-left text-[15px] font-bold text-slate-900 font-heading tracking-tight hover:no-underline py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-500 text-sm font-medium leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-40 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-slate-900 rounded-sm p-6 sm:p-10 md:p-16 lg:p-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-white/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-20">
                <div className="flex flex-col justify-center">
                  <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-6 md:mb-8">Get in Touch</h2>
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-heading mb-6 md:mb-8 tracking-tight leading-tight">
                    See it run with<br />the WiFi off.
                  </h3>
                  <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
                    A free 15-minute demo on a live system. We pull the internet connection mid-bill and you watch what happens next — then ask the AI assistant anything about the numbers. We respond within a few hours.
                  </p>
                  <div className="mt-8 md:mt-10 space-y-4">
                    <a
                      href="mailto:matowork.1721@gmail.com"
                      className="group flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                    >
                      <Mail className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                      <span className="text-sm md:text-base font-medium break-all">matowork.1721@gmail.com</span>
                    </a>
                    <a
                      href="tel:+917238051053"
                      className="group flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                    >
                      <Phone className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                      <span className="text-sm md:text-base font-medium">+91 72380 51053</span>
                    </a>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-sm">
                  {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 md:py-16">
                      <CheckCircle2 className="w-12 h-12 text-slate-900 mb-6" strokeWidth={1.5} />
                      <h4 className="text-slate-900 font-bold text-lg font-heading tracking-tight mb-3">Demo request received!</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
                        We'll reach out within a few hours. Keep your toughest questions ready — we answer them live, on real numbers.
                      </p>
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-[12px] uppercase tracking-widest font-bold text-slate-400 hover:text-slate-900 transition-colors"
                      >
                        Submit another request
                      </button>
                    </div>
                  ) : (
                  <>
                  <h4 className="text-slate-900 font-bold mb-2 text-[13px] uppercase tracking-widest">Book a Free Demo</h4>
                  <p className="text-slate-400 text-[13px] font-medium mb-6 md:mb-8">15 minutes, on a live system, no obligations.</p>
                  <form className="space-y-4" onSubmit={handleFormSubmit}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Full Name *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleFormChange}
                        placeholder="Phone Number *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Email *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="outlet"
                        value={formData.outlet}
                        onChange={handleFormChange}
                        placeholder="Restaurant / Outlet Name *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleFormChange}
                        placeholder="City"
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-2.5">Your role</p>
                      <div className="flex flex-wrap gap-2">
                        {["Owner", "Manager", "Chef", "Other"].map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, role: prev.role === role ? "" : role }))}
                            className={`text-[12px] font-bold px-4 py-2 rounded-sm border transition-colors ${
                              formData.role === role
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                            }`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        placeholder="Anything specific you want to see? (optional)"
                        rows={2}
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none resize-none"
                      ></textarea>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-slate-900 text-white h-12 md:h-14 text-[13px] uppercase tracking-widest font-bold rounded-none shadow-none disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        "Book My Free Demo"
                      )}
                    </Button>
                    <p className="text-slate-400 text-[11px] font-medium text-center leading-relaxed">
                      By submitting, you agree to be contacted by MatoWork about your demo and accept our{" "}
                      <a href="/privacy" className="underline hover:text-slate-900 transition-colors">Privacy Policy</a>.
                    </p>
                  </form>
                  </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                  <li><button onClick={() => scrollTo('features')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Features</button></li>
                  <li><button onClick={() => scrollTo('services')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Technology</button></li>
                  <li><button onClick={() => navigate('/pricing')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Pricing</button></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[11px] uppercase tracking-widest font-bold text-slate-900 mb-4 md:mb-6">Company</h5>
                <ul className="space-y-3 md:space-y-4">
                  <li><button onClick={() => scrollTo('about')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">About</button></li>
                  <li><button onClick={() => scrollTo('contact')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Contact</button></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[11px] uppercase tracking-widest font-bold text-slate-900 mb-4 md:mb-6">Get in Touch</h5>
                <ul className="space-y-3 md:space-y-4">
                  <li><a href="mailto:matowork.1721@gmail.com" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors break-all">matowork.1721@gmail.com</a></li>
                  <li><a href="tel:+917238051053" className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">+91 72380 51053</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-[11px] md:text-[12px] font-bold tracking-widest uppercase">
            <p>&copy; {new Date().getFullYear()} MatoWork. All rights reserved.</p>
            <div className="flex gap-6 md:gap-8">
              <a href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
