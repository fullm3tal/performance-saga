---
ruleId: CONSISTENCY-17
title: Pluralize with i18next plural keys, not ternaries on a count
---

## [CONSISTENCY-17] Pluralize with i18next plural keys, not ternaries on a count

### Reasoning

Choosing a word form with a ternary (`count === 1 ? 'loan' : 'loans'`), a `(s)` suffix, or a pair of keys selected by the caller hardcodes English's two-form plural rule into the code. The project ships English (`en.json`) and Hindi (`hi.json`), and their plural categories differ:

| Locale | Cardinal categories |
|---|---|
| `en` | `one` (exactly 1) / `other` |
| `hi` | `one` / `other`, but `one` covers **both 0 and 1** |

i18next has built-in plural support. `src/languages/i18n.js` initialises it with `compatibilityJSON: 'v4'`, so plural keys use the `Intl.PluralRules` suffixes `_one` / `_other`. Call `t('key', {count})` with the base key (no suffix) and i18next selects the right suffixed entry for the active language, so each language file supplies exactly the forms its grammar needs.

Ternaries using `> 1` are also wrong in English: zero takes the plural, so `` `${count} member${count > 1 ? 's' : ''}` `` renders "0 member". A single key with `{{count}}` and no plural forms (`"{{count}} months"`) is wrong the other way and renders "1 months".

### Incorrect

```tsx
// Hardcodes a two-form rule in the caller
<Text>{count === 1 ? t('label_pending_repayment') : t('label_pending_repayments', {count})}</Text>

// `> 1` also breaks English: renders "0 member"
<Text>{`${count} member${count > 1 ? 's' : ''}`}</Text>
```

```json
// en.json - "(s)" and a count with no plural forms
"message_pending_members": "{{count}} member(s) have pending requirements",
"label_months_with_count": "{{count}} months"
```

### Correct

```json
// en.json
"message_pending_members_one": "1 member has pending requirements",
"message_pending_members_other": "{{count}} members have pending requirements",
"label_months_with_count_one": "{{count}} month",
"label_months_with_count_other": "{{count}} months"

// hi.json - `one` also covers 0, so it must use {{count}}, not a literal 1
"message_pending_members_one": "{{count}} सदस्य की आवश्यकताएं लंबित हैं",
"message_pending_members_other": "{{count}} सदस्यों की आवश्यकताएं लंबित हैं"
```

```tsx
<Text>{t('message_pending_members', {count: pendingMembers.length})}</Text>
```

One plural key resolves against a single `count`. When a sentence has two independent quantities, split it into one key per quantity and compose them in the calling code:

```json
// Incorrect - no plural rule can cover two counts at once
"message_import_result": "{{added}} customer(s) added, {{updated}} customer(s) updated."

// Correct - one plural key per quantity
"message_customers_added_one": "1 customer has been added.",
"message_customers_added_other": "{{count}} customers have been added.",
"message_customers_updated_one": "1 customer has been updated.",
"message_customers_updated_other": "{{count}} customers have been updated."
```

### The option must be named `count`

i18next only applies plural resolution when the option is named exactly `count` and is a number. `t('label_months_with_count', {months: 3})` or `t('label_months_with_count', {count: '3'})` will not select `_one`/`_other`; the lookup falls back to the bare key (if one exists) and the plural forms are silently ignored. Pass the quantity as `{count: <number>}` and interpolate it as `{{count}}`.

---

### Review Metadata

**Flag a ternary or hardcoded plural** when ALL of these are true:

- The changed code is a translation entry in `src/languages/*.json` or a `t(...)` call site
- It chooses between singular and plural wording based on a number using a conditional (`=== 1`, `!== 1`, `> 1`, `>= 2`, `< 2`), a `(s)` / `(es)` suffix, or a pair of separate keys, instead of `_one`/`_other` plural keys with `t(key, {count})`
- The differing text is grammatical number agreement (singular vs plural wording), not a different message

**Flag a broken plural call** when:

- A key has `_one`/`_other` entries but the call site passes the quantity under a name other than `count`, or passes a non-number
- A key with `{{count}}` next to an inflecting word is added or changed with no `_one`/`_other` forms

**DO NOT flag if:**

- The conditional is not about grammatical number — presence or threshold checks such as `count > 0 ? t('label_more', {count}) : summary`, or conditionally showing a segment
- The number appears only next to an invariant unit abbreviation (`{{days}}d`, `{{hours}}h`) or after a label and colon (`"Applications to be sent back: {{count}}"`) where no word inflects
- The change merely touches an existing non-pluralized entry without changing its wording or count handling
- The file is a test, story, or fixture

**Guidance when flagging:**

- Adding `_one`/`_other` forms requires updating the same key in both `en.json` and `hi.json`; call sites keep using the base key
- `_one` should use a literal `1` only where that category matches exactly the number 1 (English). In `hi.json`, `one` also covers 0, so it must use `{{count}}`

**Search Patterns** (hints for reviewers):

- `(===|!==|>|>=|<|<=) 1 \?` near a `t(` call
- `\? '[a-z]+' : '[a-z]+s'` — singular/plural word pair
- `\? 's' : ''` or `\? '' : 's'` — suffix toggle
- `\(s\)` or `\(es\)` in `src/languages/*.json`
- `\{\{count\}\}` in a key with no `_one`/`_other` siblings
