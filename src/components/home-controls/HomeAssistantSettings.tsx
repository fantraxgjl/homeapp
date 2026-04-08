"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface HaEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
}

interface SavedDevice {
  id: string;
  entityId: string;
  friendlyName: string;
  domain: string;
  isVisible: boolean;
  displayOrder: number;
}

export function HomeAssistantSettings() {
  const [haUrl, setHaUrl] = useState("");
  const [haToken, setHaToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "ok" | "fail">("idle");

  const [haEntities, setHaEntities] = useState<HaEntity[]>([]);
  const [savedDevices, setSavedDevices] = useState<SavedDevice[]>([]);
  const [haAvailable, setHaAvailable] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Load current config
  useEffect(() => {
    fetch("/api/pin/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.haBaseUrl) setHaUrl(d.haBaseUrl);
      })
      .catch(() => null);
    loadEntities();
  }, []);

  async function loadEntities() {
    setLoadingEntities(true);
    try {
      const res = await fetch("/api/home-assistant/entities");
      const data = await res.json();
      setHaAvailable(data.available ?? false);
      setHaEntities(data.haEntities ?? []);
      setSavedDevices(data.devices ?? []);
    } finally {
      setLoadingEntities(false);
    }
  }

  async function handleSaveConfig() {
    setSaving(true);
    setTestResult("idle");
    try {
      const body: Record<string, string> = { haBaseUrl: haUrl.trim() };
      if (haToken.trim()) body.haToken = haToken.trim();

      const res = await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setTestResult("ok");
        setHaToken(""); // clear token display
        await loadEntities();
      } else {
        setTestResult("fail");
      }
    } catch {
      setTestResult("fail");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDevice(entity: HaEntity) {
    const domain = entity.entity_id.split(".")[0];
    const friendlyName = String(entity.attributes["friendly_name"] ?? entity.entity_id);
    await fetch("/api/home-assistant/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: entity.entity_id,
        friendlyName,
        domain,
        isVisible: true,
        displayOrder: savedDevices.length,
      }),
    });
    await loadEntities();
  }

  async function handleRemoveDevice(entityId: string) {
    await fetch(`/api/home-assistant/entities?entityId=${encodeURIComponent(entityId)}`, {
      method: "DELETE",
    });
    await loadEntities();
  }

  const savedIds = new Set(savedDevices.map((d) => d.entityId));

  return (
    <div className="space-y-6">
      {/* Connection config */}
      <Card variant="bordered">
        <h3 className="text-white font-semibold mb-4">Home Assistant Connection</h3>
        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-sm block mb-1">Base URL</label>
            <input
              type="url"
              value={haUrl}
              onChange={(e) => setHaUrl(e.target.value)}
              placeholder="http://homeassistant.local:8123"
              className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm block mb-1">Long-Lived Access Token</label>
            <input
              type="password"
              value={haToken}
              onChange={(e) => setHaToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1Ni… (leave blank to keep existing)"
              className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-slate-500 text-xs mt-1">
              Generate in HA Profile → Security → Long-Lived Access Tokens
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveConfig} disabled={saving || !haUrl.trim()}>
              {saving ? "Saving…" : "Save & Test"}
            </Button>
            {testResult === "ok" && (
              <span className="text-emerald-400 text-sm">✓ Connected</span>
            )}
            {testResult === "fail" && (
              <span className="text-red-400 text-sm">✗ Connection failed</span>
            )}
          </div>
        </div>
      </Card>

      {/* Device management */}
      {haAvailable && (
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Dashboard Devices</h3>
            <Button variant="ghost" onClick={loadEntities} disabled={loadingEntities} className="text-xs">
              {loadingEntities ? "Loading…" : "Refresh"}
            </Button>
          </div>

          {savedDevices.length > 0 && (
            <div className="mb-4 space-y-1">
              <p className="text-slate-400 text-xs font-medium mb-2">Configured devices</p>
              {savedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-xl">
                  <div>
                    <p className="text-white text-sm">{device.friendlyName}</p>
                    <p className="text-slate-500 text-xs">{device.entityId}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveDevice(device.entityId)}
                    className="text-slate-500 hover:text-red-400 transition-colors text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-slate-400 text-xs font-medium mb-2">Available entities (click to add)</p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {haEntities.filter((e) => !savedIds.has(e.entity_id)).map((entity) => (
                <button
                  key={entity.entity_id}
                  onClick={() => handleAddDevice(entity)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-700/50 transition-colors text-left group"
                >
                  <div>
                    <p className="text-white text-sm">{String(entity.attributes["friendly_name"] ?? entity.entity_id)}</p>
                    <p className="text-slate-500 text-xs">{entity.entity_id} · {entity.state}</p>
                  </div>
                  <span className="text-slate-500 group-hover:text-indigo-400 text-sm transition-colors">+ Add</span>
                </button>
              ))}
              {haEntities.filter((e) => !savedIds.has(e.entity_id)).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">All available entities are already added.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {!haAvailable && haUrl && (
        <p className="text-slate-500 text-sm text-center">
          Save a valid HA URL and token to see available devices.
        </p>
      )}
    </div>
  );
}
