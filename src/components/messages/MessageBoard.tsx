"use client";

import useSWR from "swr";
import { useState } from "react";
import { MessageCard } from "./MessageCard";
import { NewMessageForm } from "./NewMessageForm";
import { Button } from "@/components/ui/Button";

interface Author {
  id: string;
  displayName: string;
  avatarEmoji: string;
  color: string;
}

interface Message {
  id: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  expiresAt: string | null;
  author: Author;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MessageBoardProps {
  compact?: boolean; // dashboard strip mode (horizontal scroll, no title bar)
}

export function MessageBoard({ compact = false }: MessageBoardProps) {
  const [formOpen, setFormOpen] = useState(false);
  const { data: messages, mutate } = useSWR<Message[]>("/api/messages", fetcher, {
    refreshInterval: 60_000,
  });

  async function handleTogglePin(id: string, pinned: boolean) {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: pinned }),
    });
    mutate();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/messages/${id}`, { method: "DELETE" });
    mutate();
  }

  if (compact) {
    // Horizontal scrolling strip for the dashboard
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Messages</h3>
          <button
            onClick={() => setFormOpen(true)}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            + New
          </button>
        </div>

        {!messages || messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setFormOpen(true)}
              className="text-slate-600 text-sm hover:text-slate-400 transition-colors"
            >
              Post the first message →
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
            {messages.map((msg) => (
              <div key={msg.id} className="w-48 shrink-0">
                <MessageCard
                  {...msg}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}

        <NewMessageForm
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onPosted={() => { setFormOpen(false); mutate(); }}
        />
      </div>
    );
  }

  // Full-page grid layout
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">💬 Messages</h1>
        <Button onClick={() => setFormOpen(true)}>+ New message</Button>
      </div>

      {!messages ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-700/50 animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-slate-400">No messages yet</p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Post the first one →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {messages.map((msg) => (
            <MessageCard
              key={msg.id}
              {...msg}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NewMessageForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onPosted={() => { setFormOpen(false); mutate(); }}
      />
    </div>
  );
}
