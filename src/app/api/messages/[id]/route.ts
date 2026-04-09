import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { isPinned, content, color } = body;

  const message = await prisma.message.update({
    where: { id },
    data: {
      ...(isPinned !== undefined ? { isPinned } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(color !== undefined ? { color } : {}),
    },
    include: {
      author: { select: { id: true, displayName: true, avatarEmoji: true, color: true } },
    },
  });

  return NextResponse.json({
    ...message,
    createdAt: message.createdAt.toISOString(),
    expiresAt: message.expiresAt?.toISOString() ?? null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.message.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
