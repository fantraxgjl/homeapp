import { query, run, uid, now } from "../db";

interface ChoreRow {
  id: string; title: string; icon_name: string; points: number;
  recurrence: string; is_active: number; created_at: string; updated_at: string;
}
interface AssignmentRow {
  id: string; chore_id: string; member_id: string; day_of_week: number | null; created_at: string;
  member_name?: string; member_display_name?: string; member_color?: string; member_emoji?: string;
}
interface CompletionRow {
  id: string; chore_id: string; member_id: string; points_earned: number; completed_at: string;
  member_name?: string; member_color?: string;
}

function toChore(r: ChoreRow) {
  return {
    id: r.id, title: r.title, iconName: r.icon_name, points: r.points,
    recurrence: r.recurrence, isActive: !!r.is_active,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export async function getAll() {
  const chores = await query<ChoreRow>("SELECT * FROM chores ORDER BY created_at ASC");
  const assignments = await query<AssignmentRow>(
    `SELECT ca.*, fm.name as member_name, fm.display_name as member_display_name,
            fm.color as member_color, fm.avatar_emoji as member_emoji
     FROM chore_assignments ca JOIN family_members fm ON ca.member_id = fm.id`
  );
  const today = new Date().toISOString().slice(0, 10);
  const completions = await query<CompletionRow>(
    `SELECT cc.*, fm.name as member_name, fm.color as member_color
     FROM chore_completions cc JOIN family_members fm ON cc.member_id = fm.id
     WHERE DATE(cc.completed_at) = ?`,
    [today]
  );

  return chores.map((c) => ({
    ...toChore(c),
    assignments: assignments
      .filter((a) => a.chore_id === c.id)
      .map((a) => ({
        id: a.id, choreId: a.chore_id, memberId: a.member_id,
        dayOfWeek: a.day_of_week,
        member: { id: a.member_id, name: a.member_name, displayName: a.member_display_name,
                  color: a.member_color, avatarEmoji: a.member_emoji },
      })),
    completions: completions
      .filter((cc) => cc.chore_id === c.id)
      .map((cc) => ({
        id: cc.id, choreId: cc.chore_id, memberId: cc.member_id,
        pointsEarned: cc.points_earned, completedAt: cc.completed_at,
        member: { id: cc.member_id, name: cc.member_name, color: cc.member_color },
      })),
  }));
}

export async function create(data: { title: string; iconName?: string; points?: number; recurrence?: string }) {
  const id = uid(); const ts = now();
  await run(
    `INSERT INTO chores (id, title, icon_name, points, recurrence, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, data.title, data.iconName ?? "star", data.points ?? 10, data.recurrence ?? "DAILY", ts, ts]
  );
  return (await getAll()).find((c) => c.id === id)!;
}

export async function update(id: string, data: Partial<{ title: string; iconName: string; points: number; recurrence: string; isActive: boolean }>) {
  const sets: string[] = []; const params: unknown[] = [];
  if (data.title !== undefined)      { sets.push("title = ?");      params.push(data.title); }
  if (data.iconName !== undefined)   { sets.push("icon_name = ?");  params.push(data.iconName); }
  if (data.points !== undefined)     { sets.push("points = ?");     params.push(data.points); }
  if (data.recurrence !== undefined) { sets.push("recurrence = ?"); params.push(data.recurrence); }
  if (data.isActive !== undefined)   { sets.push("is_active = ?");  params.push(data.isActive ? 1 : 0); }
  sets.push("updated_at = ?"); params.push(now()); params.push(id);
  await run(`UPDATE chores SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function remove(id: string) {
  await run("DELETE FROM chores WHERE id = ?", [id]);
}

export async function complete(choreId: string, memberId: string) {
  const chores = await query<ChoreRow>("SELECT points FROM chores WHERE id = ?", [choreId]);
  const points = chores[0]?.points ?? 0;
  const id = uid();
  await run(
    `INSERT INTO chore_completions (id, chore_id, member_id, points_earned, completed_at) VALUES (?, ?, ?, ?, ?)`,
    [id, choreId, memberId, points, now()]
  );
  return { id, choreId, memberId, pointsEarned: points, completedAt: new Date().toISOString() };
}

export async function getAssignments(choreId: string) {
  return query<AssignmentRow>(
    `SELECT ca.*, fm.name as member_name, fm.color as member_color
     FROM chore_assignments ca JOIN family_members fm ON ca.member_id = fm.id
     WHERE ca.chore_id = ?`,
    [choreId]
  );
}

export async function addAssignment(choreId: string, memberId: string, dayOfWeek?: number) {
  const id = uid();
  await run(
    `INSERT OR IGNORE INTO chore_assignments (id, chore_id, member_id, day_of_week, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, choreId, memberId, dayOfWeek ?? null, now()]
  );
}

export async function removeAssignment(assignmentId: string) {
  await run("DELETE FROM chore_assignments WHERE id = ?", [assignmentId]);
}
