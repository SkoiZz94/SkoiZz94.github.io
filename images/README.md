# Images Folder Documentation

This folder contains image assets used across the project for branding and UI elements.

---

## Image Files

### 1. `skoizz_logo.png`
- **Purpose**: Main project logo displayed on the home page
- **Usage**: `index.html` - centered in the logo-title-container
- **Styling**: CSS applies a soft white glow effect (`drop-shadow`) for visibility on dark backgrounds

---

### 2. `quiz.png`
- **Purpose**: Logo/icon for the CyberArk Quiz training module
- **Usage**: `cyberarktraining.html` - displayed at the top of the quiz page

---

## Navigation Icons

The project uses **inline SVG icons** for all navigation buttons instead of image files. This provides:
- Better scalability (no pixelation)
- Easier color customization via CSS
- Reduced HTTP requests
- Consistent glassmorphism styling

The home button SVG (house icon) and back button SVG (arrow icon) are embedded directly in the HTML files.

---

## Notes

- All images use **transparent PNG format** for clean rendering on dark backgrounds
- The logo has a CSS glow effect applied in `index-styles.css`
- Legacy image files (old logos, homebutton.png) have been removed in favor of SVG icons
