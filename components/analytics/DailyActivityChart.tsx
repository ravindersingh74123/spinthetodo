"use client";

import React from "react";
import { DailyActivityPoint } from "@/lib/analytics";

interface DailyActivityChartProps {
  timeline: DailyActivityPoint[];
}

export default function DailyActivityChart({ timeline }: DailyActivityChartProps) {
  const maxTasks = Math.max(
    1,
    ...timeline.map((p) => p.assignedCount || p.completedCount)
  );

  return (
    <div className="rounded-[20px] border border-carbon bg-paper-white p-5 sm:p-6 select-none flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-carbon/20">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-[0.032em] text-carbon">
            14-Day Momentum Flow
          </h3>
          <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
            Daily tasks completed vs missed.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-mint-pop border border-carbon" />
            <span>Completed</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-soft-mist border border-carbon" />
            <span>Assigned</span>
          </span>
        </div>
      </div>

      {/* SVG / HTML Bar Chart */}
      <div className="h-44 sm:h-48 w-full flex items-end justify-between gap-1 pt-6 pb-2 px-1 border-b border-carbon/20 relative">
        {timeline.map((point) => {
          const completedHeight = (point.completedCount / maxTasks) * 100;
          const assignedHeight = (point.assignedCount / maxTasks) * 100;

          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on Hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-carbon text-paper-white text-[10px] font-bold py-1 px-2 rounded-md pointer-events-none z-30 whitespace-nowrap shadow-none">
                {point.dayLabel}: {point.completedCount}/{point.assignedCount} done
              </div>

              {/* Column Bar Container */}
              <div className="w-full max-w-[20px] h-full flex items-end justify-center relative">
                {/* Background Assigned Bar */}
                <div
                  className="w-full rounded-t-md bg-soft-mist border border-carbon/30 absolute bottom-0"
                  style={{ height: `${Math.max(4, assignedHeight)}%` }}
                />
                {/* Foreground Completed Bar */}
                <div
                  className="w-full rounded-t-md bg-mint-pop border border-carbon relative z-10 transition-all duration-300"
                  style={{ height: `${Math.max(point.completedCount > 0 ? 8 : 0, completedHeight)}%` }}
                />
              </div>

              {/* Day Label */}
              <span className="text-[9px] font-mono text-neutral-500 font-bold mt-1.5 truncate max-w-full">
                {point.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.032em] text-neutral-600">
        <span>14-Day Velocity</span>
        <span className="text-carbon font-mono">
          {timeline.reduce((s, p) => s + p.completedCount, 0)} completed of{" "}
          {timeline.reduce((s, p) => s + p.assignedCount, 0)} assigned
        </span>
      </div>
    </div>
  );
}
