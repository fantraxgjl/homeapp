import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

// POST /api/chores/[id]/complete
// Body: { memberId: string }
// Awards points and records completion. Idempotent within the same day.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: choreId } = await params;
    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const [chore, member] = await Promise.all([
      prisma.chore.findUnique({ where: { id: choreId } }),
      prisma.familyMember.findUnique({ where: { id: memberId } }),
    ]);

    if (!chore || !chore.isActive) {
      return NextResponse.json({ error: "Chore not found" }, { status: 404 });
    }
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check for duplicate today
    const now = new Date();
    const existing = await prisma.choreCompletion.findFirst({
      where: {
        choreId,
        memberId,
        completedAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    });

    if (existing) {
      return NextResponse.json(
        { alreadyCompleted: true, completion: existing },
        { status: 200 }
      );
    }

    const completion = await prisma.choreCompletion.create({
      data: { choreId, memberId, pointsEarned: chore.points },
    });

    // Calculate total points this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const weeklyPoints = await prisma.choreCompletion.aggregate({
      where: { memberId, completedAt: { gte: weekStart } },
      _sum: { pointsEarned: true },
    });

    return NextResponse.json({
      success: true,
      completion,
      pointsEarned: chore.points,
      weeklyTotal: weeklyPoints._sum.pointsEarned ?? 0,
    });
  } catch (err) {
    console.error("[chores/complete POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
