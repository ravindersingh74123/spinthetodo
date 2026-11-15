import { describe, it, expect } from "vitest";
import {
  currentStreak,
  longestStreak,
  isDateCounted,
  isStreakAlive,
} from "./streak";
import { Task } from "./types";

function makeDoneTask(id: string, date: string): Task {
  return {
    id,
    name: `Task ${id}`,
    durationMin: 30,
    points: 10,
    date,
    status: "done",
    attempts: 0,
    completedAt: 1000,
  };
}

function makeFailedTask(id: string, date: string): Task {
  return {
    id,
    name: `Failed ${id}`,
    durationMin: 30,
    points: 10,
    date,
    status: "failed",
    attempts: 2,
  };
}

describe("lib/streak: Derived streak rules (spec)", () => {
  it("counts a day toward streak if at least 1 task was completed", () => {
    const tasks = [makeDoneTask("1", "2026-11-15")];
    expect(isDateCounted(tasks, "2026-11-15")).toBe(true);
    expect(isDateCounted(tasks, "2026-11-16")).toBe(false);
  });

  it("calculates current streak for consecutive completed days ending today", () => {
    const tasks = [
      makeDoneTask("1", "2026-11-13"),
      makeDoneTask("2", "2026-11-14"),
      makeDoneTask("3", "2026-11-15"),
    ];

    expect(currentStreak(tasks, "2026-11-15")).toBe(3);
  });

  it("keeps streak alive when today is empty if yesterday counted", () => {
    // Days 12, 13, 14 have completed tasks. Today is 15. Today has 0 completed tasks.
    const tasks = [
      makeDoneTask("1", "2026-11-12"),
      makeDoneTask("2", "2026-11-13"),
      makeDoneTask("3", "2026-11-14"),
    ];

    expect(currentStreak(tasks, "2026-11-15")).toBe(3);
    expect(isStreakAlive(tasks, "2026-11-15")).toBe(true);
  });

  it("increments the alive streak when a task is completed today", () => {
    const tasks = [
      makeDoneTask("1", "2026-11-12"),
      makeDoneTask("2", "2026-11-13"),
      makeDoneTask("3", "2026-11-14"),
    ];
    expect(currentStreak(tasks, "2026-11-15")).toBe(3);

    // Complete task today
    tasks.push(makeDoneTask("4", "2026-11-15"));
    expect(currentStreak(tasks, "2026-11-15")).toBe(4);
  });

  it("breaks the streak once a full day passes with zero completions", () => {
    // Nov 12, 13 completed. Nov 14 had 0 completions. Today is Nov 15 (0 completions).
    const tasks = [
      makeDoneTask("1", "2026-11-12"),
      makeDoneTask("2", "2026-11-13"),
    ];

    // On Nov 14 (with yesterday 13 completed), streak was still alive (2)
    expect(currentStreak(tasks, "2026-11-14")).toBe(2);

    // But when Nov 15 arrives and yesterday (Nov 14) had no completions, streak breaks:
    expect(currentStreak(tasks, "2026-11-15")).toBe(0);
    expect(isStreakAlive(tasks, "2026-11-15")).toBe(false);

    // If a task is completed today on Nov 15, a new streak of 1 begins:
    tasks.push(makeDoneTask("3", "2026-11-15"));
    expect(currentStreak(tasks, "2026-11-15")).toBe(1);
  });

  it("calculates longest streak in history across multiple gaps", () => {
    const tasks = [
      // 5-day run in October
      makeDoneTask("1", "2026-10-01"),
      makeDoneTask("2", "2026-10-02"),
      makeDoneTask("3", "2026-10-03"),
      makeDoneTask("4", "2026-10-04"),
      makeDoneTask("5", "2026-10-05"),

      // Gap on Oct 6

      // 3-day run
      makeDoneTask("6", "2026-10-07"),
      makeDoneTask("7", "2026-10-08"),
      makeDoneTask("8", "2026-10-09"),
    ];

    expect(longestStreak(tasks)).toBe(5);
  });

  it("penalties and failed tasks never affect the streak; only completions do", () => {
    const tasks = [
      makeDoneTask("1", "2026-11-13"),
      makeDoneTask("2", "2026-11-14"),
      makeFailedTask("3", "2026-11-14"), // 1 done, 1 failed on Nov 14 -> still counts!
      makeDoneTask("4", "2026-11-15"),
      makeFailedTask("5", "2026-11-15"),
    ];

    expect(currentStreak(tasks, "2026-11-15")).toBe(3);
    expect(longestStreak(tasks)).toBe(3);
  });

  it("handles multiple completions on the same day without overcounting", () => {
    const tasks = [
      makeDoneTask("1", "2026-11-14"),
      makeDoneTask("2", "2026-11-14"), // 2 tasks on Nov 14
      makeDoneTask("3", "2026-11-14"),
      makeDoneTask("4", "2026-11-15"), // 1 task on Nov 15
    ];

    expect(currentStreak(tasks, "2026-11-15")).toBe(2);
    expect(longestStreak(tasks)).toBe(2);
  });

  it("returns 0 for empty tasks", () => {
    expect(currentStreak([], "2026-11-15")).toBe(0);
    expect(longestStreak([])).toBe(0);
    expect(isStreakAlive([], "2026-11-15")).toBe(false);
  });
});
