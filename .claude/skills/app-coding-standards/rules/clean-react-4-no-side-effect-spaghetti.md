---
ruleId: CLEAN-REACT-PATTERNS-4
title: Avoid side-effect spaghetti
---

## [CLEAN-REACT-PATTERNS-4] Avoid side-effect spaghetti

### Reasoning

When multiple unrelated responsibilities are grouped into a single component, hook, or utility, if any one concern changes, then unrelated logic must be touched as well, increasing coupling, regression risk, and cognitive load. This is the single responsibility principle for React: extract small units that do very little, very well. A component with several unrelated effects is a code smell - even a single effect can benefit from extraction to something with a good name, proper description, and isolated tests.

**Bucketing questions for refactoring:**
1. Does this logic need the React render loop? YES -> Extract to a focused custom hook. NO -> Extract out of React entirely (e.g., storage migration, global initialization).
2. Does this logic need to be in this component? YES -> Keep it, but use a focused hook. NO -> Extract to a separate component that owns this concern.

**Hook granularity guidance:**
- Group effects that serve the same purpose into one hook (e.g., all telemetry setup in `useTelemetry`)
- Group effects that can be reused together across components
- Don't create 15 separate single-effect hooks if 5 well-named grouped hooks make more sense

### Incorrect

#### Incorrect (side-effect spaghetti)

- Component mixes session management, deep linking, telemetry, navigation, splash screen, audio, and other startup logic
- Several unrelated `useSelector` calls and `useEffect` hooks in a single component
- Changing one concern risks breaking others

```tsx
function AppRoot() {
    // Session & auth
    const user = useSelector((state: RootState) => state.auth.user);
    const token = useSelector((state: RootState) => state.auth.token);

    // Navigation & routing
    const lastRoute = useSelector((state: RootState) => state.navigation.lastRoute);
    const [isNavigationReady, setIsNavigationReady] = useState(false);

    // App state
    const updateAvailable = useSelector((state: RootState) => state.app.updateAvailable);
    const updateRequired = useSelector((state: RootState) => state.app.updateRequired);

    // Splash screen
    const {splashScreenState, setSplashScreenState} = useContext(SplashScreenStateContext);

    // ... 10+ more useSelector calls for unrelated concerns ...

    // Telemetry effect
    useEffect(() => {
        bootSpan.current = startSpan('app.boot', {...});
        // ...
    }, []);

    // Session restore effect
    useEffect(() => {
        if (isRestoringSession) return;
        endSpan('app.boot.session');
        // ...
    }, [isRestoringSession]);

    // Splash screen effect
    useEffect(() => {
        if (!shouldHideSplash) return;
        BootSplash.hide({fade: true});
    }, [shouldHideSplash]);

    // Deep linking effect
    useEffect(() => {
        Linking.getInitialURL().then((url) => {
            if (url) {
                openApplicationFromDeepLink(url, ...);
            }
        });
        // ...
    }, []);

    // Audio mode effect
    useEffect(() => {
        Audio.setAudioModeAsync({playsInSilentModeIOS: true});
    }, []);

    // ... 10+ more useEffects mixing concerns ...
}
```

In this example:
- The component handles telemetry, deep linking, audio, session, navigation, splash screen, and more
- Each concern is interleaved with others, making it hard to modify one without risking regression in another
- Effects could be extracted to focused hooks: `useTelemetrySpans`, `useDeepLinking`, `useAudioMode`, etc.
- Entry points don't get special treatment — extracting effects into named hooks improves clarity and makes it possible to understand what each effect does and how to safely modify it

#### Incorrect (internal render helper functions)

- Internal render helpers become a problem when they carry hooks, side effects, or non-trivial business logic that belong in a dedicated component
- They become a problem when they build deeply nested JSX inline, hiding the real render tree from the return statement
- They become a problem when they close over mutable parent state (e.g., values from `useState`/`useReducer`) and bake that state into the JSX they produce
- React Compiler handles thin delegation wrappers (e.g., a function that picks a child component based on a prop) without issue — the rule targets helpers that are doing real work, not ones that just route to already-extracted children
- The fix for the problematic cases is to extract the helper into its own component with explicit props

