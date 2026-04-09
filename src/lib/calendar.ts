import ical from "node-ical";
import { addDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { prisma } from "./db";

export interface ParsedEvent {
  googleId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location: string | null;
}

/**
 * Fetch and parse events from an iCal URL.
 * Returns events within a generous window (90 days past, 180 days future).
 */
export async function fetchICalEvents(url: string): Promise<ParsedEvent[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "FamilyDashboard/1.0" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch iCal (${response.status}): ${url}`);
  }

  const text = await response.text();
  const data = ical.parseICS(text);

  const now = new Date();
  const windowStart = addDays(now, -90);
  const windowEnd = addDays(now, 180);

  const events: ParsedEvent[] = [];

  for (const key in data) {
    const event = data[key];
    if (!event || event.type !== "VEVENT") continue;

    const summary = (event.summary as string) ?? "(No title)";

    // Handle recurring events — node-ical expands them
    const start = event.start as Date | undefined;
    const end = event.end as Date | undefined;

    if (!start) continue;

    const eventStart = start instanceof Date ? start : new Date(start);
    const eventEnd =
      end instanceof Date
        ? end
        : new Date(eventStart.getTime() + 60 * 60 * 1000);

    // Skip events outside our window
    if (eventEnd < windowStart || eventStart > windowEnd) continue;

    const isAllDay =
      Boolean(event.start && (event.start as { dateOnly?: boolean }).dateOnly) ||
      (eventStart.getHours() === 0 &&
        eventStart.getMinutes() === 0 &&
        eventEnd.getHours() === 0 &&
        eventEnd.getMinutes() === 0);

    events.push({
      googleId: (event.uid as string) ?? key,
      title: summary,
      startTime: eventStart,
      endTime: eventEnd,
      isAllDay,
      location: (event.location as string) ?? null,
    });
  }

  return events;
}

/**
 * Sync all active calendar feeds into CalendarEventCache.
 * Upserts events by googleId+calendarId combination.
 */
export async function syncAllFeeds(): Promise<{
  synced: number;
  errors: string[];
}> {
  const feeds = await prisma.calendarFeed.findMany({
    where: { isActive: true },
    include: { member: { select: { color: true } } },
  });

  let totalSynced = 0;
  const errors: string[] = [];

  for (const feed of feeds) {
    try {
      const events = await fetchICalEvents(feed.icalUrl);
      const color = feed.color ?? feed.member?.color ?? "#6366f1";

      // Upsert each event
      for (const ev of events) {
        await prisma.calendarEventCache.upsert({
          where: { googleId: ev.googleId },
          update: {
            title: ev.title,
            startTime: ev.startTime,
            endTime: ev.endTime,
            isAllDay: ev.isAllDay,
            location: ev.location,
            color,
            memberId: feed.memberId,
            syncedAt: new Date(),
          },
          create: {
            googleId: ev.googleId,
            calendarId: feed.id,
            memberId: feed.memberId,
            title: ev.title,
            startTime: ev.startTime,
            endTime: ev.endTime,
            isAllDay: ev.isAllDay,
            location: ev.location,
            color,
            syncedAt: new Date(),
          },
        });
      }

      // Update lastSync
      await prisma.calendarFeed.update({
        where: { id: feed.id },
        data: { lastSync: new Date() },
      });

      totalSynced += events.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Feed "${feed.name}": ${msg}`);
      console.error(`[calendar sync] Feed "${feed.name}" failed:`, err);
    }
  }

  return { synced: totalSynced, errors };
}

/**
 * Get cached events for a date range, enriched with member info.
 */
export async function getCachedEvents(from: Date, to: Date) {
  const events = await prisma.calendarEventCache.findMany({
    where: {
      OR: [
        // Events that start within the range
        { startTime: { gte: startOfDay(from), lte: endOfDay(to) } },
        // Multi-day events that span into the range
        {
          startTime: { lt: startOfDay(from) },
          endTime: { gte: startOfDay(from) },
        },
      ],
    },
    orderBy: { startTime: "asc" },
  });

  type CachedEvent = (typeof events)[number];
  type MemberInfo = { id: string; displayName: string; avatarEmoji: string; color: string };

  // Enrich with member info
  const memberIds = [...new Set(events.map((e: CachedEvent) => e.memberId).filter(Boolean))] as string[];
  const members: MemberInfo[] =
    memberIds.length > 0
      ? await prisma.familyMember.findMany({
          where: { id: { in: memberIds } },
          select: { id: true, displayName: true, avatarEmoji: true, color: true },
        })
      : [];

  const memberMap = new Map(members.map((m: MemberInfo) => [m.id, m]));

  return events.map((e: CachedEvent) => {
    const member = e.memberId ? memberMap.get(e.memberId) : undefined;
    return {
      ...e,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      syncedAt: e.syncedAt.toISOString(),
      memberName: member?.displayName ?? null,
      memberColor: member?.color ?? e.color,
      memberEmoji: member?.avatarEmoji ?? null,
    };
  });
}

/** Check if any feed is stale (not synced in last 15 minutes) */
export async function hasStaleFeeds(): Promise<boolean> {
  const threshold = new Date(Date.now() - 15 * 60 * 1000);
  const stale = await prisma.calendarFeed.count({
    where: {
      isActive: true,
      OR: [{ lastSync: null }, { lastSync: { lt: threshold } }],
    },
  });
  return stale > 0;
}
