import { CalendarFullView } from "@/components/calendar/CalendarFullView";

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const { date } = await searchParams;
  return <CalendarFullView initialDate={date} />;
}
