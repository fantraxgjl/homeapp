"use client";

import { useEffect, useState, useCallback } from "react";
import { format, addDays, isSameDay, startOfDay, parseISO, isToday } from "date-fns";
import { EventChip } from "./EventChip";
import Link from "next/link";
import type { CalendarEvent } from "@/types/calendar";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 min

export function CalendarWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(() => startOfDay(new Date()));

  const loadEvents = useCallback(async () => {
    try {
      const from = today.toISOString();
      const to = addDays(today, 6).toISOString();
      const res = await fetch(`/api/calendar/events?from=${from}&to=${to}`);
      if (res.ok) setEvents(await res.json());
    } catch {
      // silent — cached data remains visible
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.startTime), day));

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Calendar
        </h2>
        <Link
          href="/calendar"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Full view →
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-7 gap-1 overflow-hidden">
          {days.map((day) => {
            const dayEvents = eventsForDay(day);
            const isNow = isToday(day);

            return (
              <Link
                key={day.toISOString()}
                href={`/calendar?date=${format(day, "yyyy-MM-dd")}`}
                className={`
                  flex flex-col gap-1 p-1.5 rounded-xl min-h-0 overflow-hidden
                  transition-colors hover:bg-slate-700/50
                  ${isNow ? "bg-indigo-900/30 ring-1 ring-indigo-600/50" : ""}
                `}
              >
                {/* Day header */}
                <div className="text-center flex-shrink-0">
                  <p className="text-xs text-slate-500">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-sm font-bold leading-tight ${
                      isNow ? "text-indigo-400" : "text-white"
                    }`}
                  >
                    {format(day, "d")}
                  </p>
                </div>

                {/* Events */}
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventChip key={event.id} event={event} compact />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-slate-600 pl-1">
                      +{dayEvents.length - 3}
                    </p>
                  )}
                  {dayEvents.length === 0 && (
                    <div className="h-1" /> // Spacer
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
