import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await req.json();
    const feed = await prisma.calendarFeed.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.icalUrl !== undefined && { icalUrl: data.icalUrl }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.memberId !== undefined && { memberId: data.memberId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    const { icalUrl: _url, ...feedWithoutUrl } = feed;
    return NextResponse.json(feedWithoutUrl);
  } catch (err) {
    console.error("[calendar/feeds PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Remove events for this feed
    await prisma.calendarEventCache.deleteMany({ where: { calendarId: id } });
    await prisma.calendarFeed.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[calendar/feeds DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
