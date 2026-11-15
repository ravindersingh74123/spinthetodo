"use client";

import React, { useState } from "react";
import { TaskHabitStats } from "@/lib/analytics";

interface TaskReliabilityChartProps {
  habits: TaskHabitStats[];
}

type SortOption = "assigned" | "rate" | "time";

export default function TaskReliabilityChart({ habits }: TaskReliabilityChartProps) {
  const [sortBy, setSortBy] = useState<SortOption>("assigned");

  const sortedHabits = [...habits].sort((a, b) => {
    if (sortBy === "rate") {
      return b.completionRate - a.completionRate || b.totalAssigned - a.totalAssigned;
    }
    if (sortBy === "time") {
      return b.totalMinutes - a.totalMinutes;
    }
    return b.totalAssigned - a.totalAssigned || b.completionRate - a.completionRate;
  });

  return (
    <div className="rounded-[20px] border border-carbon bg-paper-white p-5 sm:p-6 select-none flex flex-col gap-5">
      {/* Header & Sorters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-carbon/20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold uppercase tracking-[0.032em] text-carbon">
              Task Consistency & Habit Frequency
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-sky-wash text-carbon font-mono">
              {habits.length} Tasks
            </span>
          </div>
          <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
            Days scheduled on the wheel vs. successfully completed.
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1 bg-soft-mist/60 border border-carbon rounded-full p-0.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSortBy("assigned")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.032em] transition-all ${
              sortBy === "assigned"
                ? "bg-carbon text-paper-white"
                : "text-carbon hover:bg-paper-white/60"
            }`}
          >
            Frequency
          </button>
          <button
            type="button"
            onClick={() => setSortBy("rate")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.032em] transition-all ${
              sortBy === "rate"
                ? "bg-carbon text-paper-white"
                : "text-carbon hover:bg-paper-white/60"
            }`}
          >
            Success %
          </button>
          <button
            type="button"
            onClick={() => setSortBy("time")}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.032em] transition-all ${
              sortBy === "time"
                ? "bg-carbon text-paper-white"
                : "text-carbon hover:bg-paper-white/60"
            }`}
          >
            Time
          </button>
        </div>
      </div>

      {/* Habit Cards / Bar List */}
      {sortedHabits.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-carbon rounded-[16px] bg-soft-mist/30 flex flex-col items-center justify-center gap-2">
          <span className="text-2xl">📊</span>
          <p className="text-xs font-bold uppercase tracking-[0.032em] text-carbon">
            No task history found for this period
          </p>
          <p className="text-xs text-neutral-500 max-w-xs">
            Add tasks to the wheel and complete them to generate habit frequency insights.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {sortedHabits.map((habit) => {
            const hours = (habit.totalMinutes / 60).toFixed(1);

            return (
              <div
                key={habit.normalizedName}
                className="p-4 rounded-[16px] border border-carbon bg-paper-white hover:bg-soft-mist/20 transition-all flex flex-col gap-2.5"
              >
                {/* Top Row: Task Name & Success Rate Pill */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-carbon truncate max-w-[200px] sm:max-w-xs">
                      {habit.name}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-500 font-mono">
                      ({habit.daysCompleted} of {habit.daysScheduled} days)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-full border border-carbon text-[11px] font-extrabold font-mono ${
                        habit.completionRate >= 80
                          ? "bg-mint-pop text-carbon"
                          : habit.completionRate >= 50
                          ? "bg-sunburst text-carbon"
                          : "bg-soft-mist text-carbon"
                      }`}
                    >
                      {habit.completionRate}% Done
                    </span>
                  </div>
                </div>

                {/* Visual Proportion Bar (Assigned vs Completed) */}
                <div className="space-y-1">
                  <div className="w-full h-3 rounded-full border border-carbon bg-soft-mist overflow-hidden relative">
                    <div
                      className="h-full bg-mint-pop border-r border-carbon transition-all duration-500"
                      style={{ width: `${habit.completionRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.032em] text-neutral-500">
                    <span>
                      {habit.totalCompleted} completed / {habit.totalAssigned} assigned
                    </span>
                    <span>
                      {habit.daysScheduled} active {habit.daysScheduled === 1 ? "day" : "days"}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Micro Metric Badges */}
                <div className="flex items-center gap-2 pt-1 border-t border-carbon/10 text-[10px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-carbon/30 bg-soft-mist text-carbon font-semibold">
                    <span>⏱️</span>
                    <span>{hours} hrs logged</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-carbon/30 bg-sunburst/30 text-carbon font-bold font-mono">
                    <span>🪙</span>
                    <span>+{habit.totalPoints} pts earned</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
