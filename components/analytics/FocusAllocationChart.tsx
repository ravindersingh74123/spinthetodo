"use client";

import React from "react";
import { CategoryAllocation } from "@/lib/analytics";

interface FocusAllocationChartProps {
  allocations: CategoryAllocation[];
  totalHours: string;
}

export default function FocusAllocationChart({
  allocations,
  totalHours,
}: FocusAllocationChartProps) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="rounded-[20px] border border-carbon bg-paper-white p-5 sm:p-6 select-none flex flex-col gap-4">
      {/* Header */}
      <div className="pb-3 border-b border-carbon/20">
        <h3 className="text-sm font-extrabold uppercase tracking-[0.032em] text-carbon">
          Focus Time Distribution
        </h3>
        <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
          Proportion of completed focus time per habit.
        </p>
      </div>

      {allocations.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500 font-medium">
          No completed focus time logged in this period.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* SVG Donut Chart */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#e9e9e9"
                strokeWidth="20"
              />
              {/* Donut Segments */}
              {allocations.map((item) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((item.offset / 100) * circumference);

                return (
                  <circle
                    key={item.name}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-base font-extrabold text-carbon tracking-tight font-mono">
                {totalHours}h
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                Focus
              </span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex-1 flex flex-col gap-2 w-full max-w-xs">
            {allocations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs font-bold gap-2 p-1.5 rounded-lg border border-carbon/10 hover:bg-soft-mist/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full border border-carbon shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-carbon text-[11px]">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="text-neutral-500">{item.minutes}m</span>
                  <span className="px-1.5 py-0.2 rounded-full border border-carbon bg-paper-white text-carbon text-[10px]">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
