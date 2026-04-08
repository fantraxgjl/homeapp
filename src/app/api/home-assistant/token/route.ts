import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// GET /api/home-assistant/token
// Returns the HA base URL (NOT the token) for WebSocket connection from the browser.
// The token is never sent to the browser — the browser WebSocket connects via this URL
// and all service calls go through /api/home-assistant/services (server-side proxy).
export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("homeapp-session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.appConfig.findUnique({ where: { id: "singleton" } });
  if (!config?.haBaseUrl) {
    return NextResponse.json({ available: false });
  }

  // Return only the base URL — the browser polls /api/home-assistant/states instead
  // of connecting directly to HA WebSocket (keeping the token server-side only)
  return NextResponse.json({
    available: true,
    baseUrl: config.haBaseUrl,
  });
}
