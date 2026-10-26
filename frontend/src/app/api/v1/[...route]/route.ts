import { NextRequest, NextResponse } from "next/server";

// Fallback serverless handler for Vercel edge/node deployment when external Python backend is not configured
export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const path = route.join("/");
  const url = new URL(req.url);

  if (path === "public-stats") {
    return NextResponse.json({
      verified_records: 1482094,
      participating_institutions: 842,
      verifications_today: 19482,
      tamper_proof_uptime: "99.99%",
      active_anomalies_flagged: 12,
      institutions_onboarded_list: [
        "IIT Delhi", "IIT Bombay", "University of Mumbai", "Anna University", "BITS Pilani"
      ]
    });
  }

  if (path === "announcements") {
    return NextResponse.json([
      {
        id: "ann-1",
        title: "National Academic Depository (PRAMAAN) Demonstration Active",
        priority: "high",
        date: "2026-10-27",
        category: "platform",
        active: true
      },
      {
        id: "ann-2",
        title: "IIT Delhi Spring 2024 Grade Sheets Cryptographically Signed & Dispatched",
        priority: "medium",
        date: "2026-10-25",
        category: "records",
        active: true
      },
      {
        id: "ann-3",
        title: "DPDP 2023 Compliance & Masked Verification Standards Implemented",
        priority: "info",
        date: "2026-10-20",
        category: "compliance",
        active: true
      }
    ]);
  }

  if (path === "verify") {
    const id = url.searchParams.get("id")?.trim() || "";
    if (id.includes("REVOKED")) {
      return NextResponse.json({
        document_id: id,
        student_name_masked: "R**** V****",
        institution_name: "University of Mumbai",
        degree_name: "Provisional Certificate",
        issue_date: "2023-05-12",
        verification_status: "revoked",
        tamper_evident_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        revocation_reason: "Superseded by issuance of permanent Degree Certificate.",
        is_authentic: false
      });
    }

    if (id.includes("382910") || id.toLowerCase().includes("pending")) {
      return NextResponse.json({
        document_id: id,
        student_name_masked: "D*** P****",
        institution_name: "Indian Institute of Technology Delhi",
        degree_name: "Bachelor of Technology (Computer Science)",
        issue_date: "2024-06-15",
        verification_status: "pending_review",
        tamper_evident_hash: "a4f89d38c1192e403d8b3c9902f8319e48c187bc401b3f678e820cb52820980f",
        is_authentic: false,
        review_notice: "Document under standard integrity review."
      });
    }

    // Default authentic demo document (e.g. PRM-DOC-2024-918274)
    return NextResponse.json({
      document_id: id || "PRM-DOC-2024-918274",
      student_name_masked: "A**** S*****",
      institution_name: "Indian Institute of Technology Delhi",
      degree_name: "Bachelor of Technology in Computer Science & Engineering",
      academic_session: "2021-2025 (Semester VI)",
      cgpa_sgpa: "9.42 SGPA / 9.28 CGPA",
      issue_date: "2024-06-20",
      verification_status: "verified",
      tamper_evident_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
      is_authentic: true,
      issuer_signature_valid: true,
      qr_payload_match: true
    });
  }

  if (path.startsWith("documents/") && path.endsWith("/pdf")) {
    // Generate a lightweight text/pdf demo response
    const docId = path.split("/")[1] || "PRM-DOC-2024-918274";
    const dummyPdfContent = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF`;
    return new NextResponse(dummyPdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PRAMAAN_Marksheet_${docId}.pdf"`
      }
    });
  }

  if (path === "students/me") {
    return NextResponse.json({
      id: "std-001",
      student_identifier: "PRM-2024-ND-849201",
      roll_number: "2021CSB1084",
      registration_number: "IITD/2021/CS/084",
      full_name: "Aarav Sharma",
      date_of_birth: "2003-04-14",
      gender: "Male",
      institution_name: "Indian Institute of Technology Delhi",
      program: "B.Tech Computer Science & Engineering",
      batch: "2021-2025",
      current_semester: 6,
      cgpa: 9.28,
      status: "active"
    });
  }

  if (path === "students/me/documents") {
    return NextResponse.json([
      {
        id: "PRM-DOC-2024-918274",
        title: "Semester VI Official Grade Sheet",
        semester: 6,
        academic_year: "2023-2024",
        issue_date: "2024-06-20",
        sgpa: 9.42,
        cgpa: 9.28,
        status: "verified",
        tamper_evident_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
        subjects: [
          { code: "COL331", name: "Operating Systems", credits: 4, grade: "A", points: 10 },
          { code: "COL352", name: "Introduction to Automata", credits: 4, grade: "A-", points: 9 },
          { code: "COL362", name: "Computer Networks", credits: 4, grade: "A", points: 10 },
          { code: "COL380", name: "Parallel Programming", credits: 4, grade: "B", points: 8 },
          { code: "COP290", name: "Design Practices", credits: 3, grade: "A", points: 10 }
        ]
      },
      {
        id: "PRM-DOC-2023-451290",
        title: "Semester V Official Grade Sheet",
        semester: 5,
        academic_year: "2023-2024",
        issue_date: "2023-12-15",
        sgpa: 9.15,
        cgpa: 9.24,
        status: "verified",
        tamper_evident_hash: "7c98e11a24d8f168b9201948ba10ef92314bc8190d7281bc9204857201948190",
        subjects: [
          { code: "COL216", name: "Computer Architecture", credits: 4, grade: "A", points: 10 },
          { code: "COL226", name: "Programming Languages", credits: 4, grade: "A", points: 10 },
          { code: "COL341", name: "Fundamentals of Machine Learning", credits: 4, grade: "B+", points: 8.5 }
        ]
      }
    ]);
  }

  if (path === "admin/stats" || path === "admin/telemetry") {
    return NextResponse.json({
      total_students: 14820,
      total_documents: 42190,
      total_institutions: 842,
      pending_approvals: 3,
      flagged_anomalies: 2,
      verifications_today: 19482,
      recent_activity: [
        { id: "aud-1", event: "Document Verified", detail: "PRM-DOC-2024-918274 verified by external recruiter", timestamp: "10 mins ago" },
        { id: "aud-2", event: "Batch Import", detail: "IIT Delhi uploaded Batch #2024-Spring (412 records)", timestamp: "1 hour ago" },
        { id: "aud-3", event: "Credential Revocation", detail: "PRM-DOC-2023-REVOKED-001 flagged as superseded", timestamp: "3 hours ago" }
      ]
    });
  }

  if (path.includes("pending")) {
    return NextResponse.json([
      {
        id: "PRM-DOC-2024-382910",
        student_name: "Diya Patel",
        roll_number: "2021CSB1092",
        institution: "IIT Delhi",
        document_type: "Semester VI Grade Sheet",
        submitted_at: "2026-10-26T14:30:00Z",
        status: "pending_review",
        flag_reason: "GPA discrepancy during batch cross-check"
      }
    ]);
  }

  // Default fallback
  return NextResponse.json({ message: "PRAMAAN Platform Vercel Node Handler Active", path });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
  const { route } = await params;
  const path = route.join("/");

  if (path === "auth/login") {
    try {
      const body = await req.json();
      const email = body.email?.toLowerCase().trim() || "";
      const password = body.password || "";

      // Super Admin
      if (email === "superadmin@pramaan.demo.gov" && password === "SuperAdmin@123") {
        return NextResponse.json({
          access_token: "demo_superadmin_jwt_token_pramaan_2024",
          token_type: "bearer",
          role: "super_admin",
          user_id: "usr-superadmin-01",
          email: "superadmin@pramaan.demo.gov",
          full_name: "Rajesh Verma (Super Administrator)"
        });
      }

      // Institution Admin
      if (email.startsWith("admin@") || password === "InstAdmin@123") {
        return NextResponse.json({
          access_token: "demo_institution_jwt_token_pramaan_2024",
          token_type: "bearer",
          role: "institution_admin",
          user_id: "usr-instadmin-01",
          email: email || "admin@iitdelhi.demo.ac.in",
          full_name: "Dr. Sunita Kulkarni (Dean of Academics, IITD)",
          institution_id: "inst-iitd-01",
          institution_name: "Indian Institute of Technology Delhi"
        });
      }

      // Student User
      if (email.includes("student") || email.includes("aarav") || password === "Student@123") {
        return NextResponse.json({
          access_token: "demo_student_jwt_token_pramaan_2024",
          token_type: "bearer",
          role: "student",
          user_id: "usr-student-01",
          email: email || "aarav.sharma@demo.ac.in",
          full_name: "Aarav Sharma",
          institution_id: "inst-iitd-01",
          institution_name: "Indian Institute of Technology Delhi",
          student_identifier: "PRM-2024-ND-849201"
        });
      }

      // Demo fallback - accept any credentials formatted for role
      return NextResponse.json({
        access_token: "demo_session_jwt_token_pramaan_2024",
        token_type: "bearer",
        role: "student",
        user_id: "usr-demo-01",
        email: email,
        full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
        institution_id: "inst-demo-01",
        institution_name: "Indian Institute of Technology Delhi"
      });
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true, message: `Action received on ${path}` });
}
