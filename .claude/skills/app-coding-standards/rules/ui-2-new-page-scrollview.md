---
ruleId: UI-2
title: New pages must be scrollable
---

## [UI-2] New pages must be scrollable

### Reasoning

When a new page is added it must use the `ScrollView` component so it stays usable as more elements are added and on smaller screens. A page that lays out its content in plain `View`s will clip or trap content once it exceeds the viewport. Pages whose primary content is a virtualized list are already scrollable and are exempt.

### Incorrect

```tsx
function CustomerDetailsScreen() {
    return (
        <View style={styles.flex1}>
            <Header title={t('customer.details')} />
            <View style={styles.flex1}>
                <DetailRow label={t('common.name')} />
                <DetailRow label={t('common.mobileNumber')} />
                {/* more fields keep getting added below... */}
            </View>
        </View>
    );
}
```

### Correct

```tsx
function CustomerDetailsScreen() {
    return (
        <View style={styles.flex1}>
            <Header title={t('customer.details')} />
            <ScrollView>
                <DetailRow label={t('common.name')} />
                <DetailRow label={t('common.mobileNumber')} />
            </ScrollView>
        </View>
    );
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- A newly added file under `src/screens/**` renders a screen (e.g. is registered as a navigator screen)
- Its content is laid out directly in `View`s that can grow as elements are added
- It does not render a `ScrollView` (or a project wrapper around it, e.g. `BaseScrollView`) and is not a list-based screen

**DO NOT flag if:**

- The page's primary content is a virtualized list (`FlatList`, `SectionList`) - already scrollable
- The screen is intentionally fixed-height (full-screen loader, confirmation modal, bottom sheet that must not scroll)
- The change modifies an existing page rather than adding a new one

**Search Patterns** (hints for reviewers):
- Added files in `src/screens/**`
- A screen component without `ScrollView`/`BaseScrollView`/`FlatList`/`SectionList`
