import { ChoreIcon } from "./ChoreIcon";

interface ChoreCardProps {
  title: string;
  iconName: string;
  points: number;
  recurrence: string;
  assignees?: Array<{ displayName: string; avatarEmoji: string; color: string }>;
  onEdit?: () => void;
  onDelete?: () => void;
}

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: "Every day",
  WEEKLY: "Once a week",
  WEEKDAYS: "Weekdays",
  WEEKENDS: "Weekends",
};

export function ChoreCard({
  title,
  iconName,
  points,
  recurrence,
  assignees = [],
  onEdit,
  onDelete,
}: ChoreCardProps) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 border border-slate-700">
      <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
        <ChoreIcon name={iconName} size={28} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {RECURRENCE_LABELS[recurrence] ?? recurrence} · {points} pt
          {points !== 1 ? "s" : ""}
        </p>
        {assignees.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {assignees.map((a, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: a.color + "33", color: a.color }}
              >
                {a.avatarEmoji} {a.displayName}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Edit chore"
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/30 transition-colors"
            aria-label="Delete chore"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
