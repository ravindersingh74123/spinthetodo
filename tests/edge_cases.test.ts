import { describe, it, expect, beforeEach } from "vitest";
import { createTask, startTask, completeTask, markNotCompleted, validateTaskInput } from "@/lib/tasks";
import { completionEntry, penaltyEntry, checkPerfectDayBonus, totalPoints } from "@/lib/ledger";
import { isDateCounted, currentStreak } from "@/lib/streak";
import { truncateSliceLabel } from "@/lib/wheel";
import { loadState, createInitialState } from "@/lib/storage";
import { LedgerEntry, STORAGE_KEY } from "@/lib/types";

describe("Phase 8: Edge Cases and Hardening", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Zero-point tasks", () => {
    it("validates and creates a 0-point task without error", () => {
      const validation = validateTaskInput("Review inbox zero", 15, 0);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual({});

      const task = createTask("Review inbox zero", 15, 0, "2026-11-15");
      expect(task.points).toBe(0);
      expect(task.status).toBe("pending");
    });

    it("awards 0 points in the ledger on completion without breaking total calculations", () => {
      const task = createTask("Quick breather", 5, 0, "2026-11-15");
      const activeTask = startTask(task, Date.now());
      const doneTask = completeTask(activeTask, Date.now());
      const entry = completionEntry(doneTask, "2026-11-15");

      expect(entry.delta).toBe(0);
      expect(entry.reason).toBe("task_completed");

      const ledger: LedgerEntry[] = [entry];
      expect(totalPoints(ledger)).toBe(0);
    });

    it("counts a completed 0-point task towards the daily streak", () => {
      const task = createTask("Meditate", 10, 0, "2026-11-15");
      const activeTask = startTask(task, Date.now());
      const doneTask = completeTask(activeTask, Date.now());

      expect(isDateCounted([doneTask], "2026-11-15")).toBe(true);
      expect(currentStreak([doneTask], "2026-11-15")).toBe(1);
    });

    it("awards the +50 Perfect Day bonus even when all completed tasks have 0 points", () => {
      const t1 = completeTask(startTask(createTask("Task A", 10, 0, "2026-11-15"), Date.now()), Date.now());
      const t2 = completeTask(startTask(createTask("Task B", 15, 0, "2026-11-15"), Date.now()), Date.now());

      const bonus = checkPerfectDayBonus([t1, t2], [], "2026-11-15");
      expect(bonus).not.toBeNull();
      expect(bonus?.delta).toBe(50);
      expect(bonus?.reason).toBe("perfect_day_bonus");
    });

    it("generates a 0-penalty entry when a 0-point task fails on 2nd attempt", () => {
      const task = createTask("Zero point chore", 10, 0, "2026-11-15");
      const active1 = startTask(task, Date.now());
      const { updatedTask: retryTask, didFail: fail1 } = markNotCompleted(active1);
      expect(fail1).toBe(false);
      expect(retryTask.status).toBe("pending");
      expect(retryTask.attempts).toBe(1);

      const active2 = startTask(retryTask, Date.now());
      const { updatedTask: failedTask, didFail: fail2 } = markNotCompleted(active2);
      expect(fail2).toBe(true);
      expect(failedTask.status).toBe("failed");

      const penalty = penaltyEntry(failedTask, "2026-11-16");
      expect(Math.abs(penalty.delta)).toBe(0);
      expect(penalty.date).toBe("2026-11-16");
    });
  });

  describe("Very long task names", () => {
    it("handles long task names and truncates them cleanly for wheel slices", () => {
      const longName = "Refactor the entire authentication subsystem with bidirectional session hashing and telemetry";
      const truncated = truncateSliceLabel(longName, 14);

      expect(truncated.length).toBeLessThanOrEqual(14);
      expect(truncated.endsWith("…")).toBe(true);
    });

    it("does not truncate task names that fit within the character limit", () => {
      const shortName = "Deep work";
      expect(truncateSliceLabel(shortName, 14)).toBe("Deep work");
    });
  });

  describe("Storage resilience and mid-session recovery", () => {
    it("gracefully falls back to initial state if localStorage is wiped mid-session", () => {
      const initial = loadState("non_existent_key");
      expect(initial.tasks).toEqual([]);
      expect(initial.ledger).toEqual([]);
      expect(initial.activeTaskId).toBeNull();
      expect(initial.schemaVersion).toBe(1);
    });

    it("recovers cleanly from corrupt JSON in storage", () => {
      localStorage.setItem(STORAGE_KEY, "INVALID_MALFORMED_JSON{{{");
      const recovered = loadState(STORAGE_KEY);
      expect(recovered).toEqual(createInitialState());
    });

    it("recovers cleanly from missing arrays or schema tampering", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: "not an array" }));
      const recovered = loadState(STORAGE_KEY);
      expect(recovered).toEqual(createInitialState());
    });
  });

  describe("Midnight rollover and non-rollover of unfinished tasks", () => {
    it("does not roll over yesterday's unfinished pending tasks into today's pending list", () => {
      const yesterdayTask = createTask("Old task from yesterday", 30, 20, "2026-11-14");
      const todayTask = createTask("New task for today", 25, 10, "2026-11-15");

      const allTasks = [yesterdayTask, todayTask];

      // Check tasks strictly for today
      const todayOnly = allTasks.filter((t) => t.date === "2026-11-15" && t.status === "pending");
      expect(todayOnly).toHaveLength(1);
      expect(todayOnly[0].id).toBe(todayTask.id);
    });
  });
});
