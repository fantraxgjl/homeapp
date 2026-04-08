"use client";

import {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { EventChip } from "./EventChip";
import type { CalendarEvent } from "@/types/calendar";

type ViewMode = "month" | "week";

interface CalendarFullViewProps {
  initialDate?: string; // yyyy-MM-dd
}

export function CalendarFullView({ initialDate }: CalendarFullViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [baseDate, setBaseDate] = useState(() =>
    initialDate ? new Date(initialDate) : new Date()
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadEvents = useCallback(async (from: Date, to: Date) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar/events?from=${from.toISOString()}&to=${to.toISOString()}`
      );
      if (res.ok) setEvents(await res.json());
    } catch {
      // keep existing events
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
      loadEvents(start, end);
    } else {
      const start = startOfWeek(baseDate, { weekStartsOn: 1 });
      const end = endOfWeek(baseDate, { weekStartsOn: 1 });
      loadEvents(start, end);
    }
  }, [baseDate, viewMode, loadEvents]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      // Reload events after sync
      const start =
        viewMode === "month"
          ? startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 })
          : startOfWeek(baseDate, { weekStartsOn: 1 });
      const end =
        viewMode === "month"
          ? endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 })
          : endOfWeek(baseDate, { weekStartsOn: 1 });
      await loadEvents(start, end);
    } finally {
      setSyncing(false);
    }
  };

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(parseISO(e.startTime), day));

  // Build month grid
  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });

    const weeks: Date[][] = [];
    let current = start;
    while (current <= end) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(current);
        current = addDays(current, 1);
      }
      weeks.push(week);
    }

    const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-800 flex-shrink-0">
          {DOW.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-medium text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex-1 grid overflow-hidden" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-slate-800/50">
              {week.map((day) => {
                const dayEvents = eventsForDay(day);
                const inMonth = isSameMonth(day, baseDate);
                const isNow = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      border-r border-slate-800/50 p-1.5 flex flex-col gap-0.5 overflow-hidden min-h-0
                      ${!inMonth ? "opacity-30" : ""}
                      ${isNow ? "bg-indigo-900/20" : ""}
                    `}
                  >
                    <span
                      className={`
                        text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                        ${isNow
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400"
                        }
                      `}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.slice(0, 3).map((ev) => (
                      <EventChip key={ev.id} event={ev} compact />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-slate-600 pl-1">
                        +{dayEvents.length - 3}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Build week view
  const renderWeekView = () => {
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex-1 grid grid-cols-7 gap-2 overflow-auto dashboard-scroll">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const isNow = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`
                flex flex-col gap-2 p-3 rounded-xl min-h-0
                ${isNow ? "bg-indigo-900/20 ring-1 ring-indigo-600/40" : "bg-slate-800/50"}
              `}
            >
              <div className="text-center flex-shrink-0">
                <p className="text-xs text-slate-500">{format(day, "EEE")}</p>
                <p
                  className={`text-xl font-bold ${
                    isNow ? "text-indigo-400" : "text-white"
                  }`}
                >
                  {format(day, "d")}
                </p>
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-slate-700 text-center mt-1">—</p>
              ) : (
                dayEvents.map((ev) => (
                  <EventChip key={ev.id} event={ev} />
                ))
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header / Controls */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Prev */}
        <button
          onClick={() =>
            setBaseDate((d) =>
              viewMode === "month" ? subMonths(d, 1) : addDays(d, -7)
            )
          }
          className="min-h-10 min-w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          ‹
        </button>

        {/* Title */}
        <h1 className="text-xl font-bold text-white flex-1">
          {viewMode === "month"
            ? format(baseDate, "MMMM yyyy")
            : `${format(startOfWeek(baseDate, { weekStartsOn: 1 }), "d MMM")} – ${format(
                endOfWeek(baseDate, { weekStartsOn: 1 }),
                "d MMM yyyy"
              )}`}
        </h1>

        {/* Next */}
        <button
          onClick={() =>
            setBaseDate((d) =>
              viewMode === "month" ? addMonths(d, 1) : addDays(d, 7)
            )
          }
          className="min-h-10 min-w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
        >
          ›
        </button>

        {/* Today */}
        <button
          onClick={() => setBaseDate(new Date())}
          className="min-h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          Today
        </button>

        {/* View toggle */}
        <div className="flex bg-slate-800 rounded-xl overflow-hidden">
          {(["month", "week"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`min-h-10 px-4 text-sm font-medium capitalize transition-colors ${
                viewMode === mode
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Sync */}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="min-h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "⟳ Sync"}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "month" ? (
        renderMonthView()
      ) : (
        renderWeekView()
      )}
    </div>
  );
}
