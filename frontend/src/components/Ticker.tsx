"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, ExternalLink } from "lucide-react";
import { API_BASE } from "@/lib/api";

export interface Announcement {
  id: string;
  title: string;
  category: "HACKATHON" | "SCHOLARSHIP" | "ADMISSIONS" | "EXAM" | "ANNOUNCEMENT";
  summary: string;
  content?: string;
  link?: string;
  priority: number;
  created_at: string;
}

const FALLBACK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "fb-1",
    title: "Smart India Hackathon 2026: Institutional Grand Finale Registrations Now Open for PRAMAAN Verified Students",
    category: "HACKATHON",
    summary: "Students with verified digital academic profiles can pre-fill SIH 2026 team submissions directly via unified credential validation.",
    content: "The Ministry of Education's Innovation Cell announces the 2026 Grand Finale. Teams can verify their active semester enrollments and CGPA instantaneously without physical attestation.",
    link: "https://sih.gov.in",
    priority: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-2",
    title: "National Merit Fellowship 2026-27: Automated Eligibility Verification via Academic Records Enabled",
    category: "SCHOLARSHIP",
    summary: "Top 2% rank holders across accredited Indian universities can apply with 1-click marksheet verification.",
    content: "The National Fellowship program has enabled direct API verification for participating institutions, eliminating manual attestation delays.",
    link: "https://scholarships.gov.in",
    priority: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-3",
    title: "Centralized M.Tech & Ph.D. Admissions Window Closes on November 15, 2026",
    category: "ADMISSIONS",
    summary: "Eligible undergraduate seniors are requested to ensure their Semester 6 digital transcripts are verified.",
    content: "Participating technical institutions will draw grade sheets directly from institutional registries for provisional shortlists.",
    link: "#",
    priority: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: "fb-4",
    title: "Winter 2026 End-Semester Examination Schedules Released for Autonomous Technical Institutes",
    category: "EXAM",
    summary: "Timetables for Autumn/Winter 2026 sessions are published. Download official hall tickets through your institution portal.",
    content: "Autonomous colleges are reminded to complete internal mark submissions 10 business days prior to practical examinations.",
    link: "#",
    priority: 1,
    created_at: new Date().toISOString(),
  },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  HACKATHON: { bg: "bg-[#7C3AED]/20", text: "text-[#C4B5FD]", border: "border-[#7C3AED]/40" },
  SCHOLARSHIP: { bg: "bg-[#10B981]/20", text: "text-[#6EE7B7]", border: "border-[#10B981]/40" },
  ADMISSIONS: { bg: "bg-[#315CF5]/20", text: "text-[#93C5FD]", border: "border-[#315CF5]/40" },
  EXAM: { bg: "bg-[#F59E0B]/20", text: "text-[#FCD34D]", border: "border-[#F59E0B]/40" },
  ANNOUNCEMENT: { bg: "bg-slate-700/40", text: "text-slate-300", border: "border-slate-600/40" },
};

export default function Ticker() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(FALLBACK_ANNOUNCEMENTS);
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Announcement | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch(`${API_BASE}/announcements`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAnnouncements(data);
            setIsLiveFeed(true);
          }
        }
      } catch (err) {
        // Keeps graceful fallback demo announcements
        console.warn("Using fallback demo ticker feed:", err);
      }
    }
    fetchAnnouncements();
  }, []);

  const loopedItems = [...announcements, ...announcements];

  return (
    <>
      {/* Slim dark-navy ticker strip directly under navigation */}
      <section
        aria-label="Academic Announcements Feed"
        className="bg-[#14213D] border-b border-[#0F172A] text-white overflow-hidden relative flex items-center h-10 select-none z-30"
      >
        {/* Compact Lead Feed Indicator */}
        <div className="z-10 bg-[#0E172B] border-r border-slate-700/60 h-full px-3 sm:px-4 flex items-center gap-2 shrink-0 shadow-md">
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveFeed ? "bg-[#10B981] animate-pulse" : "bg-[#F59E0B]"
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
            {isLiveFeed ? "LIVE FEED" : "DEMO FEED"}
          </span>
        </div>

        {/* Continuous Horizontal Scrolling Track */}
        <div className="overflow-hidden w-full flex items-center h-full">
          <div className="animate-ticker flex items-center gap-8 pl-4">
            {loopedItems.map((item, idx) => {
              const catStyle =
                CATEGORY_STYLES[item.category] || CATEGORY_STYLES.ANNOUNCEMENT;
              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 text-left group focus-visible:outline-hidden"
                >
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                  >
                    {item.category}
                  </span>
                  <span className="font-medium group-hover:underline underline-offset-4 decoration-[#315CF5]">
                    {item.title}
                  </span>
                  <span className="text-slate-600 font-mono text-xs">•</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Announcement Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#14213D] hover:bg-[#F1F5F9] transition-colors"
              aria-label="Close Announcement"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  CATEGORY_STYLES[selectedItem.category]?.bg || "bg-slate-100"
                } ${
                  CATEGORY_STYLES[selectedItem.category]?.text || "text-slate-700"
                } ${
                  CATEGORY_STYLES[selectedItem.category]?.border || "border-slate-200"
                }`}
              >
                {selectedItem.category}
              </span>
              <span className="text-xs text-[#64748B] flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(selectedItem.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#14213D] mb-2 leading-snug">
              {selectedItem.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#475569] mb-4 leading-relaxed">
              {selectedItem.summary}
            </p>

            {selectedItem.content && (
              <div className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl p-3.5 text-xs text-[#334155] mb-5 leading-relaxed">
                {selectedItem.content}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
              <div className="text-[11px] text-[#64748B] font-medium">
                PRAMAAN Verified Announcement Notice
              </div>
              {selectedItem.link && selectedItem.link !== "#" ? (
                <a
                  href={selectedItem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315CF5] hover:text-[#2347DB] hover:underline"
                >
                  Visit Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#14213D] rounded-xl transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
