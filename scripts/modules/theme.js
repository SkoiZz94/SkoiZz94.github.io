/***********************
 * THEME SYSTEM
 * Dark/Light theme toggle with system preference detection
 ***********************/

const THEME_KEY = 'taskhubTheme';

// Theme definitions
const THEMES = {
  dark: {
    name: 'dark',
    label: 'Dark Mode'
  },
  light: {
    name: 'light',
    label: 'Light Mode'
  }
};

let currentTheme = 'dark';

/**
 * Initialize theme system
 */
export function initTheme() {
  // Check saved preference first
  const savedTheme = localStorage.getItem(THEME_KEY);

  if (savedTheme && THEMES[savedTheme]) {
    currentTheme = savedTheme;
  } else {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      currentTheme = 'light';
    } else {
      currentTheme = 'dark';
    }
  }

  // Apply initial theme
  applyTheme(currentTheme);

  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(THEME_KEY)) {
        const newTheme = e.matches ? 'light' : 'dark';
        applyTheme(newTheme);
        currentTheme = newTheme;
        updateToggleButton();
      }
    });
  }

  // Setup toggle button
  setupToggleButton();
}

/**
 * Apply a theme to the document
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);

  // Update meta theme-color for mobile browsers
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }

  metaThemeColor.content = theme === 'light' ? '#f5f5f5' : '#0d0d0d';
}

/**
 * Setup the theme toggle button
 */
function setupToggleButton() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', toggleTheme);
  updateToggleButton();
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  localStorage.setItem(THEME_KEY, currentTheme);
  updateToggleButton();
}

/**
 * Update the toggle button icon/state
 */
function updateToggleButton() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

  const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  // Show moon when in dark mode (click to go light), sun when in light mode (click to go dark)
  toggleBtn.innerHTML = currentTheme === 'dark' ? moonIcon : sunIcon;
  toggleBtn.title = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

/**
 * Get current theme
 */
export function getCurrentTheme() {
  return currentTheme;
}

/**
 * Set theme directly
 */
export function setTheme(theme) {
  if (THEMES[theme]) {
    currentTheme = theme;
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleButton();
  }
}
