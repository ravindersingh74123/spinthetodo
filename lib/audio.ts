/**
 * Pure Web Audio API & Task Audio Manager for Spin the Wheel Todo.
 * Generates tactile mechanical ratchet clicks, celebration chimes, and plays
 * task-specific landed background music capped at a maximum of 10 seconds.
 */

/**
 * Resolves the matching background audio asset from /audio for a given task name.
 */
export function getTaskAudioUrl(taskName: string): string | null {
  if (!taskName) return null;
  const norm = taskName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Direct normalized match:
  if (norm.includes("cleanyourroom") || (norm.includes("clean") && norm.includes("room"))) {
    return "/audio/cleanyourroom_task_audio.mp3";
  }
  if (norm.includes("drinkwater") || (norm.includes("drink") && norm.includes("water"))) {
    return "/audio/drinkwater_task_audio.mp3";
  }
  if (norm === "dsa" || norm.includes("dsa") || norm.includes("leetcode") || norm.includes("algo")) {
    return "/audio/dsa_task_audio.mp3";
  }
  if (norm.includes("gym") || norm.includes("workout") || norm.includes("exercise") || norm.includes("fitness")) {
    return "/audio/gym_task_audio.mp3";
  }
  if (norm.includes("journal") || norm.includes("diary") || norm.includes("writing")) {
    return "/audio/journal_task_audio.mp3";
  }
  if (
    norm.includes("readbook") ||
    norm.includes("readingbook") ||
    norm.includes("reading") ||
    (norm.includes("read") && norm.includes("book"))
  ) {
    return "/audio/readbook_task_audio.mp3";
  }

  // General keyword fallbacks:
  if (norm.includes("water")) return "/audio/drinkwater_task_audio.mp3";
  if (norm.includes("room") || norm.includes("clean")) return "/audio/cleanyourroom_task_audio.mp3";
  if (norm.includes("read") || norm.includes("book")) return "/audio/readbook_task_audio.mp3";

  return null;
}

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentTaskAudio: HTMLAudioElement | null = null;
  private taskAudioTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("spintodo_muted");
      this.isMuted = storedMute === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("spintodo_muted", String(muted));
    }
    if (muted) {
      this.stopTaskAudio();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Plays a crisp, mechanical ratchet "click/tick" sound.
   */
  public playClick(pitchMultiplier: number = 1.0): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Bandpass filtered click tone
      osc.type = "sine";
      const baseFreq = 850 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // AudioContext play fallback
    }
  }

  /**
   * Plays a celebratory multi-note game-show chime on winning task landing.
   */
  public playWinChime(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Major chord arpeggio: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const noteStart = startTime + idx * 0.08;
        const noteDuration = 0.35;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.22, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * Plays task-specific background audio when landing on the wheel,
   * max capped at 10 seconds.
   */
  public playTaskAudio(taskName: string, maxDurationMs: number = 10000): void {
    if (this.isMuted) return;
    this.stopTaskAudio();

    const audioUrl = getTaskAudioUrl(taskName);
    if (!audioUrl || typeof window === "undefined" || typeof Audio === "undefined") {
      return;
    }

    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.65;
      this.currentTaskAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy or unsupported format safe fallback
        });
      }

      // Hard cap to 10 seconds
      this.taskAudioTimeout = setTimeout(() => {
        this.stopTaskAudio();
      }, maxDurationMs);

      audio.onended = () => {
        this.stopTaskAudio();
      };
    } catch {
      // Audio element fallback
    }
  }

  /**
   * Stops any currently playing task background audio and clears timers.
   */
  public stopTaskAudio(): void {
    if (this.taskAudioTimeout) {
      clearTimeout(this.taskAudioTimeout);
      this.taskAudioTimeout = null;
    }

    if (this.currentTaskAudio) {
      try {
        this.currentTaskAudio.pause();
        this.currentTaskAudio.currentTime = 0;
      } catch {
        // Safe pause
      }
      this.currentTaskAudio = null;
    }
  }
}

export const soundManager = new SoundEffectsManager();
