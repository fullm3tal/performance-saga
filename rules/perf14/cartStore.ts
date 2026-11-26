/**
 * PERF-14 demo: a shopping cart that lives OUTSIDE React (a plain module),
 * like a native module, a websocket, or a non-React SDK would.
 * It has the two things useSyncExternalStore needs: a way to read the
 * current value, and a way to be told when it changes (subscribe).
 */

/** The cart already has items before any screen mounts, e.g. added on another screen. */
const INITIAL_ITEMS = [1, 5, 9];

let items = new Set(INITIAL_ITEMS);
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** Calls `listener` whenever the cart changes. Returns the unsubscribe function. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getCount() {
  return items.size;
}

/** Adds the lowest product id that isn't in the cart yet. */
function addNextItem() {
  let productID = 0;
  while (items.has(productID)) {
    productID += 1;
  }
  // A new Set each time, so anything comparing snapshots sees a change.
  items = new Set(items).add(productID);
  notify();
}

function resetCart() {
  items = new Set(INITIAL_ITEMS);
  notify();
}

export { addNextItem, getCount, resetCart, subscribe };
