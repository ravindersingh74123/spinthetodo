"use client";

import React, { useMemo } from "react";
import { useAppState } from "@/store/useAppState";
import {
  formatDisplayDate,
} from "@/lib/date";
import {
  completedTasks as getCompletedTasks,
  failedTasks as getFailedTasks,
  tasksForDate,
} from "@/lib/tasks";
import {
  entriesForDate,
  pointsForDate,
} from "@/lib/ledger";

interface DayDetailProps {
  date: string;
}

export default function DayDetail({ date }: DayDetailProps) {
  const { tasks, ledger, today } = useAppState();

  const isToday = Boolean(today && date === today);
  const isPast = Boolean(today && date < today);

  const dayTasks = useMemo(() => (date ? tasksForDate(tasks, date) : []), [tasks, date]);
  const completed = useMemo(() => (date ? getCompletedTasks(tasks, date) : []), [tasks, date]);
  const failed = useMemo(() => (date ? getFailedTasks(tasks, date) : []), [tasks, date]);
  const entries = useMemo(() => (date ? entriesForDate(ledger, date) : []), [ledger, date]);
  const netPoints = useMemo(() => (date ? pointsForDate(ledger, date) : 0), [ledger, date]);

  const hasActivity = dayTasks.length > 0 || entries.length > 0;

  if (!date) {
    return (
      <div className="rounded-[20px] border border-carbon bg-paper-white p-6">
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-[0.032em]">
          Select a day to view details
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-carbon bg-paper-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-carbon">
        <div>
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.032em]">
            Day Summary
          </span>
          <h3 className="text-base font-extrabold uppercase text-carbon tracking-tight">
            {formatDisplayDate(date)}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isToday ? (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-sky-wash text-carbon">
              Today
            </span>
          ) : isPast ? (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-soft-mist text-carbon">
              Read-Only
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-lavender text-carbon">
              Future
            </span>
          )}
        </div>
      </div>

      {/* Net Points Banner */}
      <div className="mb-6 p-4 rounded-[20px] border border-carbon bg-paper-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-carbon" />
          <span className="text-xs font-bold uppercase tracking-[0.032em] text-carbon">
            Day Net Points
          </span>
        </div>
        <span
          className={`font-mono text-xs font-extrabold px-3 py-1 rounded-full border border-carbon ${
            netPoints < 0
              ? "bg-ember text-paper-white"
              : netPoints > 0
              ? "bg-mint-pop text-carbon"
              : "bg-soft-mist text-carbon"
          }`}
        >
          {netPoints > 0 ? `+${netPoints}` : netPoints} pts
        </span>
      </div>

      {!hasActivity ? (
        <div className="py-12 px-4 text-center border border-dashed border-carbon rounded-[16px] bg-soft-mist/20 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full border border-carbon bg-soft-mist flex items-center justify-center text-xs">
            📄
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.032em] text-carbon">
            No activity recorded
          </p>
          <p className="text-xs text-neutral-500 max-w-xs">
            No tasks or points ledger entries were created for this day.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Completed Tasks */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.032em] text-carbon flex items-center gap-1.5">
                  <span>✓</span>
                  <span>Completed Tasks ({completed.length})</span>
                </h4>
              </div>
              <ul className="space-y-2">
                {completed.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 rounded-[12px] border border-carbon bg-mint-pop/10 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-carbon truncate">
                      {task.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-medium shrink-0">
                      <span className="text-neutral-500">{task.durationMin}m</span>
                      <span className="font-bold text-carbon font-mono">
                        +{task.points} pts
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Failed Tasks */}
          {failed.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-[0.032em] text-carbon flex items-center gap-1.5">
                  <span>✕</span>
                  <span>Failed Tasks ({failed.length})</span>
                </h4>
              </div>
              <ul className="space-y-2">
                {failed.map((task) => (
                  <li
                    key={task.id}
                    className="p-3 rounded-[12px] border border-carbon bg-ember/10 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-carbon truncate">
                      {task.name}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-medium shrink-0">
                      <span className="text-neutral-500">2 attempts</span>
                      <span className="font-bold text-ember font-mono">
                        -{task.points} penalty
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ledger Breakdown */}
          {entries.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.032em] text-carbon mb-2">
                Ledger Entries ({entries.length})
              </h4>
              <ul className="space-y-2">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="p-2.5 rounded-[12px] border border-carbon/40 bg-paper-white flex items-center justify-between text-xs font-medium"
                  >
                    <span className="capitalize text-neutral-700">
                      {entry.reason === "perfect_day_bonus"
                        ? "⭐ Perfect Day Bonus"
                        : entry.reason === "task_completed"
                        ? "Task Completion"
                        : "Penalty (Failed Task)"}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        entry.delta >= 0 ? "text-carbon" : "text-ember"
                      }`}
                    >
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta} pts
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
