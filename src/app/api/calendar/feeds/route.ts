import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const feeds = await prisma.calendarFeed.findMany({
      include: {
        member: {
          select: { id: true, displayName: true, avatarEmoji: true, color: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    // Hide raw iCal URL from response (keep it server-side only)
    return NextResponse.json(
      feeds.map(({ icalUrl: _url, ...f }) => f)
    );
  } catch (err) {
    console.error("[calendar/feeds GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, icalUrl, color, memberId } = await req.json();

    if (!name || !icalUrl) {
      return NextResponse.json(
        { error: "name and icalUrl are required" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(icalUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const feed = await prisma.calendarFeed.create({
      data: {
        name,
        icalUrl,
        color: color ?? "#6366f1",
        memberId: memberId || null,
      },
      include: {
        member: {
          select: { id: true, displayName: true, avatarEmoji: true, color: true },
        },
      },
    });

    // Trigger initial sync in background
    const { syncAllFeeds } = await import("@/lib/calendar");
    syncAllFeeds().catch(console.error);

    const { icalUrl: _url, ...feedWithoutUrl } = feed;
    return NextResponse.json(feedWithoutUrl, { status: 201 });
  } catch (err) {
    console.error("[calendar/feeds POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
