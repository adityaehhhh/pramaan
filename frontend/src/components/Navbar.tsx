"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Menu, X, User, Building2, LogOut } from "lucide-react";
import { getStoredSession, clearSession, UserSession } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.push("/");
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Verify Document", href: "/verify" },
    { label: "Announcements", href: "/#announcements" },
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-[#E5EAF2] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Custom Shield/Check Icon, Wordmark, Subtitle */}
          <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#315CF5] to-[#14B8A6] p-0.5 shadow-sm shadow-[#315CF5]/20 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#315CF5]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#14213D] leading-none">
                  PRAMAAN
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                  PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] tracking-wide font-medium">
                Digital Academic Records
              </p>
            </div>
          </Link>

          {/* Center: Main Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                    isActive
                      ? "text-[#315CF5] bg-[#EFF4FF]"
                      : "text-[#475569] hover:text-[#14213D] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Action Buttons / Session */}
          <div className="hidden md:flex items-center gap-2.5">
            {session ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href={
                    session.role === "student"
                      ? "/portal/student"
                      : session.role === "institution_admin"
                      ? "/portal/institution"
                      : "/portal/admin"
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#EFF4FF] border border-[#BFDBFE] text-[#315CF5] text-xs font-semibold hover:bg-[#DBEAFE] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#315CF5]" />
                  <span>
                    {session.full_name} ({session.role.replace("_", " ")})
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] border border-[#E5EAF2] hover:border-[#FECACA] transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login?tab=student"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#14213D] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-colors flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[#315CF5]" />
                  <span>Student Portal</span>
                </Link>
                <Link
                  href="/login?tab=institution"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] shadow-sm shadow-[#315CF5]/25 transition-colors flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Institution / Admin</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#475569] hover:text-[#14213D] hover:bg-[#F1F5F9] border border-[#E5EAF2] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-white border-b border-[#E5EAF2] space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#475569] hover:text-[#14213D] hover:bg-[#F1F5F9]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#F1F5F9] flex flex-col gap-2">
            <Link
              href="/login?tab=student"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-[#F1F5F9] text-[#14213D] border border-[#E2E8F0]"
            >
              Student Portal
            </Link>
            <Link
              href="/login?tab=institution"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-[#315CF5] text-white"
            >
              Institution / Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
