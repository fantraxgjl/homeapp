import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HomeAssistantAdapter } from "@/lib/home-assistant";

// GET /api/home-assistant/entities
// Returns all HA entity states (for device discovery in settings) + saved HomeDevice configs.
export async function GET(_req: NextRequest) {
  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });

  const savedDevices = await prisma.homeDevice.findMany({
    orderBy: { displayOrder: "asc" },
  });

  if (!config?.haBaseUrl || !config?.haToken) {
    return NextResponse.json({ available: false, devices: savedDevices });
  }

  try {
    const adapter = new HomeAssistantAdapter(config.haBaseUrl, config.haToken);
    const allStates = await adapter.getStates();

    // Only return controllable domains, sorted by domain then friendly name
    const CONTROLLABLE = new Set(["light", "switch", "climate", "lock", "media_player", "input_boolean", "fan", "cover"]);
    const controllable = allStates
      .filter((s) => CONTROLLABLE.has(s.entity_id.split(".")[0]))
      .sort((a, b) => {
        const aName = String(a.attributes["friendly_name"] ?? a.entity_id);
        const bName = String(b.attributes["friendly_name"] ?? b.entity_id);
        return aName.localeCompare(bName);
      });

    return NextResponse.json({
      available: true,
      haEntities: controllable,
      devices: savedDevices,
    });
  } catch (err) {
    return NextResponse.json(
      { available: false, devices: savedDevices, error: err instanceof Error ? err.message : "HA unreachable" }
    );
  }
}

// POST /api/home-assistant/entities — upsert a HomeDevice record
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entityId, friendlyName, domain, isVisible, displayOrder, iconOverride } = body;

  if (!entityId || !domain) {
    return NextResponse.json({ error: "entityId and domain are required" }, { status: 400 });
  }

  const device = await prisma.homeDevice.upsert({
    where: { entityId },
    update: {
      friendlyName: friendlyName ?? entityId,
      domain,
      isVisible: isVisible ?? true,
      displayOrder: displayOrder ?? 0,
      iconOverride: iconOverride ?? null,
    },
    create: {
      entityId,
      friendlyName: friendlyName ?? entityId,
      domain,
      isVisible: isVisible ?? true,
      displayOrder: displayOrder ?? 0,
      iconOverride: iconOverride ?? null,
    },
  });

  return NextResponse.json(device, { status: 201 });
}

// DELETE /api/home-assistant/entities?entityId=...
export async function DELETE(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  await prisma.homeDevice.delete({ where: { entityId } }).catch(() => null);
  return new NextResponse(null, { status: 204 });
}
