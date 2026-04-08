"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface Member {
  id: string;
  displayName: string;
  avatarEmoji: string;
  color: string;
}

interface NewMessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPosted: () => void;
}

const NOTE_COLORS = [
  "#fef08a", // yellow
  "#86efac", // green
  "#93c5fd", // blue
  "#f9a8d4", // pink
  "#fed7aa", // orange
  "#c4b5fd", // purple
  "#99f6e4", // teal
  "#fca5a5", // red
];

const MAX_CHARS = 280;

export function NewMessageForm({ isOpen, onClose, onPosted }: NewMessageFormProps) {
  const [content, setContent] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [isPinned, setIsPinned] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/members")
        .then((r) => r.json())
        .then((data: Member[]) => {
          setMembers(data);
          if (data.length > 0 && !authorId) setAuthorId(data[0].id);
        })
        .catch(() => null);
    }
  }, [isOpen]);

  async function handlePost() {
    if (!content.trim() || !authorId) return;
    setSaving(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), authorId, color, isPinned }),
      });
      onPosted();
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setContent("");
    setIsPinned(false);
    setColor(NOTE_COLORS[0]);
    onClose();
  }

  const remaining = MAX_CHARS - content.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New message">
      <div className="space-y-4">
        {/* Author picker */}
        <div>
          <label className="text-slate-400 text-sm block mb-2">From</label>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setAuthorId(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  authorId === m.id
                    ? "border-indigo-500 bg-indigo-900/30"
                    : "border-slate-600 bg-slate-700 hover:border-slate-500"
                }`}
              >
                <span>{m.avatarEmoji}</span>
                <span className="text-white text-sm">{m.displayName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-slate-400 text-sm block mb-2">Colour</label>
          <div className="flex gap-2 flex-wrap">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-lg transition-transform ${
                  color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-800" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder="What's the message?"
            rows={4}
            className="w-full px-4 py-3 bg-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className={`text-xs text-right mt-1 ${remaining < 20 ? "text-amber-400" : "text-slate-500"}`}>
            {remaining} left
          </p>
        </div>

        {/* Pin toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPinned((p) => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
              isPinned
                ? "border-amber-500 bg-amber-900/30 text-amber-300"
                : "border-slate-600 text-slate-400 hover:border-slate-500"
            }`}
          >
            📌 {isPinned ? "Pinned" : "Pin this note"}
          </button>
        </div>

        <Button
          onClick={handlePost}
          disabled={!content.trim() || !authorId || saving}
          className="w-full"
        >
          {saving ? "Posting…" : "Post message"}
        </Button>
      </div>
    </Modal>
  );
}
