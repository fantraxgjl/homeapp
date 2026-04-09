/**
 * Native API Router
 *
 * In standalone mode this replaces all /api/... fetch calls with direct
 * Capacitor SQLite calls. It is installed by NativeDataProvider by
 * monkey-patching window.fetch at app startup.
 *
 * Route matching follows the same URL structure as the Next.js API routes
 * so every existing component works without changes.
 */

import * as config   from "./repositories/config";
import * as members  from "./repositories/members";
import * as chores   from "./repositories/chores";
import * as meals    from "./repositories/meals";
import * as recipes  from "./repositories/recipes";
import * as shopping from "./repositories/shopping";
import * as messages from "./repositories/messages";
import { describeWeather } from "@/lib/weather";

function ok(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
function err(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), { status });
}

function body(init?: RequestInit): unknown {
  if (!init?.body) return {};
  try { return JSON.parse(init.body as string); } catch { return {}; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = Record<string, any>; // body is untyped at the router boundary

export async function routeNativeRequest(
  path: string,
  method: string,
  init?: RequestInit,
  searchParams?: URLSearchParams
): Promise<Response> {
  const b = body(init) as Params;
  const seg = path.replace(/^\/api\//, "").split("/");

  try {
    // ── pin ──────────────────────────────────────────────────────────
    if (seg[0] === "pin") {
      if (seg[1] === "status") {
        const cfg = await config.getConfig();
        return ok({ hasPin: cfg.pinSet });
      }
      if (seg[1] === "verify") {
        const cfg = await config.getConfig();
        if (!cfg.pinSet) {
          // First setup — save this PIN and unlock
          await config.setPin(b.pin);
          return ok({ success: true, firstSetup: true });
        }
        const valid = await config.verifyPin(b.pin);
        if (valid) return ok({ success: true });
        return ok({ success: false, error: "Incorrect PIN" });
      }
      if (seg[1] === "update")  { await config.setPin(b.pin); return ok({ success: true }); }
      if (seg[1] === "session") return ok({ success: true }); // no-op; Zustand manages state
    }

    // ── config ───────────────────────────────────────────────────────
    if (seg[0] === "config") {
      await config.updateConfig(b);
      return ok({ success: true });
    }

    // ── members ──────────────────────────────────────────────────────
    if (seg[0] === "members") {
      if (!seg[1]) {
        if (method === "GET")  return ok(await members.getAll());
        if (method === "POST") return ok(await members.create(b as Parameters<typeof members.create>[0]));
      }
      const memberId = seg[1];
      if (seg[2] === "points") return ok(await members.getPoints(memberId));
      if (method === "PATCH")  return ok(await members.update(memberId, b as Parameters<typeof members.update>[1]));
      if (method === "DELETE") { await members.remove(memberId); return ok({ success: true }); }
    }

    // ── chores ───────────────────────────────────────────────────────
    if (seg[0] === "chores") {
      if (!seg[1]) {
        if (method === "GET")  return ok(await chores.getAll());
        if (method === "POST") return ok(await chores.create(b as Parameters<typeof chores.create>[0]));
      }
      const choreId = seg[1];
      if (seg[2] === "complete") {
        return ok(await chores.complete(choreId, b.memberId));
      }
      if (seg[2] === "assign") {
        if (!seg[3]) {
          if (method === "GET")  return ok(await chores.getAssignments(choreId));
          if (method === "POST") { await chores.addAssignment(choreId, b.memberId, b.dayOfWeek); return ok({ success: true }); }
        }
        if (method === "DELETE") { await chores.removeAssignment(seg[3]); return ok({ success: true }); }
      }
      if (method === "PATCH")  { await chores.update(choreId, b as Parameters<typeof chores.update>[1]); return ok({ success: true }); }
      if (method === "DELETE") { await chores.remove(choreId);    return ok({ success: true }); }
    }

    // ── meals ────────────────────────────────────────────────────────
    if (seg[0] === "meals") {
      if (!seg[1]) {
        if (method === "GET") {
          const weekStart = searchParams?.get("weekStart") ?? new Date().toISOString().slice(0, 10);
          return ok(await meals.getMealPlan(weekStart));
        }
        if (method === "POST") return ok(await meals.upsertMeal(b as Parameters<typeof meals.upsertMeal>[0]));
      }
      const mealId = seg[1];
      if (method === "PATCH")  { await meals.updateMeal(mealId, b as Parameters<typeof meals.updateMeal>[1]); return ok({ success: true }); }
      if (method === "DELETE") { await meals.deleteMeal(mealId);    return ok({ success: true }); }
    }

    // ── recipes ──────────────────────────────────────────────────────
    if (seg[0] === "recipes") {
      if (seg[1] === "extract") {
        // Recipe extraction via Anthropic — requires key stored in config
        const cfg = await config.getConfig();
        if (!cfg.anthropicKey) {
          return new Response(JSON.stringify({ error: "No Anthropic API key configured. Add it in Settings → Recipe Extraction." }), { status: 503 });
        }
        // Dynamically import so it only loads when needed
        const { extractRecipeFromUrl, extractRecipeFromPdf } = await import("@/lib/recipe-extract");
        if (b.url)         return ok(await extractRecipeFromUrl(b.url));
        if (b.pdfBase64)   return ok(await extractRecipeFromPdf(b.pdfBase64, b.mimeType));
        return err("Provide url or pdfBase64");
      }

      if (!seg[1]) {
        if (method === "GET") {
          return ok(await recipes.getAll({
            mealType: searchParams?.get("mealType") ?? undefined,
            cuisine:  searchParams?.get("cuisine")  ?? undefined,
            q:        searchParams?.get("q")         ?? undefined,
            allergen: searchParams?.get("allergen")  ?? undefined,
          }));
        }
        if (method === "POST") return ok(await recipes.create(b as Parameters<typeof recipes.create>[0]));
      }
      const recipeId = seg[1];
      if (method === "GET")    return ok(await recipes.getById(recipeId));
      if (method === "DELETE") { await recipes.remove(recipeId); return ok({ success: true }); }
    }

    // ── shopping ─────────────────────────────────────────────────────
    if (seg[0] === "shopping") {
      if (!seg[1]) {
        if (method === "GET")  return ok(await shopping.getAll());
        if (method === "POST") {
          const items = Array.isArray(b) ? b : b.items ?? [b];
          return ok(await shopping.addItems(items));
        }
      }
      const itemId = seg[1];
      if (method === "PATCH")  { await shopping.update(itemId, b as Parameters<typeof shopping.update>[1]); return ok({ success: true }); }
      if (method === "DELETE") { await shopping.remove(itemId);    return ok({ success: true }); }
    }

    // ── messages ─────────────────────────────────────────────────────
    if (seg[0] === "messages") {
      if (!seg[1]) {
        if (method === "GET")  return ok(await messages.getAll());
        if (method === "POST") return ok(await messages.create(b as Parameters<typeof messages.create>[0]));
      }
      const msgId = seg[1];
      if (method === "PATCH")  { await messages.update(msgId, b as Parameters<typeof messages.update>[1]); return ok({ success: true }); }
      if (method === "DELETE") { await messages.remove(msgId);    return ok({ success: true }); }
    }

    // ── weather (direct Open-Meteo call, no server needed) ───────────
    if (seg[0] === "weather") {
      const cfg = await config.getConfig();
      const lat = cfg.weatherLat ?? 51.5074;
      const lon = cfg.weatherLon ?? -0.1278;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`;
      const res = await fetch(url);
      const raw = await res.json() as {
        current: { temperature_2m: number; weather_code: number; is_day: number };
        daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      const { emoji, label } = describeWeather(raw.current.weather_code, raw.current.is_day === 1);
      return ok({
        current: {
          temperature: Math.round(raw.current.temperature_2m),
          weatherCode: raw.current.weather_code,
          isDay: raw.current.is_day === 1,
          emoji, label,
        },
        daily: {
          high: Math.round(raw.daily.temperature_2m_max[0]),
          low:  Math.round(raw.daily.temperature_2m_min[0]),
        },
      });
    }

    // ── calendar — not available in standalone mode ───────────────────
    if (seg[0] === "calendar") {
      if (seg[1] === "events") return ok([]);
      if (seg[1] === "feeds")  return ok([]);
      return ok({ available: false });
    }

    // ── home-assistant — native uses HomeKit instead ──────────────────
    if (seg[0] === "home-assistant") {
      return ok({ available: false });
    }

    return err(`Unhandled native route: ${method} /api/${seg.join("/")}`, 404);
  } catch (e) {
    console.error("[native-api-router]", e);
    return err(String(e), 500);
  }
}
