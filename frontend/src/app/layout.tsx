import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRAMAAN — Digital Academic Records Platform",
  description: "Unified Digital Academic Identity and Student Records Platform for Indian Educational Institutions. Tamper-evident credential issuance, marksheet verification, and institutional management.",
  keywords: "PRAMAAN, academic records, digital marksheet, credential verification, higher education, student identity, DigiLocker demonstration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#F7F8FC] text-[#14213D] min-h-screen flex flex-col font-sans selection:bg-[#315CF5] selection:text-white">
        {/* Step 4A: Top prototype notice banner */}
        <aside
          aria-label="Prototype Evaluation Notice"
          className="bg-[#EDF2F7] text-[#475569] text-xs py-1.5 px-4 text-center border-b border-[#E2E8F0] font-medium tracking-wide flex items-center justify-center gap-2"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="truncate">
            <strong className="text-[#1E293B]">PRAMAAN Prototype</strong> | Academic record management and verification demonstration.
            <span className="hidden sm:inline text-[#64748B] ml-1.5">
              Not an official Government of India service.
            </span>
          </span>
        </aside>

        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
