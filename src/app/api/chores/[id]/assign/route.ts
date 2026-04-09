import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/chores/[id]/assign — assign a chore to a member
// Body: { memberId: string, dayOfWeek?: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: choreId } = await params;
    const { memberId, dayOfWeek } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const assignment = await prisma.choreAssignment.upsert({
      where: {
        choreId_memberId_dayOfWeek: {
          choreId,
          memberId,
          dayOfWeek: dayOfWeek ?? null,
        },
      },
      update: {},
      create: { choreId, memberId, dayOfWeek: dayOfWeek ?? null },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    console.error("[chores/assign POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
