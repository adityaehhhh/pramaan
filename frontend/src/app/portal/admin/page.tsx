"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Building2,
  Users,
  FileCheck2,
  AlertTriangle,
  Activity,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Search,
  RefreshCw,
  Bell,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
} from "lucide-react";
import { getStoredSession, fetchWithAuth, API_BASE } from "@/lib/api";

export default function AdminPortalPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "review_queue" | "discrepancies" | "announcements" | "institutions" | "audit"
  >("overview");
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [reviewDocs, setReviewDocs] = useState<any[]>([]);
  const [allDiscrepancies, setAllDiscrepancies] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Announcement Form Modal
  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annCategory, setAnnCategory] = useState("ANNOUNCEMENT");
  const [annSummary, setAnnSummary] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState(2);
  const [annCreating, setAnnCreating] = useState(false);

  // Action review modal
  const [reviewActionDoc, setReviewActionDoc] = useState<any | null>(null);
  const [reviewActionType, setReviewActionType] = useState<"approve" | "reject" | "request_correction">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const s = getStoredSession();
    if (!s || s.role !== "super_admin") {
      router.push("/login?tab=institution");
      return;
    }
    loadAllAdminData();
  }, [router]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [metRes, revRes, discRes, annRes, instRes, audRes] = await Promise.all([
        fetchWithAuth("/admin/metrics"),
        fetchWithAuth("/admin/documents/review-queue"),
        fetchWithAuth("/admin/discrepancies"),
        fetchWithAuth("/announcements/all"),
        fetchWithAuth("/admin/institutions"),
        fetchWithAuth("/audit?limit=25"),
      ]);

      if (metRes.ok) setMetrics(await metRes.json());
      if (revRes.ok) setReviewDocs(await revRes.json());
      if (discRes.ok) setAllDiscrepancies(await discRes.json());
      if (annRes.ok) setAnnouncements(await annRes.json());
      if (instRes.ok) setInstitutions(await instRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async () => {
    if (!reviewActionDoc) return;
    setReviewSubmitting(true);

    try {
      const res = await fetchWithAuth(`/admin/documents/${reviewActionDoc.id}/action`, {
        method: "POST",
        body: JSON.stringify({
          action: reviewActionType,
          review_notes: reviewNotes || "Verified by platform authority.",
        }),
      });

      if (res.ok) {
        setReviewActionDoc(null);
        setReviewNotes("");
        loadAllAdminData();
      } else {
        alert("Failed to submit review action.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnCreating(true);

    try {
      const res = await fetchWithAuth("/announcements", {
        method: "POST",
        body: JSON.stringify({
          title: annTitle,
          category: annCategory,
          summary: annSummary,
          content: annContent,
          priority: Number(annPriority),
          is_published: true,
        }),
      });

      if (res.ok) {
        setNewAnnouncementOpen(false);
        setAnnTitle("");
        setAnnSummary("");
        setAnnContent("");
        loadAllAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnnCreating(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to remove this announcement from the ticker feed?")) return;
    try {
      const res = await fetchWithAuth(`/announcements/${id}`, { method: "DELETE" });
      if (res.ok) loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveDiscrepancy = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/admin/discrepancies/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution_notes: "Reviewed and reconciled by super admin." }),
      });
      if (res.ok) loadAllAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium">
              <Link href="/" className="hover:text-[#14213D]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#14213D]">Super Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14213D] tracking-tight">
              PRAMAAN Platform Governance
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              National registry management, cross-institutional verification, and immutable audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllAdminData}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E5EAF2] hover:bg-[#F8FAFC] text-[#14213D] flex items-center gap-1.5 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#315CF5] ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#E5EAF2] mb-6 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "KPI Overview" },
            { id: "review_queue", label: `Review Queue (${reviewDocs.length})` },
            { id: "discrepancies", label: `Discrepancies (${allDiscrepancies.length})` },
            { id: "announcements", label: "News Feed & Ticker" },
            { id: "institutions", label: `Institutions (${institutions.length})` },
            { id: "audit", label: "Immutable Audit Log" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#315CF5] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#14213D] hover:bg-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Total Students
                </span>
                <div className="text-3xl font-extrabold text-[#14213D] mt-1">{metrics.total_students}</div>
                <div className="text-[11px] text-[#059669] mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Unique Identifiers</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Institutions
                </span>
                <div className="text-3xl font-extrabold text-[#315CF5] mt-1">{metrics.total_institutions}</div>
                <div className="text-[11px] text-[#64748B] mt-1">Autonomous universities</div>
              </div>

              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Documents Sealed
                </span>
                <div className="text-3xl font-extrabold text-[#14B8A6] mt-1">{metrics.total_documents}</div>
                <div className="text-[11px] text-[#64748B] mt-1">SHA-256 Tamper-evident</div>
              </div>

              <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
                <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Verification Requests
                </span>
                <div className="text-3xl font-extrabold text-[#14213D] mt-1">{metrics.total_verifications}</div>
                <div className="text-[11px] text-[#059669] mt-1">Public QR Verifications</div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#14213D] mb-4">Real-Time Platform Audit Events</h3>
              <div className="divide-y divide-[#F1F5F9]">
                {metrics.recent_activity.map((act: any, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#315CF5]" />
                      <span className="font-semibold text-[#14213D]">{act.action}</span>
                      <span className="text-[#64748B]">{act.details}</span>
                    </div>
                    <span className="text-[#94A3B8] font-mono text-[11px]">
                      {new Date(act.created_at).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: Review Queue */}
        {activeTab === "review_queue" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#14213D]">Academic Document Approval Queue</h3>
              <p className="text-xs text-[#64748B]">
                Review semester marksheets pending official platform certification.
              </p>
            </div>

            {reviewDocs.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#059669] font-medium bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                ✓ No academic documents currently waiting in review queue.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="p-3">Doc ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Institution</th>
                      <th className="p-3 text-center">Semester</th>
                      <th className="p-3 text-center">SGPA</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                    {reviewDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                        <td className="p-3 font-mono font-semibold text-[#315CF5]">{doc.document_id}</td>
                        <td className="p-3 font-bold">{doc.student_name}</td>
                        <td className="p-3 text-[#64748B]">{doc.institution_name}</td>
                        <td className="p-3 text-center">Sem {doc.semester}</td>
                        <td className="p-3 text-center font-bold">{doc.sgpa}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              setReviewActionDoc(doc);
                              setReviewActionType("approve");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#315CF5] hover:bg-[#2347DB] text-white text-[11px] font-semibold"
                          >
                            Review & Seal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Discrepancies */}
        {activeTab === "discrepancies" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#14213D]">All Platform Discrepancy Flags</h3>
              <p className="text-xs text-[#64748B]">Cross-tenant validation exceptions and anomaly reports.</p>
            </div>

            {allDiscrepancies.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#059669] font-medium bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                ✓ All platform records are cleanly reconciled.
              </div>
            ) : (
              <div className="space-y-3">
                {allDiscrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl border border-[#E5EAF2] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          {d.flag_type}
                        </span>
                        <span className="text-[10px] font-semibold text-[#DC2626] uppercase">
                          Severity: {d.severity}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-mono">
                          Status: {d.status}
                        </span>
                      </div>
                      <p className="text-[#14213D] font-medium">{d.description}</p>
                    </div>

                    {d.status === "open" && (
                      <button
                        onClick={() => handleResolveDiscrepancy(d.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-semibold shrink-0"
                      >
                        Resolve Flag
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: Announcements & Ticker */}
        {activeTab === "announcements" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">Announcement Feed Manager</h3>
                <p className="text-xs text-[#64748B]">Items broadcast live to the stock-market style ticker.</p>
              </div>
              <button
                onClick={() => setNewAnnouncementOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#315CF5] text-white hover:bg-[#2347DB] flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Announcement</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Title & Summary</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                  {announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#315CF5] border border-[#BFDBFE]">
                          {ann.category}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold">{ann.title}</div>
                        <div className="text-[11px] text-[#64748B] line-clamp-1">{ann.summary}</div>
                      </td>
                      <td className="p-3 text-center font-mono">{ann.priority}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteAnnouncement(ann.id)}
                          className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2]"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 5: Institutions */}
        {activeTab === "institutions" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#14213D]">Onboarded Educational Bodies</h3>
              <p className="text-xs text-[#64748B]">Accredited universities with tenant isolation keys.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {institutions.map((inst) => (
                <div key={inst.id} className="p-5 rounded-2xl border border-[#E5EAF2] bg-[#F8FAFC]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#315CF5]">{inst.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      {inst.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#14213D]">{inst.name}</h4>
                  <p className="text-xs text-[#64748B] mt-1">{inst.state}, India</p>
                  <div className="mt-3 text-[11px] text-[#94A3B8]">
                    Accreditation: <strong className="text-[#14213D]">{inst.accreditation}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 6: Immutable Audit Log */}
        {activeTab === "audit" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-xs">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#14213D]">Immutable Platform Audit Trail</h3>
              <p className="text-xs text-[#64748B]">
                Cryptographically tracked administrative and verification actions.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Actor Role</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-3 font-mono text-[11px] text-[#94A3B8]">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="p-3 font-semibold text-[#14213D]">{log.action}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] font-mono text-[10px]">
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#64748B]">{log.ip_address}</td>
                      <td className="p-3 text-[#475569]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {reviewActionDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setReviewActionDoc(null)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#14213D] mb-1">Review & Seal Document</h3>
            <p className="text-xs text-[#64748B] mb-4">
              Document ID: <span className="font-mono text-[#315CF5]">{reviewActionDoc.document_id}</span>
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Action</label>
                <select
                  value={reviewActionType}
                  onChange={(e) => setReviewActionType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                >
                  <option value="approve">Approve & Issue Cryptographic Seal</option>
                  <option value="reject">Reject Document</option>
                  <option value="request_correction">Flag for Institution Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Review Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Official notes for registry audit log..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                />
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewActionDoc(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDocumentAction}
                  disabled={reviewSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB]"
                >
                  {reviewSubmitting ? "Processing..." : "Commit Action"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Announcement Modal */}
      {newAnnouncementOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setNewAnnouncementOpen(false)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#14213D]">Create News/Ticker Announcement</h3>
              <button
                onClick={() => setNewAnnouncementOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#14213D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5 py-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Headline Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Smart India Hackathon 2026 Registration Open"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                  >
                    <option value="HACKATHON">HACKATHON</option>
                    <option value="SCHOLARSHIP">SCHOLARSHIP</option>
                    <option value="ADMISSIONS">ADMISSIONS</option>
                    <option value="EXAM">EXAM</option>
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Priority</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={annPriority}
                    onChange={(e) => setAnnPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Brief Summary</label>
                <textarea
                  rows={2}
                  required
                  value={annSummary}
                  onChange={(e) => setAnnSummary(e.target.value)}
                  placeholder="Summary shown on cards and modals..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D]"
                />
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={annCreating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB]"
                >
                  {annCreating ? "Publishing..." : "Publish to Feed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
