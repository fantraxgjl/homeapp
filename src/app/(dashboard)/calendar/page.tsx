import { CalendarFullView } from "@/components/calendar/CalendarFullView";

// CalendarFullView reads the date from its own state in static export mode.
// In server mode the date is optionally passed via searchParams.
export default function CalendarPage() {
  return <CalendarFullView />;
}
