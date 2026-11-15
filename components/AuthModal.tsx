"use client";

import React, { useState, useEffect } from "react";
import { useAppState } from "@/store/useAppState";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { tasks, ledger, activeTaskId } = useAppState();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check auth status on open
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        if (data.notConfigured) {
          setErrorMessage(
            "Neon DB is not connected yet. Add DATABASE_URL to your environment variables."
          );
        } else {
          setErrorMessage(data.error || "Authentication failed");
        }
        return;
      }

      setUser(data.user);
      setSuccessMessage(
        mode === "register"
          ? "Account created and signed in!"
          : "Signed in successfully!"
      );

      // Now sync with Neon DB:
      // Try to fetch existing remote data first
      const syncRes = await fetch("/api/sync");
      const syncData = await syncRes.json();

      if (syncData.success && syncData.state && syncData.state.tasks?.length > 0) {
        // Cloud has existing tasks -> load them
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "spinthetodo_state_v1",
            JSON.stringify(syncData.state)
          );
          setTimeout(() => {
            window.location.reload();
          }, 600);
        }
      } else {
        // Push local tasks up to Neon DB
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: {
              tasks,
              ledger,
              activeTaskId,
              schemaVersion: 1,
            },
          }),
        });
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Network error connecting to auth server");
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setIsSubmitting(false);
    setUser(null);
    setSuccessMessage("Signed out");
  };

  const handleSyncNow = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("Syncing with Neon DB...");

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            tasks,
            ledger,
            activeTaskId,
            schemaVersion: 1,
          },
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        setSuccessMessage("✓ All tasks and streaks synced to Neon DB!");
      } else {
        setErrorMessage(data.error || "Sync failed");
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Failed to sync with Neon DB");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[20px] border-2 border-carbon bg-paper-white p-6 shadow-2xl relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-carbon/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-carbon">
              {user ? "Cloud Account" : mode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-carbon text-xs font-black text-carbon hover:bg-soft-mist cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* User is already signed in */}
        {user ? (
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-[16px] border border-carbon bg-soft-mist/60 text-center">
              <span className="text-[10px] font-bold text-carbon/60 uppercase tracking-wider block mb-1">
                Signed in as
              </span>
              <span className="font-mono text-lg font-black text-carbon">
                @{user.username}
              </span>
              <p className="text-[11px] text-carbon/60 mt-1">
                Your tasks and history sync live between your laptop and phone via Neon DB.
              </p>
            </div>

            {successMessage && (
              <div className="p-2.5 rounded-[12px] text-xs font-bold bg-mint-pop/20 border border-mint-pop text-carbon">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-[12px] text-xs font-bold bg-ember/15 border border-ember text-ember">
                {errorMessage}
              </div>
            )}

            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full border border-carbon bg-mint-pop text-carbon text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Syncing..." : "⚡ Sync with Neon DB Now"}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full border border-carbon bg-paper-white text-carbon text-xs font-bold uppercase tracking-wider hover:bg-soft-mist transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* User is not signed in: Minimalist Username & Password form */
          <div className="mt-4 space-y-4">
            <p className="text-[11px] font-medium text-carbon/60">
              {mode === "login"
                ? "Sign in to sync your to-dos, streaks, and analytics between your laptop and phone."
                : "Create a simple username & password to sync all devices."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="auth-username"
                  className="block text-[11px] font-bold uppercase tracking-wide text-carbon mb-1"
                >
                  Username
                </label>
                <input
                  id="auth-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ravinder"
                  required
                  className="w-full px-3 py-2 text-xs font-medium rounded-[12px] border border-carbon bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[11px] font-bold uppercase tracking-wide text-carbon mb-1"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 text-xs font-medium rounded-[12px] border border-carbon bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon"
                />
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-[12px] text-[11px] font-bold bg-ember/15 border border-ember text-ember">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-[12px] text-[11px] font-bold bg-mint-pop/20 border border-mint-pop text-carbon">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !username.trim() || !password}
                className="w-full mt-2 py-2.5 rounded-full border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting
                  ? "Processing..."
                  : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            {/* Mode switch */}
            <div className="pt-2 text-center border-t border-carbon/10">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className="text-[11px] font-bold text-carbon/70 hover:text-carbon underline cursor-pointer"
              >
                {mode === "login"
                  ? "Don't have an account? Create one"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
