# HTML Pages Documentation

This folder contains the HTML pages that implement different sections of the **productivity and learning portal**.

All pages share:
- **Glassmorphism dark theme** via dedicated CSS stylesheets
- **SVG navigation buttons** (home icon, back arrow)
- **Centered layouts** for main content
- **Responsive design** for all screen sizes

---

## 1. KanTrack (`kantrack.html`)

### Purpose
A full-featured productivity hub with task management (kanban board), notebook system, timezone clocks, and comprehensive export/import capabilities.

### Structure
- **Header**: Home button, Notebook toggle, KanTrack logo (center), Undo/Redo buttons, Trash toggle
- **Clock Container**: Timezone clocks and chronometers
- **Controls**: Task input field, Add button, Search bar, Tag filter buttons
- **Kanban Board**: Four columns (To Do, In Progress, On Hold, Done)
- **Notebook Sidebar**: Collapsible sidebar with folders and pages for notes
- **Trash Panel**: View and restore deleted tasks
- **Notes Area**: Permanent and temporary text areas
- **Export/Import**: HTML export and file import buttons
- **Task Modal**: Detailed task view with notes, sub-tasks, priority, timer, tags, due dates, history
- **Image Modal**: Full-screen image viewer with zoom and pan
- **Clock Modal**: Add timezone clocks or chronometers

### Key Features
- **Tag filtering**: Dynamic filter buttons based on pinned tags
- **Pinned tags**: Pin custom tags for reuse across tasks
- **Due dates**: Visual indicators for today (yellow) and overdue (red)
- **Undo/Redo**: Full undo/redo for all actions (create, delete, edit, move, priority, timer, tags, due dates)
- **Trash**: Recover deleted tasks (max 20 items)
- **Data cleanup**: Automatic removal of duplicate/orphaned tasks on load

**Linked Assets**:
- `kantrack/base.css` - Core styles (variables, layout, board, cards)
- `kantrack/components.css` - UI components (clocks, modals, sub-kanban)
- `kantrack/features.css` - Feature styles (notebook, tags, search, trash)
- `kantrack/responsive.css` - Media queries for responsive design
- `kantrack.js` (ES modules entry point)
- `kantrack-modules/` folder with modular JS files
- jsPDF and JSZip (CDN)

---

## 2. WIM Calculator (`wincalc.html`)

### Purpose
Portuguese workday/holiday calculator for office attendance compliance.

### Structure
- **Navigation**: Home button
- **Header**: Title and current date
- **Form**: Week selector, daily time inputs, vacation checkboxes
- **Results**: Calculated metrics and compliance indicators

**Linked Assets**:
- `wincalc-styles.css`
- `wincalc.js`

---

## 3. Trainings Index (`trainingsindex.html`)

### Purpose
Navigation hub for all training modules.

### Structure
- **Navigation**: Home button
- **Button Container**: Links to Linux, Python, CyberArk training

**Linked Assets**:
- `trainings-styles.css`

---

## 4. Linux Training (`linuxtraining.html`)

### Purpose
Curated links to Linux training resources.

### Structure
- **Navigation**: Home button + Back to Trainings button
- **Warning**: Access instructions
- **Button Container**: External course links (PacktPub)

**Linked Assets**:
- `trainings-styles.css`

---

## 5. Python Training (`pythontraining.html`)

### Purpose
Curated links to Python training resources.

### Structure
- **Navigation**: Home button + Back to Trainings button
- **Warning**: Access instructions
- **Button Container**: External course links (Mammoth Interactive)

**Linked Assets**:
- `trainings-styles.css`

---

## 6. CyberArk Training Quiz (`cyberarktraining.html`)

### Purpose
Interactive quiz for CyberArk certification preparation.

### Structure
- **Navigation**: Home button + Back to Trainings button
- **Quiz Logo**: `images/quiz.png`
- **Quiz Container**: Question display, answer options, navigation
- **Results Panel**: Score, pass/fail, retry/review options
- **Review Section**: Detailed answer review

**Linked Assets**:
- `cyberark-styles.css`
- `cyberark.js`
- `data/questions.json`

---

## 7. Useful Stuff (`usefulstuff.html`)

### Purpose
Quick access to curated external resources.

### Structure
- **Navigation**: Home button
- **Button Container**: External links (GitHub repos, DevOps tools, syntax checkers)

**Linked Assets**:
- `trainings-styles.css`

---

## Navigation Patterns

### Single Button (Most Pages)
- Home button with house SVG icon
- Links to `index.html`

### Dual Buttons (Training Sub-Pages)
- Home button → `index.html`
- Back button (arrow) → `trainingsindex.html`
- Uses `.nav-buttons` container for side-by-side layout

---

## Consistency Notes

- All pages use glassmorphism styling from their respective CSS files
- Navigation buttons are SVG-based (no image files)
- External links open in new tabs with `target="_blank"`
- Forms and interactive elements have consistent dark theme styling
