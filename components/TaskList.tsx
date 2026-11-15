"use client";

import React, { useState, useMemo } from "react";
import { useAppState } from "@/store/useAppState";
import { Task, TaskStatus } from "@/lib/types";
import { canDeleteTask } from "@/lib/tasks";

type FilterTab = "all" | "pending" | "done";

interface StatusBadgeProps {
  status: TaskStatus;
  attempts: number;
}

function StatusBadge({ status, attempts }: StatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-soft-mist text-carbon">
            Pending
          </span>
          {attempts > 0 && (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-sunburst text-carbon"
              title="Failed once, back on wheel for final attempt"
            >
              Retry 1/2
            </span>
          )}
        </div>
      );
    case "active":
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-sunburst text-carbon flex items-center gap-1">
          <span className="animate-pulse">⚡</span>
          <span>In Progress</span>
        </span>
      );
    case "done":
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-mint-pop text-carbon">
          ✓ Done
        </span>
      );
    case "failed":
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full border border-carbon bg-ember text-paper-white">
          ✕ Failed (Penalty)
        </span>
      );
    default:
      return null;
  }
}

export default function TaskList() {
  const { todayTasks, pendingTasks, deleteTask } = useAppState();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const counts = useMemo(() => {
    const done = todayTasks.filter((t) => t.status === "done").length;
    const pending = todayTasks.filter(
      (t) => t.status === "pending" || t.status === "active"
    ).length;
    const total = todayTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, pending, total, percent };
  }, [todayTasks]);

  const filteredTasks = useMemo(() => {
    if (activeTab === "pending") {
      return todayTasks.filter(
        (t) => t.status === "pending" || t.status === "active"
      );
    }
    if (activeTab === "done") {
      return todayTasks.filter((t) => t.status === "done");
    }
    return todayTasks;
  }, [todayTasks, activeTab]);

  const handleDelete = (task: Task) => {
    if (!canDeleteTask(task)) return;
    deleteTask(task.id);
  };

  return (
    <div className="p-1 sm:p-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-carbon/20">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold tracking-[0.032em] uppercase text-carbon">
            Today&apos;s Tasks
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-carbon bg-soft-mist text-carbon font-mono">
            {todayTasks.length} Total
          </span>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border border-carbon bg-sky-wash text-carbon">
          {pendingTasks.length} on Wheel
        </span>
      </div>

      {/* Daily Progress Momentum Strip */}
      {todayTasks.length > 0 && (
        <div className="mb-4 p-3 rounded-[16px] border border-carbon bg-paper-white flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.032em]">
            <span className="flex items-center gap-1.5 text-carbon">
              <span>🔥</span>
              <span>Daily Momentum</span>
            </span>
            <span className="font-mono text-carbon font-extrabold">
              {counts.done} / {counts.total} Done ({counts.percent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full border border-carbon bg-soft-mist overflow-hidden">
            <div
              className="h-full bg-mint-pop transition-all duration-300"
              style={{ width: `${counts.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Segmented Filter Tabs: All, Pending, Done */}
      {todayTasks.length > 0 && (
        <div
          role="tablist"
          aria-label="Filter tasks"
          className="flex items-center gap-1.5 p-1 mb-4 rounded-full border border-carbon bg-paper-white"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold uppercase tracking-[0.032em] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "all"
                ? "bg-carbon text-paper-white shadow-none"
                : "text-carbon hover:bg-soft-mist"
            }`}
          >
            All ({counts.total})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold uppercase tracking-[0.032em] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-carbon text-paper-white shadow-none"
                : "text-carbon hover:bg-soft-mist"
            }`}
          >
            Pending ({counts.pending})
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "done"}
            onClick={() => setActiveTab("done")}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold uppercase tracking-[0.032em] transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "done"
                ? "bg-carbon text-paper-white shadow-none"
                : "text-carbon hover:bg-soft-mist"
            }`}
          >
            Done ({counts.done})
          </button>
        </div>
      )}

      {/* Task List or Empty State */}
      {todayTasks.length === 0 ? (
        <div className="py-10 px-4 text-center border border-dashed border-carbon rounded-[16px] bg-soft-mist/30 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full border border-carbon bg-lavender flex items-center justify-center text-sm">
            🎯
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.032em] text-carbon">
            No tasks added for today
          </p>
          <p className="text-xs text-neutral-500 max-w-xs">
            Add tasks above. They will appear as equal slices on the wheel.
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-carbon rounded-[16px] bg-soft-mist/30 flex flex-col items-center justify-center gap-1.5">
          <span className="text-xl">
            {activeTab === "done" ? "⏱️" : "🎉"}
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.032em] text-carbon">
            {activeTab === "done"
              ? "No completed tasks yet"
              : "No pending tasks"}
          </p>
          <p className="text-xs text-neutral-500">
            {activeTab === "done"
              ? "Spin the wheel and beat the timer to log your first win!"
              : "All tasks for today are completed or resolved!"}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5" aria-label="Today's task list">
          {filteredTasks.map((task) => {
            const isDeletable = canDeleteTask(task);

            return (
              <li
                key={task.id}
                className={`p-3 rounded-[16px] border flex items-center justify-between gap-3 transition-all ${
                  task.status === "active"
                    ? "bg-sunburst/15 border-2 border-carbon"
                    : task.status === "done"
                    ? "bg-mint-pop/10 border-carbon/70 opacity-95"
                    : task.status === "failed"
                    ? "bg-ember/10 border-carbon/70 opacity-90"
                    : "bg-paper-white border-carbon hover:bg-soft-mist/20"
                }`}
              >
                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      title={task.name}
                      className={`text-xs font-bold text-carbon truncate max-w-[200px] sm:max-w-xs ${
                        task.status === "done" ? "line-through text-neutral-500" : ""
                      }`}
                    >
                      {task.name}
                    </span>
                    <StatusBadge status={task.status} attempts={task.attempts} />
                  </div>

                  {/* Micro-tags for time and points */}
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-carbon/30 bg-soft-mist text-carbon font-medium">
                      <span>⏱️</span>
                      <span>{task.durationMin}m</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-carbon/30 bg-sunburst/30 text-carbon font-bold font-mono">
                      <span>🪙</span>
                      <span>+{task.points} pts</span>
                    </span>
                  </div>
                </div>

                {/* Right Action: Delete if pending, stamp if done, penalty badge if failed */}
                <div className="shrink-0">
                  {isDeletable ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(task)}
                      aria-label={`Delete task: ${task.name}`}
                      title="Delete task from wheel"
                      className="w-7 h-7 rounded-full border border-carbon bg-paper-white text-carbon hover:bg-ember hover:text-paper-white flex items-center justify-center text-xs font-bold transition-all active:scale-90"
                    >
                      ✕
                    </button>
                  ) : task.status === "done" ? (
                    <span
                      className="w-7 h-7 rounded-full border border-carbon bg-mint-pop text-carbon flex items-center justify-center text-xs font-black select-none"
                      title="Task Completed"
                    >
                      ✓
                    </span>
                  ) : task.status === "active" ? (
                    <span
                      className="w-7 h-7 rounded-full border border-carbon bg-sunburst text-carbon flex items-center justify-center text-xs font-black animate-pulse select-none"
                      title="Task Active"
                    >
                      ⚡
                    </span>
                  ) : (
                    <span
                      className="w-7 h-7 rounded-full border border-carbon bg-ember text-paper-white flex items-center justify-center text-xs font-bold select-none"
                      title="Task Failed"
                    >
                      ✕
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
