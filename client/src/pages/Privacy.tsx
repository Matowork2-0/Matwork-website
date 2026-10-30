import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const logoImg = "/favicon.png";

const sections = [
  {
    heading: "What we collect",
    body: [
      "When you request a demo or unlock pricing on this website, we collect the details you submit: your name, phone number, email address, restaurant or business name, city, your role, and any comments you include.",
      "We also keep basic visit logs for this website — the page visited, device and browser type, screen size, referrer, and language. These logs help us understand interest in MatoWork. We do not use advertising trackers or sell data to advertisers.",
      "This website uses Google Analytics and Microsoft Clarity to understand how visitors use it — pages viewed, approximate location, device type, and interaction patterns, including session recordings and heatmaps. These tools set cookies. We use this data only to improve the website; it is not used for advertising.",
    ],
  },
  {
    heading: "Why we collect it",
    body: [
      "We use your contact details for one purpose: to respond to your demo or pricing request and follow up about MatoWork. We do not sell or rent your information to anyone.",
    ],
  },
  {
    heading: "Where it is stored",
    body: [
      "Form submissions are stored in our private records (currently Google Workspace), accessible only to the MatoWork team. Website logs are stored with our hosting provider.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can ask us at any time to show, correct, or permanently delete the information you submitted. Email matowork.1721@gmail.com from the address you registered with, and we will act on it promptly.",
    ],
  },
  {
    heading: "Privacy inside the product",
    body: [
      "The MatoWork POS itself is built local-first: your restaurant's operational data, including customer personal information, lives in a database on your own hardware. Optional cloud sync carries aggregate figures only — customer PII never leaves your premises. The product includes DPDP-aligned capabilities such as verified PII erasure and consent tracking.",
    ],
  },
  {
    heading: "Changes and contact",
    body: [
      "If this policy changes, we will update this page. Questions? Write to matowork.1721@gmail.com or call +91 72380 51053.",
    ],
  },
];

export default function Privacy() {
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
            Privacy <span className="text-slate-400 italic font-serif">Policy.</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium mb-10 md:mb-14">Last updated: 30 October 2026</p>

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
