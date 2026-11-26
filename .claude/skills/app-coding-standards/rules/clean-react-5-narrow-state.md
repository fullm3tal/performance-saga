---
ruleId: CLEAN-REACT-PATTERNS-5
title: Keep state and subscriptions narrow
---

## [CLEAN-REACT-PATTERNS-5] Keep state and subscriptions narrow

### Reasoning

When unrelated pieces of data are grouped into a single state structure, if an unused part changes, then all consumers re-render unnecessarily. This silently expands render scope, increases coupling, and makes performance regressions hard to detect. Structuring state around cohesive concerns ensures render scope stays predictable and changes remain local.

**Distinction from PERF-11**: PERF-11 addresses individual selector usage (`useSelector`, React Query `select`). This rule addresses state structure — how multiple values are grouped and exposed to consumers via contexts, hooks, or stores.

**Distinction from CLEAN-REACT-PATTERNS-2**: PATTERNS-2 addresses data flow direction — parent shouldn't fetch data just to pass to children. This rule addresses how state is structured and grouped within any state provider.

### Incorrect

#### Incorrect (grab-bag state — bundles unrelated concerns)

- State provider subscribes to many unrelated store slices and queries
- Exposed value mixes navigation state, list data, membership data, and cache utilities
- Any consumer re-renders when ANY subscribed value changes

```tsx
function OrderedApplicationsContextProvider({children}) {
    // Many unrelated subscriptions bundled together
    const sortMode = useSelector((state: RootState) => state.preferences.sortMode);
    const applications = useSelector((state: RootState) => state.applications.byID);
    const customers = useSelector((state: RootState) => state.customers.byID);
    const loans = useSelector((state: RootState) => state.loans.byID);
    const repayments = useSelector((state: RootState) => state.repayments.byID);
    const drafts = useSelector((state: RootState) => state.drafts);
    const {data: branches} = useQuery({queryKey: ['branches'], queryFn: fetchBranches});

    // Context value mixes unrelated concerns
    const contextValue = {
        orderedApplications,    // List data
        orderedApplicationIDs,  // List data
        currentApplicationID,   // Navigation state
        branchOfficerIDs,       // Branch membership
        clearListCache,         // Cache management utility
    };

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

// A component needing only currentApplicationID re-renders when orderedApplications changes
// A component needing only branchOfficerIDs re-renders when navigation changes
```

### Correct

#### Correct (cohesive state — all values serve one purpose)

- All state relates to one concern (keyboard)
- Values change together — no wasted re-renders
- Derived state computed inline, not stored separately

```tsx
type KeyboardStateContextValue = {
    isKeyboardShown: boolean;
    isKeyboardActive: boolean;
    keyboardHeight: number;
};

function KeyboardStateProvider({children}: ChildrenProps) {
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardActive, setIsKeyboardActive] = useState(false);

    useEffect(() => {
        const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
            setIsKeyboardActive(true);
        });
        const hideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
            setIsKeyboardActive(false);
        });
        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    const contextValue = useMemo(() => ({
        keyboardHeight,
        isKeyboardShown: keyboardHeight !== 0,  // Derived, not separate state
        isKeyboardActive,
    }), [keyboardHeight, isKeyboardActive]);

    return <KeyboardStateContext.Provider value={contextValue}>{children}</KeyboardStateContext.Provider>;
}
```

---

### Review Metadata

#### Condition

Flag when a state structure (context, hook, store, or subscription) bundles unrelated concerns together, causing consumers to re-render when data they don't use changes.

**Signs of violation:**
- State provider (context, hook, or store) that bundles unrelated data (e.g., navigation state + list data + cache utilities in one structure)
- State object where properties serve different purposes and change independently
- Multiple unrelated subscriptions (`useSelector`, `useQuery`, `useContext`) aggregated into a single exposed value
- Consumers of a state source that only use a subset of the provided values

**DO NOT flag if:**
- State values are cohesive — they change together and serve the same purpose (e.g., `keyboardHeight` + `isKeyboardShown` both relate to keyboard state)
- The state structure is intentionally designed as an aggregation point and consumers use most/all values
- Individual `useSelector`/`useQuery` calls that select too broadly — this is covered by [PERF-11]

**Search Patterns** (hints for reviewers):
- `Context`
- `Provider`
- `useSelector`
