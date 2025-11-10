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
The **Weekly Individual Measurement (WIM Calculator)** computes an employee’s **office attendance and compliance** for a given **week**, based on actual entry/exit times, local holidays, and selected vacation days.  
It is designed for **Portugal**, integrating directly with the [Nager.Date API](https://date.nager.at/) to fetch official public holidays.

### Key Features

#### Input
- **Week selection:** pick any date to automatically load its full Monday–Friday range.
- **Automatic holiday detection:** retrieves official Portuguese holidays within the selected week.
- **Manual vacation selection:** mark individual days as *Férias* (vacation).
- **Work hours entry:** specify daily **Entrada** and **Saída** times in 24h format (`07:00–19:00` window).
  - Hours outside this window are ignored.
  - Lunch break of 1 hour is automatically deducted for days > 4h.

#### Processing
- Fetches and filters holidays:
  - Only **national weekday holidays** (no regional or weekend holidays).
- Blocks entry fields automatically for holidays.
- Disables *Férias* checkbox on holidays.
- Calculates:
  - **Total valid office hours** (07:00–19:00, minus lunch).
  - **Days present in office**.
  - **Vacation days**.
  - **Available workdays** (`5 - holidays - vacation days`).

#### Compliance Evaluation
Compares total hours against required thresholds:

| Requirement | Non-Compliant (Red) | Warning (Yellow) | Compliant (Green) |
|--------------|--------------------|------------------|------------------|
| **2 dias / 16h** | `<16h` | `≥16h & <18h` | `≥18h` |
| **3 dias / 24h** | `<24h` | `≥24h & <27h` | `≥27h` |

#### Visual Indicators
- **Feriado** rows: subtle **orange background**.
- **Férias** rows: subtle **blue background**.
- **Compliance colors:** red, yellow, and green per rule.
- **Results summary** includes:
  - Week range + ISO week number (e.g., `Semana: 29 de Dezembro (2025) a 2 de Janeiro (2026) – W01`)
  - List of holidays with names.
  - Days of vacation.
  - Available workdays.
  - Days present in the office.
  - Total valid hours and compliance status.

#### Output
Displays a clean, structured weekly report:
- All calculated metrics.
- Visual compliance indicators for both rules (2-day and 3-day WIM targets).
- Contextual notes clarifying the hour rules (window + lunch break).

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
