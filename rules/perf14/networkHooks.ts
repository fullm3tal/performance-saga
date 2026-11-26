/**
 * PERF-14: two ways for a screen to know whether the phone is online.
 * This is the exact pattern from the rule: the ❌ hook guesses "online" in
 * useState and corrects it in an effect; the ✅ hook asks the store directly.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { getIsOnline, subscribeToNetwork } from "./networkStore";

// ❌ Starts with a guess (true). If the phone is actually offline, the first
// render is wrong until the effect copies the real value in.
function useIsOnlineWithEffect() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const update = () => setIsOnline(getIsOnline());
    update();
    return subscribeToNetwork(update);
  }, []);
  return isOnline;
}

// ✅ Reads the real value on the first render, and re-renders on every change.
function useIsOnline() {
  return useSyncExternalStore(subscribeToNetwork, getIsOnline);
}

export { useIsOnline, useIsOnlineWithEffect };
