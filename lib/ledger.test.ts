import { describe, it, expect } from "vitest";
import {
  completionEntry,
  penaltyEntry,
  perfectDayEntry,
  hasPerfectDayEntry,
  checkPerfectDayBonus,
  totalPoints,
  pointsForDate,
  entriesForDate,
  penaltiesForDate,
} from "./ledger";
import { createTask, completeTask, startTask } from "./tasks";
import { PERFECT_DAY_BONUS } from "./types";

describe("lib/ledger: Points, penalties, and perfect-day bonus (spec)", () => {
  it("creates a completion entry dated today with +task.points", () => {
    const task = createTask("Study", 30, 25, "2026-11-15", "task-1");
    const entry = completionEntry(task, "2026-11-15", "entry-1");

    expect(entry).toEqual({
      id: "entry-1",
      date: "2026-11-15",
      delta: 25,
      reason: "task_completed",
      taskId: "task-1",
    });
  });

  it("creates a penalty entry dated tomorrow with -task.points", () => {
    const task = createTask("Exercise", 45, 30, "2026-11-15", "task-2");
    const entry = penaltyEntry(task, "2026-11-16", "entry-2");

    expect(entry).toEqual({
      id: "entry-2",
      date: "2026-11-16",
      delta: -30,
      reason: "task_penalty",
      taskId: "task-2",
    });
  });

  it("handles zero-point tasks without math errors", () => {
    const task = createTask("Free task", 10, 0, "2026-11-15", "task-zero");
    const comp = completionEntry(task, "2026-11-15");
    const pen = penaltyEntry(task, "2026-11-16");

    expect(comp.delta).toBe(0);
    expect(pen.delta).toBe(-0);
  });

  it("allows total points to go negative (no artificial floor)", () => {
    const task = createTask("Hard task", 60, 50, "2026-11-15", "task-3");
    const penalty = penaltyEntry(task, "2026-11-16", "p-1");

    const ledger = [penalty];
    expect(totalPoints(ledger)).toBe(-50);
  });

  it("calculates totalPoints and pointsForDate correctly across multiple entries", () => {
    const t1 = createTask("Task 1", 20, 10, "2026-11-15", "1");
    const t2 = createTask("Task 2", 20, 20, "2026-11-15", "2");
    const t3 = createTask("Task 3", 20, 15, "2026-11-15", "3");

    const e1 = completionEntry(t1, "2026-11-15"); // +10 today
    const e2 = completionEntry(t2, "2026-11-15"); // +20 today
    const e3 = penaltyEntry(t3, "2026-11-16");   // -15 tomorrow

    const ledger = [e1, e2, e3];

    expect(totalPoints(ledger)).toBe(15); // 10 + 20 - 15 = 15
    expect(pointsForDate(ledger, "2026-11-15")).toBe(30);
    expect(pointsForDate(ledger, "2026-11-16")).toBe(-15);
    expect(entriesForDate(ledger, "2026-11-15").length).toBe(2);
    expect(penaltiesForDate(ledger, "2026-11-16")).toEqual([e3]);
  });

  describe("Perfect day bonus (+50 once per day)", () => {
    it("creates a perfect-day entry with +50 dated today", () => {
      const entry = perfectDayEntry("2026-11-15", "bonus-1");
      expect(entry).toEqual({
        id: "bonus-1",
        date: "2026-11-15",
        delta: PERFECT_DAY_BONUS,
        reason: "perfect_day_bonus",
      });
      expect(PERFECT_DAY_BONUS).toBe(50);
    });

    it("awards perfect day bonus when all tasks for the day are done", () => {
      const t1 = completeTask(startTask(createTask("T1", 10, 5, "2026-11-15", "1"), 1000), 2000);
      const t2 = completeTask(startTask(createTask("T2", 10, 5, "2026-11-15", "2"), 1000), 2000);
      const tasks = [t1, t2];
      const ledger = [completionEntry(t1, "2026-11-15"), completionEntry(t2, "2026-11-15")];

      const bonus = checkPerfectDayBonus(tasks, ledger, "2026-11-15", "bonus-1");
      expect(bonus).not.toBeNull();
      expect(bonus?.delta).toBe(50);
      expect(bonus?.reason).toBe("perfect_day_bonus");
    });

    it("does NOT award perfect day bonus more than once (one-time only)", () => {
      const t1 = completeTask(startTask(createTask("T1", 10, 5, "2026-11-15", "1"), 1000), 2000);
      const tasks = [t1];
      const existingBonus = perfectDayEntry("2026-11-15");
      const ledger = [completionEntry(t1, "2026-11-15"), existingBonus];

      expect(hasPerfectDayEntry(ledger, "2026-11-15")).toBe(true);
      const bonus = checkPerfectDayBonus(tasks, ledger, "2026-11-15");
      expect(bonus).toBeNull();
    });

    it("does NOT award perfect day bonus if there are no tasks for that date", () => {
      const bonus = checkPerfectDayBonus([], [], "2026-11-15");
      expect(bonus).toBeNull();
    });

    it("does NOT award perfect day bonus if any task is still pending or failed", () => {
      const t1 = completeTask(startTask(createTask("T1", 10, 5, "2026-11-15", "1"), 1000), 2000);
      const t2 = createTask("T2", 10, 5, "2026-11-15", "2"); // still pending
      const tasks = [t1, t2];
      const ledger = [completionEntry(t1, "2026-11-15")];

      expect(checkPerfectDayBonus(tasks, ledger, "2026-11-15")).toBeNull();
    });
  });
});
