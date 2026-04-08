import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
      select: { pinHash: true },
    });
    return NextResponse.json({ hasPin: !!config?.pinHash });
  } catch {
    return NextResponse.json({ hasPin: false });
  }
}
