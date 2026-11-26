/**
 * PERF-14 demo: a pretend network-status module, standing in for something
 * like NetInfo. It lives outside React: it knows whether the phone is online
 * and tells subscribers when that changes.
 */

let isOnline = true;
const listeners = new Set<() => void>();

function getIsOnline() {
  return isOnline;
}

/** Simulates Wi-Fi going on or off. */
function setIsOnline(next: boolean) {
  isOnline = next;
  listeners.forEach((listener) => listener());
}

/** Calls `listener` whenever the network status changes. Returns the unsubscribe function. */
function subscribeToNetwork(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export { getIsOnline, setIsOnline, subscribeToNetwork };
