---
ruleId: CONSISTENCY-8
title: Localize numbers, amounts, dates and phone numbers
---

## [CONSISTENCY-8] Localize numbers, amounts, dates and phone numbers

### Reasoning

All numbers, amounts, dates and phone numbers shown in the product must be formatted through the project's shared formatting helpers (e.g. `formatCurrency` in `src/utils/AppUtility.ts`, `formatDateWithPattern` in `src/utils/DateUtils.ts`) so separators, currency placement and date order are consistent across screens. Raw `Intl.*`, manual currency concatenation, or ad hoc `toLocale*` calls bypass those helpers and produce inconsistent output.

### Incorrect

```tsx
function LoanAmount({value}: {value: number}) {
    return <Text>{new Intl.NumberFormat('en-US', {style: 'currency', currency: 'INR'}).format(value)}</Text>;
}

function RepaymentDueDate({date}: {date: Date}) {
    return <Text>Due {date.toLocaleDateString()}</Text>;
}

function OutstandingTotal({amount}: {amount: number}) {
    return <Text>{`₹${amount}`}</Text>;
}
```

### Correct

```tsx
function LoanAmount({value}: {value: number}) {
    return <Text>{formatCurrency(value)}</Text>;
}

function RepaymentDueDate({date}: {date: string}) {
    const {t} = useTranslation();
    return <Text>{t('label_due_on', {date: formatDateWithPattern(date)})}</Text>;
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- The changed code formats a number, monetary amount, date/time, or phone number for display
- It does so with `new Intl.NumberFormat`/`Intl.DateTimeFormat`, `.toLocaleString`/`.toLocaleDateString`/`.toLocaleTimeString`, or manual string concatenation of a currency symbol with a number (e.g. `` `₹${amount}` ``)
- It does not go through the project's shared formatting helpers (`formatCurrency`, `formatDateWithPattern` or another existing util in `src/utils/`)

**DO NOT flag if:**

- The value is internal/non-display (logging, sorting keys, API payloads, IDs)
- The code is inside the localization utilities themselves
- The code is in a test or story

**Search Patterns** (hints for reviewers):
- `Intl.NumberFormat` / `Intl.DateTimeFormat`
- `toLocaleDateString` / `toLocaleTimeString` / `toLocaleString`
- `` `₹${ `` / `` `₹ ${ `` or `'₹' +` style currency concatenation
