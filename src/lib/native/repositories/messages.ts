import { query, run, uid, now } from "../db";

interface MessageRow {
  id: string; content: string; author_id: string | null; color: string;
  is_pinned: number; expires_at: string | null; created_at: string; updated_at: string;
  author_name?: string; author_emoji?: string; author_color?: string;
}

function toMessage(r: MessageRow) {
  return {
    id: r.id, content: r.content, authorId: r.author_id, color: r.color,
    isPinned: !!r.is_pinned, expiresAt: r.expires_at,
    createdAt: r.created_at, updatedAt: r.updated_at,
    author: r.author_id
      ? { id: r.author_id, name: r.author_name ?? "Unknown",
          avatarEmoji: r.author_emoji ?? "👤", color: r.author_color ?? "#6366f1" }
      : null,
  };
}

export async function getAll() {
  const rows = await query<MessageRow>(
    `SELECT m.*, fm.name as author_name, fm.avatar_emoji as author_emoji, fm.color as author_color
     FROM messages m LEFT JOIN family_members fm ON m.author_id = fm.id
     WHERE m.expires_at IS NULL OR m.expires_at > datetime('now')
     ORDER BY m.is_pinned DESC, m.created_at DESC`
  );
  return rows.map(toMessage);
}

export async function create(data: {
  content: string; authorId?: string; color?: string;
  isPinned?: boolean; expiresInDays?: number;
}) {
  const id = uid(); const ts = now();
  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 86400000).toISOString()
    : null;
  await run(
    `INSERT INTO messages (id, content, author_id, color, is_pinned, expires_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.content, data.authorId ?? null, data.color ?? "#fef08a",
     data.isPinned ? 1 : 0, expiresAt, ts, ts]
  );
  const rows = await query<MessageRow>(
    `SELECT m.*, fm.name as author_name, fm.avatar_emoji as author_emoji, fm.color as author_color
     FROM messages m LEFT JOIN family_members fm ON m.author_id = fm.id WHERE m.id = ?`,
    [id]
  );
  return toMessage(rows[0]);
}

export async function update(id: string, data: Partial<{ isPinned: boolean; content: string; color: string }>) {
  const sets: string[] = []; const params: unknown[] = [];
  if (data.isPinned !== undefined) { sets.push("is_pinned = ?"); params.push(data.isPinned ? 1 : 0); }
  if (data.content !== undefined)  { sets.push("content = ?");   params.push(data.content); }
  if (data.color !== undefined)    { sets.push("color = ?");     params.push(data.color); }
  sets.push("updated_at = ?"); params.push(now()); params.push(id);
  await run(`UPDATE messages SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function remove(id: string) {
  await run("DELETE FROM messages WHERE id = ?", [id]);
}
