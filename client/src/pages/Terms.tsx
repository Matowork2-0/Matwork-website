import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const logoImg = "/favicon.png";

const sections = [
  {
    heading: "1. Acceptance of these terms",
    body: [
      "These Terms of Service (\"Terms\") govern your access to and use of the MatoWork website at matowork.netlify.app (the \"Website\"), operated by MatoWork (\"MatoWork\", \"we\", \"us\"). By visiting the Website, submitting a form on it, or using any part of it, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the Website.",
      "If you use the Website on behalf of a company or restaurant business, you confirm that you are authorized to accept these Terms for that business, and \"you\" includes that business.",
    ],
  },
  {
    heading: "2. What this Website is for",
    body: [
      "The Website presents the MatoWork restaurant control suite — an offline-first point-of-sale and restaurant management product — and lets you request a product demo, request pricing information, and contact us. The Website itself is not the product: it does not provide billing, POS, or restaurant-management functionality.",
    ],
  },
  {
    heading: "3. Eligibility and accurate information",
    body: [
      "The Website is intended for business users — owners, managers, and staff of food-service businesses evaluating software — and for general visitors. When you submit a form, you must provide information that is accurate, current, and yours to share: your real name, a phone number and email address you control, and your actual business details.",
      "We may decline, ignore, or delete submissions that appear false, automated, abusive, or submitted on someone else's behalf without authority.",
    ],
  },
  {
    heading: "4. Demo requests and communications",
    body: [
      "Submitting a demo or pricing request is an invitation for us to contact you; it does not create any purchase obligation for you or any supply obligation for us. By submitting a form, you consent to MatoWork contacting you about your request and about the MatoWork product by phone, email, or messaging, using the details you provided.",
      "You can withdraw this consent at any time by telling us so on any channel or by writing to matowork.1721@gmail.com, and we will stop contacting you.",
    ],
  },
  {
    heading: "5. Pricing information and confidentiality",
    body: [
      "Plan structures, feature lists, and prices shown on or shared through this Website — including pricing revealed after you complete the pricing-request form — are indicative only, are provided for your own evaluation, and may change or be withdrawn at any time without notice.",
      "Pricing information we share with you after a form submission or consultation is intended for you and your business. You agree not to republish it or share it for purposes other than evaluating MatoWork for your business.",
      "Nothing on this Website is a binding offer. Final pricing, scope, deliverables, support, and all commercial commitments are set out exclusively in the written proposal, quotation, or agreement signed between you and MatoWork.",
    ],
  },
  {
    heading: "6. The MatoWork product",
    body: [
      "Your purchase, licensing, deployment, and use of the MatoWork product itself — including software licenses, subscriptions, setup, support, AMC, and data-protection commitments — are governed by the separate written agreement you sign with MatoWork, not by these Website Terms. If there is any conflict between these Terms and a signed agreement, the signed agreement prevails for the product.",
    ],
  },
  {
    heading: "7. Acceptable use of the Website",
    body: [
      "You agree not to: (a) probe, scan, or test the Website or its APIs for vulnerabilities without our written permission; (b) attempt to bypass access controls, including the pricing-request step; (c) scrape, harvest, or bulk-download Website content or submit automated form entries; (d) submit unlawful, defamatory, infringing, or deceptive content; (e) impersonate any person or business; or (f) use the Website in violation of applicable law.",
      "We may restrict, rate-limit, or block access that we reasonably believe violates these Terms.",
    ],
  },
  {
    heading: "8. Intellectual property",
    body: [
      "The MatoWork name, logo, product designs, screenshots, text, graphics, and all other content on this Website are owned by MatoWork or used with permission, and are protected by applicable intellectual-property laws. We grant you a limited, revocable, non-exclusive right to view and use the Website for evaluating MatoWork for your business.",
      "You may not copy, modify, distribute, or create derivative works from Website content, or use our name or branding, for any competing or commercial purpose without our prior written permission. Third-party names mentioned on the Website (such as integration partners) belong to their respective owners and are referenced for identification only; no affiliation or endorsement is implied.",
    ],
  },
  {
    heading: "9. Third-party services",
    body: [
      "The Website runs on third-party infrastructure (such as hosting and form-processing services) and may offer sign-in through third-party providers (such as Google). Your use of those services is subject to their own terms and privacy policies, which we do not control. Links to third-party websites are provided for convenience; we are not responsible for their content.",
    ],
  },
  {
    heading: "10. Privacy",
    body: [
      "Our Privacy Policy explains what information we collect through the Website, why, where it is stored, and how to have it corrected or deleted. It forms part of these Terms.",
    ],
  },
  {
    heading: "11. Disclaimers",
    body: [
      "The Website is provided on an \"as is\" and \"as available\" basis. We work to keep it accurate, secure, and available, but we make no warranty that the Website will be uninterrupted, error-free, or free of harmful components, or that every description, feature list, or figure is current at all times. Product capabilities described on the Website are summaries; their authoritative description is the one in your signed agreement and product documentation.",
    ],
  },
  {
    heading: "12. Limitation of liability",
    body: [
      "To the maximum extent permitted by applicable law, MatoWork will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or business opportunity, arising out of or related to your use of (or inability to use) this Website.",
      "To the same extent, our total aggregate liability for all claims relating to the Website is limited to INR 1,000. Nothing in these Terms limits liability that cannot be limited under applicable law, including liability for fraud. This clause applies to the Website only; liability relating to the MatoWork product is addressed in your signed agreement.",
    ],
  },
  {
    heading: "13. Indemnity",
    body: [
      "You agree to indemnify and hold MatoWork harmless from claims, losses, and reasonable costs (including legal fees) arising from your misuse of the Website, your violation of these Terms, or information you submit that infringes the rights of another person.",
    ],
  },
  {
    heading: "14. Changes to the Website and these Terms",
    body: [
      "We may change, suspend, or discontinue any part of the Website at any time. We may also update these Terms; the \"Last updated\" date above reflects the current version. Changes apply from the moment they are published on this page, and your continued use of the Website after a change means you accept the updated Terms.",
    ],
  },
  {
    heading: "15. Severability and entire agreement",
    body: [
      "If any provision of these Terms is held unenforceable, the remaining provisions continue in full force. These Terms, together with the Privacy Policy, are the entire agreement between you and MatoWork regarding use of the Website — and, as set out above, they do not replace any signed agreement covering the MatoWork product.",
    ],
  },
  {
    heading: "16. Governing law, jurisdiction, and contact",
    body: [
      "These Terms are governed by the laws of India. Subject to any mandatory law to the contrary, disputes arising out of or relating to the Website are subject to the exclusive jurisdiction of the courts at Ranchi, Jharkhand, India.",
      "Questions about these Terms? Write to matowork.1721@gmail.com or call +91 72380 51053.",
    ],
  },
];

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-slate-900 selection:text-white">
      <header className="border-b border-slate-100 py-4 md:py-5">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImg} alt="MatoWork" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-heading font-bold text-lg tracking-tight text-slate-900">
              Mato<span className="text-slate-500">Work</span>
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-[12px] uppercase tracking-widest font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to site
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-14 md:py-24">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-400 mb-4 md:mb-6">Legal</h2>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 leading-tight mb-4">
            Terms of <span className="text-slate-400 italic font-serif">Service.</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mb-10 md:mb-14">Last updated: 24 October 2026</p>

          <div className="space-y-10 md:space-y-12">
            {sections.map((section, i) => (
              <section key={i}>
                <h3 className="text-lg font-bold text-slate-900 font-heading tracking-tight mb-3">{section.heading}</h3>
                {section.body.map((para, j) => (
                  <p key={j} className="text-slate-500 text-[15px] font-medium leading-relaxed mb-3">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-12 md:mt-16 pt-8 border-t border-slate-100">
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed">
              Also see our{" "}
              <a href="/privacy" className="underline hover:text-slate-900 transition-colors">Privacy Policy</a>
              , which explains how we handle the information you share with us.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-100 py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-slate-400 text-[11px] font-bold tracking-widest uppercase">
          &copy; {new Date().getFullYear()} MatoWork. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
