# Data Folder – Question Bank Format

This folder stores JSON files used by the Quiz application. Currently contains **one file** with CyberArk training questions.

> The quiz script expects **semicolon-separated answer strings** and converts them to arrays at runtime.

---

## File Contents & Schema

Each entry in the JSON array must follow this shape:

```json
{
  "question": "<string>",
  "correct_answer": "<string: one or more answers separated by ';'>",
  "incorrect_answers": "<string: zero or more answers separated by ';'>",
  "image": "<string: optional, currently ignored>"
}
```

### Field Notes

- **question** *(required)*: The prompt shown to the user. Plain text recommended.
- **correct_answer** *(required)*: One or more correct choices separated by semicolons (`;`).
  - Multiple correct answers are treated as **multi-select** questions.
- **incorrect_answers** *(optional)*: Zero or more incorrect choices separated by semicolons. Use empty string (`""`) if none.
- **image** *(optional)*: Not currently used by the UI, preserved for future use.

---

## How the App Reads This Data

The loader (`normalizeFromSemicolonStrings` in `cyberark.js`) does the following:

1. Splits `correct_answer` and `incorrect_answers` on `;` and trims whitespace
2. Filters out empty values
3. Builds `answers[]` with all correct answers first, then incorrect ones
4. Creates `correctIndices[]` pointing to the correct options
5. Marks question as **multiple-choice** if more than one correct item
6. Shuffles answers for randomized display

> Because answers are split on semicolons, **semicolons cannot appear inside an individual answer**.

---

## Example Entries

**Single-answer question**
```json
{
  "question": "Which report provides a list of accounts stored in the vault?",
  "correct_answer": "Privileged Accounts Inventory",
  "incorrect_answers": "Privileged Accounts Compliance Status;Entitlement Report;Activity Log",
  "image": ""
}
```

**Multi-answer question** (multi-select)
```json
{
  "question": "SAFE Authorizations may be granted to (choose all that apply).",
  "correct_answer": "Vault Users;Vault Groups;LDAP Users;LDAP Groups",
  "incorrect_answers": "",
  "image": ""
}
```

---

## Authoring Guidelines

- **Clarity**: Avoid double negatives and ambiguous phrasing
- **Consistency**: Match capitalization and punctuation across options
- **Balance**: Prefer 3–5 options per question
- **Length**: Keep options short for readability
- **No HTML**: Provide plain text only
- **Images**: Field preserved for future enhancement

---

## Validation Checklist

- [ ] All objects contain `question` and `correct_answer`
- [ ] No trailing/leading semicolons in answer strings
- [ ] No empty items after splitting on `;`
- [ ] If `incorrect_answers` is empty, set to `""`
- [ ] No semicolons inside a single answer

---

## File Location

- Place files under `data/`, e.g., `data/questions.json`
- The quiz loader fetches from `/data/questions.json` by default (see `JSON_URL` in `cyberark.js`)

---

## Extending the Dataset

- Add more objects to the array using the same schema
- For topic-specific banks, create separate JSON files (e.g., `linux.json`) and update `JSON_URL` accordingly
