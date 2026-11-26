---
ruleId: PERF-17
title: Avoid intermediate lookup layers
---

## [PERF-17] Avoid intermediate lookup layers

### Reasoning

Building a derived lookup structure (`new Set`/`new Map`/`Object.fromEntries` or a hand-built index) from a collection you already hold - just to answer membership/per-element checks downstream - is O(n) construction, often re-run every render, for something the callee can index O(1) straight from the raw source. Pass the raw collection and do the lookup on demand inside the callee instead.

### Examples

#### Incorrect

```tsx
// Closed loans when resuming the last-opened application
// Builds an intermediate lookup layer from the full collection on every render.
const closedLoanIDSet = useClosedLoanIDSet();

useFocusEffect(
    useCallback(() => {
        const application = findLastOpenedApplication(branchID, includeDrafts, closedLoanIDSet);
    }, [closedLoanIDSet, branchID, includeDrafts]),
);
```

#### Correct

```tsx
// Pass raw collection and index on demand inside the callee.
const loansByID = useSelector((state: RootState) => state.loans.byID);

useFocusEffect(
    useCallback(() => {
        const application = findLastOpenedApplication(branchID, includeDrafts, loansByID);
    }, [loansByID, branchID, includeDrafts]),
);

// inside findLastOpenedApplication:
const loan = loansByID[application.loanID];
const isClosed = isClosedLoan(loan);
```

#### Incorrect

```tsx
// Interest rate membership on the loan product screen
const selectableRates = useMemo(() => buildSelectableRates(productRates), [productRates]);

// Unnecessary intermediate lookup layer from data already keyed by ID.
const rateIDs = useMemo(() => new Set(Object.keys(selectableRates)), [selectableRates]);

const isSelectable = rateIDs.has(application?.loanTerms?.interestRateID);
```

#### Correct

```tsx
const selectableRates = useMemo(() => buildSelectableRates(productRates), [productRates]);

const rateID = application?.loanTerms?.interestRateID;
const isSelectable = !!rateID && !!selectableRates[rateID];
```

---

### Review Metadata

**Flag when ALL of these are true:**

- A derived lookup structure (`new Set`/`new Map`/`Object.fromEntries`, or a hand-built index object) is constructed from a collection/array the code already holds.
- It is built eagerly - at component scope or on every render (e.g. a hook or `useMemo` over the whole collection) - rather than behind the branch that needs it.
- Its only purpose is membership/lookup checks answerable O(1) directly against the raw source, i.e. the raw source is already keyed (object / `Map` / normalized store collection).

Increase confidence (not required):

- The callee runs conditionally/lazily (for example, inside a `useCallback`/event handler, `useFocusEffect`, or a `useState(() => ...)` initializer), so the intermediate lookup layer is rebuilt on every render even when the callee and lookup never run.

**DO NOT flag if:**

- Genuine repeated querying against the intermediate lookup layer is confirmed (for example, `.has(...)` inside a loop or multiple distinct lookup sites). If that evidence is not visible in the diff, confirm it by searching the callee or changed file.
- The raw source isn't already available to the callee and would otherwise need its own expensive fetch.
- The structure meaningfully reshapes data (not just a membership/lookup index) and the callee needs the whole thing.
- The raw source is an array: a `Set`/`Map` that turns O(n) `.includes`/scan membership into O(1) `.has` is a real precompute win, not a violation.

**Search Patterns** (hints for reviewers):
- `new Set\(`
- `new Map\(`
- `Object\.fromEntries`
- `\.has\(`
