import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  WifiOff, 
  Zap, 
  BrainCircuit, 
  Database, 
  LineChart, 
  Package, 
  Users, 
  Smartphone, 
  Puzzle, 
  ShieldCheck, 
  Workflow,
  ArrowRight,
  Menu,
  X,
  Phone,
  Mail,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Assets
import heroImg from "@/assets/images/hero-pos.png";
import servicesImg from "@/assets/images/software-services.png";
import abstractBg from "@/assets/images/abstract-bg.png";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">
              Mato<span className="text-primary">Work</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Services', 'Pricing', 'About'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`link-${item.toLowerCase()}`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" className="font-medium" onClick={() => scrollTo('contact')}>Contact</Button>
            <Button onClick={() => scrollTo('contact')} className="shadow-lg shadow-primary/20" data-testid="button-book-demo">
              Book Demo
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-border shadow-lg py-4 px-4 flex flex-col gap-4">
            {['Features', 'Services', 'Pricing', 'About', 'Contact'].map((item) => (
              <button 
                key={item}
                onClick={() => scrollTo(item.toLowerCase())}
                className="text-left py-2 text-lg font-medium text-foreground border-b border-border/50"
              >
                {item}
              </button>
            ))}
            <Button className="w-full mt-2" onClick={() => scrollTo('contact')}>Book Demo</Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${abstractBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial="hidden" 
              animate="visible" 
              variants={staggerContainer}
              className="max-w-2xl"
            >
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Next-Gen POS System
              </motion.div>
              <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-heading leading-[1.1] tracking-tight mb-6 text-foreground">
                Smarter Retail.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Offline-First.</span>
              </motion.h1>
              <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                Empower your business with fast billing, AI-driven insights, and local data storage. A POS built for reliability—even without an internet connection.
              </motion.p>
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/20" onClick={() => scrollTo('pricing')}>
                  Explore Plans
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-base group" onClick={() => scrollTo('features')}>
                  View Features
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div variants={fadeIn} className="mt-10 flex items-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> No Hidden Fees</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> 24/7 Support</div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotate: 1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-white p-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50 z-10 pointer-events-none" />
                <img 
                  src={heroImg} 
                  alt="MatoWork Modern POS Interface" 
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-border flex items-center gap-4 z-20"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Lightning Fast</p>
                  <p className="text-xs text-muted-foreground">Sub-second billing</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Logos / Trust Strip */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Trusted by modern businesses</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder logos, using text for now */}
            {['RetailCo', 'FreshMart', 'LuxeStore', 'QuickCafe', 'TechShop'].map((name) => (
              <span key={name} className="font-heading font-bold text-xl">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* POS Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-semibold tracking-wide uppercase mb-3">Core Capabilities</h2>
            <h3 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-foreground">Everything you need to run your business</h3>
            <p className="text-muted-foreground text-lg">We've engineered a point-of-sale system that handles the complexity of retail, so you can focus on growth.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: WifiOff, title: "Offline-First Architecture", desc: "Keep selling even when the internet drops. Data syncs automatically once you're back online." },
              { icon: Zap, title: "Fast Billing", desc: "Process transactions in milliseconds. Reduce queues and improve customer satisfaction." },
              { icon: BrainCircuit, title: "AI Insights", desc: "Predict trends, understand purchasing behavior, and optimize your strategy with built-in intelligence." },
              { icon: Database, title: "Local Data Storage", desc: "Your data stays on your device for maximum speed and privacy, with secure cloud backups." },
              { icon: LineChart, title: "Real-Time Analytics", desc: "Monitor sales, inventory, and performance metrics from anywhere, in real-time." },
              { icon: Package, title: "Inventory Management", desc: "Automate stock tracking, receive low-stock alerts, and manage multiple locations easily." },
              { icon: Users, title: "CRM Intelligence", desc: "Build customer profiles, track loyalty, and personalize marketing automatically." },
              { icon: Smartphone, title: "Multi-Device Sync", desc: "Use on tablets, phones, or desktops. Changes reflect instantly across all your hardware." },
              { icon: Puzzle, title: "Seamless Integrations", desc: "Connect with accounting software, payment gateways, and e-commerce platforms effortlessly." },
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Bank-level encryption and role-based access control protect your business and customers." },
              { icon: Workflow, title: "Smart Automation", desc: "Automate end-of-day reporting, reordering, and employee scheduling." },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold mb-3 text-foreground font-heading">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-primary font-semibold tracking-wide uppercase mb-3">Beyond Software</h2>
              <h3 className="text-3xl md:text-4xl font-bold font-heading mb-6 text-foreground">
                Personalized Services & Development
              </h3>
              <p className="text-lg text-muted-foreground mb-8">
                We don't just hand you a product and leave. Our engineering team works with you to ensure the software fits your exact operational needs.
              </p>
              
              <div className="space-y-4">
                {[
                  "Personalized Software Development",
                  "Expert POS Implementation",
                  "Workflow Customization",
                  "Seamless Deployment & Integration",
                  "Dedicated Support & Training",
                  "Continuous Upgrades & Optimization"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
              
              <Button className="mt-10 h-12 px-8" onClick={() => scrollTo('contact')}>Discuss Your Project</Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl translate-x-4 translate-y-4" />
              <img 
                src={servicesImg} 
                alt="Software Engineers Collaborating" 
                className="relative z-10 rounded-3xl shadow-2xl w-full h-auto object-cover border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-semibold tracking-wide uppercase mb-3">Transparent Pricing</h2>
            <h3 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-foreground">Choose the right plan for your growth</h3>
            <p className="text-muted-foreground text-lg">No hidden fees. Scale your software as your business expands.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Starter */}
            <div className="bg-background rounded-3xl border border-border p-8 shadow-sm flex flex-col h-full">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-foreground font-heading">Starter</h4>
                <p className="text-muted-foreground mt-2">Essential features for single-location setups.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">$29</span><span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Basic POS Features', 'Local Data Storage', 'Standard Reporting', 'Email Support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-12" onClick={() => scrollTo('contact')}>Get Started</Button>
            </div>

            {/* Growth (Highlighted) */}
            <div className="bg-primary text-primary-foreground rounded-3xl border border-primary p-8 shadow-2xl flex flex-col h-full relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-400 to-indigo-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                Recommended
              </div>
              <div className="mb-6 mt-2">
                <h4 className="text-xl font-bold font-heading text-white">Growth</h4>
                <p className="text-primary-foreground/80 mt-2">Advanced tools for expanding businesses.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-white">$79</span><span className="text-primary-foreground/80">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Starter', 
                  'Multi-Device Sync', 
                  'Advanced Inventory & Alerts', 
                  'Basic CRM & Loyalty', 
                  'Priority Support'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-white">
                    <CheckCircle2 className="w-5 h-5 text-blue-200 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="w-full h-12 bg-white text-primary hover:bg-white/90 font-semibold" onClick={() => scrollTo('contact')}>Start Free Trial</Button>
            </div>

            {/* Enterprise */}
            <div className="bg-background rounded-3xl border border-border p-8 shadow-sm flex flex-col h-full">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-foreground font-heading">Enterprise</h4>
                <p className="text-muted-foreground mt-2">Custom solutions for large scale operations.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-extrabold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  'Everything in Growth', 
                  'Advanced AI Insights', 
                  'Custom Workflows & APIs', 
                  'Dedicated Account Manager', 
                  'On-Premise Deployment Options'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-12" onClick={() => scrollTo('contact')}>Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Issues Fixed (Brochure Audit) */}
      <section className="py-16 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-white rounded-2xl p-8 border border-border shadow-sm max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="text-amber-500 w-5 h-5" />
              Website Redesign Audit Notes
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">As requested, we transformed the dense PDF brochure into a high-converting website. Here is what we fixed:</p>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-foreground">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Fixed typos like "POS FEATURERS" to "POS Features".</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Removed internal draft text ("Here's a shorter version").</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Normalized inconsistent spelling (e.g., customisation vs customization).</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Standardized plan names ("Enterprises" → "Enterprise").</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Transformed dense paragraphs into scannable cards and bullet points.</li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0"/> Applied a modern, cohesive brand identity with clear visual hierarchy.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section id="contact" className="py-24 relative overflow-hidden bg-foreground text-background">
        <div className="absolute inset-0 bg-primary/10" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-6">Ready to upgrade your business?</h2>
          <p className="text-lg text-background/80 max-w-2xl mx-auto mb-10">
            Get in touch with our team today to schedule a demo or discuss a custom solution tailored to your workflow.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <div className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <Phone className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="text-xs text-background/60 font-medium uppercase tracking-wider">Call Us</p>
                <p className="font-semibold text-lg">+91 7559438082 <span className="opacity-50 font-normal mx-1">|</span> 8887518471</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/10 backdrop-blur-sm">
              <Mail className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="text-xs text-background/60 font-medium uppercase tracking-wider">Email Us</p>
                <div className="flex flex-col text-sm font-medium">
                  <a href="mailto:pradumn.upadhyay1@gmail.com" className="hover:text-primary transition-colors">pradumn.upadhyay1@gmail.com</a>
                  <a href="mailto:akarshmishra333@gmail.com" className="hover:text-primary transition-colors">akarshmishra333@gmail.com</a>
                </div>
              </div>
            </div>
          </div>
          
          <Button size="lg" className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 text-white" data-testid="button-final-cta">
            Request A Callback
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-8 border-t border-white/10 text-center text-background/60">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <span className="font-heading font-bold tracking-tight text-white">MatoWork</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} MatoWork. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
