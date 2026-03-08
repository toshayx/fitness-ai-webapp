interface Props {
  label: string;
  current: number;
  goal: number;
  unit: string;
  decimals?: number;
}

export default function ProgressBar({ label, current, goal, unit, decimals = 0 }: Props) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = current > goal;

  const barColor = over
    ? "bg-danger"
    : pct > 80
      ? "bg-warning"
      : "bg-success";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className={over ? "text-danger font-medium" : "text-text-muted"}>
          {current.toFixed(decimals)} / {goal.toFixed(decimals)} {unit}
        </span>
      </div>
      <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
