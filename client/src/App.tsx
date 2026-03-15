import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthGate from "@/components/AuthGate";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/not-found";

const BASE_URL = "https://matowork.netlify.app";

function DynamicMeta() {
  const [location] = useLocation();

  useEffect(() => {
    const url = `${BASE_URL}${location === "/" ? "/" : location}`;

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", url);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", url);
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

function GatedPricing() {
  return (
    <AuthGate>
      <Pricing />
    </AuthGate>
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
          <Route path="/pricing" component={GatedPricing} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
