export interface CalendarEvent {
  id: string;
  googleId: string;
  calendarId: string;
  feedId?: string;
  feedName?: string;
  memberId: string | null;
  memberName?: string | null;
  memberColor?: string | null;
  memberEmoji?: string | null;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isAllDay: boolean;
  color: string;
  location: string | null;
}

export interface CalendarFeed {
  id: string;
  name: string;
  icalUrl: string;
  color: string;
  memberId: string | null;
  isActive: boolean;
  lastSync: string | null;
  createdAt: string;
  member?: {
    id: string;
    displayName: string;
    avatarEmoji: string;
    color: string;
  } | null;
}
