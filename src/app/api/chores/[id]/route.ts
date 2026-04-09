import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chore = await prisma.chore.findUnique({
    where: { id },
    include: { assignments: { include: { member: true } } },
  });
  if (!chore) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(chore);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await req.json();
    const chore = await prisma.chore.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.iconName !== undefined && { iconName: data.iconName }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.recurrence !== undefined && { recurrence: data.recurrence }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return NextResponse.json(chore);
  } catch (err) {
    console.error("[chores PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Soft delete
    await prisma.chore.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[chores DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
