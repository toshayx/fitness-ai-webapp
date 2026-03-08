export interface TokenResponse {
  access_token: string;
  token_type: string;
  username: string;
}

export interface NutritionData {
  food_name: string;
  kcals: number;
  fats_g: number;
  saturated_fats_g: number;
  carbs_g: number;
  proteins_g: number;
  sodium_mg: number;
}

export interface AnalyzeResponse {
  nutrition: NutritionData;
  model_used: string;
  raw_response: string;
}

export interface FoodEntry {
  id: number;
  food_name: string;
  description: string;
  model_used: string;
  entry_date: string;
  created_at: string;
  kcals: number;
  fats_g: number;
  saturated_fats_g: number;
  carbs_g: number;
  proteins_g: number;
  sodium_mg: number;
}

export interface Goals {
  kcals: number;
  fats_g: number;
  saturated_fats_g: number;
  carbs_g: number;
  proteins_g: number;
  sodium_mg: number;
}

export interface MacroTotals {
  kcals: number;
  fats_g: number;
  saturated_fats_g: number;
  carbs_g: number;
  proteins_g: number;
  sodium_mg: number;
}

export interface DashboardToday {
  date: string;
  totals: MacroTotals;
  goals: Goals;
  entries: FoodEntry[];
}

export interface DayHistoryItem {
  date: string;
  totals: MacroTotals;
  entry_count: number;
}

export interface AIModel {
  id: string;
  name: string;
  supports_vision: boolean;
}
