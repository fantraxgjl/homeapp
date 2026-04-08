import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isChoreActiveToday, todayRange } from "@/lib/chore-utils";

// GET /api/chores
// Returns all active chores with assignments and today's completion status.
// Query: ?forToday=1 to filter to only chores active today (for kids view)
//        ?memberId=xxx to filter to a specific member
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const forToday = searchParams.get("forToday") === "1";
    const memberFilter = searchParams.get("memberId");

    const todayDow = new Date().getDay();
    const todayBounds = todayRange();

    const chores = await prisma.chore.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: {
            member: {
              select: {
                id: true,
                displayName: true,
                avatarEmoji: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get today's completions
    const completions = await prisma.choreCompletion.findMany({
      where: { completedAt: todayBounds },
    });
    const completionSet = new Set(
      completions.map((c) => `${c.choreId}:${c.memberId}`)
    );

    // Build the response
    const result = chores.flatMap((chore) => {
      return chore.assignments
        .filter((assignment) => {
          if (memberFilter && assignment.memberId !== memberFilter) return false;
          if (forToday) {
            return isChoreActiveToday(
              chore.recurrence,
              assignment.dayOfWeek,
              todayDow
            );
          }
          return true;
        })
        .map((assignment) => ({
          choreId: chore.id,
          title: chore.title,
          iconName: chore.iconName,
          points: chore.points,
          recurrence: chore.recurrence,
          assignmentId: assignment.id,
          dayOfWeek: assignment.dayOfWeek,
          memberId: assignment.memberId,
          memberName: assignment.member.displayName,
          memberEmoji: assignment.member.avatarEmoji,
          memberColor: assignment.member.color,
          isCompleted: completionSet.has(
            `${chore.id}:${assignment.memberId}`
          ),
        }));
    });

    // If forToday but no assignments, return base chores too for admin use
    if (!forToday) {
      return NextResponse.json({ chores, todayCompletions: completionSet.size });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[chores GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/chores — create a new chore
export async function POST(req: NextRequest) {
  try {
    const { title, iconName, points, recurrence } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const chore = await prisma.chore.create({
      data: {
        title,
        iconName: iconName ?? "star",
        points: points ?? 1,
        recurrence: recurrence ?? "DAILY",
      },
    });

    return NextResponse.json(chore, { status: 201 });
  } catch (err) {
    console.error("[chores POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
