"use client";

import { useState, useCallback, useEffect } from "react";
import { ChoreCard } from "./ChoreCard";
import { AddChoreModal } from "./AddChoreModal";
import { AddMemberModal } from "./AddMemberModal";
import { RewardMeter } from "./RewardMeter";
import { Button } from "@/components/ui/Button";
import type { FamilyMember } from "@/types/members";

interface ChoreWithAssignees {
  id: string;
  title: string;
  iconName: string;
  points: number;
  recurrence: string;
  assignments: Array<{
    id: string;
    memberId: string;
    member: { id: string; displayName: string; avatarEmoji: string; color: string };
  }>;
}

interface MemberPoints {
  weeklyPoints: number;
  todayCount: number;
}

export function ChoreBoard() {
  const [chores, setChores] = useState<ChoreWithAssignees[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [memberPoints, setMemberPoints] = useState<Record<string, MemberPoints>>({});
  const [showAddChore, setShowAddChore] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [assigning, setAssigning] = useState<{ choreId: string; choreTitle: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [choreRes, memberRes] = await Promise.all([
        fetch("/api/chores"),
        fetch("/api/members"),
      ]);
      const choreData = await choreRes.json();
      const memberData = await memberRes.json();
      setChores(choreData.chores ?? []);
      setMembers(memberData);

      // Load points for each member
      const pointsData: Record<string, MemberPoints> = {};
      await Promise.all(
        memberData.map(async (m: FamilyMember) => {
          const res = await fetch(`/api/members/${m.id}/points`);
          pointsData[m.id] = await res.json();
        })
      );
      setMemberPoints(pointsData);
    } catch (err) {
      console.error("Failed to load chore data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteChore = async (id: string) => {
    if (!confirm("Archive this chore?")) return;
    await fetch(`/api/chores/${id}`, { method: "DELETE" });
    loadData();
  };

  const handleAssign = async (choreId: string, memberId: string) => {
    await fetch(`/api/chores/${choreId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setAssigning(null);
    loadData();
  };

  const handleUnassign = async (choreId: string, assignmentId: string) => {
    await fetch(`/api/chores/${choreId}/assign/${assignmentId}`, {
      method: "DELETE",
    });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const children = members.filter((m) => m.role === "CHILD");

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chore Management</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowAddMember(true)}>
            + Member
          </Button>
          <Button size="sm" onClick={() => setShowAddChore(true)}>
            + Chore
          </Button>
        </div>
      </div>

      {/* Member reward meters */}
      {children.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            This Week&apos;s Progress
          </h2>
          <div className="flex gap-8 flex-wrap">
            {children.map((m) => (
              <RewardMeter
                key={m.id}
                memberName={m.displayName}
                memberColor={m.color}
                memberEmoji={m.avatarEmoji}
                points={memberPoints[m.id]?.weeklyPoints ?? 0}
                goal={10}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chore list */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          All Chores ({chores.length})
        </h2>
        {chores.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-8 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-slate-400">No chores yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chores.map((chore) => (
              <div key={chore.id}>
                <ChoreCard
                  title={chore.title}
                  iconName={chore.iconName}
                  points={chore.points}
                  recurrence={chore.recurrence}
                  assignees={chore.assignments.map((a) => a.member)}
                  onEdit={() => setAssigning({ choreId: chore.id, choreTitle: chore.title })}
                  onDelete={() => handleDeleteChore(chore.id)}
                />

                {/* Inline assignment panel when editing */}
                {assigning?.choreId === chore.id && (
                  <div className="mt-1 ml-4 bg-slate-700/50 rounded-xl p-3 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-400 self-center">Assign to:</span>
                    {members.map((m) => {
                      const existing = chore.assignments.find(
                        (a) => a.memberId === m.id
                      );
                      return (
                        <button
                          key={m.id}
                          onClick={() =>
                            existing
                              ? handleUnassign(chore.id, existing.id)
                              : handleAssign(chore.id, m.id)
                          }
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                            ${existing
                              ? "text-white"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }
                          `}
                          style={
                            existing
                              ? { backgroundColor: m.color + "55", border: `1px solid ${m.color}` }
                              : undefined
                          }
                        >
                          {m.avatarEmoji} {m.displayName}
                          {existing && <span className="text-xs opacity-70">✕</span>}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setAssigning(null)}
                      className="ml-auto text-xs text-slate-500 hover:text-slate-300"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members list */}
      {members.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Family Members
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3 border border-slate-700"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: m.color + "33", border: `2px solid ${m.color}` }}
                >
                  {m.avatarEmoji}
                </div>
                <div>
                  <p className="font-semibold text-white">{m.displayName}</p>
                  <p className="text-xs text-slate-400 capitalize">{m.role.toLowerCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddChoreModal
        isOpen={showAddChore}
        onClose={() => setShowAddChore(false)}
        onAdd={loadData}
      />
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={loadData}
      />
    </div>
  );
}
