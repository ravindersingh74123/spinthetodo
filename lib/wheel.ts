/**
 * Pure wheel slice geometry, color distribution, and rotation math for Spin the Wheel Todo.
 *
 * Rules:
 * - Equal slices, one per pending task.
 * - Random winner is chosen FIRST; animation lands exactly on the middle of that slice.
 * - Pointer is fixed at 12 o'clock (top center).
 * - Slices use the 6 brand sticker colors from design_todo.md.
 */

import { WHEEL_PALETTE } from "./types";

/**
 * Returns the color for slice at index out of total slices.
 * Ensures two adjacent slices never share the same color even when total > 6.
 */
export function getSliceColor(index: number, total: number): string {
  if (total === 1) {
    return WHEEL_PALETTE[0]; // Electric Blue for single task
  }

  const baseIndex = index % WHEEL_PALETTE.length;
  const baseColor = WHEEL_PALETTE[baseIndex];

  // If the last slice wraps around and would collide with slice 0's color:
  if (index === total - 1 && baseColor === WHEEL_PALETTE[0]) {
    return WHEEL_PALETTE[(baseIndex + 1) % WHEEL_PALETTE.length];
  }

  return baseColor;
}

/**
 * Computes SVG arc path for a slice spanning from startAngle to endAngle (in degrees from top).
 */
export function describeSliceArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const rad = Math.PI / 180;
  // Convert 12-o'clock-based angle to standard Cartesian coordinates
  const x1 = cx + r * Math.sin(startAngle * rad);
  const y1 = cy - r * Math.cos(startAngle * rad);
  const x2 = cx + r * Math.sin(endAngle * rad);
  const y2 = cy - r * Math.cos(endAngle * rad);

  const angleDelta = endAngle - startAngle;
  const largeArcFlag = angleDelta > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

/**
 * Selects a winner index uniformly at random.
 */
export function pickRandomWinnerIndex(totalSlices: number): number {
  if (totalSlices <= 0) return -1;
  return Math.floor(Math.random() * totalSlices);
}

/**
 * Calculates target rotation angle (in degrees) that will land the top pointer (12 o'clock)
 * directly in the center of the winning slice.
 *
 * @param winnerIndex Index of the winning slice (0 to totalSlices - 1)
 * @param totalSlices Number of slices on the wheel
 * @param currentRotation Current wheel rotation angle (accumulated)
 * @param fullSpins Number of full 360-degree spins to add (default 5)
 */
export function calculateTargetRotation(
  winnerIndex: number,
  totalSlices: number,
  currentRotation: number,
  fullSpins: number = 5
): number {
  if (totalSlices <= 0) return currentRotation;

  const sliceAngle = 360 / totalSlices;
  // Middle angle of the winning slice in original coordinates (clockwise from top)
  const sliceMidAngle = (winnerIndex + 0.5) * sliceAngle;

  // For pointer at 12 o'clock to hit sliceMidAngle, the wheel must rotate to:
  // (sliceMidAngle + rotation) % 360 = 0 -> rotation % 360 = 360 - sliceMidAngle
  const targetMod = ((360 - (sliceMidAngle % 360)) % 360 + 360) % 360;

  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta <= 0) {
    delta += 360;
  }

  return currentRotation + fullSpins * 360 + delta;
}

/**
 * Helper to determine which slice is under the 12 o'clock pointer at any rotation angle.
 * Used for mathematical verification and test assertions.
 */
export function getSliceAtRotation(
  rotation: number,
  totalSlices: number
): number {
  if (totalSlices <= 0) return -1;
  const sliceAngle = 360 / totalSlices;

  // The pointer is at 12 o'clock (angle 0).
  // A point on the wheel at original angle theta is now at (theta + rotation) % 360.
  // Setting (theta + rotation) % 360 = 0 gives theta = (360 - (rotation % 360)) % 360.
  const pointerSliceAngle = ((360 - (rotation % 360)) % 360 + 360) % 360;

  const index = Math.floor(pointerSliceAngle / sliceAngle);
  return Math.min(index, totalSlices - 1);
}

/**
 * Cleanly truncates a task name for slice labels.
 */
export function truncateSliceLabel(name: string, maxLen: number = 14): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}
