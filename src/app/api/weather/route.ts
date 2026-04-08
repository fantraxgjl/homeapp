import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchWeather } from "@/lib/weather";

// Default to London if no coords configured
const DEFAULT_LAT = 51.5074;
const DEFAULT_LON = -0.1278;

export async function GET() {
  try {
    const config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
      select: { weatherLat: true, weatherLon: true },
    });

    const lat = config?.weatherLat ?? DEFAULT_LAT;
    const lon = config?.weatherLon ?? DEFAULT_LON;

    const weather = await fetchWeather(lat, lon);
    return NextResponse.json(weather);
  } catch (err) {
    console.error("[weather]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Weather unavailable" },
      { status: 502 }
    );
  }
}
