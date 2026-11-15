import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActiveTask from "./ActiveTask";
import * as AppStateModule from "@/store/useAppState";
import { Task } from "@/lib/types";

describe("components/ActiveTask (spec)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders null when there is no active task so the wheel stays the main focus", () => {
    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      activeTask: null,
      completeActiveTask: vi.fn(),
      abandonActiveTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    const { container } = render(<ActiveTask />);

    expect(container.firstChild).toBeNull();
  });

  it("derives remaining countdown from startedAt and renders task details", () => {
    const startedAt = Date.now() - 5 * 60 * 1000; // 5 min elapsed
    const task: Task = {
      id: "t1",
      name: "Focus on feature",
      durationMin: 25, // 25 min total -> 20 min remaining (20:00)
      points: 20,
      date: "2026-11-15",
      status: "active",
      attempts: 0,
      startedAt,
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      activeTask: task,
      completeActiveTask: vi.fn(),
      abandonActiveTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<ActiveTask />);

    expect(screen.getByText("Focus on feature")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    // 25m - 5m = 20:00
    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /done early/i })
    ).toBeInTheDocument();
  });

  it("completes active task immediately when Done early is clicked", () => {
    const mockComplete = vi.fn();
    const task: Task = {
      id: "t1",
      name: "Design sprint",
      durationMin: 30,
      points: 15,
      date: "2026-11-15",
      status: "active",
      attempts: 0,
      startedAt: Date.now() - 1000,
    };

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      activeTask: task,
      completeActiveTask: mockComplete,
      abandonActiveTask: vi.fn(),
    } as unknown as AppStateModule.AppStateContextValue);

    render(<ActiveTask />);

    const doneEarlyBtn = screen.getByRole("button", { name: /done early/i });
    fireEvent.click(doneEarlyBtn);

    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("immediately displays 'Did you complete it?' prompt when opened after timer expiry", () => {
    const startedAt = Date.now() - 35 * 60 * 1000; // 35 min elapsed for 30m task (expired!)
    const task: Task = {
      id: "t1",
      name: "Expired Task",
      durationMin: 30,
      points: 25,
      date: "2026-11-15",
      status: "active",
      attempts: 0,
      startedAt,
    };

    const mockComplete = vi.fn();
    const mockAbandon = vi.fn();

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      activeTask: task,
      completeActiveTask: mockComplete,
      abandonActiveTask: mockAbandon,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<ActiveTask />);

    expect(screen.getByText(/time's up!/i)).toBeInTheDocument();
    expect(screen.getByText(/did you complete it\?/i)).toBeInTheDocument();

    const yesBtn = screen.getByRole("button", { name: /yes, completed/i });
    const noBtn = screen.getByRole("button", { name: /no, not completed/i });

    expect(yesBtn).toBeInTheDocument();
    expect(noBtn).toBeInTheDocument();

    // Clicking Yes completes task
    fireEvent.click(yesBtn);
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("triggers abandonActiveTask(false) when user clicks No on expiry prompt", () => {
    const startedAt = Date.now() - 60 * 60 * 1000;
    const task: Task = {
      id: "t1",
      name: "Incomplete Task",
      durationMin: 15,
      points: 10,
      date: "2026-11-15",
      status: "active",
      attempts: 0,
      startedAt,
    };

    const mockAbandon = vi.fn();

    vi.spyOn(AppStateModule, "useAppState").mockReturnValue({
      activeTask: task,
      completeActiveTask: vi.fn(),
      abandonActiveTask: mockAbandon,
    } as unknown as AppStateModule.AppStateContextValue);

    render(<ActiveTask />);

    const noBtn = screen.getByRole("button", { name: /no, not completed/i });
    fireEvent.click(noBtn);

    expect(mockAbandon).toHaveBeenCalledWith(false);
  });
});
