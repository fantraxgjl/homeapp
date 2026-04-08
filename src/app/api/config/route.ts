import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { clearHaAdapter } from "@/lib/home-assistant";

// PATCH /api/config — update non-PIN app configuration
// Requires valid session.
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get("homeapp-session")?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { haBaseUrl, haToken, weatherLat, weatherLon, kioskMode } = body;

  const updateData: Record<string, unknown> = {};
  if (haBaseUrl !== undefined) updateData.haBaseUrl = haBaseUrl || null;
  if (haToken !== undefined && haToken !== "") updateData.haToken = haToken;
  if (weatherLat !== undefined) updateData.weatherLat = weatherLat ? Number(weatherLat) : null;
  if (weatherLon !== undefined) updateData.weatherLon = weatherLon ? Number(weatherLon) : null;
  if (kioskMode !== undefined) updateData.kioskMode = Boolean(kioskMode);

  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: updateData,
    create: { id: "singleton", ...updateData },
  });

  // Clear the HA adapter singleton so it picks up new credentials
  clearHaAdapter();

  return NextResponse.json({ ok: true });
}
