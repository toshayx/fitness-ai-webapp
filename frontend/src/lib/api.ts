import type {
  AIModel,
  AnalyzeResponse,
  DashboardToday,
  DayHistoryItem,
  FoodEntry,
  Goals,
  NutritionData,
  TokenResponse,
} from "./types";

const BASE = "/api";

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = localStorage.getItem("token");
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: headers(), ...opts });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (username: string, password: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getModels: () => request<AIModel[]>("/food/models"),

  analyzeFood: (text: string | null, imageBase64: string | null, model: string) =>
    request<AnalyzeResponse>("/food/analyze", {
      method: "POST",
      body: JSON.stringify({ text, image_base64: imageBase64, model }),
    }),

  saveEntry: (entry: {
    food_name: string;
    description: string;
    model_used: string;
    entry_date: string;
    ai_response_raw: string;
  } & NutritionData) =>
    request<FoodEntry>("/food/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  getEntries: (date?: string) =>
    request<FoodEntry[]>(`/food/entries${date ? `?date=${date}` : ""}`),

  deleteEntry: (id: number) =>
    request<void>(`/food/entries/${id}`, { method: "DELETE" }),

  getGoals: () => request<Goals>("/goals"),

  updateGoals: (goals: Goals) =>
    request<Goals>("/goals", {
      method: "PUT",
      body: JSON.stringify(goals),
    }),

  getDashboardToday: () => request<DashboardToday>("/dashboard/today"),

  getHistory: (days = 7) =>
    request<DayHistoryItem[]>(`/dashboard/history?days=${days}`),
};