```tsx
function ApplicationDetailsScreen({application, loanProduct}: Props) {
    const [draftNote, setDraftNote] = useState('');
    const {t} = useTranslation();

    // ❌ Heavy internal helper — closes over mutable state, runs business logic,
    //    and builds deeply nested JSX inline. This is what the rule targets.
    const renderNoteSection = () => {
        const trimmed = draftNote.trim();
        const isValid = trimmed.length > 0 && trimmed.length <= NOTE_MAX_LENGTH;
        const reviewers = getApplicationReviewers(application, loanProduct);
        const canEdit = canEditApplicationNote(application, reviewers);

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('notes.title')}</Text>
                    {canEdit && (
                        <View style={styles.sectionActions}>
                            <Button
                                text={t('common.save')}
                                isDisabled={!isValid}
                                onPress={() => saveApplicationNote(application.id, trimmed)}
                            />
                        </View>
                    )}
                </View>
                <TextInput
                    value={draftNote}
                    onChangeText={setDraftNote}
                    editable={canEdit}
                    multiline
                />
            </View>
        );
    };

    return <View style={styles.flex1}>{renderNoteSection()}</View>;
}
```

### Correct

#### Correct (separated concerns)

- Each piece of logic is extracted to a focused hook or component
- Parent component only orchestrates what to render
- State subscriptions in smaller components don't cause re-renders in parent
- Component-scoped hooks can be co-located in the same directory for maintainability

```tsx
function DebugMenu() {
    useRefreshOnForeground();

    return (
        // Debug menu UI
    );
}

function ParentComponent({ applicationID }: { applicationID: string }) {
    return (
        <View>
            {/* Each child owns its own concerns */}
            <ApplicationView applicationID={applicationID} />
            <DebugMenu />
        </View>
    );
}
```

```tsx
// Focused hook that does one thing well
function useRefreshOnForeground() {
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                refreshDebugInfo();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);
}
```

---

### Review Metadata

#### Condition

Flag when a component, hook, or utility aggregates multiple unrelated responsibilities in a single unit, making it difficult to modify one concern without touching others.

**Signs of violation:**
- Component has several `useEffect` hooks handling unrelated concerns (e.g., telemetry, deep linking, audio, session management all in one component)
- A single `useEffect` or hook handles multiple distinct responsibilities
- Unrelated state variables are interdependent or updated together
- Logic mixes data fetching, navigation, UI state, and lifecycle behavior in one place
- Removing one piece of functionality requires careful untangling from others
- An internal function that returns JSX contains hooks, side effects, or non-trivial business logic (data shaping, permission checks, validation, etc.) that should live in its own component
- An internal function that returns JSX builds deeply nested JSX inline, obscuring the component's render tree
- An internal function that returns JSX closes over mutable parent state (e.g., values from `useState`/`useReducer`) and embeds that state in the JSX it produces

**What counts as "unrelated":**
- Group by responsibility (what the code does), NOT by timing (when it runs)
- Data fetching and analytics are NOT related — they serve different purposes even if both run on mount
- Session management and audio configuration are NOT related — different domains entirely

**DO NOT flag if:**
- Component is a thin orchestration layer that ONLY composes child components (no business logic, no effects beyond rendering)
- Effects are extracted into focused custom hooks with single responsibilities (e.g., `useRefreshOnForeground`, `useDeepLinking`) — inline `useEffect` calls are a code smell and should be named hooks
- The internal function is a **callback or event handler** (e.g., `handlePress`, `onSubmit`), not a render helper — only functions that return JSX qualify
- The internal function is a **single early return** for a guard clause (e.g., `if (!data) return <EmptyState />;` at the top of the component) — simple guards in the component body are not render helpers
- The internal function is a **switch/conditional helper that delegates to already-extracted child components** (e.g., `const renderItem = () => type === 'foo' ? <FooItem /> : <BarItem />`) — React Compiler memoizes these thin wrappers correctly
- The internal function (or inline `.map()` callback) **iterates over data and renders an already-extracted child component** per item (e.g., `items.map((item) => <Row key={item.id} item={item} />)`) — the per-item work happens inside the extracted child

**Search Patterns** (hints for reviewers):
- `useEffect`
- `useSelector`
- `const render\w+\s*=` or `function render\w+` inside a component body (internal render helpers)
- `{render\w+\(\)}` in JSX return statements (helper invocations)
