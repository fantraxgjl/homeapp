import { startOfDay, endOfDay } from "date-fns";

/**
 * Returns whether a chore assignment is active on a given day of week,
 * based on the chore's recurrence setting.
 */
export function isChoreActiveToday(
  recurrence: string,
  assignmentDayOfWeek: number | null,
  todayDow: number // 0=Sun, 1=Mon ... 6=Sat
): boolean {
  switch (recurrence) {
    case "DAILY":
      return true;
    case "WEEKLY":
      // Active only on the assigned day of week
      return assignmentDayOfWeek === todayDow;
    case "WEEKDAYS":
      return todayDow >= 1 && todayDow <= 5;
    case "WEEKENDS":
      return todayDow === 0 || todayDow === 6;
    default:
      return true;
  }
}

export function todayRange() {
  const now = new Date();
  return { gte: startOfDay(now), lte: endOfDay(now) };
}
