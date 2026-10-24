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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
