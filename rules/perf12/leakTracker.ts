/**
 * PERF-12 demo-only bookkeeping. The score cards report to this tracker when
 * they start a timer, when a timer ticks, and when they stop one, so the screen
 * can show how many timers are still running and a log of what each one did.
 * Real code doesn't need any of this; it only needs clearInterval.
 */
import { useSyncExternalStore } from "react";

type Lane = "leaky" | "clean";

/** One setInterval started by a score card. `id` is set right after it's created. */
type DemoTimer = {
  lane: Lane;
  number: number;
  id?: ReturnType<typeof setInterval>;
};

type LaneState = {
  /** Timers that were started and never stopped. */
  running: number;
  /** Ticks that ran while their card was already closed. */
  wastedTicks: number;
  /** Newest first. */
  log: string[];
};

type TrackerState = Record<Lane, LaneState>;

/** How many log lines each lane keeps. */
const LOG_LINES = 5;

function emptyLane(): LaneState {
  return { running: 0, wastedTicks: 0, log: [] };
}

let state: TrackerState = { leaky: emptyLane(), clean: emptyLane() };
const timerCount: Record<Lane, number> = { leaky: 0, clean: 0 };
const liveTimers = new Set<DemoTimer>();
const listeners = new Set<() => void>();

function update(lane: Lane, change: (laneState: LaneState) => LaneState) {
  state = { ...state, [lane]: change(state[lane]) };
  listeners.forEach((listener) => listener());
}

function addLog(laneState: LaneState, line: string): string[] {
  return [line, ...laneState.log].slice(0, LOG_LINES);
}

/** Call when a card starts a timer. Returns a label like "Timer #3" for the log. */
function newTimer(lane: Lane): DemoTimer {
  timerCount[lane] += 1;
  const timer: DemoTimer = { lane, number: timerCount[lane] };
  liveTimers.add(timer);
  update(lane, (laneState) => ({
    ...laneState,
    running: laneState.running + 1,
    log: addLog(laneState, `▶️ Timer #${timer.number} started`),
  }));
  return timer;
}

/** Call from inside the timer callback. */
function tick(timer: DemoTimer, isCardOpen: boolean) {
  update(timer.lane, (laneState) => ({
    ...laneState,
    wastedTicks: laneState.wastedTicks + (isCardOpen ? 0 : 1),
    log: addLog(
      laneState,
      isCardOpen
        ? `✅ Timer #${timer.number} refreshed the score`
        : `👻 Timer #${timer.number} ran, but the card is closed`,
    ),
  }));
}

/** Call after clearInterval. */
function timerStopped(timer: DemoTimer) {
  // Reset may have already stopped and forgotten this timer.
  if (!liveTimers.delete(timer)) {
    return;
  }
  update(timer.lane, (laneState) => ({
    ...laneState,
    running: laneState.running - 1,
    log: addLog(laneState, `⏹ Timer #${timer.number} stopped`),
  }));
}

/** Kills every demo timer (leaked ones too) and clears the counters. Used by Reset and when leaving the screen. */
function resetTracker() {
  console.log("Resetting tracker and killing all demo timers");
  liveTimers.forEach((timer) => clearInterval(timer.id));
  liveTimers.clear();
  timerCount.leaky = 0;
  timerCount.clean = 0;
  state = { leaky: emptyLane(), clean: emptyLane() };
  listeners.forEach((listener) => listener());
}

function getState(): TrackerState {
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useTrackerState(): TrackerState {
  return useSyncExternalStore(subscribe, getState);
}

export {
  getState,
  newTimer,
  resetTracker,
  tick,
  timerStopped,
  useTrackerState,
};
export type { DemoTimer, Lane, LaneState };
