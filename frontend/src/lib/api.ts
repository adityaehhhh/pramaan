// API client library for PRAMAAN

export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return "http://127.0.0.1:8000/api/v1";
}

export const API_BASE = typeof window !== "undefined" ? "/api/v1" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1");

export interface UserSession {
  access_token: string;
  token_type: string;
  role: "student" | "institution_admin" | "super_admin" | "verifier";
  user_id: string;
  email: string;
  full_name: string;
  institution_id?: string;
  institution_name?: string;
  student_identifier?: string;
}

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("pramaan_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session: UserSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pramaan_session", JSON.stringify(session));
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pramaan_session");
  }
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const session = getStoredSession();
  const headers = new Headers(options.headers || {});
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const base = getApiBase();
  const url = endpoint.startsWith("http") ? endpoint : `${base}${endpoint}`;
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    // Session expired
    clearSession();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && window.location.pathname.startsWith("/portal")) {
      window.location.href = "/login";
    }
  }
  return res;
}
