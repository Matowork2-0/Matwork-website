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
    city: "",
    role: "",
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
          city: formData.city.trim(),
          role: formData.role,
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
      (window as any).gtag?.("event", "generate_lead", { form: "pricing_gate" });
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

            <div>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
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

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-slate-300 text-[11px] font-bold uppercase tracking-widest">or</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <a
            href={"https://wa.me/917238051053?text=" + encodeURIComponent("Hi, I would like MatoWork pricing details.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => (window as any).gtag?.("event", "whatsapp_click", { location: "pricing_gate" })}
            className="mt-4 flex w-full items-center justify-center gap-2.5 border border-slate-200 py-3.5 text-[12px] uppercase tracking-widest font-bold text-slate-600 hover:border-[#25D366] hover:text-slate-900 transition-colors rounded-none"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366] shrink-0" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Ask for pricing on WhatsApp
          </a>

          <p className="text-slate-400 text-[11px] font-medium text-center mt-5 leading-relaxed">
            We'll use your details to share pricing information.{" "}
            <a href="/privacy" className="underline hover:text-slate-600 transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
