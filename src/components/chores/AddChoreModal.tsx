"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const ICONS = [
  { name: "dishes", label: "Dishes", emoji: "🍽️" },
  { name: "sweep", label: "Sweep", emoji: "🧹" },
  { name: "laundry", label: "Laundry", emoji: "👕" },
  { name: "tidy-room", label: "Tidy Room", emoji: "🛏️" },
  { name: "trash", label: "Trash", emoji: "🗑️" },
  { name: "homework", label: "Homework", emoji: "📚" },
  { name: "teeth", label: "Brush Teeth", emoji: "🪥" },
  { name: "bed", label: "Make Bed", emoji: "🛏️" },
  { name: "vacuum", label: "Vacuum", emoji: "🧹" },
  { name: "feed-pet", label: "Feed Pet", emoji: "🐾" },
  { name: "star", label: "Other", emoji: "⭐" },
];

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

export function AddChoreModal({ isOpen, onClose, onAdd }: AddChoreModalProps) {
  const [title, setTitle] = useState("");
  const [iconName, setIconName] = useState("star");
  const [points, setPoints] = useState(1);
  const [recurrence, setRecurrence] = useState("DAILY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setTitle("");
    setIconName("star");
    setPoints(1);
    setRecurrence("DAILY");
    setError("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Chore name is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), iconName, points, recurrence }),
      });
      if (!res.ok) throw new Error("Failed to create chore");
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
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add New Chore">
      <div className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="text-sm text-slate-400 mb-1 block">Chore name</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Make your bed"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Icon</label>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon.name}
                onClick={() => setIconName(icon.name)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-all
                  ${iconName === icon.name
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }
                `}
                title={icon.label}
              >
                <span className="text-2xl">{icon.emoji}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Points + Recurrence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Points</label>
            <select
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              {[1, 2, 3, 5].map((p) => (
                <option key={p} value={p}>{p} point{p !== 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Schedule</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="DAILY">Every day</option>
              <option value="WEEKDAYS">Weekdays</option>
              <option value="WEEKENDS">Weekends</option>
              <option value="WEEKLY">Once a week</option>
            </select>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={() => { reset(); onClose(); }} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            {loading ? "Saving…" : "Add Chore"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
