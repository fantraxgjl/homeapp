import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
      select: { pinHash: true, haBaseUrl: true, weatherLat: true, weatherLon: true },
    });
    return NextResponse.json({
      hasPin: !!config?.pinHash,
      haBaseUrl: config?.haBaseUrl ?? null,
      weatherLat: config?.weatherLat ?? null,
      weatherLon: config?.weatherLon ?? null,
    });
  } catch {
    return NextResponse.json({ hasPin: false });
  }
}
