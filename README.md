# 🗂️ Project Overview

This repository contains a **personal productivity and learning hub**, built as a static website.  
It provides interactive tools, training resources, and curated references, all organized into dedicated sections.

---

## 🌐 Website Structure

The **home page** (`index.html`) acts as the main entry point with navigation buttons to all sections:

- **Personal Kanban Board** → `pages/kanban.html`  
- **WIM Calculator** → `pages/wincalc.html`  
- **Trainings** → `pages/trainingsindex.html`  
- **Useful Stuff** → `pages/usefulstuff.html`

Each section has its own purpose and supporting assets (HTML, CSS, JS, JSON, and images).

---

## 📂 Folder Breakdown

- **`pages/`** → Contains the main HTML files for all sections  
  - `kanban.html` → Interactive Kanban board with task export/import  
  - `wincalc.html` → Work In Motion (WIM) calculator with form and results  
  - `trainingsindex.html` → Training modules hub (Linux, Python, CyberArk, etc.)  
  - `usefulstuff.html` → Curated list of external resources  

- **`styles/`** → All CSS files for styling the website  
  - Separate stylesheets for each page (e.g., `kanban-styles.css`, `wincalc-styles.css`)  

- **`scripts/`** → JavaScript files powering interactivity  
  - `kanban.js` → Handles tasks creation, drag-and-drop, export  
  - `wincalc.js` → Handles calculator logic
  - `cyberark.js` → Handles cyberark quiz logic    

- **`images/`** → Logos, buttons, and other graphical assets  
  - Includes reusable images like `homebutton.png` and `skoizz_logo.png`  

- **`data/`** → JSON files for dynamic or quiz-based content  
  - Currently includes a **CyberArk quiz JSON** with multiple-choice questions  

---

## ✨ Features

- 📝 **Personal Kanban Board** with multiple columns, live clocks, and task export  
- 📊 **WIM Calculator** for calculating work/vacation distribution  
- 🎓 **Training Hub** to organize learning resources  
- 🌍 **Useful Stuff Section** with curated external links  
- 📁 Modular folder structure with **dedicated `README.md` files** for deeper details  

---

## 📖 Documentation

This project is fully documented in a modular way:

- **`pages/README.md`** → Explains the purpose of each HTML page  
- **`styles/README.md`** → Describes the CSS organization  
- **`scripts/README.md`** → Explains the logic and functionality of JS files  
- **`images/README.md`** → Lists the available images and their usage  
- **`data/README.md`** → Documents the structure and purpose of JSON files  

👉 For **further details**, please refer to the `README.md` file inside each respective folder.  

---

## 🚀 Getting Started

1. Clone this repository  
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```
2. Open `index.html` in your browser  
3. Navigate via the buttons to explore each tool and section  

---

## 🔮 Future Improvements

- Add more **training modules**  
- Expand the **quiz dataset** under `data/`  
- Improve responsive design for mobile devices  
