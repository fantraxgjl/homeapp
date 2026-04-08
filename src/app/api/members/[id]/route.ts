import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const member = await prisma.familyMember.findUnique({ where: { id } });
  if (!member)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await req.json();
    const member = await prisma.familyMember.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.avatarEmoji !== undefined && { avatarEmoji: data.avatarEmoji }),
        ...(data.calendarId !== undefined && { calendarId: data.calendarId }),
      },
    });
    return NextResponse.json(member);
  } catch (err) {
    console.error("[members PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.familyMember.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[members DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
