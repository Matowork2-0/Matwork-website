import { useEffect, useRef, useCallback } from "react";

interface EngagementState {
  sessionId: string;
  startTime: number;
  maxScrollDepth: number;
  scrollMilestones: Set<number>;
  timeBucketReached: string;
  pricingModelsViewed: Set<string>;
  billingToggleUsed: boolean;
  ctaClicks: Set<string>;
  ctaClickCount: number;
  featureTableExpanded: boolean;
  tierInteractions: Set<string>;
  flushed: boolean;
}

const TIME_BUCKETS = [10, 30, 60, 120];
const SCROLL_MILESTONES = [25, 50, 75, 100];
const BACKUP_INTERVAL_MS = 30_000;
const ENDPOINT = "/api/log-engagement";
const STORAGE_PREFIX = "mw_engagement_";

function generateSessionId(): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 6);
  return `px_${ts}_${rand}`;
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let device = "Desktop";
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    device = /iPad/i.test(ua) ? "Tablet" : "Mobile";
  }
  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  return `${device} | ${os} | ${browser}`;
}

function buildPayload(state: EngagementState) {
  const timeOnPage = Math.round((Date.now() - state.startTime) / 1000);
  return {
    timestamp: new Date(state.startTime).toISOString(),
    sessionId: state.sessionId,
    page: "/pricing",
    timeOnPage,
    timeBucketReached: state.timeBucketReached,
    maxScrollDepth: state.maxScrollDepth,
    scrollMilestones: Array.from(state.scrollMilestones).sort((a, b) => a - b).join(","),
    pricingModelsViewed: Array.from(state.pricingModelsViewed).join(","),
    billingToggle: state.billingToggleUsed,
    ctaClicks: Array.from(state.ctaClicks).join(","),
    ctaClickCount: state.ctaClickCount,
    featureTableExpanded: state.featureTableExpanded,
    tierInteractions: Array.from(state.tierInteractions).join(","),
    device: getDeviceInfo(),
    screen: `${window.screen.width}x${window.screen.height}`,
    referrer: document.referrer || "",
  };
}

function sendPayload(data: string) {
  if (navigator.sendBeacon) {
    const blob = new Blob([data], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
  } else {
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data,
      keepalive: true,
    }).catch(() => {});
  }
}

function flush(state: EngagementState) {
  if (state.flushed) return;
  const payload = buildPayload(state);
  sendPayload(JSON.stringify(payload));
  // Clean up localStorage backup for this session
  try { localStorage.removeItem(STORAGE_PREFIX + state.sessionId); } catch {}
  state.flushed = true;
}

export function usePricingEngagement() {
  const stateRef = useRef<EngagementState>({
    sessionId: generateSessionId(),
    startTime: Date.now(),
    maxScrollDepth: 0,
    scrollMilestones: new Set(),
    timeBucketReached: "0s",
    pricingModelsViewed: new Set(["standalone"]),
    billingToggleUsed: false,
    ctaClicks: new Set(),
    ctaClickCount: 0,
    featureTableExpanded: false,
    tierInteractions: new Set(),
    flushed: false,
  });

  // Flush any orphaned engagement data from previous sessions
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          sendPayload(data);
          localStorage.removeItem(key);
        }
      }
    } catch {}
  }, []);

  // Scroll tracking
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          const pct = Math.round((scrollTop / docHeight) * 100);
          const s = stateRef.current;
          if (pct > s.maxScrollDepth) s.maxScrollDepth = pct;
          for (const milestone of SCROLL_MILESTONES) {
            if (pct >= milestone) s.scrollMilestones.add(milestone);
          }
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Time-on-page bucket tracking
  useEffect(() => {
    const timers = TIME_BUCKETS.map((seconds) =>
      setTimeout(() => {
        stateRef.current.timeBucketReached = `${seconds}s`;
      }, seconds * 1000)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Periodic localStorage backup
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const payload = buildPayload(stateRef.current);
        localStorage.setItem(
          STORAGE_PREFIX + stateRef.current.sessionId,
          JSON.stringify(payload)
        );
      } catch {}
    }, BACKUP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Flush on unload / visibility change / component unmount
  useEffect(() => {
    const handleUnload = () => flush(stateRef.current);
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush(stateRef.current);
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      flush(stateRef.current);
    };
  }, []);

  const trackModelChange = useCallback((model: string) => {
    stateRef.current.pricingModelsViewed.add(model);
  }, []);

  const trackBillingToggle = useCallback(() => {
    stateRef.current.billingToggleUsed = true;
  }, []);

  const trackCtaClick = useCallback((label: string) => {
    stateRef.current.ctaClicks.add(label);
    stateRef.current.ctaClickCount += 1;
  }, []);

  const trackFeatureExpansion = useCallback(() => {
    stateRef.current.featureTableExpanded = true;
  }, []);

  const trackTierInteraction = useCallback((tier: string) => {
    stateRef.current.tierInteractions.add(tier);
  }, []);

  return {
    trackModelChange,
    trackBillingToggle,
    trackCtaClick,
    trackFeatureExpansion,
    trackTierInteraction,
  };
}
