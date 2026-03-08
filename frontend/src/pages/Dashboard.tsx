import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { AnalyzeResponse, DashboardToday } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import FoodInput from "@/components/FoodInput";
import NutritionCard from "@/components/NutritionCard";
import EntryList from "@/components/EntryList";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardToday | null>(null);
  const [pending, setPending] = useState<{ result: AnalyzeResponse; description: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    const data = await api.getDashboardToday();
    setDashboard(data);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAnalyzeResult = (result: AnalyzeResponse, description: string) => {
    setPending({ result, description });
  };

  const handleSave = async () => {
    if (!pending || !dashboard) return;
    setSaving(true);
    try {
      await api.saveEntry({
        food_name: pending.result.nutrition.food_name,
        description: pending.description,
        model_used: pending.result.model_used,
        entry_date: dashboard.date,
        ai_response_raw: pending.result.raw_response,
        ...pending.result.nutrition,
      });
      setPending(null);
      await loadDashboard();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await api.deleteEntry(id);
    await loadDashboard();
  };

  if (!dashboard) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  const { totals, goals } = dashboard;

  return (
    <div className="space-y-6">
      {/* Progress bars */}
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          Today&apos;s Progress
        </h2>
        <ProgressBar label="Calories" current={totals.kcals} goal={goals.kcals} unit="kcal" />
        <ProgressBar label="Fats" current={totals.fats_g} goal={goals.fats_g} unit="g" decimals={1} />
        <ProgressBar label="Saturated Fats" current={totals.saturated_fats_g} goal={goals.saturated_fats_g} unit="g" decimals={1} />
        <ProgressBar label="Carbs" current={totals.carbs_g} goal={goals.carbs_g} unit="g" decimals={1} />
        <ProgressBar label="Proteins" current={totals.proteins_g} goal={goals.proteins_g} unit="g" decimals={1} />
        <ProgressBar label="Sodium" current={totals.sodium_mg} goal={goals.sodium_mg} unit="mg" decimals={0} />
      </div>

      {/* Food input */}
      <FoodInput onResult={handleAnalyzeResult} />

      {/* Pending nutrition card */}
      {pending && (
        <NutritionCard
          nutrition={pending.result.nutrition}
          modelUsed={pending.result.model_used}
          onSave={handleSave}
          onDiscard={() => setPending(null)}
          saving={saving}
        />
      )}

      {/* Today's entries */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Today&apos;s Food Log
        </h2>
        <EntryList entries={dashboard.entries} onDelete={handleDelete} />
      </div>
    </div>
  );
}
