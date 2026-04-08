export type MemberRole = "ADULT" | "CHILD";

export interface FamilyMember {
  id: string;
  name: string;
  displayName: string;
  role: MemberRole;
  color: string;
  avatarEmoji: string;
  calendarId: string | null;
  createdAt: string;
}
