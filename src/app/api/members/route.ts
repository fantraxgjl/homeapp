import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const members = await prisma.familyMember.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(members);
  } catch (err) {
    console.error("[members GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, displayName, role, color, avatarEmoji, calendarId } =
      await req.json();

    if (!name || !displayName) {
      return NextResponse.json(
        { error: "name and displayName are required" },
        { status: 400 }
      );
    }

    const member = await prisma.familyMember.create({
      data: {
        name,
        displayName,
        role: role ?? "CHILD",
        color: color ?? "#6366f1",
        avatarEmoji: avatarEmoji ?? "👤",
        calendarId: calendarId ?? null,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("[members POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
