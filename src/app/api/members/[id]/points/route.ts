import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/members/[id]/points
// Returns weekly and all-time point totals for a member
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await params;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weekly, total, todayCount] = await Promise.all([
      prisma.choreCompletion.aggregate({
        where: { memberId, completedAt: { gte: weekStart } },
        _sum: { pointsEarned: true },
        _count: true,
      }),
      prisma.choreCompletion.aggregate({
        where: { memberId },
        _sum: { pointsEarned: true },
        _count: true,
      }),
      prisma.choreCompletion.count({
        where: {
          memberId,
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    return NextResponse.json({
      weeklyPoints: weekly._sum.pointsEarned ?? 0,
      weeklyCount: weekly._count,
      totalPoints: total._sum.pointsEarned ?? 0,
      totalCount: total._count,
      todayCount,
    });
  } catch (err) {
    console.error("[members/points GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
