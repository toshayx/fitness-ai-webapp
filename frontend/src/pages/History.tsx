import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { DayHistoryItem, FoodEntry } from "@/lib/types";
import EntryList from "@/components/EntryList";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function HistoryPage() {
  const [days, setDays] = useState(7);
  const [history, setHistory] = useState<DayHistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<FoodEntry[]>([]);

  useEffect(() => {
    api.getHistory(days).then(setHistory);
  }, [days]);

  const toggleDay = async (date: string) => {
    if (expanded === date) {
      setExpanded(null);
      setExpandedEntries([]);
      return;
    }
    setExpanded(date);
    const entries = await api.getEntries(date);
    setExpandedEntries(entries);
  };

  const handleDelete = async (id: number) => {
    await api.deleteEntry(id);
    if (expanded) {
      const entries = await api.getEntries(expanded);
      setExpandedEntries(entries);
    }
    api.getHistory(days).then(setHistory);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-surface-alt border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {!history.length && (
        <div className="text-center py-12 text-text-muted text-sm">No history yet.</div>
      )}

      {history.map((item) => (
        <div key={item.date} className="bg-surface border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleDay(item.date)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors"
          >
            <div className="text-left">
              <div className="font-medium text-sm">{formatDate(item.date)}</div>
              <div className="flex flex-wrap gap-x-3 text-xs text-text-muted mt-0.5">
                <span>{item.totals.kcals} kcal</span>
                <span>F {item.totals.fats_g}g</span>
                <span>C {item.totals.carbs_g}g</span>
                <span>P {item.totals.proteins_g}g</span>
                <span>{item.entry_count} items</span>
              </div>
            </div>
            {expanded === item.date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded === item.date && (
            <div className="border-t border-border px-4 py-3">
              <EntryList entries={expandedEntries} onDelete={handleDelete} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
