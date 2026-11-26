---
ruleId: PERF-14
title: Use useSyncExternalStore for external store subscriptions
---

## [PERF-14] Use `useSyncExternalStore` for external store subscriptions

### Reasoning

[`useSyncExternalStore`](https://react.dev/learn/you-might-not-need-an-effect#subscribing-to-an-external-store) is React's purpose-built hook for reading external store values. It handles concurrent rendering edge cases (tearing), avoids the extra render pass of `useEffect` + `setState`, and makes the subscription contract explicit. Manual subscriptions via `useEffect` are more error-prone and miss these guarantees.

### Incorrect

```tsx
function useAppState() {
  // Not ideal: Manual store subscription in an Effect
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => {
      setAppState(AppState.currentState);
    });
    return () => subscription.remove();
  }, []);
  return appState;
}

function SyncIndicator() {
  const appState = useAppState();
  // ...
}
```

### Correct

```tsx
function subscribe(callback: () => void) {
  const subscription = AppState.addEventListener('change', callback);
  return () => subscription.remove();
}

function getSnapshot() {
  return AppState.currentState;
}

function useAppState() {
  // Good: Subscribing to an external store with a built-in Hook.
  // React won't resubscribe for as long as you pass the same functions.
  return useSyncExternalStore(subscribe, getSnapshot);
}

function SyncIndicator() {
  const appState = useAppState();
  // ...
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- A `useEffect` subscribes to an external source (native module events, third-party store, platform API)
- Inside the listener, at least one `setState` call directly mirrors an external value
  (e.g., `setWidth(Dimensions.get('window').width)`, `setAppState(AppState.currentState)`)
- The pattern for that state variable follows: subscribe in setup, unsubscribe in cleanup,
  `setState(externalValue)` in the listener
- Evaluate each state variable independently — if one state variable is a raw mirror of an
  external value, flag it even if the same effect also manages other state for different purposes

**DO NOT flag if:**

- The specific state variable being flagged undergoes transformation, debouncing, or derives
  from computation rather than directly mirroring the external value. Other state variables
  in the same effect that DO directly mirror external values should still be flagged.
- The external API doesn't fit the `subscribe` / `getSnapshot` contract
- The code already uses `useSyncExternalStore`
- The subscription is managed by a library (e.g., react-redux's `useSelector`, React Query's `useQuery`)

**Search Patterns** (hints for reviewers):
- `addEventListener`
- `subscribe`
- `useEffect`
- `useState`
