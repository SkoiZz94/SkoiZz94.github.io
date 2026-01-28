# Project Overview

This repository contains a **personal productivity and learning hub**, built as a static website.
It provides interactive tools, training resources, and curated references, all organized into dedicated sections.

---

## Website Structure

The **home page** (`index.html`) acts as the main entry point with navigation buttons to all sections:

- **TaskHub** → `pages/taskhub.html`
- **WIM Calculator** → `pages/wincalc.html`
- **Trainings** → `pages/trainingsindex.html`
- **Entertainment DB** → External link
- **Useful Stuff** → `pages/usefulstuff.html`

Each section has its own purpose and supporting assets (HTML, CSS, JS, JSON, and images).

---

## Folder Breakdown

- **`pages/`** → Contains the main HTML files for all sections
  - `taskhub.html` → TaskHub: Task management with kanban board, notebook, clocks, timers, and export
  - `wincalc.html` → Work In Motion (WIM) calculator with form and results
  - `trainingsindex.html` → Training modules hub (Linux, Python, CyberArk)
  - `usefulstuff.html` → Curated list of external resources

- **`styles/`** → All CSS files for styling the website
  - Modern glassmorphism dark theme with blur effects
  - Separate stylesheets for each page (e.g., `taskhub-styles.css`, `wincalc-styles.css`)

- **`scripts/`** → JavaScript files powering interactivity
  - `taskhub.js` → Main entry point for TaskHub (ES modules)
  - `modules/` → Modular JS files for TaskHub functionality
  - `wincalc.js` → Handles calculator logic with holiday API integration
  - `cyberark.js` → Handles CyberArk quiz logic

- **`images/`** → Logos and graphical assets
  - `skoizz_logo.png` → Main project logo with glow effect
  - `quiz.png` → Quiz module logo

- **`data/`** → JSON files for dynamic or quiz-based content
  - `questions.json` → CyberArk quiz with multiple-choice questions

---

## Features

### TaskHub
- **Kanban Board**: Four columns (To Do, In Progress, On Hold, Done)
- **Sub-Tasks**: Mini kanban boards within tasks
- **Priority system**: None, Low, Medium, High with color-coded cards
- **Auto-sorting**: Tasks automatically sort by priority within each column
- **Task timer**: Track worked time with quick add/subtract buttons
- **Rich notes**: Plain text notes with image paste support (clipboard)
- **Image viewer**: Full-screen view with scroll wheel zoom and drag-to-pan
- **Notebook**: Sidebar with folders and pages for notes, supports export/import
- **Clocks**: Multiple timezone clocks and chronometers
- **History tracking**: All actions logged (created, moved, timer, priority, sub-tasks, tags)
- **Export/Import**: HTML board export, PDF task export, ZIP notebook export
- **IndexedDB**: Persistent image storage
- **Task Tags**: Color-coded labels (Urgent, Review, User Story, Incident, Rollout)
- **Tag Filtering**: Quick filter buttons to show tasks by tag
- **Due Dates**: Set due dates with visual indicators (yellow for today, red for overdue)
- **Search**: Real-time search across task titles and notes
- **Undo/Redo**: Full undo/redo for all actions (Ctrl+Z, Ctrl+Y)
  - Create/delete tasks, title changes, priority, timer, tags, due dates, notes, moves
- **Trash**: Deleted tasks recoverable from trash (max 20 items)

### WIM Calculator
- Portuguese workday/holiday calculator
- Automatic holiday detection via Nager.Date API
- Visual compliance indicators (2-day and 3-day rules)

### Training Hub
- Organized learning resources (Linux, Python, CyberArk)
- Interactive CyberArk quiz with pass/fail and review modes

### Useful Stuff
- Curated external links (GitHub repos, DevOps resources, tools)

---

## Design System

The project uses a modern **Inspired glassmorphism** design:
- Dark backgrounds with subtle gradients
- Translucent panels with backdrop blur
- Soft shadows and rounded corners
- SVG icons for navigation (no image files)
- Responsive layouts for all screen sizes

---

## Documentation

This project is fully documented in a modular way:

- **`pages/README.md`** → Explains the purpose of each HTML page
- **`styles/README.md`** → Describes the CSS organization
- **`scripts/README.md`** → Explains the logic and functionality of JS files
- **`images/README.md`** → Lists the available images and their usage
- **`data/README.md`** → Documents the structure and purpose of JSON files

---

## Getting Started

1. Clone this repository
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. Start a local server (required for ES modules in TaskHub)
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000
   ```

3. Open `http://localhost:8000` in your browser

4. Navigate via the buttons to explore each tool and section

> **Note**: TaskHub uses ES modules which require HTTP serving. Opening `index.html` directly via `file://` will cause module loading errors. Other pages (WIM Calculator, Trainings) work without a server.

---
