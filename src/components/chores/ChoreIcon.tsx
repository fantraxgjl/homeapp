interface ChoreIconProps {
  name: string;
  size?: number;
  className?: string;
}

const ICON_MAP: Record<string, string> = {
  dishes: "🍽️",
  sweep: "🧹",
  laundry: "👕",
  "tidy-room": "🛏️",
  trash: "🗑️",
  homework: "📚",
  teeth: "🪥",
  bed: "🛏️",
  vacuum: "🧹",
  "feed-pet": "🐾",
  star: "⭐",
};

export function ChoreIcon({ name, size = 40, className = "" }: ChoreIconProps) {
  const emoji = ICON_MAP[name] ?? "⭐";
  return (
    <span
      className={`flex items-center justify-center select-none ${className}`}
      style={{ fontSize: size, lineHeight: 1, width: size, height: size }}
      role="img"
      aria-label={name}
    >
      {emoji}
    </span>
  );
}
