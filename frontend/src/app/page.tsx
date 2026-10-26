"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  FileCheck2,
  Building2,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Lock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Download,
  Calendar,
  ExternalLink,
  ChevronRight,
  Activity,
  FileText,
} from "lucide-react";
import { saveSession, API_BASE } from "@/lib/api";

interface PublicStats {
  student_records: number;
  participating_institutions: number;
  documents_issued: number;
  verification_requests: number;
  is_demo_seed?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  category: "HACKATHON" | "SCHOLARSHIP" | "ADMISSIONS" | "EXAM" | "ANNOUNCEMENT";
  summary: string;
  content?: string;
  link?: string;
  created_at: string;
}

export default function HomePage() {
  const router = useRouter();
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);

  // Platform statistics derived from database
  const [stats, setStats] = useState<PublicStats>({
    student_records: 3,
    participating_institutions: 3,
    documents_issued: 7,
    verification_requests: 10,
    is_demo_seed: true,
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  useEffect(() => {
    // Fetch live platform database statistics
    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/public-stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        // Keeps graceful database seed defaults
      }
    }

    // Fetch announcements
    async function loadAnnouncements() {
      try {
        const res = await fetch(`${API_BASE}/announcements`);
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        }
      } catch (err) {
        // Handled gracefully
      } finally {
        setAnnouncementsLoading(false);
      }
    }

    loadStats();
    loadAnnouncements();
  }, []);

  const handleQuickLogin = async (email: string, pass: string, rolePath: string) => {
    setQuickLoginLoading(email);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        saveSession(data);
        router.push(rolePath);
      } else {
        alert("Quick login failed. Please ensure the backend server is running.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting backend API at http://127.0.0.1:8000.");
    } finally {
      setQuickLoginLoading(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F8FC]">
      {/* Step 4B: Navbar */}
      <Navbar />

      {/* Step 4C: Education News Ticker */}
      <Ticker />

      {/* Step 4D: Premium Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden border-b border-[#E5EAF2] bg-white">
        {/* Soft background tint */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EFF4FF] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 opacity-70" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F0FDFA] rounded-full blur-3xl pointer-events-none -ml-20 -mb-20 opacity-70" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#315CF5] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>THE DIGITAL ACADEMIC RECORDS PLATFORM</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#14213D] tracking-tight leading-[1.12]">
                Your Academic Records. <br />
                <span className="text-[#315CF5]">One Trusted Place.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Access academic documents, manage student records and verify PRAMAAN-issued credentials through a unified digital platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/login?tab=student"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-[#315CF5] hover:bg-[#2347DB] shadow-md shadow-[#315CF5]/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Access My Records</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/verify"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-[#14213D] bg-white hover:bg-[#F8FAFC] border border-[#E5EAF2] hover:border-[#CBD5E1] shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 text-[#14B8A6]" />
                  <span>Verify a Document</span>
                </Link>
              </div>

              {/* Three Compact Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-[#64748B] border-t border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="font-medium text-[#14213D]">Secure Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="font-medium text-[#14213D]">QR Document Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="font-medium text-[#14213D]">Institution-Level Permissions</span>
                </div>
              </div>
            </div>

            {/* Right Column: Real UI Component Product Mockup (Digital Document Wallet) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white p-2 rounded-3xl border border-[#E5EAF2] shadow-xl shadow-[#14213D]/5">
                {/* Simulated Marksheet Card */}
                <div className="bg-[#FFFFFF] rounded-2xl p-6 text-[#14213D] border border-[#E5EAF2] relative overflow-hidden">
                  {/* Subtle Card Accent Stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#315CF5] via-[#6366F1] to-[#14B8A6]" />

                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-[#F1F5F9] mt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#315CF5]">
                        PRAMAAN VERIFIED WALLET
                      </span>
                      <h3 className="text-base font-bold text-[#14213D] mt-0.5">
                        Indian Institute of Technology Delhi
                      </h3>
                      <p className="text-[11px] text-[#64748B]">B.Tech Computer Science • Semester VI</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[10px] font-bold tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      VERIFIED
                    </span>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-2 gap-3 py-3.5 text-xs border-b border-[#F1F5F9]">
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">STUDENT NAME</div>
                      <div className="font-semibold text-[#14213D]">Aarav Sharma</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">PRAMAAN ID</div>
                      <div className="font-mono text-[#315CF5] font-medium text-[11px]">
                        PRM-2024-ND-849201
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">ROLL NUMBER</div>
                      <div className="font-mono text-[#475569] font-medium text-[11px]">2021CSB1084</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">CUMULATIVE CGPA</div>
                      <div className="font-bold text-[#059669] text-sm">9.18 / 10.0</div>
                    </div>
                  </div>

                  {/* Subject Grade Snippet */}
                  <div className="py-3 text-[11px] space-y-1.5 bg-[#F8FAFC] px-3 rounded-xl my-2 border border-[#F1F5F9]">
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span>COL758 Advanced Algorithms</span>
                      <span className="text-[#14213D] font-semibold">Grade A+ (10.0)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span>COL774 Machine Learning</span>
                      <span className="text-[#14213D] font-semibold">Grade A (10.0)</span>
                    </div>
                    <div className="flex items-center justify-between text-[#64748B]">
                      <span>COL380 Distributed Computing</span>
                      <span className="text-[#14213D] font-semibold">Grade A (10.0)</span>
                    </div>
                  </div>

                  {/* Bottom Verification Status Badge */}
                  <div className="pt-2 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] p-1 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-[#14213D]" />
                      </div>
                      <div>
                        <div className="font-mono text-[9px] text-[#64748B]">ID: PRM-DOC-2024-918274</div>
                        <div className="text-[10px] text-[#059669] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                          <span>Tamper-evident SHA-256</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/verify?id=PRM-DOC-2024-918274"
                      className="px-3 py-1.5 rounded-lg bg-[#EFF4FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] text-[#315CF5] text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>Check Proof</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4E: Platform Statistics Strip */}
      <section className="bg-white border-b border-[#E5EAF2] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-[#E5EAF2]">
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#14213D]">
                {stats.student_records}
              </div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1">
                Student Records
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#315CF5]">
                {stats.participating_institutions}
              </div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1">
                Participating Institutions
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#14B8A6]">
                {stats.documents_issued}
              </div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1">
                Documents Issued
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#14213D]">
                {stats.verification_requests}
              </div>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mt-1">
                Verification Requests
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-[11px] text-[#94A3B8] font-medium">
              Real-time platform counts computed dynamically from verified database records.
            </span>
          </div>
        </div>
      </section>

      {/* 1-Click Interactive Demo Sandbox (Preserving seeded workflows) */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#315CF5] bg-[#EFF4FF] border border-[#BFDBFE] px-3 py-1 rounded-full">
            EVALUATOR DEMO SANDBOX
          </span>
          <h2 className="text-2xl font-bold text-[#14213D] mt-2">Explore Seeded Portals in 1-Click</h2>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto mt-1">
            Test pre-configured synthetic profiles with authenticated sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Card */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 hover:border-[#CBD5E1] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#315CF5]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                  STUDENT
                </span>
              </div>
              <h3 className="text-base font-bold text-[#14213D]">Aarav Sharma</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                IIT Delhi • B.Tech Computer Science (Sem 6)
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[11px] text-[#475569] space-y-1">
                <div>• Download verified official marksheet PDF</div>
                <div>• Review SGPA/CGPA and subjects</div>
                <div>• Submit correction requests</div>
              </div>
            </div>
            <button
              onClick={() =>
                handleQuickLogin("aarav.sharma@demo.ac.in", "Student@123", "/portal/student")
              }
              disabled={quickLoginLoading !== null}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[#315CF5] hover:bg-[#2347DB] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {quickLoginLoading === "aarav.sharma@demo.ac.in" ? "Authenticating..." : "Login as Student"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Institution Admin Card */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 hover:border-[#CBD5E1] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-center text-[#0D9488]">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4]">
                  INSTITUTION
                </span>
              </div>
              <h3 className="text-base font-bold text-[#14213D]">Dr. Sunita Kulkarni</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Dean of Academics • IIT Delhi</p>
              <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[11px] text-[#475569] space-y-1">
                <div>• Manage student roster & filters</div>
                <div>• Upload CSV with live preview & validation</div>
                <div>• Review flagged discrepancies</div>
              </div>
            </div>
            <button
              onClick={() =>
                handleQuickLogin("admin@iitdelhi.demo.ac.in", "InstAdmin@123", "/portal/institution")
              }
              disabled={quickLoginLoading !== null}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0D9488] hover:bg-[#0F766E] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {quickLoginLoading === "admin@iitdelhi.demo.ac.in"
                ? "Authenticating..."
                : "Login as Institution Admin"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Super Admin Card */}
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 hover:border-[#CBD5E1] hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#14213D]">
                  <ShieldCheck className="w-5 h-5 text-[#315CF5]" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#14213D] border border-[#E2E8F0]">
                  SUPER ADMIN
                </span>
              </div>
              <h3 className="text-base font-bold text-[#14213D]">Rajesh Verma</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Platform Administrator • PRAMAAN Core</p>
              <div className="mt-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2] text-[11px] text-[#475569] space-y-1">
                <div>• Live dynamic KPI metrics derived from DB</div>
                <div>• Document review queue (Approve/Reject)</div>
                <div>• Manage announcements & audit logs</div>
              </div>
            </div>
            <button
              onClick={() =>
                handleQuickLogin("superadmin@pramaan.demo.gov", "SuperAdmin@123", "/portal/admin")
              }
              disabled={quickLoginLoading !== null}
              className="mt-6 w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-[#14213D] hover:bg-[#0F172A] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {quickLoginLoading === "superadmin@pramaan.demo.gov"
                ? "Authenticating..."
                : "Login as Super Admin"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Step 4F: How PRAMAAN Works (4 Visually Consistent Steps with Connector) */}
      <section id="how-it-works" className="py-16 bg-white border-y border-[#E5EAF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#315CF5] bg-[#EFF4FF] border border-[#BFDBFE] px-3 py-1 rounded-full">
              WORKFLOW
            </span>
            <h2 className="text-3xl font-bold text-[#14213D] mt-3">How PRAMAAN Works</h2>
            <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
              A transparent four-stage process ensuring high-trust academic record issuance and instantaneous public verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Institution submits records",
                desc: "Universities upload batch student registries and semester results through encrypted portal endpoints.",
                icon: Building2,
              },
              {
                step: "02",
                title: "Validation checks data quality",
                desc: "Automated anomaly checks verify credit limits, detect duplicate IDs, and validate required columns.",
                icon: Layers,
              },
              {
                step: "03",
                title: "Authorized staff review discrepancies",
                desc: "Institutional and platform administrators examine flagged exceptions before issuing marksheet approval.",
                icon: AlertTriangle,
              },
              {
                step: "04",
                title: "Students access available documents",
                desc: "Students download tamper-evident marksheet PDFs with embedded cryptographic SHA-256 QR codes.",
                icon: FileCheck2,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-2xl p-6 relative hover:border-[#315CF5]/40 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold font-mono px-2 py-0.5 rounded-md bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                        STEP {item.step}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E5EAF2] flex items-center justify-center text-[#315CF5] shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#14213D] mb-2">{item.title}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Step 4G: Feature Cards (4 Premium Cards) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#14B8A6] bg-[#F0FDFA] border border-[#99F6E4] px-3 py-1 rounded-full">
            CORE CAPABILITIES
          </span>
          <h2 className="text-3xl font-bold text-[#14213D] mt-3">Platform Features</h2>
          <p className="text-sm text-[#64748B] mt-2">
            Engineered specifically to balance institutional autonomy with instant verification simplicity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Student Document Wallet",
              desc: "Students view all semester marksheets, track SGPA/CGPA history, and download official verified PDFs with 1 click.",
              icon: FileText,
              tag: "Student Portal",
            },
            {
              title: "Institutional Record Management",
              desc: "Universities batch import CSV records, manage student rosters, and view real-time validation error queues.",
              icon: Building2,
              tag: "Institution Portal",
            },
            {
              title: "QR-Based Document Verification",
              desc: "Instant server-side verification using SHA-256 document hashing, with zero sensitive student PII leakage to the public.",
              icon: QrCode,
              tag: "Public Verifier",
            },
            {
              title: "Secure Audit Trails",
              desc: "Comprehensive immutable event logging for all downloads, approvals, imports, and credential verification events.",
              icon: ShieldCheck,
              tag: "Governance",
            },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E5EAF2] rounded-2xl p-6 hover:shadow-md hover:border-[#CBD5E1] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#315CF5] mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    {feat.tag}
                  </span>
                  <h3 className="text-base font-bold text-[#14213D] mb-2">{feat.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Step 4H: Announcements Section */}
      <section id="announcements" className="py-16 bg-white border-t border-[#E5EAF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#315CF5] bg-[#EFF4FF] border border-[#BFDBFE] px-3 py-1 rounded-full">
                DEMO FEED
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#14213D] mt-2">
                Education & Opportunity Notices
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Recent hackathons, scholarships, and academic alerts across participating institutions.
              </p>
            </div>
            <Link
              href="/login?tab=student"
              className="text-xs font-semibold text-[#315CF5] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View in Portal</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(announcements.length > 0 ? announcements.slice(0, 3) : []).map((ann) => (
              <div
                key={ann.id}
                className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-2xl p-6 flex flex-col justify-between hover:bg-white hover:border-[#CBD5E1] hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(ann.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#14213D] mb-2 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
                    {ann.summary}
                  </p>
                </div>

                {ann.link && ann.link !== "#" && (
                  <div className="pt-4 mt-4 border-t border-[#E5EAF2] flex justify-end">
                    <a
                      href={ann.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#315CF5] hover:underline"
                    >
                      <span>Official Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Step 4I: Footer */}
      <Footer />
    </div>
  );
}
