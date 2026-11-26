/**
 * PERF-14: two ways to read the cart store from a component.
 * The ❌ hooks copy the store value into useState inside a useEffect.
 * The ✅ hooks hand React the subscribe + read functions via useSyncExternalStore.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { getCount, subscribe } from "./cartStore";

// ❌ The first render shows the useState default (0), not the real count.
// Only after the effect runs does it copy the real value in and render again.
function useCartCountWithEffect() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getCount());
    update(); // catch anything that changed before we subscribed
    return subscribe(update);
  }, []);
  return count;
}

// ✅ React reads getCount() during the very first render, and re-renders
// whenever subscribe() reports a change. No copy in useState, no effect.
function useCartCount() {
  return useSyncExternalStore(subscribe, getCount);
}

export { useCartCount, useCartCountWithEffect };
