"use client";

import React, { useMemo } from "react";
import { useAppState } from "@/store/useAppState";
import { hasPerfectDayEntry } from "@/lib/ledger";
import { isAllTasksDoneForDate } from "@/lib/tasks";

/**
 * StatsBar renders the celebratory Perfect Day achievement banner
 * on the main screen when all daily tasks are completed and the +50 bonus is awarded.
 * The core game stats pills now live persistently in the sticky Topbar Header.
 */
export default function StatsBar() {
  const { todayTasks, ledger, today } = useAppState();

  // Check if today qualifies for and has been awarded the Perfect Day bonus
  const isPerfectDay = useMemo(() => {
    if (!today) return false;
    const allDone = isAllTasksDoneForDate(todayTasks, today);
    const bonusAwarded = hasPerfectDayEntry(ledger, today);
    return allDone && bonusAwarded;
  }, [todayTasks, ledger, today]);

  if (!isPerfectDay) return null;

  return (
    <section className="flex flex-col gap-3" aria-label="Achievements">
      {/* Perfect Day Celebration Banner per design_todo.md */}
      <div
        role="status"
        aria-live="polite"
        className="rounded-[20px] border border-carbon bg-sunburst p-4 sm:p-5 flex items-center justify-between gap-3 animate-bounce"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-carbon bg-paper-white flex items-center justify-center text-xl select-none">
            ⭐
          </div>
          <div>
            <span className="block text-xs font-bold uppercase tracking-[0.032em] text-carbon">
              Perfect Day Achieved!
            </span>
            <p className="text-xs text-neutral-800 font-medium">
              You completed every task for today. One-time bonus +50 pts awarded!
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center px-3 py-1 rounded-full border border-carbon bg-paper-white text-xs font-bold uppercase tracking-[0.032em] text-carbon">
          +50 BONUS
        </div>
      </div>
    </section>
  );
}
