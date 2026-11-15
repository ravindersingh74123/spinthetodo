"use client";

import React, { useState } from "react";
import Link from "next/link";
import Calendar from "@/components/Calendar";
import DayDetail from "@/components/DayDetail";
import { useAppState } from "@/store/useAppState";

export default function CalendarPage() {
  const { today, activeTask } = useAppState();
  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null);

  // Selected date defaults to today from state, or explicit user selection
  const selectedDate = userSelectedDate ?? today;

  return (
    <div className="flex flex-col gap-8">
      {/* Active Task Floating Alert if navigating while task is running/expired */}
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
                A task is currently active or waiting for your completion prompt. Return to the Today screen to complete it.
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

      {/* Header section on Concrete Gray pastel ground per design_todo.md */}
      <section className="relative overflow-hidden rounded-[30px] border border-carbon bg-concrete-gray p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 mb-2 text-xs font-bold tracking-[0.032em] uppercase rounded-full border border-carbon bg-paper-white">
              History & Accountability
            </span>
            <h1
              className="font-extrabold uppercase text-carbon tracking-[0.04em] leading-[0.85] text-4xl sm:text-6xl select-none"
              style={{ fontFamily: "var(--font-lateral)" }}
            >
              CALENDAR
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-neutral-800 font-medium max-w-lg">
              Review past days, streaks, completed tasks, and penalties. Past days are read-only.
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

      {/* Main Grid: Month Calendar & Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Month View Calendar */}
        <div className="lg:col-span-8">
          <Calendar
            selectedDate={selectedDate}
            onSelectDate={(date) => setUserSelectedDate(date)}
          />
        </div>

        {/* Day Detail Inspector */}
        <div className="lg:col-span-4">
          <DayDetail date={selectedDate} />
        </div>
      </div>
    </div>
  );
}
