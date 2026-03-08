import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Goals } from "@/lib/types";
import { Save, Loader2 } from "lucide-react";

const fields: { key: keyof Goals; label: string; unit: string }[] = [
  { key: "kcals", label: "Calories", unit: "kcal" },
  { key: "fats_g", label: "Fats", unit: "g" },
  { key: "saturated_fats_g", label: "Saturated Fats", unit: "g" },
  { key: "carbs_g", label: "Carbs", unit: "g" },
  { key: "proteins_g", label: "Proteins", unit: "g" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
];

export default function SettingsPage() {
  const [goals, setGoals] = useState<Goals | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getGoals().then(setGoals);
  }, []);

  const handleChange = (key: keyof Goals, value: string) => {
    if (!goals) return;
    setGoals({ ...goals, [key]: Number(value) || 0 });
    setSaved(false);
  };

  const handleSave = async () => {
    if (!goals) return;
    setSaving(true);
    try {
      const updated = await api.updateGoals(goals);
      setGoals(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (!goals) {
    return <div className="text-center py-12 text-text-muted">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Daily Goals</h2>

      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <p className="text-sm text-text-muted">
          Set your daily nutritional targets. The dashboard progress bars will compare your intake against these goals.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, unit }) => (
            <div key={key}>
              <label className="block text-sm text-text-muted mb-1">
                {label} ({unit})
              </label>
              <input
                type="number"
                min={0}
                step={key === "kcals" ? 50 : key === "sodium_mg" ? 100 : 5}
                value={goals[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Goals"}
        </button>
      </div>
    </div>
  );
}
