import { describe, it, expect } from "vitest";
import {
  validateTaskInput,
  createTask,
  startTask,
  completeTask,
  markNotCompleted,
  pendingTasks,
  activeTask,
  completedTasks,
  failedTasks,
  canDeleteTask,
  isAllTasksDoneForDate,
  isTaskAttempted,
  findExistingTaskForDate,
} from "./tasks";
import { Task } from "./types";

describe("lib/tasks: Task lifecycle transitions and rules (spec)", () => {
  describe("Validation and creation", () => {
    it("validates valid task inputs successfully", () => {
      const res = validateTaskInput("Write design documentation", 45, 20);
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual({});
    });

    it("rejects empty or whitespace-only task names", () => {
      const res = validateTaskInput("   ", 30, 10);
      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBeDefined();
    });

    it("rejects durations less than 1 or greater than 240 or non-integers", () => {
      expect(validateTaskInput("Task", 0, 10).isValid).toBe(false);
      expect(validateTaskInput("Task", 241, 10).isValid).toBe(false);
      expect(validateTaskInput("Task", 30.5, 10).isValid).toBe(false);
      expect(validateTaskInput("Task", 240, 10).isValid).toBe(true);
      expect(validateTaskInput("Task", 1, 10).isValid).toBe(true);
    });

    it("rejects negative points and non-integer points, allows 0 points", () => {
      expect(validateTaskInput("Task", 25, -5).isValid).toBe(false);
      expect(validateTaskInput("Task", 25, 2.5).isValid).toBe(false);
      expect(validateTaskInput("Task", 25, 0).isValid).toBe(true);
    });

    it("creates a task in 'pending' status with 0 attempts", () => {
      const task = createTask("Build wheel SVG", 30, 15, "2026-11-15", "task-1");
      expect(task).toEqual({
        id: "task-1",
        name: "Build wheel SVG",
        durationMin: 30,
        points: 15,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      });
    });
  });

  describe("Lifecycle: pending -> active -> done", () => {
    it("starts a pending task by setting status to 'active' and recording startedAt", () => {
      const task = createTask("Workout", 30, 10, "2026-11-15", "task-1");
      const startTime = 1700000000000;
      const started = startTask(task, startTime);

      expect(started.status).toBe("active");
      expect(started.startedAt).toBe(startTime);
    });

    it("completes an active task by setting status to 'done' and recording completedAt", () => {
      const task = createTask("Workout", 30, 10, "2026-11-15", "task-1");
      const started = startTask(task, 1700000000000);
      const finishTime = 1700001800000;
      const finished = completeTask(started, finishTime);

      expect(finished.status).toBe("done");
      expect(finished.completedAt).toBe(finishTime);
    });

    it("prevents starting a non-pending task or completing a non-active task", () => {
      const task = createTask("Workout", 30, 10, "2026-11-15", "task-1");
      const started = startTask(task, 1000);
      const finished = completeTask(started, 2000);

      expect(() => startTask(started, 3000)).toThrow();
      expect(() => startTask(finished, 3000)).toThrow();
      expect(() => completeTask(task, 3000)).toThrow();
    });
  });

  describe("Lifecycle: 2-attempt rule (retry once, then fail)", () => {
    it("on first unfinished attempt (attempt 1): returns to pending (re-enters wheel once)", () => {
      const task = createTask("Read chapter 1", 20, 10, "2026-11-15", "task-1");
      const active = startTask(task, 1000);

      const { updatedTask, didFail } = markNotCompleted(active);

      expect(didFail).toBe(false);
      expect(updatedTask.status).toBe("pending");
      expect(updatedTask.attempts).toBe(1);
      expect(updatedTask.startedAt).toBeUndefined();
    });

    it("on second unfinished attempt (attempt 2): marks as failed and removes from wheel", () => {
      const task = createTask("Read chapter 1", 20, 10, "2026-11-15", "task-1");
      // First attempt
      const active1 = startTask(task, 1000);
      const attempt1 = markNotCompleted(active1).updatedTask;
      expect(attempt1.attempts).toBe(1);
      expect(attempt1.status).toBe("pending");

      // Second attempt
      const active2 = startTask(attempt1, 2000);
      const { updatedTask: attempt2, didFail } = markNotCompleted(active2);

      expect(didFail).toBe(true);
      expect(attempt2.status).toBe("failed");
      expect(attempt2.attempts).toBe(2);
      expect(attempt2.startedAt).toBeUndefined();
    });
  });

  describe("Deletion and Selectors", () => {
    it("allows deletion only while task is pending", () => {
      const pending = createTask("Task", 15, 5, "2026-11-15", "t-1");
      const active = startTask(pending, 1000);
      const done = completeTask(active, 2000);
      const failed = markNotCompleted(startTask(markNotCompleted(startTask(pending, 1000)).updatedTask, 2000)).updatedTask;

      expect(canDeleteTask(pending)).toBe(true);
      expect(canDeleteTask(active)).toBe(false);
      expect(canDeleteTask(done)).toBe(false);
      expect(canDeleteTask(failed)).toBe(false);
    });

    it("filters pending, active, completed, and failed tasks accurately", () => {
      const t1 = createTask("Task 1", 10, 5, "2026-11-15", "1");
      const t2 = startTask(createTask("Task 2", 10, 5, "2026-11-15", "2"), 1000);
      const t3 = completeTask(startTask(createTask("Task 3", 10, 5, "2026-11-15", "3"), 1000), 2000);
      const t4: Task = { ...createTask("Task 4", 10, 5, "2026-11-15", "4"), status: "failed", attempts: 2 };
      const tasks = [t1, t2, t3, t4];

      expect(pendingTasks(tasks, "2026-11-15")).toEqual([t1]);
      expect(activeTask(tasks)).toEqual(t2);
      expect(completedTasks(tasks, "2026-11-15")).toEqual([t3]);
      expect(failedTasks(tasks, "2026-11-15")).toEqual([t4]);
    });

    it("isAllTasksDoneForDate returns true only when at least 1 task exists and every task is done", () => {
      expect(isAllTasksDoneForDate([], "2026-11-15")).toBe(false);

      const done1 = completeTask(startTask(createTask("T1", 10, 5, "2026-11-15", "1"), 1000), 2000);
      const done2 = completeTask(startTask(createTask("T2", 10, 5, "2026-11-15", "2"), 1000), 2000);
      const pending = createTask("T3", 10, 5, "2026-11-15", "3");

      expect(isAllTasksDoneForDate([done1, done2], "2026-11-15")).toBe(true);
      expect(isAllTasksDoneForDate([done1, done2, pending], "2026-11-15")).toBe(false);
    });

    it("isTaskAttempted accurately identifies active, done, failed, and retrying tasks", () => {
      const pendingZero = createTask("T0", 10, 5, "2026-11-15", "0");
      expect(isTaskAttempted(pendingZero)).toBe(false);

      const active = startTask(createTask("T1", 10, 5, "2026-11-15", "1"), 1000);
      expect(isTaskAttempted(active)).toBe(true);

      const done = completeTask(active, 2000);
      expect(isTaskAttempted(done)).toBe(true);

      const failed: Task = { ...pendingZero, status: "failed", attempts: 2 };
      expect(isTaskAttempted(failed)).toBe(true);

      const retrying: Task = { ...pendingZero, status: "pending", attempts: 1 };
      expect(isTaskAttempted(retrying)).toBe(true);
    });

    it("findExistingTaskForDate finds matching tasks with case-insensitivity, slug variations and aliases", () => {
      const gym = createTask("Gym", 60, 30, "2026-11-15", "g-1");
      const cleanRoom = createTask("clean-your-room", 25, 10, "2026-11-15", "c-1");
      const reading = createTask("reading book", 25, 20, "2026-11-15", "r-1");
      const tasks = [gym, cleanRoom, reading];

      // Exact case-insensitive
      expect(findExistingTaskForDate(tasks, "gym", "2026-11-15")).toEqual(gym);
      expect(findExistingTaskForDate(tasks, "GYM", "2026-11-15")).toEqual(gym);

      // Slug / hyphenated match
      expect(findExistingTaskForDate(tasks, "clean your room", "2026-11-15")).toEqual(cleanRoom);
      expect(findExistingTaskForDate(tasks, "cleanyourroom", "2026-11-15")).toEqual(cleanRoom);

      // Preset alias match
      expect(findExistingTaskForDate(tasks, "read book", "2026-11-15")).toEqual(reading);

      // Different date should not match
      expect(findExistingTaskForDate(tasks, "gym", "2026-11-16")).toBeUndefined();

      // Non-existent task should not match
      expect(findExistingTaskForDate(tasks, "drink water", "2026-11-15")).toBeUndefined();
    });
  });
});
