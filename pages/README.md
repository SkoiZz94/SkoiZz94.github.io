# 🌐 HTML Pages Documentation

This folder contains multiple HTML files that implement different parts of a **training and utilities portal**.  
All pages share a **consistent dark-themed design** with:
- A **back-to-index button** for navigation.  
- **Centered layouts** for main content.  
- Integration with dedicated CSS stylesheets and JavaScript logic.  
- Responsive structures for usability across devices.  

---

## 1. CyberArk Training Quiz (`cyberarktraining.html`)

### Purpose
Provides an interactive quiz for CyberArk training, pulling questions dynamically from JSON and styled with `cyberark-styles.css`.

### Structure
- **Back to Index button** (links to `trainingsindex.html`).  
- **Quiz Container**:  
  - Loader and error messages.  
  - Quiz interface with questions, answers, navigation (Prev/Next/Flag).  
  - Submit button always visible.  
- **Results Panel**: Score, counts, retry and review options.  
- **Review Section**: Displays flagged or answered questions.  
- Linked to `cyberark.js` for logic.

---

## 2. Kanban Board (`kanban.html`)

### Purpose
Implements a Kanban board for task management, with draggable notes and world clocks.

### Structure
- **Back to Index button**.  
- **Clock Container**: Shows current/local time plus Europe, China, Americas, and Africa.  
- **Kanban Board**: Four columns (`To Do`, `In Progress`, `Done`, `On Hold`).  
- **Controls**: Input to add tasks, buttons to add/export, and a temporary notes textarea.  
- Linked to `kanban-styles.css` and `kanban.js`.

---

## 3. Linux Training Page (`linuxtraining.html`)

### Purpose
Landing page with curated links to Linux training videos.

### Structure
- **Back to Index button**.  
- **Logo & Title**: Training warning and instructions.  
- **Button Container**: Grid of external links (PacktPub courses).  
- Linked to `trainings-styles.css`.

---

## 4. Python Training Page (`pythontraining.html`)

### Purpose
Landing page with curated links to Python training resources.

### Structure
- **Back to Index button**.  
- **Logo & Title**: Training warning and instructions.  
- **Button Container**: Large collection of external links (Mammoth Interactive courses).  
- Linked to `trainings-styles.css`.

---

## 5. Trainings Index (`trainingsindex.html`)

### Purpose
Navigation hub for training sections.

### Structure
- **Back to Index button**.  
- **Button Container** linking to:  
  - Linux Training,  
  - Python Training,  
  - CyberArk Quiz.  
- Provides an entry point for future training additions.  
- Linked to `trainings-styles.css`.

---

## 6. Useful Stuff Page (`usefulstuff.html`)

### Purpose
Quick access to curated external resources (GitHub repos, DevOps exercises, tools).

### Structure
- **Back to Index button**.  
- **Button Container** with external links (GitHub websites lists, DevOps Bible, Python syntax checker).  
- Linked to `trainings-styles.css`.

---

## 7. WIM Calculator (`wincalc.html`)

### Purpose
Implements a calculator for Portuguese workdays, holidays, and attendance score.

### Structure
- **Back to Index button**.  
- **Logo & Title**.  
- **Form**: Month selector, vacation days, workdays attended.  
- **Results Container**: Populated dynamically.  
- Linked to `wincalc-styles.css` and `wincalc.js`.

---

## ✅ Consistency Across Pages
- **Navigation**: Every page has a back-to-index button with a house icon.  
- **Dark theme**: Achieved through linked CSS.  
- **Grid-based button containers** for navigation and training links.  
- **Integration with scripts** for interactivity (quiz, kanban, calculator).  

This ensures a unified user experience across all HTML pages.
