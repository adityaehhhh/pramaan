"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Building2,
  Lock,
  QrCode,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [documentId, setDocumentId] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialId) {
      performVerification(initialId);
    }
  }, [initialId]);

  const performVerification = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`${API_BASE}/verify?id=${encodeURIComponent(idToVerify.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult({
          is_valid: false,
          status: "NOT_FOUND",
          tamper_status: "SYSTEM_LOOKUP_FAILED",
          disclaimer: "Document record could not be resolved in the PRAMAAN registry.",
        });
      }
    } catch (err) {
      console.error(err);
      setResult({
        is_valid: false,
        status: "NOT_FOUND",
        tamper_status: "NETWORK_ERROR",
        disclaimer: "Network connection error verifying document.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(documentId);
  };

  const handleQuickTest = (id: string) => {
    setDocumentId(id);
    performVerification(id);
  };

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Page Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF4FF] border border-[#BFDBFE] text-[#315CF5] text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-[#315CF5]" />
          <span>Cryptographic Credential Verification</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#14213D]">Public Document Verification</h1>
        <p className="text-sm text-[#64748B] mt-2 leading-relaxed">
          Verify the authenticity and integrity of PRAMAAN-issued academic grade sheets. Results are validated against the tamper-evident registry with zero student personal data leakage.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="Enter Document ID (e.g. PRM-DOC-2024-918274) or QR Token..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#E5EAF2] text-[#14213D] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5] font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] shadow-sm shadow-[#315CF5]/25 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Credential"}
          </button>
        </form>

        {/* Demo Quick Test Buttons */}
        <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[#64748B] text-[11px] font-semibold">Demo Presets:</span>
          <button
            type="button"
            onClick={() => handleQuickTest("PRM-DOC-2024-918274")}
            className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5] transition-colors cursor-pointer font-medium"
          >
            ✓ Valid Marksheet (Aarav, IITD)
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest("PRM-DOC-2023-REVOKED-001")}
            className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer font-medium"
          >
            ✗ Revoked Record (Demo Superseded)
          </button>
          <button
            type="button"
            onClick={() => handleQuickTest("INVALID_DOC_SAMPLE_404")}
            className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] hover:bg-[#E2E8F0] transition-colors cursor-pointer font-medium"
          >
            ? Unregistered Document
          </button>
        </div>
      </div>

      {/* Verification Result Card */}
      {loading && (
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-12 text-center text-[#64748B]">
          <div className="w-10 h-10 border-2 border-[#315CF5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium">Validating cryptographic token against institutional registry...</p>
        </div>
      )}

      {!loading && hasSearched && result && (
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          {result.status === "VALID" ? (
            <div>
              {/* Status Header */}
              <div className="flex items-center justify-between pb-6 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#059669]">
                      CRYPTOGRAPHICALLY AUTHENTIC
                    </span>
                    <h2 className="text-xl font-bold text-[#14213D]">Valid Academic Credential</h2>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs font-bold tracking-wide">
                  REGISTRY VERIFIED
                </span>
              </div>

              {/* Minimal Privacy-Preserved Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-[#F1F5F9] text-xs">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">ISSUING INSTITUTION</span>
                  <div className="font-bold text-[#14213D] text-sm mt-0.5">{result.institution_name}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">STUDENT NAME (PRIVACY MASKED)</span>
                  <div className="font-mono font-bold text-[#315CF5] text-sm mt-0.5">{result.masked_student_name}</div>
                  <div className="text-[10px] text-[#94A3B8] mt-0.5">PII masked per DPDP privacy principles</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">ACADEMIC PROGRAM</span>
                  <div className="font-semibold text-[#14213D] mt-0.5">{result.program_name}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-semibold">SEMESTER & RESULT</span>
                  <div className="font-semibold text-[#14213D] mt-0.5">
                    Semester {result.semester} • SGPA: <strong className="text-[#059669]">{result.sgpa}</strong> ({result.result_status})
                  </div>
                </div>
              </div>

              {/* Tamper and Security Notice */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>
                    Tamper Integrity: <strong className="text-[#059669]">{result.tamper_status}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-[#94A3B8] font-mono">
                  Document ID: {result.document_id}
                </div>
              </div>
            </div>
          ) : result.status === "REVOKED" ? (
            <div>
              {/* Revoked State */}
              <div className="flex items-center justify-between pb-6 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                    <XCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#DC2626]">
                      CREDENTIAL REVOKED
                    </span>
                    <h2 className="text-xl font-bold text-[#14213D]">Record Superseded or Withdrawn</h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs font-bold">
                  REVOKED
                </span>
              </div>
              <div className="py-6 text-xs text-[#64748B]">
                <p>
                  This academic credential was officially revoked by the issuing institution. This typically happens if an updated grade revision was released or if a duplicate record was identified.
                </p>
                <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] text-[#DC2626] font-mono text-[11px]">
                  Document ID: {result.document_id}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] mx-auto mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#14213D]">Record Not Found in Registry</h2>
              <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
                No matching academic document was found with the specified token or identifier. Please check for typos or scan the QR code again.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20 text-[#64748B] text-sm">
            Loading verification service...
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
      <Footer />
    </div>
  );
}
