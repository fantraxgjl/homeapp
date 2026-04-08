/**
 * SmartHomeAdapter — abstraction layer so the UI never talks to HA directly.
 * Swap the adapter in src/lib/home-assistant.ts without touching any component.
 */

export interface HaEntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HaServiceCallParams {
  domain: string;
  service: string;
  serviceData?: Record<string, unknown>;
  target?: { entity_id?: string | string[] };
}

export interface SmartHomeAdapter {
  getStates(): Promise<HaEntityState[]>;
  getState(entityId: string): Promise<HaEntityState>;
  callService(params: HaServiceCallParams): Promise<void>;
}

// ─── Home Assistant REST Adapter ──────────────────────────────────────────────

export class HomeAssistantAdapter implements SmartHomeAdapter {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async getStates(): Promise<HaEntityState[]> {
    const res = await fetch(`${this.baseUrl}/api/states`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HA getStates failed: ${res.status}`);
    return res.json();
  }

  async getState(entityId: string): Promise<HaEntityState> {
    const res = await fetch(`${this.baseUrl}/api/states/${entityId}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`HA getState ${entityId} failed: ${res.status}`);
    return res.json();
  }

  async callService({ domain, service, serviceData, target }: HaServiceCallParams): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/services/${domain}/${service}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ ...serviceData, ...target }),
    });
    if (!res.ok) throw new Error(`HA service ${domain}.${service} failed: ${res.status}`);
  }
}

// ─── Singleton factory (server-side only) ─────────────────────────────────────

let _adapter: HomeAssistantAdapter | null = null;

export function getHaAdapter(baseUrl: string, token: string): HomeAssistantAdapter {
  if (!_adapter) {
    _adapter = new HomeAssistantAdapter(baseUrl, token);
  }
  return _adapter;
}

export function clearHaAdapter() {
  _adapter = null;
}

// ─── HA domain helpers ────────────────────────────────────────────────────────

export function getDomain(entityId: string) {
  return entityId.split(".")[0];
}

export function isLight(entityId: string) {
  return getDomain(entityId) === "light";
}

export function isSwitch(entityId: string) {
  return getDomain(entityId) === "switch";
}

export function isClimate(entityId: string) {
  return getDomain(entityId) === "climate";
}

export function isLock(entityId: string) {
  return getDomain(entityId) === "lock";
}

export function isMediaPlayer(entityId: string) {
  return getDomain(entityId) === "media_player";
}

export function isInputBoolean(entityId: string) {
  return getDomain(entityId) === "input_boolean";
}

export type DeviceDomain = "light" | "switch" | "climate" | "lock" | "media_player" | "sensor" | "binary_sensor" | "input_boolean" | "other";

export function classifyDomain(entityId: string): DeviceDomain {
  const domain = getDomain(entityId);
  const known: DeviceDomain[] = ["light", "switch", "climate", "lock", "media_player", "sensor", "binary_sensor", "input_boolean"];
  return (known.includes(domain as DeviceDomain) ? domain : "other") as DeviceDomain;
}
