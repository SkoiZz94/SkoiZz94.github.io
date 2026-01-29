# CSS Styles Documentation

This folder contains CSS stylesheets that implement a **modern glassmorphism dark theme** across all applications.

---

## Design System

The overall design uses an **Inspired glassmorphism** aesthetic:

- **Dark backgrounds**: Gradient backgrounds (`#0d0d0d` to `#1a1a1a`)
- **Glassmorphism panels**: Translucent backgrounds with `backdrop-filter: blur()`
- **Light text**: High contrast (`#f5f5f5`) for readability
- **Accent colors**:
  - Green (`#4caf50`) for success/low priority
  - Orange (`#ff9800`) for warnings/medium priority
  - Red (`#f44336`) for errors/high priority
  - Cyan (`#26c6da`) for priority changes in history
  - Purple (`#ab47bc`) for status changes (main board)
  - Pink (`#ec407a`) for sub-task operations
  - Blue (`#64b5f6`) for created/info
- **Rounded corners**: 10-16px border-radius throughout
- **Soft shadows**: Multiple layered shadows for depth
- **Smooth transitions**: Cubic-bezier easing for animations
- **System fonts**: Apple SF Pro fallback chain

---

## Stylesheet Files

### 1. `index-styles.css`

**Purpose**: Home page styling with logo and navigation grid

**Key Elements**:
- `.index` - Centered flexbox layout
- `.logo-title-container img` - Logo with `drop-shadow` glow effect
- `.button-container` - 3-column grid for navigation buttons
- `.back-button` - Glassmorphism navigation button with SVG icon support

---

### 2. KanTrack Styles (`kantrack/` folder)

**Purpose**: Full KanTrack styling, organized into modular files for maintainability.

**File Structure**:
```
styles/kantrack/
├── base.css        # Variables, reset, layout, board, columns, notes, buttons
├── components.css  # Clocks, modals, sub-kanban, history, timers, priority
├── features.css    # Notebook, search, notifications, tags, due dates, trash
└── responsive.css  # All media queries for responsive design
```

#### `base.css`
- **CSS Variables**: Colors, spacing, typography
- **Reset & Body**: Base styles and dark background
- **Header Bar**: `.top-header`, `.header-left`, `.header-right`, `.header-action-btn`
- **Board Layout**: `.kanban-board` (4-column grid), `.column` (glassmorphism panels)
- **Task Cards**: `.note`, `.priority-low/medium/high`, `.worked-time`, `.timestamp`
- **Controls**: Input fields, buttons, control rows

#### `components.css`
- **Clocks**: `.clock`, `.chronometer-controls`, `.clock-add-button`
- **Modals**: `.modal`, `.modal-content`, `.notes-editor`
- **Sub-Tasks**: `.sub-kanban-header`, `.sub-kanban-board`, `.sub-task`
- **Priority**: `.priority-controls`, `.quick-priority-menu`
- **Timer**: `.timer-controls`, `.quick-time-menu`
- **History**: `.history-list` with color-coded action types
- **Image Viewer**: `.image-modal`, `.image-controls`, `.image-container`

#### `features.css`
- **Notebook Sidebar**: `.notebook-sidebar`, `.notebook-tree`, `.page-modal`
- **Search**: `.search-wrapper`, `.controls-row-search`
- **Notifications**: `.notification-container`, `.notification`
- **Tags**: `.task-tags`, `.task-tag`, `.tag-selector`, `.tag-filter-btn`
  - Dynamic tag colors using CSS variables (`--tag-color`, `--tag-bg`)
- **Due Dates**: `.task-due-date`, `.due-date-today`, `.due-date-overdue`
- **Trash**: `.trash-panel`, `.trash-item`, `.trash-toggle`

#### `responsive.css`
- **Desktop** (>1200px): Full 4-column board
- **Tablet** (≤1024px): 2-column board, stacked controls
- **Mobile** (≤768px): Single column, full-width sidebar, touch-optimized
- **Small Mobile** (≤480px): Compact modal layouts

---

### 3. `trainings-styles.css`

**Purpose**: Training hub and sub-page styling

**Key Elements**:
- `.index` - Centered layout for training pages
- `.button-container` - Grid for training module links
- `.back-to-index` - Home button positioning
- `.nav-buttons` - Dual button container (Home + Back)
- `.back-button` - Glassmorphism button with SVG support

---

### 4. `cyberark-styles.css`

**Purpose**: Quiz application styling

**Key Elements**:
- `.quiz-wrapper` / `.quiz-container` - Centered quiz panel
- `.question` - Question text styling
- `.answers label` - Clickable answer options with hover states
- `.question-nav-btn` - Navigation pills with states (`.flagged`, `.answered`, `.current`)
- `.pass` / `.fail` - Result outcome colors
- `.review-item` - Review mode question panels
- `.nav-buttons` - Dual navigation buttons

---

### 5. `wincalc-styles.css`

**Purpose**: WIM Calculator form and results styling

**Key Elements**:
- `form` - Input form with dark glassmorphism
- `.controls-row` / `.controls-inline` - Form layout
- `#results` - Results panel with dynamic width
- `.vacation-day` - Blue highlight for vacation
- `.feriado` - Orange highlight for holidays
- Compliance colors: red/yellow/green indicators

---

## Navigation Buttons

All pages use a consistent glassmorphism navigation button:

```css
.back-button {
  background: linear-gradient(135deg, rgba(40,40,40,0.7), rgba(30,30,30,0.7));
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.12);
  /* SVG icon inside, styled via currentColor */
}
```

Training sub-pages use `.nav-buttons` for dual buttons (Home + Back to Trainings).

---

## Responsive Design

- **Desktop** (>1200px): Full 4-column board, all features visible
- **Tablet** (≤1024px): 2-column board, stacked notes areas
- **Mobile** (≤640px): Single column, touch-optimized controls

---

## Motion Preferences

Respects `prefers-reduced-motion` media query to disable animations for accessibility.
