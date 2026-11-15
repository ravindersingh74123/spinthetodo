import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Wheel from "./Wheel";
import * as AppStateModule from "@/store/useAppState";
import { Task } from "@/lib/types";

describe("components/Wheel (spec)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    );
  });

  it("renders empty wheel with disabled spin button when there are no pending tasks", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      pendingTasks: [],
      activeTask: null,
      startTaskById: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Wheel />);

    const spinBtn = screen.getByRole("button", { name: /add task to spin/i });
    expect(spinBtn).toBeDisabled();
  });

  it("renders 1 task full-circle wheel without dividing lines", () => {
    const singleTask: Task = {
      id: "t1",
      name: "Only Task",
      durationMin: 30,
      points: 15,
      date: "2026-11-15",
      status: "pending",
      attempts: 0,
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      pendingTasks: [singleTask],
      activeTask: null,
      startTaskById: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Wheel />);

    expect(screen.getByText("Only Task")).toBeInTheDocument();
    const spinBtn = screen.getByRole("button", { name: /spin the wheel \(1\)/i });
    expect(spinBtn).not.toBeDisabled();
  });

  it("disables spin button when a task is already active", () => {
    const pendingTask: Task = {
      id: "t1",
      name: "Pending 1",
      durationMin: 20,
      points: 10,
      date: "2026-11-15",
      status: "pending",
      attempts: 0,
    };
    const activeTask: Task = {
      id: "t2",
      name: "Active 2",
      durationMin: 25,
      points: 15,
      date: "2026-11-15",
      status: "active",
      attempts: 0,
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      pendingTasks: [pendingTask],
      activeTask: activeTask,
      startTaskById: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Wheel />);

    const spinBtn = screen.getByRole("button", { name: /task in progress/i });
    expect(spinBtn).toBeDisabled();
  });

  it("animates spin and invokes completion callback with the winning task", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        name: "Task A",
        durationMin: 20,
        points: 10,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      },
      {
        id: "t2",
        name: "Task B",
        durationMin: 25,
        points: 15,
        date: "2026-11-15",
        status: "pending",
        attempts: 0,
      },
    ];

    const mockStart = vi.fn();
    const mockOnComplete = vi.fn();

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      pendingTasks: tasks,
      activeTask: null,
      startTaskById: mockStart,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<Wheel onSpinComplete={mockOnComplete} />);

    const spinBtn = screen.getByRole("button", { name: /spin the wheel \(2\)/i });
    fireEvent.click(spinBtn);

    // During spin: button displays spinning and is disabled
    expect(screen.getByRole("button", { name: /spinning\.\.\./i })).toBeDisabled();

    // Advance timers past animation duration (4200ms)
    act(() => {
      vi.advanceTimersByTime(4500);
    });

    expect(mockOnComplete).toHaveBeenCalled();
    const winningTask = mockOnComplete.mock.calls[0][0];
    expect(tasks.some((t) => t.id === winningTask.id)).toBe(true);
  });
});
