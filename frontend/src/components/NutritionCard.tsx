import type { NutritionData } from "@/lib/types";
import { Check, X } from "lucide-react";

interface Props {
  nutrition: NutritionData;
  modelUsed: string;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
}

export default function NutritionCard({ nutrition, modelUsed, onSave, onDiscard, saving }: Props) {
  const rows = [
    { label: "Calories", value: nutrition.kcals, unit: "kcal" },
    { label: "Fats", value: nutrition.fats_g, unit: "g" },
    { label: "Saturated Fats", value: nutrition.saturated_fats_g, unit: "g" },
    { label: "Carbs", value: nutrition.carbs_g, unit: "g" },
    { label: "Proteins", value: nutrition.proteins_g, unit: "g" },
    { label: "Sodium", value: nutrition.sodium_mg, unit: "mg" },
  ];

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-primary-light">{nutrition.food_name}</h3>
        <span className="text-xs text-text-muted bg-surface-alt px-2 py-0.5 rounded-md">
          {modelUsed.split("/").pop()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rows.map((r) => (
          <div key={r.label} className="bg-surface-alt rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold">
              {typeof r.value === "number" ? (Number.isInteger(r.value) ? r.value : r.value.toFixed(1)) : r.value}
              <span className="text-xs font-normal text-text-muted ml-0.5">{r.unit}</span>
            </div>
            <div className="text-[10px] text-text-muted mt-0.5">{r.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 bg-success/15 text-success hover:bg-success/25 rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Check size={16} /> Save
        </button>
        <button
          onClick={onDiscard}
          className="flex-1 flex items-center justify-center gap-1.5 bg-danger/15 text-danger hover:bg-danger/25 rounded-lg py-2 text-sm font-medium transition-colors"
        >
          <X size={16} /> Discard
        </button>
      </div>
    </div>
  );
}
