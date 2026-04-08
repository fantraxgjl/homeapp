import { NextRequest, NextResponse } from "next/server";
import { getCachedEvents, hasStaleFeeds, syncAllFeeds } from "@/lib/calendar";
import { addDays } from "date-fns";

// GET /api/calendar/events
// Query params: from (ISO date), to (ISO date), memberId
// Returns cached events. Triggers background sync if stale.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = fromStr ? new Date(fromStr) : new Date();
    const to = toStr ? new Date(toStr) : addDays(from, 30);

    // Check staleness — fire-and-forget background sync
    hasStaleFeeds().then((stale) => {
      if (stale) syncAllFeeds().catch(console.error);
    });

    const events = await getCachedEvents(from, to);
    return NextResponse.json(events);
  } catch (err) {
    console.error("[calendar/events GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
