import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const logoImg = "/favicon.png";

const sections = [
  {
    heading: "About this website",
    body: [
      "This website presents the MatoWork restaurant control suite and lets you request a demo or pricing information. By using it, you accept these terms.",
    ],
  },
  {
    heading: "Informational content",
    body: [
      "Product descriptions, feature lists, and prices shown or shared from this website are indicative and may change. Final pricing, scope, and commitments are set out in the written proposal or agreement you sign with MatoWork — not by this website.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Submit only accurate information that you are entitled to share. Do not attempt to disrupt the website, probe its systems without authorization, or submit automated spam.",
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      "The MatoWork name, logo, product designs, and the content of this website belong to MatoWork. You may not copy or reuse them for a competing purpose without written permission.",
    ],
  },
  {
    heading: "No warranty for the website",
    body: [
      "This website is provided as-is. We work to keep it accurate and available, but we do not guarantee uninterrupted access or that every detail is current at all times.",
    ],
  },
  {
    heading: "Governing law and contact",
    body: [
      "These terms are governed by the laws of India. Questions about them? Write to matowork.1721@gmail.com or call +91 72380 51053.",
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
