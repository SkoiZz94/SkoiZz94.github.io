# 📘 JavaScript Projects Documentation

This folder contains three independent JavaScript-based projects:

1. **CyberArk Quiz Application**  
2. **Kanban Board with Clocks**  
3. **WIM Calculator (Portugal)**  

Each script handles different functionality and is documented below.

---

## 1. Quiz Application (`cyberark.js`)

### Overview
An interactive quiz engine that loads questions from a JSON file, randomizes order, tracks answers, supports multiple correct answers, and calculates pass/fail results.

### Key Features
- Fetches questions from `/data/questions.json` (semicolon-delimited fields for answers).
- Normalizes data into `{question, answers[], correctIndices[], isMultiple}`.
- Shuffles questions and answers independently.
- Tracks:
  - **User answers**
  - **Flagged questions** (skipped from grading but available in review).
- Results view:
  - Pass/fail calculation (default threshold: **80%**).
  - Counts of correct, incorrect, and answered questions.
- Review mode:
  - Shows flagged/answered questions.
  - Marks correct/incorrect answers with ✓ / ✗.

### Utilities
- **DOM helpers** (`$`, `show`, `hide`).
- **Randomization** (`shuffleArray`).
- **Deep clone** via `JSON.stringify`/`parse`.

---

## 2. Kanban Board with Clocks (`kanban.js`)

### Overview
A browser-based **Kanban task board** with drag-and-drop (desktop + touch), note history, and time zone clocks.

### Key Features
- **Notes (tasks):**
  - Add, edit, delete, and move tasks across columns (`todo`, `inProgress`, `done`, `onHold`).
  - Track history of actions (created, edited, moved, deleted).
  - Persisted with `localStorage`.
- **Clocks:**
  - Displays local time and date plus times for **Europe/Paris**, **Asia/Shanghai**, **America/New_York**, and **Africa/Cairo**.
- **Drag-and-Drop:**
  - Native support for desktop.
  - Touch events for tablets/phones.
- **Export:**
  - Exports current tasks and deleted items into a `.txt` file with history.
- **Navigation Guard:**
  - Prompts user to export notes before leaving the page.

### Utilities
- HTML escaping for safe rendering (`escapeHtml`).
- Date helpers (`getCurrentDate`).
- Column name mapping.

---

## 3. WIM Calculator (`wincalc.js`)

### Overview
A calculator that computes an employee’s attendance score for a given month in **Portugal**, taking into account:
- Weekdays,
- National holidays (via [Nager.Date API](https://date.nager.at/)),
- Vacation days.

### Key Features
- **Input:**
  - Month number (`1–12`),
  - Vacation days,
  - Workdays attended.
- **Processing:**
  - Counts weekdays in month.
  - Fetches and filters holidays:
    - Only **national** (no regional holidays).
    - Only those on weekdays.
  - Subtracts holidays + vacation days from available workdays.
- **Scoring:**
  - Score = `(diasPresentes / diasDisponiveis) × 5`.
  - Color-coded result:
    - Red: `< 2`,
    - Yellow: `2 – 3`,
    - Green: `> 3`.
- **Output:**
  - Summary of weekdays, holidays (with dates and names), available days, and score.

### Utilities
- `contarDiasDeSemana(mes, ano)` – counts weekdays in a month.
- `monthNames[]` – Portuguese month names.

---

## ⚙️ Requirements
- Runs in any modern browser (no external libraries needed).
- Requires internet access for **holiday API** (script 3).

---

## 🚀 Usage
1. Open the HTML page including the desired script(s).
2. Ensure elements with expected IDs exist in the HTML (e.g., `#cyberark`, `#wincalc`, `#kanban`).
3. For the quiz:
   - Place `questions.json` in `/data/`.
4. For Kanban:
   - Interact with tasks across columns, clocks auto-update.
5. For WIM Calculator:
   - Select a month, input vacation & attendance days, view calculated score.
