"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function WeatherSettings() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    fetch("/api/pin/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.weatherLat) setLat(String(d.weatherLat));
        if (d.weatherLon) setLon(String(d.weatherLon));
      })
      .catch(() => null);
  }, []);

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(4));
        setLon(pos.coords.longitude.toFixed(4));
        setLocating(false);
      },
      () => setLocating(false)
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weatherLat: lat, weatherLon: lon }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white">Weather</h3>
      <p className="text-sm text-slate-500">
        Uses Open-Meteo — no API key required. Set your coordinates to get local weather.
      </p>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-slate-400 text-xs block mb-1">Latitude</label>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="51.5074"
            className="w-full px-3 py-2 bg-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="text-slate-400 text-xs block mb-1">Longitude</label>
          <input
            type="number"
            step="0.0001"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="-0.1278"
            className="w-full px-3 py-2 bg-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={handleGeolocate} disabled={locating} className="text-sm">
          {locating ? "Locating…" : "📍 Use my location"}
        </Button>
        <Button onClick={handleSave} disabled={saving || !lat || !lon} className="text-sm">
          {saving ? "Saving…" : "Save"}
        </Button>
        {saved && <span className="text-emerald-400 text-sm">✓ Saved</span>}
      </div>
    </div>
  );
}
