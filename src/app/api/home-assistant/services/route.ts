import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { HomeAssistantAdapter } from "@/lib/home-assistant";

// POST /api/home-assistant/services
// Body: { domain, service, entityId?, serviceData? }
// Requires valid session cookie (adult-only action).
export async function POST(req: NextRequest) {
  // Session gate — only adults can control devices
  const cookieStore = await cookies();
  const session = cookieStore.get("homeapp-session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  if (!config?.haBaseUrl || !config?.haToken) {
    return NextResponse.json({ error: "Home Assistant not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { domain, service, entityId, serviceData } = body;

  if (!domain || !service) {
    return NextResponse.json({ error: "domain and service are required" }, { status: 400 });
  }

  try {
    const adapter = new HomeAssistantAdapter(config.haBaseUrl, config.haToken);
    await adapter.callService({
      domain,
      service,
      serviceData,
      target: entityId ? { entity_id: entityId } : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ha/services]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Service call failed" },
      { status: 502 }
    );
  }
}
