import { describe, it, expect } from "vitest";
import {
  calculateTargetRotation,
  getSliceAtRotation,
  getSliceColor,
  describeSliceArc,
  truncateSliceLabel,
  pickRandomWinnerIndex,
} from "./wheel";

describe("lib/wheel: Slice geometry and landing rotation math (spec)", () => {
  it("lands precisely on the selected slice across 1, 2, 5, and 12 tasks", () => {
    const testSliceCounts = [1, 2, 5, 12];

    for (const N of testSliceCounts) {
      for (let winner = 0; winner < N; winner++) {
        const startRotation = Math.floor(Math.random() * 3600);
        const target = calculateTargetRotation(winner, N, startRotation, 5);

        // Must rotate forward
        expect(target).toBeGreaterThan(startRotation);

        // Verification: slice at top pointer must match winner index exactly
        const landedSlice = getSliceAtRotation(target, N);
        expect(landedSlice).toBe(winner);
      }
    }
  });

  it("consistently lands on chosen winner across 100+ random test spins with arbitrary start angles", () => {
    for (let i = 0; i < 100; i++) {
      const totalSlices = Math.floor(Math.random() * 16) + 1; // 1 to 16 tasks
      const winner = pickRandomWinnerIndex(totalSlices);
      const startRotation = Math.random() * 7200; // arbitrary current angle
      const spins = Math.floor(Math.random() * 4) + 4; // 4 to 7 full spins

      const target = calculateTargetRotation(
        winner,
        totalSlices,
        startRotation,
        spins
      );
      const landed = getSliceAtRotation(target, totalSlices);

      expect(landed).toBe(winner);
    }
  });

  it("prevents adjacent slices from sharing the same color", () => {
    // Test slice counts from 2 to 15
    for (let total = 2; total <= 15; total++) {
      for (let i = 0; i < total; i++) {
        const currentColor = getSliceColor(i, total);
        const nextColor = getSliceColor((i + 1) % total, total);
        expect(currentColor).not.toBe(nextColor);
      }
    }
  });

  it("generates valid SVG arc path strings", () => {
    const path = describeSliceArc(200, 200, 190, 0, 90);
    expect(path).toContain("M 200 200");
    expect(path).toContain("A 190 190");
    expect(path).toContain("Z");
  });

  it("truncates long task names with ellipsis", () => {
    expect(truncateSliceLabel("Short", 10)).toBe("Short");
    expect(truncateSliceLabel("Very long task name that exceeds limits", 12)).toBe(
      "Very long t…"
    );
  });
});
