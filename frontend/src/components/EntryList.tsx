import type { FoodEntry } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface Props {
  entries: FoodEntry[];
  onDelete: (id: number) => void;
}

export default function EntryList({ entries, onDelete }: Props) {
  if (!entries.length) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        No food logged yet today. Use the input above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center justify-between group"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{entry.food_name}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted mt-1">
              <span>{entry.kcals} kcal</span>
              <span>F {entry.fats_g}g</span>
              <span>C {entry.carbs_g}g</span>
              <span>P {entry.proteins_g}g</span>
              <span>Na {entry.sodium_mg}mg</span>
            </div>
          </div>
          <button
            onClick={() => onDelete(entry.id)}
            className="ml-3 p-1.5 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all"
            title="Delete entry"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
