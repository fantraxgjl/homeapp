"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { format, parseISO } from "date-fns";
import type { CalendarFeed } from "@/types/calendar";
import type { FamilyMember } from "@/types/members";

const COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
  "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4",
];

export function CalendarSettings() {
  const [feeds, setFeeds] = useState<CalendarFeed[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Add feed form
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [memberId, setMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    const [feedRes, memberRes] = await Promise.all([
      fetch("/api/calendar/feeds"),
      fetch("/api/members"),
    ]);
    if (feedRes.ok) setFeeds(await feedRes.json());
    if (memberRes.ok) setMembers(await memberRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!name.trim() || !url.trim()) {
      setFormError("Name and URL are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/calendar/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icalUrl: url, color, memberId: memberId || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setFormError(d.error ?? "Failed to add");
        return;
      }
      setName(""); setUrl(""); setColor(COLORS[0]); setMemberId("");
      setShowAdd(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this calendar feed?")) return;
    await fetch(`/api/calendar/feeds/${id}`, { method: "DELETE" });
    load();
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(
        data.errors?.length
          ? `Synced ${data.synced} events. Errors: ${data.errors.join("; ")}`
          : `Synced ${data.synced} events successfully`
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Calendar Feeds</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Add Google Calendar iCal URLs to sync events
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "⟳ Sync now"}
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            + Add calendar
          </Button>
        </div>
      </div>

      {syncResult && (
        <div className="px-3 py-2 bg-slate-700 rounded-xl text-sm text-slate-300">
          {syncResult}
        </div>
      )}

      {/* How to get iCal URL hint */}
      <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-xl p-3 text-xs text-indigo-300">
        <p className="font-medium mb-1">How to get your Google Calendar iCal URL:</p>
        <p>Google Calendar → Settings → [Your calendar] → Integrate calendar → <strong>Secret address in iCal format</strong></p>
      </div>

      {/* Feed list */}
      {feeds.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm">
          No calendars added yet
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {feeds.map((feed) => (
            <div
              key={feed.id}
              className="bg-slate-800 rounded-xl p-3 flex items-center gap-3"
            >
              <div
                className="w-3 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: feed.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm">{feed.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {feed.member
                    ? `${feed.member.avatarEmoji} ${feed.member.displayName} · `
                    : ""}
                  {feed.lastSync
                    ? `Synced ${format(parseISO(feed.lastSync), "d MMM HH:mm")}`
                    : "Not yet synced"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(feed.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                aria-label="Remove feed"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => { setShowAdd(false); setFormError(""); }}
        title="Add Calendar Feed"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Calendar name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emma's calendar"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">iCal URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      color === c
                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">
                Link to member (optional)
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Family / Shared —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatarEmoji} {m.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-red-400 text-sm">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => { setShowAdd(false); setFormError(""); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={saving} className="flex-1">
              {saving ? "Adding…" : "Add Calendar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
