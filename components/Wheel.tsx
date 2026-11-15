"use client";

import React, { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { useAppState } from "@/store/useAppState";
import { Task } from "@/lib/types";
import {
  getSliceColor,
  describeSliceArc,
  calculateTargetRotation,
  pickRandomWinnerIndex,
  truncateSliceLabel,
} from "@/lib/wheel";
import { soundManager } from "@/lib/audio";

interface WheelProps {
  onSpinComplete?: (winningTask: Task) => void;
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Wheel({ onSpinComplete }: WheelProps) {
  const { pendingTasks, activeTask, startTaskById } = useAppState();

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted());

  // Detect user preference for reduced motion via useSyncExternalStore
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );

  const totalSlices = pendingTasks.length;
  const isSpinDisabled = isSpinning || totalSlices === 0 || activeTask !== null;

  const currentWinnerRef = useRef<Task | null>(null);
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending tick timer on unmount
  useEffect(() => {
    return () => {
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
      }
      soundManager.stopTaskAudio();
    };
  }, []);

  const toggleSound = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    if (nextMuted) {
      soundManager.stopTaskAudio();
    }
  };

  /**
   * Schedules tactile mechanical ratchet clicks that slow down as the wheel decelerates.
   */
  const scheduleDeceleratingTicks = (durationMs: number) => {
    let elapsed = 0;
    let delay = prefersReducedMotion ? 100 : 50;

    const playNextTick = () => {
      soundManager.playClick();
      elapsed += delay;

      const progress = elapsed / durationMs;
      if (progress < 0.25) {
        delay = 55;
      } else if (progress < 0.5) {
        delay = 90;
      } else if (progress < 0.75) {
        delay = 160;
      } else if (progress < 0.9) {
        delay = 280;
      } else {
        delay = 420;
      }

      if (elapsed < durationMs - 80) {
        tickTimeoutRef.current = setTimeout(playNextTick, delay);
      }
    };

    playNextTick();
  };

  const handleSpin = () => {
    if (isSpinDisabled) return;

    soundManager.stopTaskAudio();

    // 1. Pick winner FIRST (pure uniform random)
    const winnerIndex = pickRandomWinnerIndex(totalSlices);
    const winner = pendingTasks[winnerIndex];
    if (!winner) return;

    currentWinnerRef.current = winner;
    setSelectedTask(null);
    setIsSpinning(true);

    // 2. Compute exact rotation that lands 12 o'clock pointer on winner
    const spins = prefersReducedMotion ? 1 : 5;
    const targetRotation = calculateTargetRotation(
      winnerIndex,
      totalSlices,
      rotation,
      spins
    );

    setRotation(targetRotation);

    const spinDurationMs = prefersReducedMotion ? 400 : 4200;

    // 3. Start mechanical ticking sounds
    scheduleDeceleratingTicks(spinDurationMs);

    // 4. Complete spin after animation duration
    setTimeout(() => {
      if (tickTimeoutRef.current) {
        clearTimeout(tickTimeoutRef.current);
      }

      setIsSpinning(false);
      setSelectedTask(winner);

      // Play victory chime on landing
      soundManager.playWinChime();
      // Play task-specific background audio capped at 10 seconds
      soundManager.playTaskAudio(winner.name, 10000);

      if (onSpinComplete) {
        onSpinComplete(winner);
      } else {
        // Default action: activate task
        startTaskById(winner.id);
      }
    }, spinDurationMs);
  };

  // Dimensions
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;

  const sliceAngle = totalSlices > 0 ? 360 / totalSlices : 360;

  return (
    <div className="flex flex-col items-center text-center py-2 select-none">
      {/* SVG Wheel Container with Fixed Top Pointer */}
      <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] flex items-center justify-center select-none my-2">
        {/* Animated Dashed Orbit Ring */}
        <div
          className={`absolute -inset-3 sm:-inset-4 rounded-full border border-dashed border-carbon/25 pointer-events-none transition-all ${
            isSpinning && !prefersReducedMotion ? "animate-spin" : ""
          }`}
          style={{ animationDuration: "14s" }}
        />

        {/* Top Pointer with Mechanical Ratchet Flutter Animation */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 z-20 pointer-events-none origin-top ${
            isSpinning && !prefersReducedMotion ? "animate-pointer-tick" : ""
          }`}
        >
          <svg width="28" height="28" viewBox="0 0 28 28">
            <polygon
              points="4,2 24,2 14,24"
              fill="#000000"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle
              cx="14"
              cy="8"
              r="2.5"
              fill="#ffd731"
              stroke="#000000"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Rotating SVG Wheel */}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={`w-full h-full rounded-full border-2 border-carbon overflow-hidden bg-soft-mist transition-transform ${
            isSpinning ? "cursor-wait" : ""
          }`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${prefersReducedMotion ? "0.4s" : "4.2s"} cubic-bezier(0.12, 0.88, 0.2, 1)`
              : "none",
          }}
          aria-label="Task Wheel"
          role="img"
        >
          {totalSlices === 0 ? (
            /* Empty Wheel Circle */
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="#e9e9e9"
              stroke="#000000"
              strokeWidth="1.5"
            />
          ) : totalSlices === 1 ? (
            /* 1 Task Edge Case: Full Circle, No dividing lines per spec */
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={getSliceColor(0, 1)}
                stroke="#000000"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={cy - 60}
                textAnchor="middle"
                fill="#000000"
                className="font-bold uppercase tracking-[0.032em]"
                fontSize="16"
              >
                {truncateSliceLabel(pendingTasks[0].name, 18)}
              </text>
              <text
                x={cx}
                y={cy - 38}
                textAnchor="middle"
                fill="#000000"
                className="font-bold opacity-80"
                fontSize="12"
              >
                ⏱️ {pendingTasks[0].durationMin}m • +{pendingTasks[0].points} pts
              </text>
            </g>
          ) : (
            /* Multiple Tasks: Equal Slices */
            pendingTasks.map((task, index) => {
              const startAngle = index * sliceAngle;
              const endAngle = (index + 1) * sliceAngle;
              const midAngle = (startAngle + endAngle) / 2;
              const fillColor = getSliceColor(index, totalSlices);
              const pathD = describeSliceArc(cx, cy, r, startAngle, endAngle);

              // Responsive label sizing based on number of slices
              const fontSize = totalSlices > 8 ? 11 : totalSlices > 5 ? 12 : 13;
              const maxLabelLength = totalSlices > 8 ? 10 : 14;

              return (
                <g key={task.id}>
                  {/* Slice Arc */}
                  <path
                    d={pathD}
                    fill={fillColor}
                    stroke="#000000"
                    strokeWidth="1.5"
                  />

                  {/* Slice Text positioned along ray from center */}
                  <g transform={`rotate(${midAngle}, ${cx}, ${cy})`}>
                    <text
                      x={cx}
                      y={cy - r + 30}
                      textAnchor="middle"
                      fill="#000000"
                      className="font-extrabold uppercase tracking-[0.032em] select-none"
                      style={{ fontFamily: "var(--font-aeonik)" }}
                      fontSize={fontSize}
                    >
                      {truncateSliceLabel(task.name, maxLabelLength)}
                    </text>
                    <text
                      x={cx}
                      y={cy - r + 50}
                      textAnchor="middle"
                      fill="#000000"
                      className="font-bold opacity-80 select-none"
                      style={{ fontFamily: "var(--font-aeonik)" }}
                      fontSize={Math.max(9, fontSize - 2)}
                    >
                      {task.durationMin}m • +{task.points}p
                    </text>
                  </g>
                </g>
              );
            })
          )}

          {/* Center Hub Badge per design_todo.md */}
          <circle
            cx={cx}
            cy={cy}
            r="32"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="2"
          />
          <circle cx={cx} cy={cy} r="12" fill="#000000" />
          <circle
            cx={cx}
            cy={cy}
            r="4"
            fill="#ffd731"
            className={isSpinning && !prefersReducedMotion ? "animate-pulse" : ""}
          />
        </svg>
      </div>

      {/* Landing / Selected Notification with Celebratory Confetti Stickers */}
      {selectedTask && !isSpinning && (
        <div className="mt-4 px-4 py-2 rounded-full border border-carbon bg-mint-pop text-carbon text-xs font-bold animate-bounce flex items-center gap-1.5 shadow-none">
          <span>🎯</span>
          <span>
            Landed on: <strong className="underline">{selectedTask.name}</strong> ({selectedTask.durationMin} min)
          </span>
          <span>🎉</span>
        </div>
      )}

      {/* Controls: Spin Button & Sound Effects Toggle */}
      <div className="mt-5 flex flex-col items-center gap-2.5 w-full max-w-xs">
        <button
          type="button"
          onClick={handleSpin}
          disabled={isSpinDisabled}
          className={`w-full py-3.5 px-6 rounded-full border border-carbon text-xs font-bold uppercase tracking-[0.032em] transition-all ${
            isSpinDisabled
              ? "bg-soft-mist text-neutral-400 cursor-not-allowed border-neutral-300"
              : "bg-carbon text-paper-white hover:bg-neutral-800 active:scale-95 cursor-pointer shadow-none"
          }`}
        >
          {isSpinning
            ? "Spinning..."
            : activeTask !== null
            ? "Task In Progress"
            : totalSlices === 0
            ? "Add Task to Spin"
            : `SPIN THE WHEEL (${totalSlices})`}
        </button>

        {/* Sound Effects Toggle Button */}
        <button
          type="button"
          onClick={toggleSound}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-carbon/40 bg-paper-white hover:bg-soft-mist text-carbon text-[11px] font-bold transition-all active:scale-95"
          aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          title={isMuted ? "Sound muted. Click to enable." : "Sound active. Click to mute."}
        >
          <span>{isMuted ? "🔇" : "🔊"}</span>
          <span>{isMuted ? "Sound Off" : "Sound On"}</span>
        </button>
      </div>
    </div>
  );
}
