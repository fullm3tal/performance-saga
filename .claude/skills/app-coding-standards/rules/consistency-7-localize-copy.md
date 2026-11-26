---
ruleId: CONSISTENCY-7
title: Localize all user-visible copy
---

## [CONSISTENCY-7] Localize all user-visible copy

### Reasoning

All copy/text shown in the product must be localized by adding a key to both `src/languages/en.json` and `src/languages/hi.json` and rendering it through i18next (`t('key')` from `useTranslation()` in components, or `t` imported from `i18next` outside React). Hardcoded user-facing strings cannot be translated and break the localized experience.

### Incorrect

```tsx
function SaveButton() {
    return <Button text="Save changes" />;
}

function EmptyState() {
    return (
        <View>
            <Text>No results found</Text>
        </View>
    );
}
```

### Correct

```tsx
function SaveButton() {
    const {t} = useTranslation();
    return <Button text={t('label_save_changes')} />;
}

function EmptyState() {
    const {t} = useTranslation();
    return (
        <View>
            <Text>{t('message_no_results_found')}</Text>
        </View>
    );
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- A user-visible JSX text node, or a user-facing string prop (`text`, `title`, `label`, `placeholder`, `header`, `description`, `accessibilityLabel`, `alternateText`), is assigned a hardcoded non-empty string literal
- The string is rendered in product code (not a test, story, or dev-only path)
- The string is not passed through the translation method (`t(...)` from `useTranslation` or `i18next`)

**DO NOT flag if:**

- The string is an identifier, key, route, test ID, style token, icon name, or enum/constant value (not shown to the user)
- The value is already wrapped in `t(...)` or comes from a `src/languages/*.json` entry
- The string is a `console.*` / logging message
- The text is a proper noun or brand name intentionally not translated (e.g. the app's own product name)

**Search Patterns** (hints for reviewers):
- `<Text>` / `<Text ...>` containing a bare string literal
- `(text|title|label|placeholder|header|description|alternateText|accessibilityLabel)=["'][A-Za-z]`
