import { format } from "date-fns";
import Link from "next/link";
import { KidsChoreView } from "@/components/chores/KidsChoreView";

export default function KidsPage() {
  const now = new Date();
  const greeting = getGreeting(now);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-slate-800/50 border-b border-slate-700 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}! 👋</h1>
          <p className="text-slate-400 mt-0.5">
            {format(now, "EEEE, d MMMM")}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white tabular-nums">
            {format(now, "HH:mm")}
          </div>
        </div>
      </div>

      {/* Chores section */}
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-shrink-0">
          ✅ <span>Today&apos;s Chores</span>
        </h2>
        <div className="flex-1 overflow-hidden">
          <KidsChoreView />
        </div>
      </div>

      {/* Unlock button */}
      <div className="flex justify-center pb-5 flex-shrink-0">
        <Link
          href="/unlock"
          className="flex items-center gap-3 px-8 py-4 min-h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-all text-base font-medium touch-manipulation"
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
