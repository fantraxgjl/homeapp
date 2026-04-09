import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { isChecked, name, quantity, category } = body;

  const item = await prisma.shoppingItem.update({
    where: { id },
    data: {
      ...(isChecked !== undefined ? { isChecked } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(quantity !== undefined ? { quantity } : {}),
      ...(category !== undefined ? { category } : {}),
    },
  });

  return NextResponse.json({ ...item, createdAt: item.createdAt.toISOString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.shoppingItem.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
// Required for Next.js static export (output: 'export'). Unused at runtime in native mode.
export async function generateStaticParams() { return []; }
