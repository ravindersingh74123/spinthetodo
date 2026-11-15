import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppStateProvider, useAppState } from "./useAppState";
import { STORAGE_KEY } from "@/lib/types";

describe("store/useAppState: State container and persistence glue (spec)", () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        localStorageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        localStorageMock = {};
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppStateProvider initialDate="2026-11-15">{children}</AppStateProvider>
  );

  it("initializes with clean state and hydrates", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.ledger).toEqual([]);
    expect(result.current.activeTaskId).toBeNull();
    expect(result.current.today).toBe("2026-11-15");
  });

  it("adds a task, updates pending list, and persists to localStorage", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      const res = result.current.addTask("Write unit tests", 30, 20);
      expect(res.success).toBe(true);
    });

    expect(result.current.tasks.length).toBe(1);
    expect(result.current.todayTasks.length).toBe(1);
    expect(result.current.pendingTasks.length).toBe(1);
    expect(result.current.pendingTasks[0].name).toBe("Write unit tests");

    // Verify localStorage has persisted data
    const raw = localStorageMock[STORAGE_KEY];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.tasks.length).toBe(1);
    expect(parsed.tasks[0].name).toBe("Write unit tests");
  });

  it("deletes a pending task and updates storage", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    let taskId = "";
    act(() => {
      const res = result.current.addTask("Task to delete", 15, 10);
      taskId = res.task?.id ?? "";
    });

    expect(result.current.tasks.length).toBe(1);

    act(() => {
      const delRes = result.current.deleteTask(taskId);
      expect(delRes.success).toBe(true);
    });

    expect(result.current.tasks.length).toBe(0);
    const parsed = JSON.parse(localStorageMock[STORAGE_KEY]);
    expect(parsed.tasks.length).toBe(0);
  });

  it("starts a task and sets activeTaskId", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    let taskId = "";
    act(() => {
      const res = result.current.addTask("Task to start", 25, 15);
      taskId = res.task?.id ?? "";
    });

    act(() => {
      const started = result.current.startTaskById(taskId);
      expect(started).toBe(true);
    });

    expect(result.current.activeTaskId).toBe(taskId);
    expect(result.current.activeTask?.name).toBe("Task to start");
    expect(result.current.pendingTasks.length).toBe(0);
  });

  it("completes active task: awards points today and triggers perfect-day bonus if all done", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    let taskId = "";
    act(() => {
      const res = result.current.addTask("Single task for today", 20, 25);
      taskId = res.task?.id ?? "";
    });

    act(() => {
      result.current.startTaskById(taskId);
    });

    act(() => {
      const completed = result.current.completeActiveTask();
      expect(completed).toBe(true);
    });

    expect(result.current.activeTaskId).toBeNull();
    expect(result.current.completedToday.length).toBe(1);

    // Ledger should have completion (+25) and perfect day bonus (+50)
    expect(result.current.ledger.length).toBe(2);
    expect(result.current.todayPoints).toBe(75); // 25 + 50
    expect(result.current.totalPoints).toBe(75);
    expect(result.current.currentStreak).toBe(1);
  });

  it("handles the 2-attempt rule when abandoning an active task", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    let taskId = "";
    act(() => {
      const res = result.current.addTask("Tough task", 45, 30);
      taskId = res.task?.id ?? "";
    });

    // 1st attempt: start then mark not completed
    act(() => {
      result.current.startTaskById(taskId);
    });
    act(() => {
      result.current.abandonActiveTask(false);
    });

    // Reverted to pending (back on wheel), attempts = 1, no penalty yet
    expect(result.current.activeTaskId).toBeNull();
    expect(result.current.pendingTasks.length).toBe(1);
    expect(result.current.pendingTasks[0].attempts).toBe(1);
    expect(result.current.ledger.length).toBe(0);

    // 2nd attempt: start again then mark not completed
    act(() => {
      result.current.startTaskById(taskId);
    });
    act(() => {
      result.current.abandonActiveTask(false);
    });

    // Marked failed, removed from pending, penalty added dated tomorrow
    expect(result.current.activeTaskId).toBeNull();
    expect(result.current.pendingTasks.length).toBe(0);
    expect(result.current.failedToday.length).toBe(1);
    expect(result.current.failedToday[0].attempts).toBe(2);

    expect(result.current.ledger.length).toBe(1);
    expect(result.current.ledger[0].reason).toBe("task_penalty");
    expect(result.current.ledger[0].delta).toBe(-30);
    expect(result.current.ledger[0].date).toBe("2026-11-16"); // Tomorrow!

    // Today's points remain 0, pending penalties for tomorrow is 1
    expect(result.current.todayPoints).toBe(0);
    expect(result.current.pendingPenaltiesTomorrow.length).toBe(1);
    // Lifetime total points is -30 (no floor)
    expect(result.current.totalPoints).toBe(-30);
  });

  it("prevents adding a task that has already been assigned and attempted for today", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    let taskId = "";
    act(() => {
      const res = result.current.addTask("Gym", 60, 30);
      expect(res.success).toBe(true);
      taskId = res.task!.id;
    });

    // Start gym task so it is now active/attempted
    act(() => {
      result.current.startTaskById(taskId);
    });

    // Attempting to add Gym again should fail with an error
    act(() => {
      const dup = result.current.addTask("gym", 45, 20);
      expect(dup.success).toBe(false);
      expect(dup.error).toContain("already been assigned and attempted for today");
    });

    // Only 1 task should exist
    expect(result.current.todayTasks.length).toBe(1);
  });
});
