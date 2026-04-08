"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
  "#10b981", "#f43f5e", "#8b5cf6", "#06b6d4",
];

const EMOJIS = ["👦", "👧", "👨", "👩", "🧒", "🧑", "👴", "👵", "🐶", "🐱"];

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export function AddMemberModal({ isOpen, onClose, onAdd }: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"ADULT" | "CHILD">("CHILD");
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState("👧");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName(""); setDisplayName(""); setRole("CHILD");
    setColor(COLORS[0]); setEmoji("👧"); setError("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !displayName.trim()) {
      setError("Both name and display name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim(),
          role,
          color,
          avatarEmoji: emoji,
        }),
      });
      if (!res.ok) throw new Error();
      reset();
      onAdd();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add Family Member">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emma"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Display name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Emma"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Role */}
        <div className="flex gap-3">
          {(["CHILD", "ADULT"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                role === r
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {r === "CHILD" ? "👶 Child" : "👤 Adult"}
            </button>
          ))}
        </div>

        {/* Emoji */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Avatar</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  emoji === e
                    ? "bg-indigo-600"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Colour</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "Saving…" : "Add Member"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
