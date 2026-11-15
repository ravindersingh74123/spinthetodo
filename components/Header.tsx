"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/store/useAppState";

export default function Header() {
  const pathname = usePathname();
  const {
    activeTask,
    totalPoints,
    todayPoints,
    currentStreak,
    longestStreak,
    pendingPenaltiesTomorrow,
  } = useAppState();

  const isToday = pathname === "/";
  const isCalendar = pathname === "/calendar";
  const isAnalytics = pathname === "/analytics";

  const totalTomorrowPenalty = useMemo(() => {
    return pendingPenaltiesTomorrow.reduce((sum, p) => sum + Math.abs(p.delta), 0);
  }, [pendingPenaltiesTomorrow]);

  return (
    <header className="w-full border-b border-carbon bg-paper-white sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Brand Logo Mark */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus:ring-2 focus:ring-carbon rounded-full"
            aria-label="Spin the Wheel Todo Home"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-carbon bg-paper-white flex items-center justify-center font-bold text-base sm:text-lg text-carbon transition-transform group-hover:scale-105">
              S
            </div>
            <span className="hidden sm:inline font-bold tracking-[0.032em] text-xs sm:text-sm uppercase text-carbon select-none">
              SPIN TODO
            </span>
          </Link>
        </div>

        {/* Center: Navigation Pills & Active Task Alert */}
        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold tracking-[0.032em] uppercase rounded-full border border-carbon transition-all ${
                isToday
                  ? "bg-carbon text-paper-white shadow-none"
                  : "bg-paper-white text-carbon hover:bg-soft-mist"
              }`}
            >
              Today
            </Link>
            <Link
              href="/calendar"
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold tracking-[0.032em] uppercase rounded-full border border-carbon transition-all ${
                isCalendar
                  ? "bg-carbon text-paper-white shadow-none"
                  : "bg-paper-white text-carbon hover:bg-soft-mist"
              }`}
            >
              Calendar
            </Link>
            <Link
              href="/analytics"
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs font-bold tracking-[0.032em] uppercase rounded-full border border-carbon transition-all ${
                isAnalytics
                  ? "bg-carbon text-paper-white shadow-none"
                  : "bg-paper-white text-carbon hover:bg-soft-mist"
              }`}
            >
              Analytics
            </Link>
          </nav>

          {/* Active Task Indicator when away from Today page */}
          {activeTask && !isToday && (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-carbon bg-sunburst text-carbon text-xs font-bold uppercase tracking-[0.032em] hover:brightness-95 transition-all animate-pulse"
              title="Active task in progress - click to return"
            >
              <span>⏱️</span>
              <span className="max-w-[100px] truncate hidden md:inline">
                {activeTask.name}
              </span>
              <span>Active →</span>
            </Link>
          )}
        </div>

        {/* Right: Game Stats in Topbar */}
        <div
          role="region"
          aria-label="Game statistics"
          className="flex items-center gap-1.5 sm:gap-2.5 shrink-0"
        >
          {/* Total Points (Supports negative totals) */}
          <div
            className={`px-3 py-1.5 rounded-full border border-carbon text-xs font-bold flex items-center gap-1.5 select-none shadow-none ${
              totalPoints < 0
                ? "bg-ember text-paper-white"
                : "bg-sunburst text-carbon"
            }`}
            title="Lifetime net points ledger total"
          >
            <span>🪙</span>
            <span className={totalPoints < 0 ? "text-paper-white/80" : "text-neutral-800"}>
              Total:
            </span>
            <span className="font-mono font-extrabold">
              {totalPoints > 0 ? `+${totalPoints}` : totalPoints}
            </span>
          </div>

          {/* Today's Net Points */}
          <div
            className="px-3 py-1.5 rounded-full border border-carbon bg-sky-wash text-xs font-bold items-center gap-1.5 text-carbon select-none shadow-none hidden md:flex"
            title="Today's net points"
          >
            <span>📅</span>
            <span className="text-neutral-800">Today:</span>
            <span className="font-mono font-extrabold">
              {todayPoints >= 0 ? `+${todayPoints}` : todayPoints} pts
            </span>
          </div>

          {/* Current Streak */}
          <div
            className="px-3 py-1.5 rounded-full border border-carbon bg-mint-pop text-xs font-bold flex items-center gap-1.5 text-carbon select-none shadow-none"
            title="Current streak (consecutive days with completed tasks)"
          >
            <span>🔥</span>
            <span className="text-neutral-800 hidden sm:inline">Streak:</span>
            <span className="font-mono font-extrabold">
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Longest Streak */}
          <div
            className="px-3 py-1.5 rounded-full border border-carbon bg-lavender text-xs font-bold items-center gap-1.5 text-carbon select-none shadow-none hidden lg:flex"
            title="Longest streak in history"
          >
            <span>🏆</span>
            <span className="text-neutral-800">Best:</span>
            <span className="font-mono font-extrabold">{longestStreak}d</span>
          </div>

          {/* Pending Tomorrow Penalty Alert */}
          {totalTomorrowPenalty > 0 && (
            <div
              className="px-3 py-1.5 rounded-full border border-carbon bg-ember text-paper-white text-xs font-bold flex items-center gap-1.5 animate-pulse select-none shadow-none"
              title="Penalty scheduled to deduct from tomorrow's points"
            >
              <span>⚠️</span>
              <span className="font-mono font-extrabold">-{totalTomorrowPenalty}</span>
              <span className="text-[10px] hidden sm:inline">tomorrow</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
