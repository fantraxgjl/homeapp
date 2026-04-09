import { query, run, uid, now } from "../db";

interface MemberRow {
  id: string; name: string; display_name: string; role: string;
  color: string; avatar_emoji: string; calendar_id: string | null;
  created_at: string; updated_at: string;
}

function toMember(r: MemberRow) {
  return {
    id: r.id, name: r.name, displayName: r.display_name, role: r.role,
    color: r.color, avatarEmoji: r.avatar_emoji, calendarId: r.calendar_id,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export async function getAll() {
  const rows = await query<MemberRow>("SELECT * FROM family_members ORDER BY created_at ASC");
  return rows.map(toMember);
}

export async function getById(id: string) {
  const rows = await query<MemberRow>("SELECT * FROM family_members WHERE id = ?", [id]);
  return rows[0] ? toMember(rows[0]) : null;
}

export async function create(data: {
  name: string; displayName?: string; role?: string;
  color?: string; avatarEmoji?: string;
}) {
  const id = uid(); const ts = now();
  await run(
    `INSERT INTO family_members (id, name, display_name, role, color, avatar_emoji, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.displayName ?? data.name, data.role ?? "CHILD",
     data.color ?? "#6366f1", data.avatarEmoji ?? "👤", ts, ts]
  );
  return (await getById(id))!;
}

export async function update(id: string, data: Partial<{
  name: string; displayName: string; role: string; color: string; avatarEmoji: string;
}>) {
  const sets: string[] = []; const params: unknown[] = [];
  if (data.name !== undefined)        { sets.push("name = ?");         params.push(data.name); }
  if (data.displayName !== undefined) { sets.push("display_name = ?"); params.push(data.displayName); }
  if (data.role !== undefined)        { sets.push("role = ?");         params.push(data.role); }
  if (data.color !== undefined)       { sets.push("color = ?");        params.push(data.color); }
  if (data.avatarEmoji !== undefined) { sets.push("avatar_emoji = ?"); params.push(data.avatarEmoji); }
  sets.push("updated_at = ?"); params.push(now()); params.push(id);
  await run(`UPDATE family_members SET ${sets.join(", ")} WHERE id = ?`, params);
  return (await getById(id))!;
}

export async function remove(id: string) {
  await run("DELETE FROM family_members WHERE id = ?", [id]);
}

export async function getPoints(memberId: string) {
  const rows = await query<{ total: number }>(
    `SELECT COALESCE(SUM(points_earned), 0) as total
     FROM chore_completions
     WHERE member_id = ? AND completed_at >= date('now', 'start of week', 'weekday 1', '-7 days')`,
    [memberId]
  );
  return { weeklyPoints: rows[0]?.total ?? 0 };
}
