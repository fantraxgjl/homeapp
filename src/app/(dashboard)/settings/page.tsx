import { Card } from "@/components/ui/Card";
import { CalendarSettings } from "@/components/calendar/CalendarSettings";
import { HomeAssistantSettings } from "@/components/home-controls/HomeAssistantSettings";
import { WeatherSettings } from "@/components/weather/WeatherSettings";

export default function SettingsPage() {
  return (
    <div className="p-6 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Calendar */}
      <Card variant="bordered">
        <CalendarSettings />
      </Card>

      {/* Family members */}
      <Card variant="bordered">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-white">Family Members</h3>
          <p className="text-sm text-slate-500">
            Manage family members from the{" "}
            <a href="/chores" className="text-indigo-400 hover:text-indigo-300">
              Chores
            </a>{" "}
            page.
          </p>
        </div>
      </Card>

      {/* PIN */}
      <Card variant="bordered">
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-white">Dashboard PIN</h3>
          <p className="text-sm text-slate-500">
            PIN management coming in a future update.
          </p>
        </div>
      </Card>

      {/* Smart home */}
      <HomeAssistantSettings />

      {/* Weather */}
      <Card variant="bordered">
        <WeatherSettings />
      </Card>
    </div>
  );
}
