"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Building2,
  Users,
  UploadCloud,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  AlertCircle,
  X,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getStoredSession, fetchWithAuth, API_BASE } from "@/lib/api";

interface StudentItem {
  id: string;
  student_identifier: string;
  roll_number: string;
  full_name: string;
  program_name: string;
  department: string;
  current_semester: number;
  status: string;
}

interface DiscrepancyItem {
  id: string;
  flag_type: string;
  severity: string;
  description: string;
  status: string;
  student_name?: string;
  student_identifier?: string;
  created_at: string;
}

interface PreviewRow {
  row_index: number;
  data: any;
  is_valid: boolean;
  errors: any[];
  discrepancies: any[];
}

export default function InstitutionPortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"students" | "discrepancies">("students");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // Modals
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [uploadCsvOpen, setUploadCsvOpen] = useState(false);

  // Add Student Form State
  const [newRoll, setNewRoll] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDob, setNewDob] = useState("2003-05-10");
  const [newProgram, setNewProgram] = useState("Bachelor of Technology in Computer Science");
  const [newDept, setNewDept] = useState("Computer Science");
  const [newSem, setNewSem] = useState(6);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // CSV Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    filename: string;
    total_rows: number;
    valid_count: number;
    error_count: number;
    preview_rows: PreviewRow[];
    all_errors: any[];
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    const s = getStoredSession();
    if (!s || (s.role !== "institution_admin" && s.role !== "super_admin")) {
      router.push("/login?tab=institution");
      return;
    }
    setSession(s);
    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profRes, studRes, discRes] = await Promise.all([
        fetchWithAuth("/institutions/profile"),
        fetchWithAuth("/institutions/students"),
        fetchWithAuth("/institutions/discrepancies"),
      ]);

      if (profRes.ok) setProfile(await profRes.json());
      if (studRes.ok) setStudents(await studRes.json());
      if (discRes.ok) setDiscrepancies(await discRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFilter = async () => {
    setLoading(true);
    try {
      let q = "/institutions/students?";
      if (searchQuery) q += `search=${encodeURIComponent(searchQuery)}&`;
      if (departmentFilter) q += `department=${encodeURIComponent(departmentFilter)}&`;
      if (semesterFilter) q += `semester=${encodeURIComponent(semesterFilter)}&`;
      const res = await fetchWithAuth(q);
      if (res.ok) setStudents(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetchWithAuth("/institutions/students", {
        method: "POST",
        body: JSON.stringify({
          roll_number: newRoll,
          full_name: newName,
          email: newEmail,
          date_of_birth: newDob,
          program_name: newProgram,
          department: newDept,
          current_semester: Number(newSem),
          batch_year: "2021-2025",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAddError(err.detail || "Failed to register student.");
        setAddLoading(false);
        return;
      }

      setAddStudentOpen(false);
      setNewRoll("");
      setNewName("");
      setNewEmail("");
      loadAllData();
    } catch (err) {
      console.error(err);
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!selectedFile) return;
    setPreviewLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetchWithAuth("/institutions/upload-preview", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      } else {
        alert("Upload preview failed. Please check file format.");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing file.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData) return;
    setCommitLoading(true);

    try {
      const res = await fetchWithAuth("/institutions/import-commit", {
        method: "POST",
        body: JSON.stringify({
          filename: previewData.filename,
          rows: previewData.preview_rows.map((r) => r.data),
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult(result);
        loadAllData();
      } else {
        alert("Failed to commit batch records.");
      }
    } catch (err) {
      console.error(err);
      alert("Error committing import.");
    } finally {
      setCommitLoading(false);
    }
  };

  const handleDownloadSampleCsv = async () => {
    try {
      const res = await fetchWithAuth("/institutions/sample-csv");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "pramaan_student_template.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FC]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1 font-medium">
              <Link href="/" className="hover:text-[#14213D]">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#14213D]">Institution Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14213D] tracking-tight">
              {profile?.name || "Institutional Administration"}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Code: <span className="font-mono font-semibold text-[#315CF5]">{profile?.code || "INST"}</span> • Tenant Isolated Registry
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setAddStudentOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#14213D] bg-white hover:bg-[#F8FAFC] border border-[#E5EAF2] hover:border-[#CBD5E1] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#315CF5]" />
              <span>Add Student</span>
            </button>

            <button
              onClick={() => {
                setUploadCsvOpen(true);
                setPreviewData(null);
                setImportResult(null);
                setSelectedFile(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] shadow-sm shadow-[#315CF5]/25 transition-colors flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Batch CSV Import</span>
            </button>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Enrolled Students</span>
              <Users className="w-4 h-4 text-[#315CF5]" />
            </div>
            <div className="text-2xl font-extrabold text-[#14213D]">{students.length}</div>
            <div className="text-[11px] text-[#059669] font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tenant Isolated</span>
            </div>
          </div>

          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Discrepancy Flags</span>
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="text-2xl font-extrabold text-[#D97706]">{discrepancies.length}</div>
            <div className="text-[11px] text-[#64748B] mt-1">Requires registrar review</div>
          </div>

          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Accreditation</span>
              <Building2 className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <div className="text-xl font-bold text-[#14213D]">{profile?.accreditation || "NAAC A++"}</div>
            <div className="text-[11px] text-[#64748B] mt-1">Autonomous Institute</div>
          </div>

          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registry Seal</span>
              <FileCheck className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="text-xl font-bold text-[#059669]">SHA-256 Active</div>
            <div className="text-[11px] text-[#64748B] mt-1">Tamper-evident hashing</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5EAF2] mb-6">
          <button
            onClick={() => setActiveTab("students")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "students"
                ? "border-[#315CF5] text-[#315CF5]"
                : "border-transparent text-[#64748B] hover:text-[#14213D]"
            }`}
          >
            Student Roster ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("discrepancies")}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "discrepancies"
                ? "border-[#D97706] text-[#D97706]"
                : "border-transparent text-[#64748B] hover:text-[#14213D]"
            }`}
          >
            <span>Flagged Discrepancies</span>
            {discrepancies.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px]">
                {discrepancies.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Student Roster */}
        {activeTab === "students" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm">
            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, roll number, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchFilter()}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-[#E5EAF2] text-xs text-[#14213D] focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  placeholder="Department filter..."
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#E5EAF2] text-xs text-[#14213D] focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                />
              </div>

              <div className="sm:col-span-2">
                <select
                  value={semesterFilter}
                  onChange={(e) => setSemesterFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] text-xs text-[#14213D] bg-white focus:outline-hidden focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                >
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex gap-2">
                <button
                  onClick={handleSearchFilter}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-[#315CF5] hover:bg-[#2347DB] text-white transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            {/* Students Table */}
            {loading ? (
              <div className="py-12 text-center text-xs text-[#64748B]">Loading student records...</div>
            ) : students.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#64748B]">
                No student profiles found matching filters.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E5EAF2]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3.5">Roll Number</th>
                      <th className="p-3.5">Student Name</th>
                      <th className="p-3.5">PRAMAAN ID</th>
                      <th className="p-3.5">Program & Department</th>
                      <th className="p-3.5 text-center">Semester</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-[#F8FAFC]">
                        <td className="p-3.5 font-mono font-semibold text-[#14213D]">{st.roll_number}</td>
                        <td className="p-3.5 font-bold">{st.full_name}</td>
                        <td className="p-3.5 font-mono text-[11px] text-[#315CF5]">{st.student_identifier}</td>
                        <td className="p-3.5 text-[#64748B]">{st.department}</td>
                        <td className="p-3.5 text-center font-bold">Sem {st.current_semester}</td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold">
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Discrepancies Queue */}
        {activeTab === "discrepancies" && (
          <div className="bg-white border border-[#E5EAF2] rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#14213D]">Flagged Anomaly Review Queue</h3>
              <p className="text-xs text-[#64748B]">
                Automated validation rules check credit boundary violations and duplicate identifiers.
              </p>
            </div>

            {discrepancies.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#059669] font-medium bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
                ✓ No active discrepancies flagged for your institution.
              </div>
            ) : (
              <div className="space-y-3">
                {discrepancies.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          {d.flag_type}
                        </span>
                        <span className="text-[10px] font-semibold text-[#DC2626] uppercase">
                          Severity: {d.severity}
                        </span>
                      </div>
                      <p className="text-[#92400E] font-medium">{d.description}</p>
                      {d.student_name && (
                        <p className="text-[11px] text-[#78350F] mt-0.5 font-mono">
                          Affected: {d.student_name} ({d.student_identifier})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-[#FDE68A] text-[#92400E] text-[11px] font-semibold">
                        Status: {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Student Modal */}
      {addStudentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setAddStudentOpen(false)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">Register Single Student</h3>
                <p className="text-xs text-[#64748B]">Creates profile in institution tenant</p>
              </div>
              <button
                onClick={() => setAddStudentOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#14213D] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 py-4 text-xs">
              <div>
                <label className="block font-semibold text-[#14213D] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Diya Sengupta"
                  className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    placeholder="e.g. 2021CSB1090"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] font-mono focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@demo.ac.in"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#14213D] mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSem}
                    onChange={(e) => setNewSem(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5EAF2] bg-white text-[#14213D] focus:ring-2 focus:ring-[#315CF5]/20 focus:border-[#315CF5]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F1F5F9] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#315CF5] hover:bg-[#2347DB] disabled:opacity-50"
                >
                  {addLoading ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Batch Upload Modal with Live Preview */}
      {uploadCsvOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14213D]/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setUploadCsvOpen(false)}
        >
          <div
            className="bg-white border border-[#E5EAF2] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9] shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#14213D]">Batch CSV Record Ingestion</h3>
                <p className="text-xs text-[#64748B]">
                  Upload student cohorts with automated schema validation and anomaly checks.
                </p>
              </div>
              <button
                onClick={() => setUploadCsvOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#14213D] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* File Dropzone */}
              <div className="p-6 border-2 border-dashed border-[#CBD5E1] rounded-2xl bg-[#F8FAFC] text-center">
                <UploadCloud className="w-10 h-10 text-[#315CF5] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#14213D]">
                  {selectedFile ? selectedFile.name : "Select CSV file with student rosters"}
                </p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Required fields: roll_number, full_name, email, current_semester, etc.</p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <label className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#315CF5] hover:bg-[#2347DB] text-white cursor-pointer shadow-xs">
                    Browse File
                    <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white border border-[#E5EAF2] text-[#14213D] hover:bg-[#F1F5F9] flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#315CF5]" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>

              {selectedFile && !previewData && (
                <div className="text-center">
                  <button
                    onClick={handleUploadPreview}
                    disabled={previewLoading}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white shadow-xs"
                  >
                    {previewLoading ? "Parsing and Validating..." : "Inspect & Validate CSV"}
                  </button>
                </div>
              )}

              {/* Preview Table */}
              {previewData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[#14213D]">
                      Validation Results: <strong>{previewData.total_rows}</strong> total rows
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px]">
                        ✓ {previewData.valid_count} Valid
                      </span>
                      {previewData.error_count > 0 && (
                        <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[11px]">
                          ✗ {previewData.error_count} Errors
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#E5EAF2] max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F8FAFC] border-b border-[#E5EAF2] text-[#64748B] text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="p-2.5">Row</th>
                          <th className="p-2.5">Roll No</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Sem</th>
                          <th className="p-2.5">Validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F1F5F9] text-[#14213D]">
                        {previewData.preview_rows.map((r) => (
                          <tr key={r.row_index} className={r.is_valid ? "" : "bg-[#FEF2F2]/40"}>
                            <td className="p-2.5 font-mono text-[11px]">{r.row_index}</td>
                            <td className="p-2.5 font-mono">{r.data.roll_number}</td>
                            <td className="p-2.5 font-semibold">{r.data.full_name}</td>
                            <td className="p-2.5">{r.data.current_semester}</td>
                            <td className="p-2.5">
                              {r.is_valid ? (
                                <span className="text-[#059669] font-semibold text-[10px]">Ready</span>
                              ) : (
                                <span className="text-[#DC2626] text-[10px]">
                                  {r.errors.map((e) => e.error_message).join(", ")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Commit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleCommitImport}
                      disabled={commitLoading || previewData.valid_count === 0}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#315CF5] hover:bg-[#2347DB] text-white shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{commitLoading ? "Importing to Registry..." : `Commit ${previewData.valid_count} Valid Records`}</span>
                    </button>
                  </div>
                </div>
              )}

              {importResult && (
                <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-xs">
                  <div className="font-bold mb-1">✓ Batch Import Committed Successfully!</div>
                  <p>
                    Inserted {importResult.imported_count} student records into the registry.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
