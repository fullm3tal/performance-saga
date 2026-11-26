---
ruleId: CONSISTENCY-19
title: User-facing copy is grammatical and sentence case
---

## [CONSISTENCY-19] User-facing copy is grammatical and sentence case

### Reasoning

All user-visible copy lives in `src/languages/*.json` (`CONSISTENCY-7`), and the Hindi strings in `src/languages/hi.json` are translated from `src/languages/en.json`, so a mistake in the English string ships to users and is likely carried into the translation. Two failures are mechanical to spot in a diff of that file. A grammar or spelling error reads as careless in the product. Title Case breaks the convention of capitalizing only the first word of a header, label, button or menu item, proper nouns and product names excepted, and once one Title Case entry lands the next contributor copies it.

### Incorrect

```json
// src/languages/en.json
{
  "translation": {
    "message_add_co_applicant": "Add a new co-applicants to you application",
    "label_edit_loan_details": "Edit Loan Details",
    "label_save_changes": "Save Changes"
  }
}
```

### Correct

```json
// src/languages/en.json
{
  "translation": {
    "message_add_co_applicant": "Add new co-applicants to your application",
    "label_edit_loan_details": "Edit loan details",
    "label_save_changes": "Save changes"
  }
}
```

---

### Review Metadata

Flag ONLY when BOTH of these are true:

- The changed code adds or edits a user-visible string in `src/languages/en.json`
- The string has at least one of these problems:
  - A clear grammar or spelling error: wrong agreement, a wrong or missing word, a misspelling, a wrong homophone (`you`/`your`, `its`/`it's`)
  - A word after the first is capitalized, and it is not a proper noun, product name, acronym, or interpolated variable

**DO NOT flag if:**

- The capitalized words are proper nouns or product names (`Aadhaar`, `Voter ID`, `PAN`, the app's own product name)
- The string is an acronym or initialism (`KYC`, `EMI`, `OTP`)
- The wording is grammatical and the concern is only style, tone, or a phrasing preference
- A label, button or menu item is a terse fragment by design (`Save`, `Add customer`), which is not a grammar error
- The copy comes verbatim from Figma or has marketing approval. The reviewer confirms that, and it overrides this rule
- The string is in a non-English language file (`hi.json`); English grammar and casing rules do not apply there
- The string is not user-visible (log lines, test fixtures, keys, error codes)

**Search Patterns** (hints for reviewers):
- added or changed string values in `src/languages/en.json`
- `: "[A-Z][a-z]+ [A-Z]` (a second capitalized word in a JSON string value)
