import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";

const BASE_URL = "https://matowork.netlify.app";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "MatoWork — Offline-First Restaurant POS with Full Data Ownership | India",
    description:
      "MatoWork is India's only POS that runs entirely on your local database — with a built-in AI assistant that answers from your own data. Offline-first billing, recipe-level food costing, anti-fraud detection, DPDP compliance, dual QR ordering. No cloud dependency. No vendor lock-in.",
  },
  "/pricing": {
    title: "MatoWork POS Pricing — Plans & Licensing for Indian Restaurants",
    description:
      "MatoWork POS plans and licensing for Indian restaurants: subscription tiers, 4-year standalone licenses, and per-feature add-on modules. Every plan includes the full offline-first core POS.",
  },
  "/privacy": {
    title: "Privacy Policy — MatoWork",
    description: "How MatoWork collects, uses, and protects the information you share on this website.",
  },
  "/terms": {
    title: "Terms of Service — MatoWork",
    description: "The terms that govern your use of the MatoWork website.",
  },
};

function DynamicMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const url = `${BASE_URL}${location === "/" ? "/" : location}`;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", url);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", url);

    const meta = PAGE_META[location] || PAGE_META["/"];
    document.title = meta.title;

    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", meta.description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", meta.title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", meta.description);
  }, [location]);

  return null;
}

function VisitTracker() {
  const [location] = useLocation();
  const lastLogged = useRef("");

  useEffect(() => {
    if (location === lastLogged.current) return;
    lastLogged.current = location;

    const payload = {
      action: "visit",
      timestamp: new Date().toISOString(),
      page: location,
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer || "",
      language: navigator.language || "",
    };

    fetch("/api/log-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [location]);

  return null;
}

const WHATSAPP_URL =
  "https://wa.me/917238051053?text=" +
  encodeURIComponent("Hi, I would like a 15-minute MatoWork demo.");

function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      onClick={() => (window as any).gtag?.("event", "whatsapp_click", { location: "floating" })}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </a>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DynamicMeta />
        <VisitTracker />
        <Switch>
          <Route path="/login" component={Home} />
          <Route path="/" component={Home} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/price">{() => <Redirect to="/pricing" />}</Route>
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route component={NotFound} />
        </Switch>
        <WhatsAppFloat />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
