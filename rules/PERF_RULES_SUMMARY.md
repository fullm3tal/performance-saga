# Performance Rules Summary

A quick reference for the 16 `PERF-*` rules that have demos in this folder. Each rule's full text, with review criteria, lives in [`.claude/skills/app-coding-standards/rules/`](../.claude/skills/app-coding-standards/rules/). The demo order comes from [`ruleCatalog.ts`](ruleCatalog.ts).

## At a glance

| Rule | Title | In one line | Demo |
|---|---|---|---|
| [PERF-1](#perf-1--no-spread-in-renderitem) | No spread in renderItem | Pass item props separately; don't build `{...item}` objects per row | [`perf1/`](perf1/) |
| [PERF-2](#perf-2--return-early-before-expensive-work) | Return early before expensive work | Run cheap guard checks before costly calls | [`perf2/`](perf2/) |
| [PERF-5](#perf-5--shallow-over-deep-comparisons) | Shallow over deep comparisons | In `memo` comparators, compare the few fields that matter, not `deepEqual` | [`perf5/`](perf5/) |
| [PERF-6](#perf-6--derive-state-from-props) | Derive state from props | Compute values during render instead of syncing them with `useEffect` + `useState` | [`perf6/`](perf6/) |
| [PERF-7](#perf-7--reset-via-key-prop) | Reset via key prop | Use `key={id}` to reset a component's state instead of a reset effect | [`perf7/`](perf7/) |
| [PERF-8](#perf-8--handle-events-in-handlers) | Handle events in handlers | Put event logic in `onPress`/`onChangeText`, not in an effect watching a flag | [`perf8/`](perf8/) |
| [PERF-9](#perf-9--no-useeffect-chains) | No useEffect chains | Don't have one effect set state that triggers another effect | [`perf9/`](perf9/) |
| [PERF-10](#perf-10--no-useeffect-for-parent-communication) | No useEffect for parent communication | Lift state up instead of reporting it to the parent from an effect | [`perf10/`](perf10/) |
| [PERF-11](#perf-11--optimize-data-selection) | Optimize data selection | Selectors should return narrow, stable values (primitives, existing references) | [`perf11/`](perf11/) |
| [PERF-12](#perf-12--prevent-memory-leaks) | Prevent memory leaks | Clear timers, listeners and subscriptions in effect cleanup | [`perf12/`](perf12/) |
| [PERF-13](#perf-13--hoist-iterator-independent-calls) | Hoist iterator-independent calls | Move calls that don't use the item out of `.map`/`.filter`/etc. | [`perf13/`](perf13/) |
| [PERF-14](#perf-14--usesyncexternalstore-for-stores) | useSyncExternalStore for stores | Read external stores with `useSyncExternalStore`, not `useEffect` + `setState` | [`perf14/`](perf14/) |
| [PERF-15](#perf-15--clean-up-async-effects) | Clean up async effects | Use an `ignore` flag or `AbortController` so stale responses are dropped | [`perf15/`](perf15/) |
| [PERF-16](#perf-16--guard-one-time-setup) | Guard one-time setup | Protect non-idempotent init from Strict Mode's double effect run | [`perf16/`](perf16/) |
| [PERF-17](#perf-17--no-extra-lookup-layers) | No extra lookup layers | Don't build a `Set`/`Map` from data that is already keyed; look it up directly | [`perf17/`](perf17/) |
| [PERF-21](#perf-21--list-rows-read-their-own-data) | List rows read their own data | Pass IDs to rows and let each row select its own data | [`perf21/`](perf21/) |

The rules group into four themes:

- **Lists and rendering:** PERF-1, PERF-5, PERF-21
- **You might not need an effect:** PERF-6, PERF-7, PERF-8, PERF-9, PERF-10, PERF-14
- **Effect hygiene:** PERF-12, PERF-15, PERF-16
- **Less work per call:** PERF-2, PERF-11, PERF-13, PERF-17

---

## PERF-1 — No spread in renderItem

**Problem:** `renderItem` runs for every visible row. An inline `{...item, isSelected}` makes a new object each render, so memoized rows always see a changed prop and re-render.

**Fix:** Pass the original `item` and the extra values as separate props.

```tsx
// Bad
<Row item={{...item, isSelected}} />
// Good
<Row item={item} isSelected={isSelected} />
```

**Doesn't apply to:** spreads outside `renderItem`, array spreads, objects built once and reused, or clones used locally and not passed as props.

## PERF-2 — Return early before expensive work

**Problem:** Running costly work (function calls, loops, store or storage reads) before a cheap guard wastes the work when the guard bails out.

**Fix:** Put the simple checks first.

```ts
if (!repayment?.repaymentID) return;
const originalLoanID = getOriginalLoanID(loanID, repayment);
```

**Doesn't apply to:** checks that need the computed result, or work that must run for its side effects.

## PERF-5 — Shallow over deep comparisons

**Problem:** `deepEqual` in a `memo` comparator walks every nested field, which can cost more than the re-render it is meant to skip.

**Fix:** Compare only the fields the component actually uses.

```tsx
memo(Item, (prev, next) =>
    prev.loan.loanID === next.loan.loanID &&
    prev.loan.status === next.loan.status &&
    prev.isSelected === next.isSelected);
```

**Doesn't apply to:** cases where a deep comparison is really needed, or props that are already primitives.

## PERF-6 — Derive state from props

**Problem:** Mirroring a computed value into state with `useEffect` adds an extra render and can drift out of sync.

**Fix:** Compute it in the component body (with `useMemo` if it is expensive).

```tsx
const fullName = firstName + ' ' + lastName;
```

**Doesn't apply to:** effects that do real side effects, or values that depend on timing or external events.

## PERF-7 — Reset via key prop

**Problem:** An effect that clears all of a component's state when a prop changes renders once with stale state, then again after the reset.

**Fix:** Give the component `key={id}` so React remounts it with fresh state.

```tsx
<ProfileView key={userId} userId={userId} />
```

**Doesn't apply to:** resets of only part of the state, or effects that do other side effects too.

## PERF-8 — Handle events in handlers

**Problem:** Setting a flag in a handler and reacting to it in an effect adds a render cycle and hides the link between the user action and its result.

**Fix:** Do the work directly in the event handler.

```tsx
function buyItem() {
    onBuy();
    showNotification('Item purchased!');
}
```

**Doesn't apply to:** setup or teardown that isn't tied to an event.

## PERF-9 — No useEffect chains

**Problem:** Effect A sets state that triggers effect B, and so on. Each step is a separate render, and the timing is hard to follow.

**Fix:** Compute the derived values during render, or combine the logic in one place.

```tsx
const fullName = firstName + ' ' + lastName;
const isValid = fullName.trim().length > 0;
```

**Doesn't apply to:** intermediate state that drives UI (conditional rendering, props to a visible child, gating a subtree), or effects that handle separate concerns or external events.

## PERF-10 — No useEffect for parent communication

**Problem:** A child that calls `onValueChange(value)` from an effect makes the parent render one step late and keeps two copies of the state.

**Fix:** Lift the state up. The parent owns it and passes `value` and `onChange` down.

```tsx
function Parent() {
    const [value, setValue] = useState('');
    return <Child value={value} onChange={setValue} />;
}
```

**Doesn't apply to:** effects that sync with external systems, or callbacks unrelated to passing state up.

## PERF-11 — Optimize data selection

**Problem:** `useSelector` re-renders when the returned reference changes. Selecting a whole collection re-renders on unrelated changes. A selector that builds a new object, array, `Set` or `Map` re-renders on **every** dispatch.

**Fix:**

- Select one record by ID: `state.customers.byID[id]?.name`.
- Compute the final primitive inside the selector (`.some(...)` instead of `.filter(...)` then `.length`).
- Select the stored reference and transform it with `useMemo`, or use `createSelector`.
- With React Query, use `select` to pick only what you render.

**Doesn't apply to:** selectors that return primitives or existing store references, small objects with `shallowEqual`, or `createSelector` selectors over store inputs.

## PERF-12 — Prevent memory leaks

**Problem:** Intervals, timeouts, listeners and subscriptions that are never cleared keep running after unmount and use more memory over time.

**Fix:** Return a cleanup function from the effect.

```tsx
useEffect(() => {
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
}, []);
```

**Doesn't apply to:** resources a library cleans up for you, or work guaranteed to finish before unmount.

## PERF-13 — Hoist iterator-independent calls

**Problem:** A call inside `.map`, `.filter`, `.reduce` and similar methods that doesn't use the item returns the same result each time, so the work is repeated n times.

**Fix:** Call it once before the loop.

```ts
const config = getConfig();
const results = items.map((item) => item.value * config.multiplier);
```

**Doesn't apply to:** calls that take the item, its fields, or a meaningful index, methods called on the item, or calls that create a new entity per item (such as `createID()`).

## PERF-14 — useSyncExternalStore for stores

**Problem:** Subscribing in `useEffect` and mirroring the value with `setState` adds an extra render and can tear under concurrent rendering.

**Fix:** Use `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`.

```tsx
return useSyncExternalStore(subscribe, () => AppState.currentState);
```

**Doesn't apply to:** state that is transformed or debounced rather than mirrored, APIs that don't fit the subscribe/snapshot contract, or library-managed subscriptions (`useSelector`, `useQuery`).

## PERF-15 — Clean up async effects

**Problem:** When dependencies change quickly (search input, for example), a slow earlier response can arrive last and overwrite newer results.

**Fix:** Drop stale results in the cleanup with an `ignore` flag or `AbortController`.

```tsx
useEffect(() => {
    let ignore = false;
    fetchResults(query).then((json) => { if (!ignore) setResults(json); });
    return () => { ignore = true; };
}, [query]);
```

Also flagged: async effects whose `exhaustive-deps` lint is turned off, which can hide a race.

**Doesn't apply to:** fire-and-forget work (logging, analytics), or fetching through React Query or RTK Query.

## PERF-16 — Guard one-time setup

**Problem:** Strict Mode runs effects twice in development. Non-idempotent init (auth checks, SDK setup, analytics sessions, deep-link registration, navigation, deletions) then runs twice.

**Fix:** Use a module-level guard, or run the init at module level.

```tsx
let didInit = false;
useEffect(() => {
    if (didInit) return;
    didInit = true;
    initSdk();
}, []);
```

A check on data or props (`if (!transaction) return`) is **not** a guard. The guard must check a flag and set it.

**Doesn't apply to:** idempotent logic, or effects with non-empty dependencies.

## PERF-17 — No extra lookup layers

**Problem:** Building a `Set`, `Map` or index on every render from data that is already keyed, only to check membership, is O(n) work that often isn't needed.

**Fix:** Pass the raw keyed collection and look items up when needed.

```tsx
const isSelectable = !!rateID && !!selectableRates[rateID];
```

**Doesn't apply to:** sources that are arrays (a `Set` that turns `.includes` into `.has` is a real gain), lookups used many times, or structures that genuinely reshape the data.

## PERF-21 — List rows read their own data

**Problem:** When a list selects whole collections and passes members (or puts them in `extraData`), any write re-renders the list and every row.

**Fix:** Pass only IDs. Each row selects its own record, so a write re-renders only the row that changed.

```tsx
<FlatList data={ids} renderItem={({item}) => <Row id={item} />} />

function Row({id}) {
    const record = useSelector((s) => s.records.byID[id]);
}
```

**Doesn't apply to:** lists that read the collection only to sort or filter and still pass IDs, shared data every row needs, or small lists that aren't virtualized.
