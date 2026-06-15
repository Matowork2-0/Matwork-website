import { useState } from "react";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const LEAD_STORAGE_KEY = "mw_pricing_lead";

export function checkLeadToken(): boolean {
  try {
    const token = localStorage.getItem(LEAD_STORAGE_KEY);
    if (!token) return false;
    const [payloadPart] = token.split(".");
    if (!payloadPart) return false;
    const payload = JSON.parse(atob(payloadPart));
    if (!payload.exp || payload.exp < Date.now()) {
      localStorage.removeItem(LEAD_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem(LEAD_STORAGE_KEY);
    return false;
  }
}

interface PricingLeadGateProps {
  onUnlock: () => void;
}

export default function PricingLeadGate({ onUnlock }: PricingLeadGateProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    business: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Please enter your full name.";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Name is too long.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    // Normalize phone for validation
    const digits = formData.phone.replace(/[\s\-+()]/g, "");
    const cleaned = digits.startsWith("91") && digits.length === 12
      ? digits.slice(2)
      : digits;
    if (!formData.phone.trim()) {
      errors.phone = "Please enter your phone number.";
    } else if (!/^[6-9]\d{9}$/.test(cleaned)) {
      errors.phone = "Please enter a valid 10-digit Indian phone number.";
    }

    if (formData.business.trim().length > 200) {
      errors.business = "Business name is too long.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClient()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/verify-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          business: formData.business.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        toast({
          title: "Too many attempts",
          description: data.message || "Please wait a few minutes before trying again.",
          variant: "destructive",
        });
        return;
      }

      if (res.status === 400 || res.status === 422) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.message });
        } else {
          toast({
            title: "Validation error",
            description: data.message || "Please check your input and try again.",
            variant: "destructive",
          });
        }
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Server error");
      }

      // Store token and unlock
      if (data.token) {
        localStorage.setItem(LEAD_STORAGE_KEY, data.token);
      }
      onUnlock();
    } catch {
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
    <div className="py-10 md:py-20">
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-slate-200 rounded-sm p-6 sm:p-8 md:p-10 shadow-sm">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
            </div>
            <h3 className="text-[13px] uppercase tracking-widest font-bold text-slate-900 mb-3">
              Unlock Pricing Details
            </h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Enter your details to view our complete pricing, feature comparison, and plan options.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name *"
                required
                className={`w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none ${
                  fieldErrors.name ? "ring-2 ring-red-400" : ""
                }`}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Work Email *"
                required
                className={`w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none ${
                  fieldErrors.email ? "ring-2 ring-red-400" : ""
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number *"
                required
                className={`w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none ${
                  fieldErrors.phone ? "ring-2 ring-red-400" : ""
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.phone}
                </p>
              )}
            </div>

            <div>
              <input
                type="text"
                name="business"
                value={formData.business}
                onChange={handleChange}
                placeholder="Business / Outlet Name"
                className={`w-full bg-slate-50 border-none rounded-none p-3 md:p-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all outline-none ${
                  fieldErrors.business ? "ring-2 ring-red-400" : ""
                }`}
              />
              {fieldErrors.business && (
                <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {fieldErrors.business}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white h-12 md:h-14 text-[13px] uppercase tracking-widest font-bold rounded-none shadow-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "View Pricing"
              )}
            </Button>
          </form>

          <p className="text-slate-400 text-[11px] font-medium text-center mt-5 leading-relaxed">
            We'll use your details to share pricing information.{" "}
            <a href="#" className="underline hover:text-slate-600 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
