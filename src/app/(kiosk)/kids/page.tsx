import { format } from "date-fns";
import Link from "next/link";

// Server component: render the kids view
export default async function KidsPage() {
  const now = new Date();
  const greeting = getGreeting(now);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 bg-slate-800/50 border-b border-slate-700">
        <div>
          <h1 className="text-3xl font-bold text-white">{greeting}! 👋</h1>
          <p className="text-slate-400 text-lg mt-0.5">
            {format(now, "EEEE, d MMMM")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-white tabular-nums">
            {format(now, "HH:mm")}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Chores column */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ✅ <span>My Chores Today</span>
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-auto dashboard-scroll">
            {/* Placeholder — Phase 2 will fill this with real chore data */}
            <div className="p-6 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 text-center">
              <div className="text-4xl mb-2">🌟</div>
              <p className="text-slate-400">
                Chores will appear here in Phase 2
              </p>
            </div>
          </div>
        </div>

        {/* Today's schedule column */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📅 <span>What&apos;s Happening Today</span>
          </h2>
          <div className="flex-1 flex flex-col gap-3 overflow-auto dashboard-scroll">
            {/* Placeholder — Phase 3 will fill with calendar events */}
            <div className="p-6 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 text-center">
              <div className="text-4xl mb-2">📆</div>
              <p className="text-slate-400">
                Today&apos;s events will appear here in Phase 3
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock button */}
      <div className="flex justify-center pb-6">
        <Link
          href="/unlock"
          className="flex items-center gap-3 px-8 py-4 min-h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all text-lg font-medium touch-manipulation"
        >
          <span>🔓</span>
          <span>Parent Unlock</span>
        </Link>
      </div>
    </div>
  );
}

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
