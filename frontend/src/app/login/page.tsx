"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, User, Building2, Lock, ArrowRight, AlertCircle, KeyRound } from "lucide-react";
import { saveSession, API_BASE } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "institution" ? "institution" : "student";

  const [activeTab, setActiveTab] = useState<"student" | "institution">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === "student") {
      setEmail("aarav.sharma@demo.ac.in");
      setPassword("Student@123");
    } else {
      setEmail("admin@iitdelhi.demo.ac.in");
      setPassword("InstAdmin@123");
    }
    setErrorMsg(null);
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ detail: "Login failed" }));
        setErrorMsg(errData.detail || "Authentication failed. Please verify credentials.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      saveSession(data);

      if (data.role === "student") {
        router.push("/portal/student");
      } else if (data.role === "institution_admin") {
        router.push("/portal/institution");
      } else if (data.role === "super_admin") {
        router.push("/portal/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to PRAMAAN backend API.");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail: string, presetPass: string, tab: "student" | "institution") => {
    setActiveTab(tab);
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#315CF5] to-[#14B8A6] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl text-[#14213D] tracking-tight">
              PRAMAAN
            </span>
          </Link>
          <h2 className="text-xl font-bold text-[#14213D]">Portal Authentication</h2>
          <p className="text-xs text-[#64748B] mt-1">
            Access secure digital academic records and verification dashboards.
          </p>
        </div>

        {/* Tab switch */}
        <div className="mt-6 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("student")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "student"
                ? "bg-white text-[#315CF5] shadow-xs"
                : "text-[#64748B] hover:text-[#14213D]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("institution")}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "institution"
                ? "bg-white text-[#315CF5] shadow-xs"
                : "text-[#64748B] hover:text-[#14213D]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Institution / Admin</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="mt-4 bg-white border border-[#E5EAF2] rounded-2xl p-6 sm:p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
                Institutional Email / ID
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5EAF2] text-[#14213D] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                placeholder="name@institution.ac.in"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5EAF2] text-[#14213D] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] font-mono"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] shadow-sm shadow-[#315CF5]/25 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In to Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Preset 1-Click Credentials for Evaluators */}
          <div className="mt-6 pt-5 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-[#315CF5]" />
              <span>Quick Demo Accounts:</span>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() =>
                  setPreset("aarav.sharma@demo.ac.in", "Student@123", "student")
                }
                className="w-full text-left p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E5EAF2] hover:border-[#BFDBFE] transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#14213D]">Aarav Sharma (Student)</div>
                  <div className="text-[11px] text-[#64748B]">
                    aarav.sharma@demo.ac.in • Student@123
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#315CF5] group-hover:underline">
                  Auto-fill
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPreset("admin@iitdelhi.demo.ac.in", "InstAdmin@123", "institution")
                }
                className="w-full text-left p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E5EAF2] hover:border-[#BFDBFE] transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#14213D]">Dr. Sunita Kulkarni (Inst. Admin)</div>
                  <div className="text-[11px] text-[#64748B]">
                    admin@iitdelhi.demo.ac.in • InstAdmin@123
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#315CF5] group-hover:underline">
                  Auto-fill
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPreset("superadmin@pramaan.demo.gov", "SuperAdmin@123", "institution")
                }
                className="w-full text-left p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E5EAF2] hover:border-[#BFDBFE] transition-colors flex items-center justify-between text-xs cursor-pointer group"
              >
                <div>
                  <div className="font-semibold text-[#14213D]">Rajesh Verma (Super Admin)</div>
                  <div className="text-[11px] text-[#64748B]">
                    superadmin@pramaan.demo.gov • SuperAdmin@123
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#315CF5] group-hover:underline">
                  Auto-fill
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-[#64748B]">
          <Link href="/" className="hover:text-[#14213D] underline">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20 text-[#64748B] text-sm">
            Loading authentication portal...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  );
}
