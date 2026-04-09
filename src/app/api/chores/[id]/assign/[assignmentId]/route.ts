import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/chores/[id]/assign/[assignmentId] — remove an assignment
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  const { assignmentId } = await params;
  try {
    await prisma.choreAssignment.delete({ where: { id: assignmentId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chores/assign DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
