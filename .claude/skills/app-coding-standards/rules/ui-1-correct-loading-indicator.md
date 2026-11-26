---
ruleId: UI-1
title: Use the correct loading indicator based on navigation context
---

## [UI-1] Use the correct loading indicator based on navigation context

### Reasoning

If loading hangs, users need an escape route. When navigation (back button, close) is visible alongside the loader, users can escape - render an inline `ActivityIndicator` in the content area below the header. When a loader is the only thing on screen (an early return, or a full-screen overlay that covers the header), users are trapped - keep a back/close control rendered with the loader, or show a "Go back" / "Retry" action after a timeout.

### Incorrect

```tsx
// Full-screen (absolute-fill) loader overlay rendered over the header - it covers the back button
<View style={styles.flex1}>
    <Header title={t('settings.title')} onBackPress={navigation.goBack} />
    <FullScreenLoaderOverlay />
</View>

// Loader as the only content, no navigation - user trapped if loading hangs
function VerifyOtpScreen() {
    if (isLoading) {
        return (
            <View style={[styles.flex1, styles.justifyContentCenter, styles.alignItemsCenter]}>
                <ActivityIndicator size="large" />
            </View>
        );
    }
    // ...
}
```

### Correct

```tsx
// Loader as the only content - provide an escape route after a timeout
function VerifyOtpScreen() {
    if (isLoading) {
        return (
            <View style={[styles.flex1, styles.justifyContentCenter, styles.alignItemsCenter]}>
                <ActivityIndicator size="large" />
                {isLoadingTooLong && <Button title={t('common.goBack')} onPress={navigation.goBack} />}
            </View>
        );
    }
    // ...
}

// Header visible during loading - use an inline ActivityIndicator below it
function SettingsScreen() {
    return (
        <View style={styles.flex1}>
            <Header title={t('settings.title')} onBackPress={navigation.goBack} />
            {isLoading ? (
                <View style={[styles.flex1, styles.justifyContentCenter, styles.alignItemsCenter]}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <Content />
            )}
        </View>
    );
}
```

---

### Review Metadata

Flag ONLY when ANY of these patterns is found:

- A full-screen loader (absolute-fill overlay, or a `flex: 1` container that replaces the screen) and a header/back/close control are **both under the same JSX tree** and the loader covers the navigation
- A loader (`ActivityIndicator` or a full-screen loader component) is the **sole/main screen content** (flex:1 container, early return) without any navigation component (header with back button, close button) or timeout escape action **in the same return statement or conditional branch**

**DO NOT flag if:**

- The navigator's own header is shown for the screen (e.g., React Navigation `headerShown` is not `false`), so a back button stays visible above the loader
- The loader is a short, non-blocking overlay for an in-progress user action (e.g., submitting a form) that always resolves or errors
- The `ActivityIndicator` is used within interactive UI elements (buttons, list items, cards) where the user can still interact with surrounding navigation

**Search Patterns** (hints for reviewers):
- `LoadingIndicator`
- `Loader`
- `ActivityIndicator`
- `StyleSheet.absoluteFill`
