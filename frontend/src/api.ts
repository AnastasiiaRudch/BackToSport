import { storage } from "@/src/utils/storage";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;
export const TOKEN_KEY = "rts_session_token";

let inMemoryToken: string | null = null;

export function setToken(token: string | null) {
  inMemoryToken = token;
}

export async function loadToken(): Promise<string | null> {
  if (inMemoryToken) return inMemoryToken;
  const t = await storage.secureGet<string | null>(TOKEN_KEY, null);
  inMemoryToken = t;
  return t;
}

export async function saveToken(token: string) {
  inMemoryToken = token;
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken() {
  inMemoryToken = null;
  await storage.secureRemove(TOKEN_KEY);
}

async function request<T = any>(
  path: string,
  method: string = "GET",
  body?: any,
): Promise<T> {
  const token = await loadToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const detail = (data && data.detail) || `Ошибка ${res.status}`;
    const err: any = new Error(typeof detail === "string" ? detail : "Ошибка запроса");
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p, "GET"),
  post: <T = any>(p: string, b?: any) => request<T>(p, "POST", b),
  put: <T = any>(p: string, b?: any) => request<T>(p, "PUT", b),
  del: <T = any>(p: string) => request<T>(p, "DELETE"),
};

// ---------- Types ----------
export type User = {
  user_id: string;
  email: string;
  name: string;
  role: "athlete" | "trainer";
  picture?: string | null;
};

export type Profile = {
  profile_id: string;
  name: string;
  age: number;
  sex: string;
  sport: string;
  weight_category?: string | null;
  surgery_type: string;
  time_since_surgery_weeks: number;
  dominant_arm: string;
  operated_arm: string;
  latest_rts?: number | null;
  latest_zone?: string | null;
  assessment_count?: number;
};

export type Assessment = {
  assessment_id: string;
  profile_id: string;
  profile_name: string;
  sport: string;
  rts_score: number;
  zone: string;
  components: Record<string, number>;
  er_ir_ratio: { operated: number | null; healthy: number | null };
  radar: { axis: string; value: number; key?: string }[];
  weak_links: { name: string; lsi: number | null; deficit: number | null; type: string; key?: string }[];
  detail_lsi: Record<string, number>;
  roadmap: {
    summary: string;
    exercises: { title: string; description: string; target: string }[];
    retest_weeks: number;
    retest_date: string;
    ai_generated?: boolean;
  };
  created_at: string;
};
