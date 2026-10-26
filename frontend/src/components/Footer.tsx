import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, FileCheck, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5EAF2] text-[#64748B] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Purpose */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#315CF5] to-[#14B8A6] flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[#14213D] text-base">PRAMAAN</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Unified digital academic identity and verifiable student records platform for Indian educational institutions.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-medium text-[#475569]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Prototype Evaluation Platform</span>
            </div>
          </div>

          {/* Platform Portals */}
          <div>
            <h4 className="font-semibold text-[#14213D] text-xs uppercase tracking-wider mb-3">
              Portals & Access
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login?tab=student" className="hover:text-[#315CF5] transition-colors">
                  Student Records Portal
                </Link>
              </li>
              <li>
                <Link href="/login?tab=institution" className="hover:text-[#315CF5] transition-colors">
                  Institution Management
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-[#315CF5] transition-colors">
                  Public Document Verification
                </Link>
              </li>
              <li>
                <Link href="/login?tab=institution" className="hover:text-[#315CF5] transition-colors">
                  Administrator Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture & Trust */}
          <div>
            <h4 className="font-semibold text-[#14213D] text-xs uppercase tracking-wider mb-3">
              Verification Standards
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#315CF5]" />
                <span>SHA-256 Tamper-Evident Hashing</span>
              </li>
              <li className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>QR Cryptographic Verification</span>
              </li>
              <li>Multi-Tenant Institutional Isolation</li>
              <li>DPDP Privacy Minimization</li>
            </ul>
          </div>

          {/* Governance & Disclaimer */}
          <div>
            <h4 className="font-semibold text-[#14213D] text-xs uppercase tracking-wider mb-3">
              Transparency & Notice
            </h4>
            <p className="text-[11px] leading-relaxed text-[#64748B] mb-2">
              PRAMAAN is an independent architectural prototype created to demonstrate digital credential verification and anomaly detection. It is not an official Government of India service, DigiLocker replacement, or APAAR portal.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#94A3B8]">
          <div>
            © {new Date().getFullYear()} PRAMAAN Platform (Prototype Demonstration). Synthetic data for evaluation.
          </div>
          <div className="flex items-center gap-4 text-[#64748B]">
            <Link href="/#trust" className="hover:text-[#14213D]">
              Security Principles
            </Link>
            <span>•</span>
            <Link href="/#trust" className="hover:text-[#14213D]">
              Privacy Notice
            </Link>
            <span>•</span>
            <Link href="/#how-it-works" className="hover:text-[#14213D]">
              Architecture
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
