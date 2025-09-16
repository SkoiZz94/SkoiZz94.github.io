# 🎨 CSS Styles Documentation

This folder contains multiple CSS stylesheets that share a **cohesive dark-themed design system** across different applications (Quiz, Kanban Board, and WIM Calculator).  

The overall design emphasizes:
- **Dark backgrounds** (`#1e1e1e`, `#2b2b2b`, `#2c2c2c`) for a modern look and reduced eye strain.  
- **Light text** (`#e0e0e0`) for high contrast readability.  
- **Accent colors** (primarily shades of **red**, plus **green** for success and **yellow** for warnings).  
- **Rounded corners** and **soft shadows** to create depth.  
- **Consistent typography** using `Arial, sans-serif`.  
- **Responsive layouts** with `flexbox` and `CSS grid`.  

---

## 1. Quiz Styles (`cybeark-styles.css`)

### Purpose
Defines the look and feel of the interactive quiz application.

### Key Elements
- **Layout**: `.quiz-wrapper` and `.quiz-container` center the quiz with rounded panels and shadows.  
- **Questions/Answers**:  
  - `.question` styled bold with larger font.  
  - `.answers label` styled as clickable blocks with hover transitions.  
- **Navigation**:  
  - `.navigation` grid for buttons.  
  - `.question-nav-btn` pill-style navigation with states: `.flagged`, `.answered`, `.current`.  
- **Results & Review**:  
  - `.pass` (green) and `.fail` (red) outcome styles.  
  - `.review-item` panels with clear distinctions between correct, incorrect, and flagged answers.

---

## 2. Index / Menu Styles (`index-styles.css`)

### Purpose
Provides a landing/index page style with logo, title, and button grid navigation.

### Key Elements
- **Centered Layout**: `.index` flexbox centers logo and buttons vertically and horizontally.  
- **Logo & Title**: `.logo-title-container` for branding, image scaling, and heading.  
- **Buttons**:  
  - Uniform red buttons with hover (`#690000`) and active (scale-down) states.  
  - `.button-container` grid ensures alignment of 3-column button layout.  
- **Home Button**: `.back-to-index` and `.back-button` fixed in top-left corner for navigation.

---

## 3. Kanban Board Styles (`kanban-styles.css`)

### Purpose
Styles for the **Kanban task board** with multiple columns, draggable notes, and world clocks.

### Key Elements
- **Board Layout**:  
  - `.kanban-board` grid with 4 columns on desktop, collapsing to 2 (tablet) or 1 (mobile).  
  - `.column` styled with rounded corners, shadow, and scrollable content.  
- **Notes**:  
  - `.note` cards with dark background, padding, and drag-friendly styles.  
  - `.note-content`, `.note-text`, `.timestamp` for structured task info.  
- **Controls**:  
  - `.edit-delete` container with icon-style buttons for actions.  
  - `.export-btn` blue variant for exports.  
- **Clocks**:  
  - `.clock-container` responsive flex layout.  
  - `.clock-time`, `.clock-date`, `.clock-name` with distinct sizing and coloring.  
- **Responsive Design**:  
  - Media queries for tablets (`max-width: 1024px`), phones (`max-width: 640px`), and wide screens (`min-width: 1200px`).  

---

## 4. Secondary Index Styles (`trainings-styles.css`)

### Purpose
An alternative index page stylesheet with small variations in logo size, button layout, and text colors.

### Key Elements
- Similar to **Index Styles**, but with:  
  - `.logo-title-container img` smaller width (`200px`).  
  - `.logo-title-container h1` larger (`2em`) and explicitly white.  
- Ensures flexibility for different landing page designs.

---

## 5. Workday & Holiday Calculator Styles (`wincalc-styles.css`)

### Purpose
Styles for the Portuguese workday/holiday calculator form and results display.

### Key Elements
- **Form Container**:  
  - `form` styled with dark background, padding, rounded corners, and shadows.  
  - Inputs (`select`, `input[type=number]`) styled consistently with dark backgrounds and light text.  
- **Button**:  
  - Red button (`#fb0000`) with hover (`#690000`) and active (scale-down) states.  
- **Results Panel**:  
  - `#results` styled as a card with dynamic width, padding, shadows, and inline-block for responsive resizing.  
  - `.score` styled inline with dynamic color based on JS logic.  
- **Typography**:  
  - `.bold` for emphasis.  
  - `#results h2, #results h3` green highlight (`#4caf50`).  
- **Logo/Navigation**:  
  - `.logo-title-container` and `.back-to-index` similar to other apps for consistency.

---

## ✅ Consistency Across Files
- **Dark mode theme** applied everywhere.  
- **Red accents** for actions, warnings, or branding.  
- **Green for positive outcomes** (pass, success, valid score).  
- **Responsive, mobile-friendly layouts**.  
- **Back-to-index button** consistently positioned for navigation.  

This unified design ensures all applications feel like part of the same suite.  
