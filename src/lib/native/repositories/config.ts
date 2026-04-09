import { query, run, now } from "../db";
import bcrypt from "bcryptjs";

interface AppConfigRow {
  id: string;
  pin_hash: string | null;
  ha_base_url: string | null;
  ha_token: string | null;
  weather_lat: number | null;
  weather_lon: number | null;
  kiosk_mode: number;
  anthropic_key: string | null;
}

export async function getConfig() {
  const rows = await query<AppConfigRow>("SELECT * FROM app_config WHERE id = 'singleton'");
  const r = rows[0] ?? {};
  return {
    pinSet: !!r.pin_hash,
    haBaseUrl: r.ha_base_url ?? null,
    weatherLat: r.weather_lat ?? null,
    weatherLon: r.weather_lon ?? null,
    kioskMode: !!r.kiosk_mode,
    anthropicKey: r.anthropic_key ?? null,
  };
}

export async function updateConfig(data: {
  haBaseUrl?: string;
  haToken?: string;
  weatherLat?: string | number;
  weatherLon?: string | number;
  kioskMode?: boolean;
  anthropicKey?: string;
}) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (data.haBaseUrl !== undefined) { sets.push("ha_base_url = ?"); params.push(data.haBaseUrl || null); }
  if (data.haToken !== undefined)   { sets.push("ha_token = ?");    params.push(data.haToken || null); }
  if (data.weatherLat !== undefined) { sets.push("weather_lat = ?"); params.push(Number(data.weatherLat) || null); }
  if (data.weatherLon !== undefined) { sets.push("weather_lon = ?"); params.push(Number(data.weatherLon) || null); }
  if (data.kioskMode !== undefined)  { sets.push("kiosk_mode = ?");  params.push(data.kioskMode ? 1 : 0); }
  if (data.anthropicKey !== undefined) { sets.push("anthropic_key = ?"); params.push(data.anthropicKey || null); }

  if (sets.length === 0) return;
  params.push("singleton");
  await run(`UPDATE app_config SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const rows = await query<AppConfigRow>("SELECT pin_hash FROM app_config WHERE id = 'singleton'");
  const hash = rows[0]?.pin_hash;
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}

export async function setPin(pin: string) {
  const hash = await bcrypt.hash(pin, 10);
  await run("UPDATE app_config SET pin_hash = ? WHERE id = 'singleton'", [hash]);
}
