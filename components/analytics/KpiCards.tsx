"use client";

import React from "react";
import { MacroAnalytics } from "@/lib/analytics";

interface KpiCardsProps {
  analytics: MacroAnalytics;
}

export default function KpiCards({ analytics }: KpiCardsProps) {
  const {
    totalTasksAssigned,
    totalTasksCompleted,
    overallCompletionRate,
    totalFocusHours,
    bestCompletionTask,
  } = analytics;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {/* 1. Completion Rate */}
      <div className="p-4 sm:p-5 rounded-[20px] border border-carbon bg-paper-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-500">
            Success Rate
          </span>
          <span className="w-7 h-7 rounded-full border border-carbon bg-mint-pop flex items-center justify-center text-xs">
            🎯
          </span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight font-mono">
            {overallCompletionRate}%
          </span>
          <p className="text-[11px] font-medium text-neutral-600 mt-1">
            {totalTasksCompleted} of {totalTasksAssigned} missions done
          </p>
        </div>
      </div>

      {/* 2. Focus Hours */}
      <div className="p-4 sm:p-5 rounded-[20px] border border-carbon bg-paper-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-500">
            Focus Invested
          </span>
          <span className="w-7 h-7 rounded-full border border-carbon bg-sunburst flex items-center justify-center text-xs">
            ⏱️
          </span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight font-mono">
            {totalFocusHours}
            <span className="text-lg font-bold ml-1 text-neutral-500">hrs</span>
          </span>
          <p className="text-[11px] font-medium text-neutral-600 mt-1">
            {analytics.totalFocusMinutes} total focused minutes
          </p>
        </div>
      </div>

      {/* 3. Missions Logged */}
      <div className="p-4 sm:p-5 rounded-[20px] border border-carbon bg-paper-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-500">
            Missions Completed
          </span>
          <span className="w-7 h-7 rounded-full border border-carbon bg-sky-wash flex items-center justify-center text-xs">
            ✓
          </span>
        </div>
        <div>
          <span className="text-3xl sm:text-4xl font-extrabold text-carbon tracking-tight font-mono">
            {totalTasksCompleted}
          </span>
          <p className="text-[11px] font-medium text-neutral-600 mt-1">
            +{analytics.totalPointsEarned} net points earned
          </p>
        </div>
      </div>

      {/* 4. Top Habit */}
      <div className="p-4 sm:p-5 rounded-[20px] border border-carbon bg-paper-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-500">
            Top Habit
          </span>
          <span className="w-7 h-7 rounded-full border border-carbon bg-lavender flex items-center justify-center text-xs">
            ⭐
          </span>
        </div>
        <div>
          <span
            className="text-xl sm:text-2xl font-extrabold text-carbon tracking-tight truncate block"
            title={bestCompletionTask?.name ?? "No habits yet"}
          >
            {bestCompletionTask ? bestCompletionTask.name : "None"}
          </span>
          <p className="text-[11px] font-medium text-neutral-600 mt-1">
            {bestCompletionTask
              ? `${bestCompletionTask.daysCompleted}/${bestCompletionTask.daysScheduled} days (${bestCompletionTask.completionRate}%)`
              : "Spin to establish habits"}
          </p>
        </div>
      </div>
    </div>
  );
}
