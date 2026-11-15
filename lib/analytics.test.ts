import { describe, it, expect } from "vitest";
import {
  calculateTaskHabits,
  filterByTimeRange,
  computeMacroAnalytics,
  calculateFocusAllocations,
} from "./analytics";
import { Task } from "./types";

describe("lib/analytics: Task frequency and consistency (spec)", () => {
  it("calculates exact frequency and completion rate for recurring tasks (e.g. Gym assigned 22 days, done 15 days)", () => {
    const tasks: Task[] = [];

    // Create 22 days of 'Gym' tasks, with 15 completed and 7 pending/failed
    for (let day = 1; day <= 22; day++) {
      const dayStr = `2026-11-${String(day).padStart(2, "0")}`;
      const isDone = day <= 15;
      tasks.push({
        id: `gym-${day}`,
        name: "Gym",
        durationMin: 60,
        points: 30,
        date: dayStr,
        status: isDone ? "done" : "pending",
        attempts: isDone ? 1 : 0,
      });
    }

    const habits = calculateTaskHabits(tasks);

    expect(habits).toHaveLength(1);
    const gym = habits[0];
    expect(gym.name).toBe("Gym");
    expect(gym.totalAssigned).toBe(22);
    expect(gym.daysScheduled).toBe(22);
    expect(gym.totalCompleted).toBe(15);
    expect(gym.daysCompleted).toBe(15);
    // 15 / 22 = 68.18% -> 68%
    expect(gym.completionRate).toBe(68);
    // 15 * 60 = 900 minutes
    expect(gym.totalMinutes).toBe(900);
    // 15 * 30 = 450 points
    expect(gym.totalPoints).toBe(450);
  });

  it("normalizes case and whitespace when grouping tasks", () => {
    const tasks: Task[] = [
      {
        id: "1",
        name: "read book",
        durationMin: 20,
        points: 10,
        date: "2026-11-01",
        status: "done",
        attempts: 0,
      },
      {
        id: "2",
        name: "Read Book",
        durationMin: 20,
        points: 10,
        date: "2026-11-02",
        status: "done",
        attempts: 0,
      },
      {
        id: "3",
        name: "  READ BOOK  ",
        durationMin: 20,
        points: 10,
        date: "2026-11-03",
        status: "pending",
        attempts: 0,
      },
    ];

    const habits = calculateTaskHabits(tasks);
    expect(habits).toHaveLength(1);
    expect(habits[0].totalAssigned).toBe(3);
    expect(habits[0].totalCompleted).toBe(2);
    expect(habits[0].completionRate).toBe(67);
  });

  it("handles empty tasks safely", () => {
    const macro = computeMacroAnalytics([], [], "this_month", "2026-11-15");
    expect(macro.totalTasksAssigned).toBe(0);
    expect(macro.totalTasksCompleted).toBe(0);
    expect(macro.overallCompletionRate).toBe(0);
    expect(macro.totalFocusHours).toBe("0.0");
    expect(macro.mostFrequentTask).toBeNull();
    expect(macro.bestCompletionTask).toBeNull();
    expect(macro.taskHabits).toEqual([]);
    expect(macro.categoryAllocations).toEqual([]);
  });

  it("filters accurately across this_month, last_30_days, and all_time", () => {
    const tasks: Task[] = [
      {
        id: "oct",
        name: "Oct Task",
        durationMin: 15,
        points: 5,
        date: "2026-10-15",
        status: "done",
        attempts: 0,
      },
      {
        id: "nov",
        name: "Nov Task",
        durationMin: 30,
        points: 15,
        date: "2026-11-10",
        status: "done",
        attempts: 0,
      },
    ];

    const thisMonth = filterByTimeRange(tasks, "this_month", "2026-11-15");
    expect(thisMonth).toHaveLength(1);
    expect(thisMonth[0].name).toBe("Nov Task");

    const allTime = filterByTimeRange(tasks, "all_time", "2026-11-15");
    expect(allTime).toHaveLength(2);
  });

  it("computes focus category time allocation percentages", () => {
    const habits = [
      {
        name: "Coding",
        normalizedName: "coding",
        totalAssigned: 10,
        daysScheduled: 10,
        totalCompleted: 8,
        daysCompleted: 8,
        completionRate: 80,
        totalMinutes: 300,
        totalPoints: 100,
      },
      {
        name: "Workout",
        normalizedName: "workout",
        totalAssigned: 5,
        daysScheduled: 5,
        totalCompleted: 5,
        daysCompleted: 5,
        completionRate: 100,
        totalMinutes: 100,
        totalPoints: 50,
      },
    ];

    const allocations = calculateFocusAllocations(habits);
    expect(allocations).toHaveLength(2);
    expect(allocations[0].name).toBe("Coding");
    expect(allocations[0].percentage).toBe(75); // 300 / 400 = 75%
    expect(allocations[1].name).toBe("Workout");
    expect(allocations[1].percentage).toBe(25); // 100 / 400 = 25%
  });
});
