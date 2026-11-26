---
ruleId: PERF-5
title: Use shallow comparisons instead of deep comparisons
---

## [PERF-5] Use shallow comparisons instead of deep comparisons

### Reasoning

Deep equality checks recursively compare all nested properties, creating performance overhead that often exceeds the re-render cost they aim to prevent. Shallow comparisons of specific relevant properties provide the same optimization benefits with minimal computational cost.

### Incorrect

```tsx
memo(LoanSummaryItem, (prevProps, nextProps) =>
    deepEqual(prevProps.loan, nextProps.loan) &&
    prevProps.isSelected === nextProps.isSelected
)
```

### Correct

```tsx
memo(LoanSummaryItem, (prevProps, nextProps) =>
    prevProps.loan.status === nextProps.loan.status &&
    prevProps.loan.loanID === nextProps.loan.loanID &&
    prevProps.isSelected === nextProps.isSelected
)
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- Code uses `React.memo` or similar comparison function
- Deep equality check is used (e.g., `deepEqual`)
- Some properties could be shallow-compared instead

**DO NOT flag if:**

- Deep comparison is necessary for the data type
- Properties are primitives already (comparison is already shallow)
- No optimization function is used

**Search Patterns** (hints for reviewers):
- `React.memo`
- `deepEqual`
