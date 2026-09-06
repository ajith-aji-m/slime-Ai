import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useMascotStore } from "../mascot-store";

describe("mascot-store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // reset to a clean idle state between tests
    useMascotStore.setState({ action: "idle" });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("setTyping(true) moves to typing, setTyping(false) back to idle", () => {
    useMascotStore.getState().setTyping(true);
    expect(useMascotStore.getState().action).toBe("typing");
    useMascotStore.getState().setTyping(false);
    expect(useMascotStore.getState().action).toBe("idle");
  });

  it("notifySent plays the transient then reverts to idle", () => {
    useMascotStore.getState().notifySent();
    expect(useMascotStore.getState().action).toBe("sent");
    vi.advanceTimersByTime(1000);
    expect(useMascotStore.getState().action).toBe("idle");
  });

  it("notifyReceived plays celebrate then reverts to idle", () => {
    useMascotStore.getState().notifyReceived();
    expect(useMascotStore.getState().action).toBe("celebrate");
    vi.advanceTimersByTime(2000);
    expect(useMascotStore.getState().action).toBe("idle");
  });

  it("notifyError plays error then reverts to idle", () => {
    useMascotStore.getState().notifyError();
    expect(useMascotStore.getState().action).toBe("error");
    vi.advanceTimersByTime(2500);
    expect(useMascotStore.getState().action).toBe("idle");
  });

  it("a transient in flight blocks setTyping until it finishes", () => {
    useMascotStore.getState().notifyReceived();
    useMascotStore.getState().setTyping(true);
    // typing shouldn't interrupt the celebrate beat
    expect(useMascotStore.getState().action).toBe("celebrate");
    vi.advanceTimersByTime(2000);
    expect(useMascotStore.getState().action).toBe("idle");
  });

  it("falls asleep after the idle timeout with no activity", () => {
    useMascotStore.getState().setTyping(false); // arms the idle timer
    vi.advanceTimersByTime(60_000);
    expect(useMascotStore.getState().action).toBe("sleeping");
  });

  it("wakes back to idle on the next activity", () => {
    useMascotStore.getState().setTyping(false);
    vi.advanceTimersByTime(60_000);
    expect(useMascotStore.getState().action).toBe("sleeping");
    useMascotStore.getState().setTyping(true);
    expect(useMascotStore.getState().action).toBe("typing");
  });
});
