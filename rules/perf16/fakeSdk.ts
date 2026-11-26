/**
 * PERF-16 demo: a pretend third-party SDK (think analytics + push notifications).
 * Like many real SDKs, its setup calls are NOT safe to repeat:
 * - startSession() starts a brand-new session every time it's called.
 * - onNotificationTap() adds another handler every time; it never replaces the old one.
 * The screen keeps one SDK instance per side so the two can be compared.
 */

type SdkState = {
  sessions: number;
  handlers: number;
  /** Newest first. */
  log: string[];
};

/** How many log lines each side keeps. */
const LOG_LINES = 8;

function createFakeSdk() {
  let state: SdkState = { sessions: 0, handlers: 0, log: [] };
  let handlers: ((orderID: number) => void)[] = [];
  const listeners = new Set<() => void>();

  function update(change: Partial<SdkState>, line: string) {
    state = { ...state, ...change, log: [line, ...state.log].slice(0, LOG_LINES) };
    listeners.forEach((listener) => listener());
  }

  return {
    startSession() {
      update({ sessions: state.sessions + 1 }, `📊 analytics session #${state.sessions + 1} started`);
    },

    onNotificationTap(handler: (orderID: number) => void) {
      handlers.push(handler);
      update({ handlers: handlers.length }, `🔔 tap handler #${handlers.length} registered`);
    },

    /** Simulates the user tapping a push notification. Every registered handler runs. */
    tapNotification(orderID: number) {
      update({}, `👆 user tapped notification for order #${orderID}`);
      handlers.forEach((handler) => handler(orderID));
    },

    log(line: string) {
      update({}, line);
    },

    reset() {
      handlers = [];
      state = { sessions: 0, handlers: 0, log: [] };
      listeners.forEach((listener) => listener());
    },

    getState(): SdkState {
      return state;
    },

    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

type FakeSdk = ReturnType<typeof createFakeSdk>;

export { createFakeSdk };
export type { FakeSdk, SdkState };
