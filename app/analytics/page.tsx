"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAppState } from "@/store/useAppState";
import { computeMacroAnalytics, AnalyticsTimeRange } from "@/lib/analytics";
import KpiCards from "@/components/analytics/KpiCards";
import TaskReliabilityChart from "@/components/analytics/TaskReliabilityChart";
import DailyActivityChart from "@/components/analytics/DailyActivityChart";
import FocusAllocationChart from "@/components/analytics/FocusAllocationChart";

export default function AnalyticsPage() {
  const { tasks, ledger, today, activeTask } = useAppState();
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("this_month");

  // Reference date: safe fallback for SSR
  const referenceDate = today || "2026-11-15";

  // Derive aggregated analytics
  const analytics = useMemo(() => {
    return computeMacroAnalytics(tasks, ledger, timeRange, referenceDate);
  }, [tasks, ledger, timeRange, referenceDate]);

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Active Task Floating Alert if navigating while task is running */}
      {activeTask && (
        <div
          role="alert"
          className="rounded-[20px] border border-carbon bg-sunburst p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">⏱️</span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-tight text-carbon">
                Active Focus Task: <span className="underline">&ldquo;{activeTask.name}&rdquo;</span>
              </p>
              <p className="text-[11px] font-medium text-neutral-800">
                A focus timer is actively running. Return to the Today screen to complete it.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-[0.032em] hover:bg-neutral-800 transition-colors text-center shrink-0 active:scale-95"
          >
            Return to Active Task →
          </Link>
        </div>
      )}

      {/* Header section on Lavender pastel ground per design_todo.md */}
      <section className="relative overflow-hidden rounded-[30px] border border-carbon bg-lavender p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 mb-2 text-xs font-bold tracking-[0.032em] uppercase rounded-full border border-carbon bg-paper-white">
              Habits & Performance
            </span>
            <h1
              className="font-extrabold uppercase text-carbon tracking-[0.04em] leading-[0.85] text-4xl sm:text-6xl select-none"
              style={{ fontFamily: "var(--font-lateral)" }}
            >
              ANALYTICS
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-neutral-800 font-medium max-w-lg">
              Track task frequency, habit consistency, and daily momentum across time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-full border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-[0.032em] hover:bg-neutral-800 transition-colors active:scale-95 shadow-none"
            >
              ← Back to Wheel
            </Link>
          </div>
        </div>
      </section>

      {/* Scope / Time Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-carbon/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.032em] text-carbon">
            Timeframe:
          </span>
          <div className="flex items-center gap-1 bg-paper-white border border-carbon rounded-full p-1">
            <button
              type="button"
              onClick={() => setTimeRange("this_month")}
              className={`px-3.5 py-1 text-xs font-bold uppercase tracking-[0.032em] rounded-full transition-colors ${
                timeRange === "this_month"
                  ? "bg-carbon text-paper-white"
                  : "text-carbon hover:bg-soft-mist"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("last_30_days")}
              className={`px-3.5 py-1 text-xs font-bold uppercase tracking-[0.032em] rounded-full transition-colors ${
                timeRange === "last_30_days"
                  ? "bg-carbon text-paper-white"
                  : "text-carbon hover:bg-soft-mist"
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("all_time")}
              className={`px-3.5 py-1 text-xs font-bold uppercase tracking-[0.032em] rounded-full transition-colors ${
                timeRange === "all_time"
                  ? "bg-carbon text-paper-white"
                  : "text-carbon hover:bg-soft-mist"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        <span className="text-xs font-medium text-neutral-500 font-mono">
          {analytics.totalTasksAssigned} total tasks analyzed
        </span>
      </div>

      {/* KPI Cards Strip */}
      <KpiCards analytics={analytics} />

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Task Reliability & Frequency (Primary habit chart) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <TaskReliabilityChart habits={analytics.taskHabits} />
        </div>

        {/* Right Column: Daily Activity Velocity & Focus Allocation */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <DailyActivityChart timeline={analytics.dailyTimeline} />
          <FocusAllocationChart
            allocations={analytics.categoryAllocations}
            totalHours={analytics.totalFocusHours}
          />
        </div>
      </div>
    </div>
  );
}
