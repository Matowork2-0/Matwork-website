import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
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

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Home} />
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DynamicMeta />
        <AuthGate>
          <Router />
        </AuthGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
