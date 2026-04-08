import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HomeAssistantAdapter } from "@/lib/home-assistant";

// GET /api/home-assistant/states
// Returns HA entity states filtered to only visible HomeDevice entities.
// Falls back to { available: false } if HA is not configured.
export async function GET(_req: NextRequest) {
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });

  if (!config?.haBaseUrl || !config?.haToken) {
    return NextResponse.json({ available: false });
  }

  try {
    const adapter = new HomeAssistantAdapter(config.haBaseUrl, config.haToken);
    const allStates = await adapter.getStates();

    // Filter to only entities that are configured as visible HomeDevices
    const devices = await prisma.homeDevice.findMany({
      where: { isVisible: true },
      orderBy: { displayOrder: "asc" },
    });

    const deviceIds = new Set(devices.map((d) => d.entityId));
    const filteredStates = allStates.filter((s) => deviceIds.has(s.entity_id));

    // Merge device config (friendlyName, icon) with HA state
    const enriched = filteredStates.map((state) => {
      const device = devices.find((d) => d.entityId === state.entity_id)!;
      return {
        ...state,
        friendlyName: device.friendlyName || state.attributes["friendly_name"] || state.entity_id,
        iconOverride: device.iconOverride,
        displayOrder: device.displayOrder,
        deviceId: device.id,
      };
    });

    return NextResponse.json({ available: true, states: enriched });
  } catch (err) {
    console.error("[ha/states]", err);
    return NextResponse.json(
      { available: false, error: err instanceof Error ? err.message : "HA unreachable" },
      { status: 502 }
    );
  }
}
