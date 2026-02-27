import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  WifiOff,
  Zap,
  BrainCircuit,
  Database,
  LineChart,
  Package,
  ArrowRight,
  Menu,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Assets
import heroImg from "@/assets/images/hero-pos.png";
import servicesImg from "@/assets/images/software-services.png";

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
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    outlet: "",
    contact: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
    if (!formData.name.trim() || !formData.contact.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in at least your name and contact number.",
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
        title: "Inquiry sent!",
        description: "Thank you. We'll get back to you shortly.",
      });
      setFormData({ name: "", outlet: "", contact: "", address: "" });
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
            {['Features', 'Services', 'About'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-[13px] uppercase tracking-widest font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                data-testid={`link-${item.toLowerCase()}`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollTo('contact')}
              className="text-[13px] uppercase tracking-widest font-semibold text-slate-900 hover:opacity-70 transition-opacity"
            >
              Get Pricing
            </button>
            <Button
              onClick={() => scrollTo('contact')}
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-5 rounded-md h-auto text-[13px] uppercase tracking-widest font-bold border-none shadow-none"
              data-testid="button-book-demo"
            >
              Book Demo
            </Button>
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
            {['Features', 'Services', 'About', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-left text-lg font-semibold text-slate-900"
              >
                {item}
              </button>
            ))}
            <Button className="w-full bg-slate-900 py-6" onClick={() => scrollTo('contact')}>Book Demo</Button>
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
                  Enterprise POS Systems
                </span>
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold font-heading leading-[1.05] tracking-tight mb-6 md:mb-8 text-slate-900">
                The New Standard<br />
                In <span className="text-slate-400 italic font-serif">Retail Operations.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-base sm:text-lg md:text-xl text-slate-500 mb-8 md:mb-12 leading-relaxed max-w-2xl mx-auto font-medium px-2">
                Offline-first architecture meets sophisticated AI insights. MatoWork provides the infrastructure for modern, high-volume commerce environments.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                <Button
                  size="lg"
                  className="bg-slate-900 text-white hover:bg-slate-800 h-14 sm:h-16 px-8 sm:px-10 text-[12px] sm:text-[13px] uppercase tracking-widest font-bold rounded-none"
                  onClick={() => scrollTo('contact')}
                >
                  Request Consultation
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
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Core Technology</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight">
                Engineering excellence at the core of your business.
              </h3>
            </div>
            <div className="pb-2">
              <button
                onClick={() => scrollTo('contact')}
                className="group flex items-center gap-2 text-[13px] uppercase tracking-widest font-bold text-slate-900"
              >
                Inquire about custom modules
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-12 lg:gap-y-20">
            {[
              { icon: WifiOff, title: "Offline Resilience", desc: "Military-grade data persistence that operates without connectivity, syncing seamlessly when online." },
              { icon: Zap, title: "High-Performance Billing", desc: "Engineered for high-volume environments where transaction speed is a critical business metric." },
              { icon: BrainCircuit, title: "Neural Analytics", desc: "Advanced predictive models that transform raw transaction data into strategic growth insights." },
              { icon: Database, title: "Edge Storage", desc: "Data is stored locally for zero-latency performance, backed by encrypted cloud redundancy." },
              { icon: LineChart, title: "Precision Metrics", desc: "Granular, real-time visibility into every facet of your retail operation across all channels." },
              { icon: Package, title: "Adaptive Inventory", desc: "Automated replenishment workflows and multi-node stock tracking for complex supply chains." },
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

      {/* Services Section */}
      <section id="services" className="relative py-16 md:py-32 bg-[#fafafa] overflow-hidden">
        {/* Mobile: background image treatment (like hero) */}
        <div className="absolute inset-0 z-0 pointer-events-none lg:hidden" style={{ backgroundImage: `url(${servicesImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.12, filter: 'grayscale(1)' }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#fafafa]/80 via-[#fafafa]/40 to-[#fafafa] pointer-events-none lg:hidden" />

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
              <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Strategic Services</h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading mb-6 md:mb-8 text-slate-900 tracking-tight leading-tight">
                Bespoke Software<br />Architectures.
              </h3>
              <p className="text-base md:text-lg text-slate-500 mb-8 md:mb-12 leading-relaxed font-medium">
                Our team provides end-to-end engineering services to customize, integrate, and optimize MatoWork for your specific operational requirements.
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
                  * Custom pricing available upon consultation.
                </p>
                <Button
                  className="mt-6 md:mt-8 bg-slate-900 text-white h-12 md:h-14 px-8 md:px-10 text-[12px] md:text-[13px] uppercase tracking-widest font-bold rounded-none"
                  onClick={() => scrollTo('contact')}
                >
                  Speak with an Architect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">About Our POS</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight mb-6 md:mb-8">
              Built for retailers who<br className="hidden sm:inline" /> <span className="text-slate-400 italic font-serif">never stop selling.</span>
            </h3>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto mb-10 md:mb-16">
              MatoWork POS is built from the ground up for Indian retail — from restaurants and cafés to grocery stores and salons. Our offline-first billing system keeps your sales running even when the internet goes down, syncing automatically when you're back online. With sub-50ms transaction speeds, real-time inventory tracking, and AI-powered sales insights, we give every business owner the tools that enterprise chains take for granted.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "< 50ms", label: "Transaction Time" },
                { value: "100%", label: "Offline Capable" },
                { value: "24/7", label: "Support" },
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
                    Start your<br />transformation.
                  </h3>
                  <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">
                    Contact us for custom pricing, enterprise demos, or technical inquiries. Fill out the form and we'll get back to you shortly.
                  </p>
                </div>

                <div className="bg-white p-6 sm:p-8 md:p-10 rounded-sm">
                  <h4 className="text-slate-900 font-bold mb-6 md:mb-8 text-[13px] uppercase tracking-widest">Inquiry Form</h4>
                  <form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Full Name *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="outlet"
                        value={formData.outlet}
                        onChange={handleFormChange}
                        placeholder="Outlet / Business Name"
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        name="contact"
                        value={formData.contact}
                        onChange={handleFormChange}
                        placeholder="Contact Number *"
                        required
                        className="w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none"
                      />
                    </div>
                    <div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        placeholder="Address"
                        rows={3}
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
                        "Send Inquiry"
                      )}
                    </Button>
                  </form>
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
                  <li><button onClick={() => scrollTo('contact')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Pricing</button></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[11px] uppercase tracking-widest font-bold text-slate-900 mb-4 md:mb-6">Company</h5>
                <ul className="space-y-3 md:space-y-4">
                  <li><button onClick={() => scrollTo('about')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">About</button></li>
                  <li><button onClick={() => scrollTo('contact')} className="text-slate-500 text-[13px] font-medium hover:text-slate-900 transition-colors">Contact</button></li>
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
    </div>
  );
}
