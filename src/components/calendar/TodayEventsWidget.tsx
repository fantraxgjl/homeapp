"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isToday, startOfDay, endOfDay } from "date-fns";
import type { CalendarEvent } from "@/types/calendar";

export function TodayEventsWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    fetch(
      `/api/calendar/events?from=${startOfDay(now).toISOString()}&to=${endOfDay(now).toISOString()}`
    )
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-16">
        <p className="text-slate-600 text-sm">Nothing scheduled today 🎉</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((event) => {
        const start = parseISO(event.startTime);
        const color = event.memberColor ?? event.color ?? "#6366f1";

        return (
          <div
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div
              className="flex-shrink-0 text-center min-w-12"
              style={{ color }}
            >
              {event.isAllDay ? (
                <span className="text-xs font-medium">All day</span>
              ) : (
                <span className="text-sm font-bold tabular-nums">
                  {format(start, "HH:mm")}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{event.title}</p>
              {event.location && (
                <p className="text-xs text-slate-500 truncate">
                  📍 {event.location}
                </p>
              )}
            </div>
            {event.memberEmoji && (
              <span className="text-xl flex-shrink-0">{event.memberEmoji}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
