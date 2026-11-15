"use client";

import React, { useState } from "react";
import {
  getStoredSyncCode,
  setStoredSyncCode,
  fetchRemoteState,
  pushLocalState,
} from "@/lib/sync";
import { useAppState } from "@/store/useAppState";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const { tasks, ledger, activeTaskId } = useAppState();

  const [syncCode, setSyncCode] = useState(() =>
    typeof window !== "undefined" ? getStoredSyncCode() : ""
  );
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!syncCode) return;
    try {
      await navigator.clipboard.writeText(syncCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSyncNow = async () => {
    if (!syncCode) return;
    setStatus("loading");
    setMessage("Syncing with Turso edge cloud...");

    const res = await pushLocalState(syncCode, {
      tasks,
      ledger,
      activeTaskId,
      schemaVersion: 1,
    });

    if (res.success) {
      setStatus("success");
      setMessage("✓ Successfully synced with Turso cloud!");
    } else if (res.notConfigured) {
      setStatus("error");
      setMessage(
        "Turso credentials not configured on Vercel yet. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to your Vercel Environment Variables."
      );
    } else {
      setStatus("error");
      setMessage(res.error || "Failed to sync with cloud");
    }
  };

  const handleConnectCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = inputCode.trim().toUpperCase();
    if (!target) return;

    setStatus("loading");
    setMessage("Connecting to device session...");

    const res = await fetchRemoteState(target);

    if (res.success && res.state) {
      setStoredSyncCode(target);
      setSyncCode(target);
      // Reload page to rehydrate with new cloud state cleanly
      if (typeof window !== "undefined") {
        localStorage.setItem("spinthetodo_state_v1", JSON.stringify(res.state));
        window.location.reload();
      }
    } else if (res.notFound) {
      setStatus("error");
      setMessage(`No data found on cloud for code ${target}. Check the code and try again.`);
    } else if (res.notConfigured) {
      setStatus("error");
      setMessage(
        "Turso credentials not configured on Vercel yet. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN to your Vercel Environment Variables."
      );
    } else {
      setStatus("error");
      setMessage(res.error || "Could not connect to code");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-carbon/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[20px] border-2 border-carbon bg-paper-white p-6 shadow-2xl relative select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-carbon/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <h2 className="text-base font-extrabold uppercase tracking-wide text-carbon">
              Sync Laptop & Phone
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full border border-carbon text-xs font-black text-carbon hover:bg-soft-mist cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-5">
          {/* Current Device Code */}
          <div className="p-3.5 rounded-[16px] border border-carbon bg-soft-mist/60 text-center">
            <span className="text-[11px] font-bold text-carbon/70 uppercase tracking-wider block mb-1">
              This Device&apos;s Sync Code
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="font-mono text-2xl font-black tracking-widest text-carbon px-3 py-1 rounded-[12px] bg-paper-white border border-carbon">
                {syncCode || "GENERATING..."}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 rounded-[12px] border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-[11px] text-carbon/60 mt-2">
              Enter this code on your other device to link them together.
            </p>
          </div>

          {/* Sync Button */}
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={status === "loading"}
            className="w-full py-2.5 rounded-full border border-carbon bg-mint-pop text-carbon text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {status === "loading" ? "Syncing..." : "⚡ Sync with Cloud Now"}
          </button>

          {/* Status feedback */}
          {message && (
            <div
              className={`p-2.5 rounded-[12px] text-xs font-bold border ${
                status === "success"
                  ? "bg-mint-pop/20 border-mint-pop text-carbon"
                  : status === "error"
                  ? "bg-ember/15 border-ember text-ember"
                  : "bg-soft-mist border-carbon/30 text-carbon"
              }`}
            >
              {message}
            </div>
          )}

          {/* Connect Another Code */}
          <div className="pt-3 border-t border-carbon/20">
            <span className="text-xs font-extrabold uppercase tracking-wide text-carbon block mb-2">
              Link with Existing Code
            </span>
            <form onSubmit={handleConnectCode} className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. SPIN-XXXX"
                className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase rounded-[12px] border border-carbon bg-paper-white text-carbon focus:outline-none focus:ring-2 focus:ring-carbon"
              />
              <button
                type="submit"
                disabled={status === "loading" || !inputCode.trim()}
                className="px-4 py-2 rounded-[12px] border border-carbon bg-carbon text-paper-white text-xs font-bold uppercase hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                Connect
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
