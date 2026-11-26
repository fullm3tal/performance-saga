---
ruleId: PERF-2
title: Return early before expensive work
---

## [PERF-2] Return early before expensive work

### Reasoning

Early returns prevent wasted computation. Validate inputs before passing them to expensive operations.

### Incorrect

```ts
function clearRepaymentErrors(loanID: string, repayment: Repayment) {
    const originalLoanID = getOriginalLoanID(loanID, repayment);

    if (!repayment?.repaymentID) {
        return;
    }
    // ...
}
```

### Correct

```ts
function clearRepaymentErrors(loanID: string, repayment: Repayment) {
    if (!repayment?.repaymentID) {
        return;
    }

    const originalLoanID = getOriginalLoanID(loanID, repayment);
    // ...
}
```

---

### Review Metadata

Flag ONLY when ALL of these are true:

- Code performs expensive work (function calls, iterations, API/store/storage reads)
- A simple check could short-circuit earlier
- The simple check happens AFTER the expensive work

**DO NOT flag if:**

- Simple checks already come first
- Validation requires the computed result
- Expensive work must run for side effects

**Search Patterns** (hints for reviewers):
- `if (!param)`
- `if (param === undefined)`
