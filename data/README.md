# 📚 Data Folder – Question Bank Format

This folder stores JSON files used by the Quiz application. At the moment there is **one file** containing CyberArk training questions.

> The quiz script expects **semicolon‑separated answer strings** and converts them to arrays at runtime.

---

## File Contents & Schema
Each entry in the JSON array must follow this shape:

```jsonc
{
  "question": "<string>",
  "correct_answer": "<string: one or more answers separated by ';'>",
  "incorrect_answers": "<string: zero or more answers separated by ';'>",
  "image": "<string: optional relative path or URL>"
}
```

### Field Notes
- **question** *(required)*: The prompt shown to the user. Keep it concise; plain text is recommended.
- **correct_answer** *(required)*: One or more correct choices separated by semicolons (`;`).
  - If there are **multiple correct answers**, they will be treated as a **multi‑select** question.
- **incorrect_answers** *(optional)*: Zero or more incorrect choices separated by semicolons. Use an empty string (`""`) if none.
- **image** *(optional)*: Not currently used by the UI (**ignored intentionally** by the loader), but preserved for future use.

---

## How the App Reads This Data
The loader (see `normalizeFromSemicolonStrings` in the quiz JS) does the following:
1. Splits `correct_answer` and `incorrect_answers` on `;` and trims whitespace.
2. Filters out empty values.
3. Builds `answers[]` with **all correct answers first**, followed by incorrect ones.
4. Creates `correctIndices[]` pointing to the (shuffled) correct options.
5. Marks a question as **multiple‑choice** if there is more than one correct item.

> Because answers are split on semicolons, **semicolons cannot appear inside an individual answer**. If you need them, rephrase or use commas/dashes.

---

## Example Entries

**Single‑answer question**
```json
{
  "question": "Which report provides a list of accounts stored in the vault?",
  "correct_answer": "Privileged Accounts Inventory",
  "incorrect_answers": "Privileged Accounts Compliance Status;Entitlement Report;Activity Log",
  "image": ""
}
```

**Multi‑answer question** (multi‑select)
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
- **Clarity**: Avoid double negatives and ambiguous phrasing.
- **Consistency**: Capitalization and punctuation should match across options.
- **Balance**: Prefer 3–5 options per question; randomize placement is handled by the app.
- **Length**: Keep options short; long paragraphs reduce readability.
- **No HTML**: Provide plain text; the app renders answers as text labels.
- **Images**: You may set `image` now for future enhancement, but the current UI ignores it.

---

## Validation Checklist (before committing)
- [ ] All objects contain `question` and `correct_answer`.
- [ ] No trailing/leading semicolons in answer strings.
- [ ] No empty items after splitting on `;`.
- [ ] If `incorrect_answers` is empty, it is set to `""`.
- [ ] No semicolons inside a single answer.

---

## File Naming & Location
- Place files under `data/`, e.g. `data/questions.json`.
- The quiz loader fetches from `/data/questions.json` by default (see `JSON_URL` in the script). If you add additional banks, update that constant or provide a selector in the UI.

---

## Extending the Dataset
- Add more objects to the array using the same schema.
- To create **topic‑specific** banks, create separate JSON files (e.g., `cyberark.json`, `linux.json`) and switch `JSON_URL` accordingly.

---

## Known Caveats
- **Semicolon delimiter**: No escaping mechanism; avoid semicolons in answers.
- **Images ignored**: Presently not rendered; safe for future expansion.
- **Whitespace**: Leading/trailing spaces are trimmed automatically.

---

## Quick Lint (optional)
If you lint the JSON externally, ensure the file is a **valid JSON array** and not JSONL or NDJSON. Comments are not permitted in the actual file.
