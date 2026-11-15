"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppState } from "@/store/useAppState";
import { soundManager } from "@/lib/audio";

export default function ActiveTask() {
  const { activeTask, completeActiveTask, abandonActiveTask } = useAppState();
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);

  const handleComplete = useCallback(() => {
    soundManager.stopTaskAudio();
    completeActiveTask();
  }, [completeActiveTask]);

  const handleAbandon = useCallback((applyPenalty = false) => {
    soundManager.stopTaskAudio();
    abandonActiveTask(applyPenalty);
  }, [abandonActiveTask]);

  useEffect(() => {
    return () => {
      soundManager.stopTaskAudio();
    };
  }, []);

  // Local ticker state updated every second
  const [currentTime, setCurrentTime] = useState(() =>
    typeof window !== "undefined" ? Date.now() : 0
  );

  useEffect(() => {
    if (!activeTask || !activeTask.startedAt) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTask]);

  // Derivation of remaining time
  const { remainingMs, isExpired, progressPercent } = useMemo(() => {
    if (!activeTask || !activeTask.startedAt) {
      return { remainingMs: 0, isExpired: false, progressPercent: 0 };
    }

    const total = activeTask.durationMin * 60_000;
    // When currentTime is 0 (SSR or initial), compute fallback without drift
    const now = currentTime > 0 ? currentTime : activeTask.startedAt;
    const elapsed = now - activeTask.startedAt;
    const remaining = Math.max(0, total - elapsed);
    const expired = remaining === 0;
    const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

    return {
      remainingMs: remaining,
      isExpired: expired,
      progressPercent: progress,
    };
  }, [activeTask, currentTime]);

  // Keyboard navigation for completion prompt
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isExpired && !showConfirmAbandon) return;

      if (e.key === "y" || e.key === "Y") {
        handleComplete();
        setShowConfirmAbandon(false);
      } else if (e.key === "n" || e.key === "N") {
        handleAbandon(false);
        setShowConfirmAbandon(false);
      } else if (e.key === "Escape" && showConfirmAbandon) {
        setShowConfirmAbandon(false);
      }
    },
    [isExpired, showConfirmAbandon, handleComplete, handleAbandon]
  );

  const yesButtonRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isExpired) {
      yesButtonRef.current?.focus();
    }
  }, [isExpired]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Formatter for MM:SS or HH:MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // If no task is active, render nothing so the wheel remains the sole focus
  if (!activeTask) {
    return null;
  }

  const isAttemptTwo = activeTask.attempts === 1;

  return (
    <div className="pt-6 border-t border-carbon/20 relative overflow-hidden flex flex-col items-center text-center w-full max-w-md mx-auto">
      {/* Header with Active Badges */}
      <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-carbon/20">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold tracking-[0.032em] uppercase text-carbon">
            Focus Timer
          </h2>
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-sunburst text-carbon flex items-center gap-1">
            <span className="animate-pulse">⚡</span>
            <span>Running</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAttemptTwo && (
            <span
              className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-ember text-paper-white"
              title="Second attempt! If unfinished, penalty applies."
            >
              Final Attempt
            </span>
          )}
          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full border border-carbon bg-soft-mist text-carbon font-mono">
            +{activeTask.points} pts
          </span>
        </div>
      </div>

      {/* Main Focus Card Content */}
      <div className="flex flex-col items-center text-center py-2">
        {/* Task Name */}
        <h3
          className="text-lg sm:text-xl font-bold text-carbon max-w-md truncate px-2"
          title={activeTask.name}
        >
          {activeTask.name}
        </h3>
        <p className="text-xs text-neutral-500 font-medium mt-1">
          {activeTask.durationMin} min allocation • Attempt {activeTask.attempts + 1} of 2
        </p>

        {/* Giant Countdown: Lateral Font Style */}
        <div className="my-6">
          <span
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold uppercase text-carbon tracking-tight leading-none select-none tabular-nums"
            style={{ fontFamily: "var(--font-lateral)" }}
          >
            {formatTime(remainingMs)}
          </span>
        </div>

        {/* Progress Bar per design_todo.md (solid fill, 1px black border, no shadow) */}
        <div className="w-full max-w-md h-3.5 rounded-full border border-carbon bg-soft-mist overflow-hidden mb-6">
          <div
            className="h-full bg-electric-blue border-r border-carbon transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action Controls while running */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={handleComplete}
            className="flex-1 py-3 px-6 rounded-full border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-[0.032em] hover:bg-neutral-800 active:scale-95 transition-all shadow-none"
          >
            ✓ Done Early (+{activeTask.points} pts)
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmAbandon(true)}
            className="py-3 px-5 rounded-full border border-carbon bg-paper-white text-carbon text-xs font-bold uppercase tracking-[0.032em] hover:bg-soft-mist active:scale-95 transition-all"
          >
            Give Up
          </button>
        </div>
      </div>

      {/* "Did you complete it?" Yes/No Dialog (at Time 0 or on Reload after Expiry) */}
      {isExpired && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expiry-prompt-title"
          className="absolute inset-0 bg-paper-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30"
        >
          <div className="w-12 h-12 rounded-full border border-carbon bg-sunburst flex items-center justify-center text-xl mb-3 animate-bounce">
            ⏰
          </div>
          <span className="px-3 py-0.5 text-xs font-bold uppercase tracking-[0.032em] rounded-full border border-carbon bg-ember text-paper-white mb-2">
            Time&apos;s Up!
          </span>
          <h4
            id="expiry-prompt-title"
            className="text-2xl sm:text-3xl font-extrabold uppercase text-carbon tracking-tight leading-tight select-none mb-1"
            style={{ fontFamily: "var(--font-lateral)" }}
          >
            Did you complete it?
          </h4>
          <p className="text-xs text-neutral-600 max-w-sm mb-6 font-medium">
            &ldquo;{activeTask.name}&rdquo;
            {isAttemptTwo ? (
              <span className="block mt-1 text-ember font-bold">
                ⚠️ Final attempt: Selecting &apos;No&apos; will apply a -{activeTask.points} point penalty tomorrow.
              </span>
            ) : (
              <span className="block mt-1 text-neutral-500">
                Selecting &apos;No&apos; gives you 1 retry on the wheel before a penalty.
              </span>
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
            <button
              ref={yesButtonRef}
              type="button"
              autoFocus
              onClick={handleComplete}
              className="w-full py-3 px-6 rounded-full border border-carbon bg-mint-pop text-carbon text-xs font-bold uppercase tracking-[0.032em] hover:brightness-95 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-carbon"
            >
              YES, COMPLETED (+{activeTask.points} pts) [Y]
            </button>
            <button
              type="button"
              onClick={() => handleAbandon(false)}
              className="w-full py-3 px-6 rounded-full border border-carbon bg-paper-white text-ember border-ember hover:bg-ember/10 text-xs font-bold uppercase tracking-[0.032em] active:scale-95 transition-all"
            >
              NO, NOT COMPLETED [N]
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog when giving up early */}
      {showConfirmAbandon && !isExpired && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute inset-0 bg-paper-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-30"
        >
          <div className="w-10 h-10 rounded-full border border-carbon bg-ember text-paper-white flex items-center justify-center text-lg mb-2">
            ⚠️
          </div>
          <h4
            className="text-xl font-bold uppercase text-carbon mb-2"
            style={{ fontFamily: "var(--font-lateral)" }}
          >
            Abandon Task?
          </h4>
          <p className="text-xs text-neutral-600 max-w-xs mb-6 font-medium">
            {isAttemptTwo
              ? `This is your 2nd attempt. Abandoning will record this task as failed and apply a -${activeTask.points} penalty tomorrow.`
              : "Abandoning now uses your 1st attempt. The task will return to the wheel for 1 final retry."}
          </p>

          <div className="flex items-center gap-3 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                handleAbandon(false);
                setShowConfirmAbandon(false);
              }}
              className="flex-1 py-2.5 px-4 rounded-full border border-carbon bg-ember text-paper-white text-xs font-bold uppercase tracking-[0.032em] hover:bg-neutral-800 transition-all"
            >
              Confirm Abandon
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmAbandon(false)}
              className="flex-1 py-2.5 px-4 rounded-full border border-carbon bg-paper-white text-carbon text-xs font-bold uppercase tracking-[0.032em] hover:bg-soft-mist transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
