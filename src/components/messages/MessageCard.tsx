"use client";

import { formatDistanceToNow } from "date-fns";

interface Author {
  id: string;
  displayName: string;
  avatarEmoji: string;
  color: string;
}

interface MessageCardProps {
  id: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  author: Author;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onDelete?: (id: string) => void;
}

// Derive readable text color from background hex
function textColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1e293b" : "#f8fafc";
}

export function MessageCard({
  id,
  content,
  color,
  isPinned,
  createdAt,
  author,
  onTogglePin,
  onDelete,
}: MessageCardProps) {
  const fg = textColor(color);

  return (
    <div
      className="relative rounded-2xl p-4 shadow-md flex flex-col gap-2 min-h-[120px] group"
      style={{ backgroundColor: color }}
    >
      {/* Pin indicator */}
      {isPinned && (
        <span className="absolute -top-2 left-4 text-lg" title="Pinned">📌</span>
      )}

      {/* Content */}
      <p
        className="text-sm leading-relaxed flex-1 whitespace-pre-wrap break-words"
        style={{ color: fg }}
      >
        {content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{author.avatarEmoji}</span>
          <span className="text-xs font-medium opacity-70" style={{ color: fg }}>
            {author.displayName}
          </span>
        </div>
        <span className="text-xs opacity-50" style={{ color: fg }}>
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Hover actions */}
      {(onTogglePin || onDelete) && (
        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
          {onTogglePin && (
            <button
              onClick={() => onTogglePin(id, !isPinned)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors text-sm"
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? "📍" : "📌"}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/20 hover:bg-red-500/50 transition-colors text-sm"
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
