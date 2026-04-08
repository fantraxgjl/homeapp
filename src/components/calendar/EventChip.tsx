import { format, parseISO } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

interface EventChipProps {
  event: CalendarEvent;
  compact?: boolean;
}

export function EventChip({ event, compact = false }: EventChipProps) {
  const color = event.memberColor ?? event.color ?? "#6366f1";
  const start = parseISO(event.startTime);

  return (
    <div
      className={`
        flex items-center gap-1.5 rounded-md text-white overflow-hidden
        ${compact ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm"}
      `}
      style={{ backgroundColor: color + "cc", borderLeft: `3px solid ${color}` }}
      title={event.title}
    >
      {!event.isAllDay && !compact && (
        <span className="text-xs opacity-80 flex-shrink-0">
          {format(start, "HH:mm")}
        </span>
      )}
      <span className="truncate font-medium">{event.title}</span>
      {event.memberEmoji && compact && (
        <span className="flex-shrink-0 opacity-80">{event.memberEmoji}</span>
      )}
    </div>
  );
}
