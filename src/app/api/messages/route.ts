import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/messages — returns non-expired messages, pinned first
export async function GET() {
  const now = new Date();
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      author: { select: { id: true, displayName: true, avatarEmoji: true, color: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return NextResponse.json(
    messages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      expiresAt: m.expiresAt?.toISOString() ?? null,
    }))
  );
}

// POST /api/messages
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, authorId, color, isPinned, expiresInDays } = body;

  if (!content?.trim() || !authorId) {
    return NextResponse.json({ error: "content and authorId are required" }, { status: 400 });
  }
  if (content.length > 280) {
    return NextResponse.json({ error: "Message must be ≤ 280 characters" }, { status: 400 });
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + Number(expiresInDays) * 86400_000)
    : null;

  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      authorId,
      color: color ?? "#fef08a",
      isPinned: isPinned ?? false,
      expiresAt,
    },
    include: {
      author: { select: { id: true, displayName: true, avatarEmoji: true, color: true } },
    },
  });

  return NextResponse.json(
    { ...message, createdAt: message.createdAt.toISOString(), expiresAt: message.expiresAt?.toISOString() ?? null },
    { status: 201 }
  );
}
