# JavaScript Documentation

This folder contains JavaScript files powering the interactive features of the project:

1. **CyberArk Quiz Application** (`cyberark.js`)
2. **TaskHub** (`taskhub.js` + `modules/`)
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

## 2. TaskHub (`taskhub.js` + `modules/`)

### Overview
A full-featured **productivity hub** with task management (kanban board), notebook system, timezone clocks, and comprehensive export/import capabilities.

### Architecture
TaskHub uses **ES Modules** for clean separation of concerns:

```
scripts/
├── taskhub.js          # Main entry point, imports and initializes all modules
└── modules/
    ├── state.js        # Shared state management
    ├── storage.js      # LocalStorage operations
    ├── database.js     # IndexedDB for images
    ├── tasks.js        # Task CRUD operations
    ├── modal.js        # Task detail modal
    ├── sub-kanban.js   # Sub-task boards
    ├── drag-drop.js    # Kanban drag & drop
    ├── timer.js        # Time tracking
    ├── priority.js     # Priority management
    ├── sorting.js      # Priority-based column sorting
    ├── images.js       # Image paste & viewer
    ├── clocks.js       # Timezone clocks & chronometers
    ├── timezones.js    # Timezone data
    ├── notebook.js     # Notebook sidebar system
    ├── notebook-export.js # Notebook PDF/ZIP export
    ├── export.js       # Task PDF/HTML export
    └── utils.js        # Shared utilities
```

### Key Features

#### Task Management
- **Add, edit, delete tasks** across four columns: To Do, In Progress, On Hold, Done
- **Sub-tasks**: Mini kanban boards within each task
- **Priority system**: None, Low, Medium, High with color-coded cards
  - Quick priority menu on cards
  - Priority selector in task modal
  - Priority changes logged in history
  - **Auto-sorting by priority**: Columns automatically sort when:
    - Page loads (all columns sorted)
    - Task is moved via drag-and-drop
    - Priority is changed (quick menu or modal)
    - New task is created
  - Sort order: High → Medium → Low → None (except To Do: new tasks at top)
- **Task timer**: Track worked time per task
  - Quick add/subtract time buttons (+1m to +60m)
  - Timer displayed on cards and in modal
  - Time changes logged in history
- **History tracking**: All actions logged with timestamps and color-coded by type

#### Notebook System
- **Sidebar**: Collapsible notebook with folder/page tree
- **Folders**: Organize pages into nested folders
- **Pages**: Rich text editor for notes with image support
- **Export/Import**: ZIP export with full content, PDF generation

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
- **ZIP export**: Export notebook with full content (reimportable)
- **Import**: Load previously exported HTML or ZIP files

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
- jsPDF and JSZip loaded via CDN in `taskhub.html`

---

## Usage

1. Open the HTML page including the desired script
2. Ensure elements with expected IDs exist in the HTML
3. For the quiz: Place `questions.json` in `/data/`
4. For TaskHub: Interact with tasks, clocks auto-update, data auto-saves
5. For WIM Calculator: Select a date, input attendance, view compliance
