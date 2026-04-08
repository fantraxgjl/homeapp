import { Card } from "@/components/ui/Card";
import { ChoreSummaryWidget } from "@/components/chores/ChoreSummaryWidget";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { MealPlanWidget } from "@/components/meals/MealPlanWidget";
import { HomeControlsWidget } from "@/components/home-controls/HomeControlsWidget";
import { MessageBoard } from "@/components/messages/MessageBoard";

export default function DashboardPage() {
  return (
    <div className="h-full p-4 grid grid-cols-3 grid-rows-[1fr_1fr_auto] gap-4">
      {/* Row 1-2: Calendar */}
      <Card className="col-span-1 row-span-2 flex flex-col">
        <CalendarWidget />
      </Card>

      {/* Row 1: Chore summary */}
      <Card className="col-span-1 flex flex-col">
        <ChoreSummaryWidget />
      </Card>

      {/* Row 1: Smart home */}
      <Card className="col-span-1 flex flex-col">
        <HomeControlsWidget />
      </Card>

      {/* Row 2: Meals widget */}
      <Card className="col-span-1 flex flex-col">
        <MealPlanWidget />
      </Card>

      {/* Row 2: Placeholder */}
      <Card className="col-span-1 flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Weather
        </h2>
        <p className="text-slate-500 text-sm">Coming in Phase 6</p>
      </Card>

      {/* Row 3: Messages strip */}
      <Card className="col-span-3" style={{ minHeight: "160px" }}>
        <MessageBoard compact />
      </Card>
    </div>
  );
}
