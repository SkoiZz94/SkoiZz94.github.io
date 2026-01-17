# JavaScript Documentation

This folder contains three JavaScript files powering the interactive features of the project:

1. **CyberArk Quiz Application** (`cyberark.js`)
2. **Kanban Board** (`kanban.js`)
3. **WIM Calculator** (`wincalc.js`)

---

## 1. Quiz Application (`cyberark.js`)

### Overview
An interactive quiz engine that loads questions from a JSON file, randomizes order, tracks answers, supports multiple correct answers, and calculates pass/fail results.

### Key Features
- Fetches questions from `/data/questions.json` (semicolon-delimited fields for answers)
- Normalizes data into `{question, answers[], correctIndices[], isMultiple}`
- Shuffles questions and answers independently
- Tracks:
  - **User answers**
  - **Flagged questions** (skipped from grading but available in review)
- Results view:
  - Pass/fail calculation (default threshold: **80%**)
  - Counts of correct, incorrect, and answered questions
- Review mode:
  - Shows flagged/answered questions
  - Marks correct/incorrect answers with visual indicators

### Utilities
- DOM helpers (`$`, `show`, `hide`)
- Randomization (`shuffleArray`)
- Deep clone via `JSON.stringify`/`parse`

---

## 2. Kanban Board (`kanban.js`)

### Overview
A full-featured **Kanban task board** with drag-and-drop support (desktop + touch), priorities, timers, notes with images, and multiple clock types.

### Key Features

#### Task Management
- **Add, edit, delete tasks** across four columns: To Do, In Progress, On Hold, Done
- **Priority system**: None, Low, Medium, High with color-coded cards
  - Quick priority menu on cards
  - Priority selector in task modal
  - Priority changes logged in history
- **Task timer**: Track worked time per task
  - Quick add/subtract time buttons (+1m to +60m)
  - Timer displayed on cards and in modal
  - Time changes logged in history
- **History tracking**: All actions logged with timestamps (created, moved, edited, timer, priority)

#### Notes System
- **Plain text only**: No formatting allowed (bold, italic, etc. blocked)
- **Image support**: Paste images from clipboard
- **Image viewer**: Full-screen modal with:
  - Scroll wheel zoom in/out
  - Click and drag to pan (when zoomed)
  - Click outside image to close
- **IndexedDB storage**: Images persisted separately from localStorage

#### Clocks
- **Timezone clocks**: Display time for any timezone
- **Chronometers**: Stopwatch functionality with start/pause/reset
- **Drag to reorder**: Clocks can be rearranged
- **Add/remove clocks**: Dynamic clock management

#### Drag-and-Drop
- Native HTML5 drag-and-drop for desktop
- Touch event handling for tablets/phones
- Visual feedback during drag operations

#### Export/Import
- **HTML export**: Export entire board with all tasks and history
- **PDF export**: Export individual tasks with notes, images, timer, priority
- **Import**: Load previously exported HTML files

#### Data Persistence
- Tasks stored in `localStorage`
- Images stored in `IndexedDB`
- Permanent and temporary notes areas

### Utilities
- HTML escaping (`escapeHtml`)
- Time formatting (`formatTime`)
- Priority helpers (`getPriorityLabel`, `getPriorityColor`)
- Image dimension calculator for PDF export

---

## 3. WIM Calculator (`wincalc.js`)

### Overview
The **Weekly Individual Measurement Calculator** computes an employee's **office attendance and compliance** for a given week, based on actual entry/exit times, local holidays, and vacation days. Designed for **Portugal**.

### Key Features

#### Input
- **Week selection**: Pick any date to load its Monday–Friday range
- **Automatic holiday detection**: Fetches Portuguese holidays via [Nager.Date API](https://date.nager.at/)
- **Manual vacation selection**: Mark individual days as vacation
- **Work hours entry**: Specify daily entry/exit times (07:00–19:00 window)
  - Hours outside window are ignored
  - 1-hour lunch break auto-deducted for days > 4h

#### Processing
- Fetches and filters holidays (national weekday holidays only)
- Blocks entry fields for holidays
- Disables vacation checkbox on holidays
- Calculates:
  - Total valid office hours
  - Days present in office
  - Vacation days
  - Available workdays

#### Compliance Evaluation
Compares total hours against required thresholds:

| Requirement | Non-Compliant (Red) | Warning (Yellow) | Compliant (Green) |
|-------------|---------------------|------------------|-------------------|
| **2 days / 16h** | <16h | ≥16h & <18h | ≥18h |
| **3 days / 24h** | <24h | ≥24h & <27h | ≥27h |

#### Visual Indicators
- Holiday rows: orange background
- Vacation rows: blue background
- Compliance colors: red, yellow, green per rule
- Week range with ISO week number

### Utilities
- `contarDiasDeSemana()` – counts weekdays in a month
- `monthNames[]` – Portuguese month names

---

## Requirements

- Runs in any modern browser (no external libraries needed except jsPDF for PDF export)
- Requires internet access for **holiday API** (WIM Calculator)
- jsPDF loaded via CDN in `kanban.html`

---

## Usage

1. Open the HTML page including the desired script
2. Ensure elements with expected IDs exist in the HTML
3. For the quiz: Place `questions.json` in `/data/`
4. For Kanban: Interact with tasks, clocks auto-update, data auto-saves
5. For WIM Calculator: Select a date, input attendance, view compliance
