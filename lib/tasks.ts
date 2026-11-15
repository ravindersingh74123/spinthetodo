/**
 * Pure task lifecycle transitions and selectors for Spin the Wheel Todo.
 *
 * Ground rules:
 * - Pure functions only, no React, no localStorage, completely testable.
 * - 2-attempt rule: pending -> active -> not completed -> attempts=1 (pending again)
 *                   pending -> active -> not completed -> attempts=2 (failed, penalty applied)
 */

import { Task, MAX_TASK_ATTEMPTS } from "./types";

export interface DefaultTaskPreset {
  name: string;
  durationMin: number;
  points: number;
  category: string;
}

export const DEFAULT_TASK_PRESETS: readonly DefaultTaskPreset[] = [
  { name: "gym", durationMin: 60, points: 30, category: "Fitness" },
  { name: "clean your room", durationMin: 25, points: 10, category: "Home" },
  { name: "drink water", durationMin: 5, points: 5, category: "Health" },
  { name: "dsa", durationMin: 60, points: 30, category: "Coding" },
  { name: "read book", durationMin: 25, points: 20, category: "Mind" },
  { name: "journal", durationMin: 15, points: 10, category: "Reflection" },
];

export interface TaskInputValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    durationMin?: string;
    points?: string;
  };
}

/**
 * Validates task creation parameters:
 * - name: non-empty string
 * - durationMin: integer from 1 to 240
 * - points: integer >= 0
 */
export function validateTaskInput(
  name: string,
  durationMin: number,
  points: number
): TaskInputValidationResult {
  const errors: TaskInputValidationResult["errors"] = {};

  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = "Task name cannot be empty";
  }

  if (
    !Number.isInteger(durationMin) ||
    durationMin < 1 ||
    durationMin > 240
  ) {
    errors.durationMin = "Duration must be an integer between 1 and 240 minutes";
  }

  if (!Number.isInteger(points) || points < 0) {
    errors.points = "Points must be a non-negative integer";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Creates a new task object with status 'pending' and 0 attempts.
 */
export function createTask(
  name: string,
  durationMin: number,
  points: number,
  date: string,
  id: string = crypto.randomUUID()
): Task {
  const validation = validateTaskInput(name, durationMin, points);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(`Invalid task input: ${firstError}`);
  }

  return {
    id,
    name: name.trim(),
    durationMin,
    points,
    date,
    status: "pending",
    attempts: 0,
  };
}

/**
 * Transitions a task from 'pending' to 'active' when it lands on the wheel.
 * Sets startedAt timestamp.
 */
export function startTask(task: Task, startedAt: number): Task {
  if (task.status !== "pending") {
    throw new Error(
      `Cannot start task ${task.id}: expected status 'pending', got '${task.status}'`
    );
  }

  return {
    ...task,
    status: "active",
    startedAt,
  };
}

/**
 * Transitions a task from 'active' to 'done' when finished early or confirmed on timer end.
 * Sets completedAt timestamp.
 */
export function completeTask(task: Task, completedAt: number): Task {
  if (task.status !== "active") {
    throw new Error(
      `Cannot complete task ${task.id}: expected status 'active', got '${task.status}'`
    );
  }

  return {
    ...task,
    status: "done",
    completedAt,
  };
}

export interface MarkNotCompletedResult {
  updatedTask: Task;
  didFail: boolean;
}

/**
 * Transitions an active task when it was not completed.
 * Applies the 2-attempt rule:
 * - If new attempts < 2: returns to 'pending' (back to wheel).
 * - If new attempts >= 2: becomes 'failed' (removed from wheel, penalty applies).
 */
export function markNotCompleted(task: Task): MarkNotCompletedResult {
  if (task.status !== "active") {
    throw new Error(
      `Cannot mark task ${task.id} as not completed: expected status 'active', got '${task.status}'`
    );
  }

  const newAttempts = task.attempts + 1;
  const didFail = newAttempts >= MAX_TASK_ATTEMPTS;

  const updatedTask: Task = {
    ...task,
    attempts: newAttempts,
    status: didFail ? "failed" : "pending",
    startedAt: undefined,
  };

  return {
    updatedTask,
    didFail,
  };
}

// ==========================================
// Selectors & Predicates
// ==========================================

/**
 * Returns tasks for a date that have status 'pending'.
 */
export function pendingTasks(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date && t.status === "pending");
}

/**
 * Returns the currently active task if any, otherwise null.
 */
export function activeTask(tasks: Task[]): Task | null {
  return tasks.find((t) => t.status === "active") ?? null;
}

/**
 * Returns completed tasks for a date.
 */
export function completedTasks(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date && t.status === "done");
}

/**
 * Returns failed tasks for a date.
 */
export function failedTasks(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date && t.status === "failed");
}

/**
 * Returns all tasks for a specific date.
 */
export function tasksForDate(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.date === date);
}

/**
 * Tasks can only be deleted while they are pending.
 */
export function canDeleteTask(task: Task): boolean {
  return task.status === "pending";
}

/**
 * A perfect day requires at least 1 task for the date, and EVERY task for that date must be 'done'.
 */
export function isAllTasksDoneForDate(tasks: Task[], date: string): boolean {
  const dayTasks = tasksForDate(tasks, date);
  if (dayTasks.length === 0) return false;
  return dayTasks.every((t) => t.status === "done");
}

/**
 * Checks whether a task has already been attempted:
 * - active (currently running)
 * - done (completed)
 * - failed (failed after 2 attempts)
 * - attempts > 0 (attempted at least once, e.g. retry 1/2)
 */
export function isTaskAttempted(task: Task): boolean {
  return (
    task.attempts > 0 ||
    task.status === "done" ||
    task.status === "failed" ||
    task.status === "active"
  );
}

/**
 * Normalizes a task name for comparison (strips punctuation/hyphens, lowercases).
 */
export function normalizeTaskKey(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds an existing task for a given date matching the given task name.
 * Supports exact matches, hyphenated/slug matches, and common preset aliases
 * (e.g., 'reading book' matches 'read book', 'clean-your-room' matches 'clean your room').
 */
export function findExistingTaskForDate(
  tasks: Task[],
  name: string,
  date: string
): Task | undefined {
  if (!name || !date) return undefined;
  const targetKey = normalizeTaskKey(name);
  if (!targetKey) return undefined;

  return tasks.find((t) => {
    if (t.date !== date) return false;
    const existingKey = normalizeTaskKey(t.name);
    if (existingKey === targetKey) return true;

    // Fuzzy / alias matches for known default categories
    const isTargetRead = targetKey.includes("read") && targetKey.includes("book");
    const isExistingRead = existingKey.includes("read") && existingKey.includes("book");
    if (isTargetRead && isExistingRead) return true;

    const isTargetClean = targetKey.includes("clean") && targetKey.includes("room");
    const isExistingClean = existingKey.includes("clean") && existingKey.includes("room");
    if (isTargetClean && isExistingClean) return true;

    const isTargetWater = targetKey.includes("drink") && targetKey.includes("water");
    const isExistingWater = existingKey.includes("drink") && existingKey.includes("water");
    if (isTargetWater && isExistingWater) return true;

    return false;
  });
}
