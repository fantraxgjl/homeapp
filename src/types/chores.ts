export type Recurrence = "DAILY" | "WEEKLY" | "WEEKDAYS" | "WEEKENDS";

export interface Chore {
  id: string;
  title: string;
  iconName: string;
  points: number;
  recurrence: Recurrence;
  isActive: boolean;
  createdAt: string;
}

export interface ChoreAssignment {
  id: string;
  choreId: string;
  memberId: string;
  dayOfWeek: number | null;
  createdAt: string;
}

export interface ChoreWithAssignments extends Chore {
  assignments: Array<
    ChoreAssignment & {
      member: { id: string; displayName: string; avatarEmoji: string; color: string };
    }
  >;
}

export interface TodayChore {
  chore: Chore;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  memberColor: string;
  isCompleted: boolean;
  completionId: string | null;
}
