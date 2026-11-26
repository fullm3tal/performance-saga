---
ruleId: UI-5
title: Reuse an existing style or style helper instead of adding a new one
---

## [UI-5] Reuse an existing style or style helper instead of adding a new one

### Reasoning

Styles belong to the shared theme/style system. Before a new style is added, the equivalent usually already exists - either as a shared style (spacing, flex, text, typography) or as a style helper that derives it from the theme. A duplicate style is invisible to the next contributor, drifts from the original when one copy is updated, and bypasses theming when it hardcodes what a helper derives.

### Incorrect

```ts
// A new style that duplicates one already in the shared styles
const styles = StyleSheet.create({
    myCardWrapper: {
        backgroundColor: color.cardBackground,
        borderRadius: 8,
        padding: 8,
    },
});
```

### Correct

```tsx
// Reuse the existing shared style
function Card() {
    return <View style={sharedStyles.card} />;
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- The changed code adds a new named style to the shared styles (or a local `StyleSheet.create` / style object built in a component)
- An equivalent already exists in the shared theme/styles or another reusable style, or the same shape can be produced by an existing style helper
- Swapping in the existing style or helper renders identically: every property the new style sets comes out with the same value

**DO NOT flag if:**

- No existing style or style helper produces the same result, and the new style is genuinely novel
- Swapping in the closest existing style or helper would change how the style renders (for example, it sets a different border color or width, or omits a property the new style needs)
- The style is a one-off override required by a third-party component's API
- The new entry is itself a shared style or style helper intended for reuse
- The code is a test or story

**Search Patterns** (hints for reviewers):
- added keys in `StyleSheet.create` blocks or shared style/theme files (e.g. under `src/themes/`)
- `padding:` / `margin:` / `flex:` numeric literals in a new style object
- hardcoded colors or font values that the theme already provides
