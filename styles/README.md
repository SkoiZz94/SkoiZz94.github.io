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

### 2. `taskhub-styles.css`

**Purpose**: Full TaskHub styling with kanban board, notebook, modals, clocks, and priorities

**Key Elements**:
- **Board Layout**:
  - `.kanban-board` - 4-column grid (responsive: 2 on tablet, 1 on mobile)
  - `.column` - Glassmorphism panels with unique tints per column
- **Task Cards**:
  - `.note` - Draggable cards with priority color coding
  - `.priority-low/medium/high` - Left border + background tint
  - `.priority-display` - Priority label on cards
  - `.worked-time` - Timer display
  - `.timestamp` - Creation date
- **Sub-Tasks**:
  - `.sub-kanban-header` - Collapsible section header
  - `.sub-kanban-board` - Mini kanban within task modal
  - `.sub-task` - Sub-task cards with 2-line title limit
- **Modals**:
  - `.modal` - Full-screen overlay with blur
  - `.modal-content` - Glassmorphism panel
  - `.notes-editor` - Plain text editor area
  - `.priority-controls` - Priority button group
  - `.timer-controls` - Time add/subtract buttons
  - `.history-list` - Action history with color-coded types
- **Image Viewer**:
  - `.image-modal` - Full-screen image display
  - `.image-controls` - Zoom buttons
  - `.image-container` - Centered image with pan support
- **Notebook Sidebar**:
  - `.notebook-sidebar` - Collapsible sidebar (400px width)
  - `.notebook-tree` - Folder/page tree structure
  - `.page-modal` - Note page editor modal
- **Clocks**:
  - `.clock` - Timezone clock cards
  - `.chronometer-controls` - Start/pause/reset buttons
  - `.clock-add-button` - Add new clock button
- **Quick Menus**:
  - `.quick-time-menu` - Floating time adjustment menu
  - `.quick-priority-menu` - Floating priority selector
- **Tags**:
  - `.task-tags` - Tag container on task cards
  - `.task-tag` - Individual tag chip with color
  - `.tag-selector` - Tag picker in modal
  - `.tag-filter-btn` - Tag filter buttons with color-coded states
- **Due Dates**:
  - `.task-due-date` - Due date display on cards
  - `.due-date-today` - Yellow styling for tasks due today
  - `.due-date-overdue` - Red styling with pulse animation
  - `.task-due-today` - Yellow border on task cards due today
  - `.task-overdue` - Red border on overdue task cards
- **Search & Filters**:
  - `.search-wrapper` - Search input with icon
  - `.tag-filters` - Container for tag filter buttons
- **Undo/Redo & Trash**:
  - `.undo-redo-controls` - Undo/redo button group
  - `.trash-toggle` - Trash panel toggle button
  - `.trash-panel` - Slide-out trash panel
- **Notifications**:
  - `.notification-container` - Toast notification stack
  - `.notification` - Individual toast with icon

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
