"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  User,
  ShieldCheck,
  Building2,
  FileText,
  Download,
  QrCode,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  Send,
  History,
  GraduationCap,
  Award,
} from "lucide-react";
import { getStoredSession, fetchWithAuth, API_BASE } from "@/lib/api";

interface StudentProfile {
  id: string;
  student_identifier: string;
  roll_number: string;
  registration_number: string;
  full_name: string;
  date_of_birth: string;
  program_name: string;
  department: string;
  batch_year: string;
  current_semester: number;
  status: string;
  institution_name: string;
}

interface DocumentItem {
  id: string;
  document_id: string;
  title: string;
  academic_year: string;
  semester: number;
  sgpa: number;
  cgpa: number;
  result_status: string;
  status: "verified" | "pending_review" | "correction_required" | "revoked";
  issued_at: string;
}

interface SubjectItem {
  id: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  internal_marks: number;
  external_marks: number;
  total_marks: number;
  max_marks: number;
  grade: string;
  grade_points: number;
  result: string;
}

export default function StudentPortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docSubjects, setDocSubjects] = useState<SubjectItem[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Correction request modal
  const [correctionDoc, setCorrectionDoc] = useState<DocumentItem | null>(null);
  const [correctionField, setCorrectionField] = useState("Name / Marks");
  const [requestedValue, setRequestedValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [correctionSuccessMsg, setCorrectionSuccessMsg] = useState<string | null>(null);

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    const session = getStoredSession();
    if (!session || session.role !== "student") {
      router.push("/login?tab=student");
      return;
    }

    async function loadData() {
      try {
        const [profRes, docsRes, actRes] = await Promise.all([
          fetchWithAuth("/students/me/profile"),
          fetchWithAuth("/students/me/documents"),
          fetchWithAuth("/students/me/activity"),
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setProfile(profData);
        }
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivityLogs(actData);
        }
      } catch (err) {
        console.error("Error loading student portal data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleOpenDocDetails = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setSubjectsLoading(true);
    try {
      const res = await fetchWithAuth(`/students/me/documents/${doc.id}/subjects`);
      if (res.ok) {
        const data = await res.json();
        setDocSubjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const handleDownloadPdf = async (docId: string) => {
    try {
      const session = getStoredSession();
      const res = await fetch(`${API_BASE}/documents/${docId}/pdf`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PRAMAAN_${docId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Unable to generate PDF. Document may be restricted.");
      }
    } catch (err) {
      console.error("PDF download failed", err);
      alert("Download failed.");
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionDoc) return;
    setCorrectionSubmitting(true);

    try {
      const res = await fetchWithAuth("/students/me/corrections", {
        method: "POST",
        body: JSON.stringify({
          document_id: correctionDoc.id,
          field_to_correct: correctionField,
          current_value: `Semester ${correctionDoc.semester} Record`,
          requested_value: requestedValue,
          reason: correctionReason,
        }),
      });

      if (res.ok) {
        setCorrectionSuccessMsg("Correction request submitted successfully to institutional registry!");
        setTimeout(() => {
          setCorrectionDoc(null);
          setCorrectionSuccessMsg(null);
          setRequestedValue("");
          setCorrectionReason("");
        }, 2000);
      } else {
        alert("Failed to submit correction request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request.");
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified by PRAMAAN</span>
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case "correction_required":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Correction Required</span>
          </span>
        );
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] text-xs font-semibold">
            <span>Revoked</span>
          </span>
        );
      default:
        return <span className="text-xs font-medium text-[#64748B]">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20 text-[#64748B] text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#315CF5] border-t-transparent rounded-full animate-spin" />
            <p>Loading your verified academic credentials...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const latestDoc = documents[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Breadcrumb / Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium">
              <Link href="/" className="hover:text-[#14213D]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#14213D]">Student Wallet</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14213D] tracking-tight">
              My Academic Records
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Verifiable semester marksheets, grade cards, and cryptographic transcripts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E5EAF2] text-xs font-semibold text-[#14213D] shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Verified Identity Active</span>
            </span>
          </div>
        </div>

        {/* Profile Card Summary */}
        {profile && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#315CF5] to-[#14B8A6]" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] border border-[#BFDBFE] flex items-center justify-center text-[#315CF5] shrink-0 font-bold text-xl">
                  {profile.full_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-[#14213D]">
                      {profile.full_name}
                    </h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                      ENROLLED
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] font-medium mt-0.5">
                    {profile.program_name} • {profile.department}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#315CF5]" />
                    <span>{profile.institution_name}</span>
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 grid grid-cols-2 gap-3 text-xs border-t md:border-t-0 md:border-l border-[#F1F5F9] pt-4 md:pt-0 md:pl-6">
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">PRAMAAN ID</div>
                  <div className="font-mono text-xs font-semibold text-[#315CF5] mt-0.5">
                    {profile.student_identifier}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">ROLL NUMBER</div>
                  <div className="font-mono text-xs font-semibold text-[#14213D] mt-0.5">
                    {profile.roll_number}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">CURRENT SEMESTER</div>
                  <div className="text-xs font-bold text-[#14213D] mt-0.5">
                    Semester {profile.current_semester}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E5EAF2]">
                  <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">CUMULATIVE CGPA</div>
                  <div className="text-xs font-extrabold text-[#059669] mt-0.5">
                    {latestDoc?.cgpa ? `${latestDoc.cgpa} / 10.0` : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Semester-Wise Marksheets Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#14213D] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#315CF5]" />
              <span>Available Digital Marksheets</span>
            </h3>
            <span className="text-xs font-medium text-[#64748B]">
              Total Records: {documents.length}
            </span>
          </div>

          {documents.length === 0 ? (
            <div className="bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center text-[#64748B]">
              <FileText className="w-10 h-10 mx-auto text-[#94A3B8] mb-2" />
              <p className="text-sm font-semibold text-[#14213D]">No documents published yet</p>
              <p className="text-xs text-[#64748B] mt-1">
                Your institution has not published verified semester results to your profile.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm hover:border-[#CBD5E1] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Top: Title, Status */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#315CF5]">
                          SEMESTER {doc.semester} GRADE CARD
                        </span>
                        <h4 className="text-base font-bold text-[#14213D] mt-0.5">{doc.title}</h4>
                        <p className="text-xs text-[#64748B]">Academic Session: {doc.academic_year}</p>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-3 py-4 text-center border-b border-[#F1F5F9]">
                      <div className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl p-2.5">
                        <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">SGPA</div>
                        <div className="text-base font-extrabold text-[#14213D] mt-0.5">
                          {doc.sgpa.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl p-2.5">
                        <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">CGPA</div>
                        <div className="text-base font-extrabold text-[#059669] mt-0.5">
                          {doc.cgpa.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-[#F8FAFC] border border-[#E5EAF2] rounded-xl p-2.5">
                        <div className="text-[10px] text-[#94A3B8] uppercase font-semibold">RESULT</div>
                        <div className="text-xs font-bold text-[#14213D] mt-1.5 uppercase">
                          {doc.result_status}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="py-3 text-[11px] text-[#64748B] flex items-center justify-between">
                      <span className="font-mono text-[#94A3B8]">ID: {doc.document_id}</span>
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        Issued: {new Date(doc.issued_at).toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleOpenDocDetails(doc)}
                      className="py-2 px-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#14213D] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="View Breakdown"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#315CF5]" />
                      <span>Subjects</span>
                    </button>

                    <button
                      onClick={() => handleDownloadPdf(doc.id)}
                      className="py-2 px-2.5 rounded-xl bg-[#315CF5] hover:bg-[#2347DB] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      title="Download Verified PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <Link
                      href={`/verify?id=${encodeURIComponent(doc.document_id)}`}
                      className="py-2 px-2.5 rounded-xl bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#99F6E4] text-[#0D9488] text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Public Verifier Proof"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Verify</span>
                    </Link>

                    <button
                      onClick={() => setCorrectionDoc(doc)}
                      className="py-2 px-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E5EAF2] hover:border-[#CBD5E1] text-[#64748B] hover:text-[#14213D] text-xs font-medium transition-colors flex items-center justify-center gap-1"
                      title="Request Correction"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Dispute</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Logs & Audit History */}
        <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#14213D] flex items-center gap-2">
              <History className="w-4 h-4 text-[#315CF5]" />
              <span>Recent Account & Credential Activity</span>
            </h3>
            <span className="text-xs text-[#94A3B8]">Immutable DPDP Audit Trail</span>
          </div>

          {activityLogs.length === 0 ? (
            <p className="text-xs text-[#64748B]">No recent activity logged for this account.</p>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {activityLogs.slice(0, 5).map((log, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
                    <span className="font-semibold text-[#14213D]">{log.action}</span>
                    <span className="text-[#64748B] hidden sm:inline">• {log.details}</span>
                  </div>
                  <span className="text-[#94A3B8] font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Subject Breakdown Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#315CF5]">
                  SUBJECT WISE PERFORMANCE BREAKDOWN
                </span>
                <h3 className="text-lg font-bold text-[#14213D] mt-0.5">
                  Semester {selectedDoc.semester} Results
                </h3>
                <p className="text-xs text-[#64748B]">
                  SGPA: <strong className="text-[#14213D]">{selectedDoc.sgpa}</strong> • CGPA:{" "}
                  <strong className="text-[#059669]">{selectedDoc.cgpa}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#14213D] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              {subjectsLoading ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  <div className="w-6 h-6 border-2 border-[#315CF5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading subject marks...
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Subject Name</th>
                        <th className="p-3 text-center">Credits</th>
                        <th className="p-3 text-center">Internal</th>
                        <th className="p-3 text-center">External</th>
                        <th className="p-3 text-center">Total</th>
                        <th className="p-3 text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                      {docSubjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#F8FAFC]">
                          <td className="p-3 font-mono text-[11px] font-semibold text-[#315CF5]">
                            {sub.subject_code}
                          </td>
                          <td className="p-3 font-medium">{sub.subject_name}</td>
                          <td className="p-3 text-center font-mono">{sub.credits}</td>
                          <td className="p-3 text-center font-mono text-[#64748B]">
                            {sub.internal_marks}
                          </td>
                          <td className="p-3 text-center font-mono text-[#64748B]">
                            {sub.external_marks}
                          </td>
                          <td className="p-3 text-center font-mono font-bold">
                            {sub.total_marks} / {sub.max_marks}
                          </td>
                          <td className="p-3 text-center font-bold text-[#059669]">
                            {sub.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex justify-end gap-2">
              <button
                onClick={() => handleDownloadPdf(selectedDoc.id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {correctionDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setCorrectionDoc(null)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                  STUDENT GRIEVANCE REDRESSAL
                </span>
                <h3 className="text-base font-bold text-[#14213D] mt-0.5">
                  Request Discrepancy Correction
                </h3>
                <p className="text-xs text-[#64748B]">Semester {correctionDoc.semester} Grade Card</p>
              </div>
              <button
                onClick={() => setCorrectionDoc(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#14213D] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {correctionSuccessMsg ? (
              <div className="py-8 text-center text-xs text-[#059669] font-medium">
                <CheckCircle2 className="w-10 h-10 mx-auto text-[#10B981] mb-2" />
                <p>{correctionSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCorrection} className="space-y-4 py-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">Field to Correct</label>
                  <select
                    value={correctionField}
                    onChange={(e) => setCorrectionField(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  >
                    <option value="Subject Marks">Subject Marks / Grade</option>
                    <option value="Student Name Spelling">Student Name Spelling</option>
                    <option value="Roll / Registration Number">Roll / Registration Number</option>
                    <option value="SGPA / CGPA Calculation">SGPA / CGPA Calculation</option>
                    <option value="Other">Other Discrepancy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">
                    Requested / Correct Value
                  </label>
                  <input
                    type="text"
                    required
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(e.target.value)}
                    placeholder="e.g. Correct Grade for COL758 is A+ (10.0)"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">
                    Reason & Supporting Reference
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Provide details or re-evaluation reference number..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectionDoc(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={correctionSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{correctionSubmitting ? "Submitting..." : "Submit Grievance"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
