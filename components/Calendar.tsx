"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/store/useAppState";
import {
  todayLocal,
  getDaysInMonth,
  formatDate,
} from "@/lib/date";
import { isDateCounted } from "@/lib/streak";
import { hasPerfectDayEntry, penaltiesForDate } from "@/lib/ledger";
import { isAllTasksDoneForDate } from "@/lib/tasks";

export type DayActivityType = "perfect_day" | "some_completed" | "penalty_only" | "none";

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export default function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const { tasks, ledger, today } = useAppState();

  // Navigation year & month (1-indexed: 1 = Jan, 12 = Dec)
  const [viewYearMonth, setViewYearMonth] = useState<{ year: number; month: number } | null>(null);

  // Derive current display year & month safely without unstable new Date() during SSR
  const { currentYear, currentMonth } = useMemo(() => {
    if (viewYearMonth) {
      return { currentYear: viewYearMonth.year, currentMonth: viewYearMonth.month };
    }
    const target = selectedDate || today;
    if (target && target.includes("-")) {
      const parts = target.split("-").map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { currentYear: parts[0], currentMonth: parts[1] };
      }
    }
    // Safe deterministic fallback for SSR prerender
    return { currentYear: 2026, currentMonth: 1 };
  }, [viewYearMonth, selectedDate, today]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setViewYearMonth({ year: currentYear - 1, month: 12 });
    } else {
      setViewYearMonth({ year: currentYear, month: currentMonth - 1 });
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setViewYearMonth({ year: currentYear + 1, month: 1 });
    } else {
      setViewYearMonth({ year: currentYear, month: currentMonth + 1 });
    }
  };

  const handleGoToToday = () => {
    const now = today || todayLocal();
    const parts = now.split("-").map(Number);
    setViewYearMonth({ year: parts[0], month: parts[1] });
    onSelectDate(now);
  };

  // Month grid calculations
  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentYear, currentMonth]);

  // Leading empty slots (Monday = 0 ... Sunday = 6)
  const leadingBlanks = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    return (firstDay + 6) % 7;
  }, [currentYear, currentMonth]);

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Trailing slots to complete the final week row
  const trailingBlanks = useMemo(() => {
    const totalSlots = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
    return totalSlots - (leadingBlanks + daysInMonth);
  }, [leadingBlanks, daysInMonth]);

  // Helper to get activity type for any date string
  const getDayActivity = (dateStr: string): DayActivityType => {
    const isPerfect =
      isAllTasksDoneForDate(tasks, dateStr) || hasPerfectDayEntry(ledger, dateStr);
    if (isPerfect) return "perfect_day";

    const hasCompleted = isDateCounted(tasks, dateStr);
    if (hasCompleted) return "some_completed";

    const hasPenalties = penaltiesForDate(ledger, dateStr).length > 0;
    if (hasPenalties) return "penalty_only";

    return "none";
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-[20px] border border-carbon bg-paper-white p-6 sm:p-7">
      {/* Month Header & Segmented Pill Navigation */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-carbon gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-carbon">
            {monthName}
          </h2>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.032em]">
            History & Streaks
          </span>
        </div>

        {/* Pill Nav Control */}
        <div className="flex items-center gap-1 border border-carbon rounded-full p-1 bg-paper-white">
          <button
            type="button"
            onClick={handleGoToToday}
            className="px-3 py-1 text-xs font-bold uppercase tracking-[0.032em] rounded-full text-carbon hover:bg-soft-mist transition-colors"
          >
            Today
          </button>
          <div className="w-[1px] h-4 bg-carbon/30" />
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-7 h-7 rounded-full text-carbon hover:bg-soft-mist flex items-center justify-center text-xs font-bold transition-colors shrink-0"
          >
            ←
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-7 h-7 rounded-full text-carbon hover:bg-soft-mist flex items-center justify-center text-xs font-bold transition-colors shrink-0"
          >
            →
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center mb-2">
        {weekDays.map((day) => (
          <span
            key={day}
            className="text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-500 py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Leading empty slots */}
        {Array.from({ length: leadingBlanks }).map((_, idx) => (
          <div key={`blank-${idx}`} className="min-h-[50px] sm:min-h-[58px] rounded-[14px] bg-transparent" />
        ))}

        {/* Days of Month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = formatDate(new Date(currentYear, currentMonth - 1, dayNum));
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const activity = getDayActivity(dateStr);
          const isStreakDay = isDateCounted(tasks, dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`min-h-[50px] sm:min-h-[58px] p-2 rounded-[14px] border transition-all flex flex-col justify-between items-center text-center relative select-none ${
                isSelected
                  ? "border-carbon bg-carbon text-paper-white shadow-none"
                  : isToday
                  ? "border-carbon bg-sky-wash text-carbon font-extrabold"
                  : "border-carbon/30 bg-paper-white hover:border-carbon hover:bg-soft-mist/60 text-carbon"
              }`}
            >
              {/* Day Number */}
              <span className="text-xs font-bold font-mono">
                {dayNum}
              </span>

              {/* Activity Indicators per design_todo.md */}
              <div className="flex items-center gap-1 min-h-[16px]">
                {activity === "perfect_day" ? (
                  <span
                    className="w-4 h-4 rounded-full border border-carbon bg-sunburst text-[10px] flex items-center justify-center text-carbon"
                    title="Perfect Day (+50 Bonus)"
                  >
                    ⭐
                  </span>
                ) : activity === "some_completed" ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-carbon bg-mint-pop text-[9px] flex items-center justify-center text-carbon"
                    title="Tasks completed"
                  >
                    ✓
                  </span>
                ) : activity === "penalty_only" ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-carbon bg-ember text-[9px] flex items-center justify-center text-paper-white"
                    title="Penalty applied"
                  >
                    ⚠️
                  </span>
                ) : null}

                {/* Streak linkage badge */}
                {isStreakDay && !isSelected && (
                  <span className="text-[10px]" title="Streak active day">
                    🔥
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Trailing empty slots */}
        {Array.from({ length: trailingBlanks }).map((_, idx) => (
          <div key={`trailing-${idx}`} className="min-h-[50px] sm:min-h-[58px] rounded-[14px] bg-transparent" />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-4 border-t border-carbon/20 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-neutral-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-carbon bg-sunburst flex items-center justify-center text-[9px]">
            ⭐
          </span>
          <span>Perfect Day (+50)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-carbon bg-mint-pop flex items-center justify-center text-[9px]">
            ✓
          </span>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-carbon bg-ember flex items-center justify-center text-[9px] text-paper-white">
            ⚠️
          </span>
          <span>Penalty</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-full border border-carbon bg-sky-wash text-carbon font-mono text-[9px]">
            •
          </span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
