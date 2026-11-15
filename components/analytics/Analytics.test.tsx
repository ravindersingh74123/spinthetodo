import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import KpiCards from "./KpiCards";
import TaskReliabilityChart from "./TaskReliabilityChart";
import DailyActivityChart from "./DailyActivityChart";
import FocusAllocationChart from "./FocusAllocationChart";
import { MacroAnalytics } from "@/lib/analytics";

describe("components/analytics (spec)", () => {
  const mockAnalytics: MacroAnalytics = {
    totalTasksAssigned: 22,
    totalTasksCompleted: 15,
    overallCompletionRate: 68,
    totalFocusMinutes: 900,
    totalFocusHours: "15.0",
    totalPointsEarned: 450,
    mostFrequentTask: {
      name: "Gym",
      normalizedName: "gym",
      totalAssigned: 22,
      daysScheduled: 22,
      totalCompleted: 15,
      daysCompleted: 15,
      completionRate: 68,
      totalMinutes: 900,
      totalPoints: 450,
    },
    bestCompletionTask: {
      name: "Gym",
      normalizedName: "gym",
      totalAssigned: 22,
      daysScheduled: 22,
      totalCompleted: 15,
      daysCompleted: 15,
      completionRate: 68,
      totalMinutes: 900,
      totalPoints: 450,
    },
    taskHabits: [
      {
        name: "Gym",
        normalizedName: "gym",
        totalAssigned: 22,
        daysScheduled: 22,
        totalCompleted: 15,
        daysCompleted: 15,
        completionRate: 68,
        totalMinutes: 900,
        totalPoints: 450,
      },
      {
        name: "Read Book",
        normalizedName: "read book",
        totalAssigned: 10,
        daysScheduled: 10,
        totalCompleted: 8,
        daysCompleted: 8,
        completionRate: 80,
        totalMinutes: 200,
        totalPoints: 80,
      },
    ],
    dailyTimeline: [
      {
        date: "2026-11-14",
        dayLabel: "11/14",
        completedCount: 2,
        assignedCount: 3,
        failedCount: 0,
        netPoints: 40,
      },
      {
        date: "2026-11-15",
        dayLabel: "11/15",
        completedCount: 1,
        assignedCount: 1,
        failedCount: 0,
        netPoints: 20,
      },
    ],
    categoryAllocations: [
      {
        name: "Gym",
        minutes: 900,
        percentage: 82,
        color: "#4da2ff",
        offset: 0,
      },
      {
        name: "Read Book",
        minutes: 200,
        percentage: 18,
        color: "#55db9c",
        offset: 82,
      },
    ],
  };

  it("renders KpiCards with accurate metrics and top habit highlight", () => {
    render(<KpiCards analytics={mockAnalytics} />);

    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText(/15 of 22 missions done/i)).toBeInTheDocument();
    expect(screen.getByText("15.0")).toBeInTheDocument();
    expect(screen.getByText("Gym")).toBeInTheDocument();
    expect(screen.getByText(/15\/22 days \(68%\)/i)).toBeInTheDocument();
  });

  it("renders TaskReliabilityChart showing Gym 15 of 22 days and allows sorting", () => {
    render(<TaskReliabilityChart habits={mockAnalytics.taskHabits} />);

    expect(screen.getByText("Gym")).toBeInTheDocument();
    expect(screen.getByText(/15 of 22 days/i)).toBeInTheDocument();
    expect(screen.getByText("68% Done")).toBeInTheDocument();
    expect(screen.getByText("Read Book")).toBeInTheDocument();
    expect(screen.getByText("80% Done")).toBeInTheDocument();

    // Sorter buttons
    const successBtn = screen.getByRole("button", { name: /success %/i });
    fireEvent.click(successBtn);
    // Read Book has 80% so after sorting by success %, both are present
    expect(screen.getByText("80% Done")).toBeInTheDocument();
  });

  it("renders DailyActivityChart with timeline points", () => {
    render(<DailyActivityChart timeline={mockAnalytics.dailyTimeline} />);

    expect(screen.getByText("14-Day Momentum Flow")).toBeInTheDocument();
    expect(screen.getByText("11/14")).toBeInTheDocument();
    expect(screen.getByText("11/15")).toBeInTheDocument();
  });

  it("renders FocusAllocationChart with habit legend and percentage slices", () => {
    render(
      <FocusAllocationChart
        allocations={mockAnalytics.categoryAllocations}
        totalHours={mockAnalytics.totalFocusHours}
      />
    );

    expect(screen.getByText("Focus Time Distribution")).toBeInTheDocument();
    expect(screen.getByText("15.0h")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("18%")).toBeInTheDocument();
  });
});
