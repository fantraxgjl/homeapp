"use client";

import { useState, useEffect, useCallback } from "react";
import { ChoreCompletionButton } from "./ChoreCompletionButton";
import { RewardMeter } from "./RewardMeter";
import type { FamilyMember } from "@/types/members";

interface TodayChoreItem {
  choreId: string;
  title: string;
  iconName: string;
  points: number;
  recurrence: string;
  assignmentId: string;
  dayOfWeek: number | null;
  memberId: string;
  memberName: string;
  memberEmoji: string;
  memberColor: string;
  isCompleted: boolean;
}

interface MemberSection {
  member: FamilyMember;
  chores: TodayChoreItem[];
  weeklyPoints: number;
}

export function KidsChoreView() {
  const [sections, setSections] = useState<MemberSection[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChores = useCallback(async () => {
    try {
      const [choresRes, membersRes] = await Promise.all([
        fetch("/api/chores?forToday=1"),
        fetch("/api/members"),
      ]);
      const [chores, members]: [TodayChoreItem[], FamilyMember[]] =
        await Promise.all([choresRes.json(), membersRes.json()]);

      const children = members.filter((m) => m.role === "CHILD");

      const sectionsData: MemberSection[] = await Promise.all(
        children.map(async (member) => {
          const memberChores = chores.filter((c) => c.memberId === member.id);
          let weeklyPoints = 0;
          try {
            const pRes = await fetch(`/api/members/${member.id}/points`);
            const p = await pRes.json();
            weeklyPoints = p.weeklyPoints ?? 0;
          } catch {}
          return { member, chores: memberChores, weeklyPoints };
        })
      );

      setSections(sectionsData);
    } catch (err) {
      console.error("Failed to load chores", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChores();
  }, [loadChores]);

  const handleComplete = useCallback(
    (memberId: string, pointsEarned: number) => {
      setSections((prev) =>
        prev.map((s) =>
          s.member.id === memberId
            ? { ...s, weeklyPoints: s.weeklyPoints + pointsEarned }
            : s
        )
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-5xl">👋</p>
        <p className="text-slate-400 text-center max-w-xs">
          No chores set up yet. Ask a parent to add chores in the dashboard!
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full overflow-auto dashboard-scroll">
      {sections.map(({ member, chores, weeklyPoints }) => (
        <div key={member.id} className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Member header with reward meter */}
          <div className="flex items-center gap-3 bg-slate-800 rounded-2xl p-4">
            <RewardMeter
              memberName={member.displayName}
              memberColor={member.color}
              memberEmoji={member.avatarEmoji}
              points={weeklyPoints}
              goal={10}
              size="sm"
            />
            <div>
              <p className="font-bold text-white text-lg">{member.displayName}</p>
              <p className="text-xs text-slate-400">
                {chores.filter((c) => c.isCompleted).length}/{chores.length} done today
              </p>
            </div>
          </div>

          {/* Chores */}
          {chores.length === 0 ? (
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center text-slate-500 text-sm">
              No chores today 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {chores.map((chore) => (
                <ChoreCompletionButton
                  key={`${chore.choreId}-${chore.memberId}`}
                  choreId={chore.choreId}
                  choreTitle={chore.title}
                  iconName={chore.iconName}
                  memberId={chore.memberId}
                  memberEmoji={chore.memberEmoji}
                  memberColor={chore.memberColor}
                  isCompleted={chore.isCompleted}
                  points={chore.points}
                  onComplete={(pts) => handleComplete(member.id, pts)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
