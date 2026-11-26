---
ruleId: PERF-11
title: Optimize data selection and handling
---

## [PERF-11] Optimize data selection and handling

### Reasoning

`useSelector` (react-redux) and React Query's `useQuery` `select` option both let a component narrow data before it reaches the render. Selectors control both **what** data the component receives and **how** a change is detected:

- **`useSelector`**: the selector runs after every dispatched action, and its return value is compared to the previous one by reference (`===`) by default. If the reference changed, the component re-renders. You can pass `shallowEqual` as the second argument to compare the top-level fields of an object instead.
- **React Query `select`**: the component re-renders only when the selected result changes, so selecting a small slice of a large response avoids re-renders when unrelated parts of the response change.

This means selectors are a double-edged sword. A well-written selector that returns a primitive, or an existing reference from the store, is highly effective — it skips re-renders when unrelated data changes and the comparison is free. But a poorly-written `useSelector` selector that builds a new object, array, `Set` or `Map` on every call makes things worse — the reference is new after every action, so the component re-renders on **every** dispatch, even when nothing it uses changed.

**Prefer selecting one entity by id:** when the component needs one or a few records and knows their IDs, select them directly (e.g., `state.applications.byID[applicationID]`) instead of selecting the whole collection. The returned reference only changes when that record changes.

**When to use a narrow selector:**
- To pick a single record or a few fields from the store (reduces re-renders from unrelated changes)
- To compute a final scalar (boolean, number, string) from a larger dataset
- To pick the part of a query response the component actually renders (React Query `select`)

**When NOT to build the result inside a `useSelector` selector:**
- To transform or reshape data without reducing its size — select the raw data and transform inline (or with `useMemo`), or use a memoized selector (`createSelector`)
- To filter/map entire collections into new arrays or objects — the output is a new reference on every action
- To return a new `Set` or `Map` — always a new reference, and `shallowEqual` does not help

### Incorrect

```tsx
// BAD: Selects the whole collection — re-renders whenever any customer changes
function CustomerName({customerID}) {
    const customers = useSelector((state: RootState) => state.customers.byID);
    return <Text>{customers[customerID]?.name}</Text>;
}

// BAD: Selector maps an entire collection — new object on every dispatched action
const loanProducts = useSelector((state: RootState) =>
    Object.fromEntries(
        Object.entries(state.loanProducts.byID).map(([key, product]) => [
            key,
            {id: product?.id, name: product?.name, type: product?.type},
        ]),
    ),
);

// BAD: Selector filters/maps a collection into an array — new array on every dispatched action
const closedLoanIDs = useSelector((state: RootState): string[] =>
    Object.entries(state.loans.byID)
        .filter(([, loan]) => loan?.isClosed)
        .map(([key]) => key),
);

// BAD: Selector returns a Set — always a new reference
const closedLoanIDSet = useSelector((state: RootState): Set<string> => {
    const ids = new Set<string>();
    Object.entries(state.loans.byID).forEach(([key, loan]) => {
        if (loan?.isClosed) {
            ids.add(key);
        }
    });
    return ids;
});

// BAD: Selector returns an array when the component only needs a boolean
const overdueRepayments = useSelector((state: RootState) =>
    Object.values(state.repayments.byID).filter((r) => r?.isOverdue),
);
const hasOverdueRepayments = overdueRepayments.length > 0;
```

### Correct

```tsx
// GOOD: The record is known, so select it by id instead of selecting the collection
function CustomerName({customerID}) {
    const customerName = useSelector((state: RootState) => state.customers.byID[customerID]?.name);
    return <Text>{customerName}</Text>;
}

// GOOD: The component needs every product. Select the stored reference, transform inline
const loanProductsByID = useSelector((state: RootState) => state.loanProducts.byID);
const loanProducts = useMemo(
    () =>
        Object.fromEntries(
            Object.entries(loanProductsByID).map(([key, product]) => [
                key,
                {id: product?.id, name: product?.name, type: product?.type},
            ]),
        ),
    [loanProductsByID],
);

// GOOD: Memoized selector — recomputes (and returns a new Set) only when state.loans.byID changes
const selectClosedLoanIDs = createSelector([(state: RootState) => state.loans.byID], (loansByID) =>
    new Set(
        Object.entries(loansByID)
            .filter(([, loan]) => loan?.isClosed)
            .map(([key]) => key),
    ),
);
const closedLoanIDs = useSelector(selectClosedLoanIDs);

// GOOD: Selector computes the final boolean directly
const hasOverdueRepayments = useSelector((state: RootState) =>
    Object.values(state.repayments.byID).some((r) => r?.isOverdue),
);

// GOOD: React Query select picks only what the component renders
const {data: applicationCount} = useQuery({
    queryKey: ['applications', branchID],
    queryFn: () => fetchApplications(branchID),
    select: (applications) => applications.length,
});
```

---

### Review Metadata

Flag ONLY when ANY of these are true:

- A component uses `useSelector` or `useQuery` and either:
  - Selects a broad data structure (a whole slice or collection) when it only uses a single record or a few fields, causing re-renders when unrelated data changes
  - Uses a `useSelector` selector that builds a new object, array, `Set`, or `Map` on every call (e.g., `.map`, `.filter`, `Object.fromEntries`, object literals) without `createSelector` memoization or a suitable equality function, or returns an intermediate data structure that is further reduced by the component
- A selector over a collection also iterates over other large datasets (e.g., another collection read from state or passed via closure) on every run, compounding the computation cost on unrelated updates

**DO NOT flag if:**

- The selector returns a primitive value (`boolean`, `string`, `number`, `undefined`)
- The selector returns an existing reference from the store (e.g., `state.applications.byID[id]`, `state.auth.user`)
- The selector returns a small object of a few fields and passes `shallowEqual`
- The selector is a memoized selector created with `createSelector` whose inputs are store references
- The selector meaningfully reduces a large dataset to a primitive or a few items by iterating over the collection itself
- The data structure is static or the function requires the entire object for valid operations

**Search Patterns** (hints for reviewers):
- `useSelector`
- `useAppSelector`
- `select:`
- `createSelector`
- `shallowEqual`
- `new Set\(`
- `new Map\(`
- `Object\.fromEntries`
- `Object\.entries.*\.map`
- `Object\.values.*\.filter`
