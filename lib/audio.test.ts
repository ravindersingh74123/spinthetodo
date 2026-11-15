import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { soundManager, getTaskAudioUrl } from "./audio";

describe("lib/audio: SoundEffectsManager & Task Background Audio (spec)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    soundManager.stopTaskAudio();
  });

  it("maps task names to corresponding background audio files", () => {
    expect(getTaskAudioUrl("clean your room")).toBe("/audio/cleanyourroom_task_audio.mp3");
    expect(getTaskAudioUrl("Clean Your Room!")).toBe("/audio/cleanyourroom_task_audio.mp3");
    expect(getTaskAudioUrl("drink water")).toBe("/audio/drinkwater_task_audio.mp3");
    expect(getTaskAudioUrl("dsa")).toBe("/audio/dsa_task_audio.mp3");
    expect(getTaskAudioUrl("gym")).toBe("/audio/gym_task_audio.mp3");
    expect(getTaskAudioUrl("Gym Workout")).toBe("/audio/gym_task_audio.mp3");
    expect(getTaskAudioUrl("journal")).toBe("/audio/journal_task_audio.mp3");
    expect(getTaskAudioUrl("read book")).toBe("/audio/readbook_task_audio.mp3");
    expect(getTaskAudioUrl("reading book")).toBe("/audio/readbook_task_audio.mp3");

    // Unmatched fallback
    expect(getTaskAudioUrl("unknown task name xyz")).toBeNull();
  });

  it("manages mute state and persists to localStorage", () => {
    soundManager.setMuted(false);
    expect(soundManager.getMuted()).toBe(false);

    soundManager.toggleMute();
    expect(soundManager.getMuted()).toBe(true);
    expect(localStorage.getItem("spintodo_muted")).toBe("true");

    soundManager.toggleMute();
    expect(soundManager.getMuted()).toBe(false);
    expect(localStorage.getItem("spintodo_muted")).toBe("false");
  });

  it("safely attempts to play clicks and task audio without crashing", () => {
    expect(() => {
      soundManager.playClick();
      soundManager.playWinChime();
      soundManager.playTaskAudio("gym", 10000);
      soundManager.stopTaskAudio();
    }).not.toThrow();
  });
});
