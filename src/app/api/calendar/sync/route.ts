import { NextResponse } from "next/server";
import { syncAllFeeds } from "@/lib/calendar";

// POST /api/calendar/sync — force re-sync all feeds
export async function POST() {
  try {
    const result = await syncAllFeeds();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[calendar/sync POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
