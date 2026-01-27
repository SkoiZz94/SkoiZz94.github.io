/***********************
 * SEARCH & FILTERING
 * Task search and column filtering
 ***********************/
import * as state from './state.js';
import { getTextPreview } from './utils.js';

// Current filter state
let currentSearchTerm = '';
let currentColumnFilter = null; // null = all columns
let currentTagFilter = []; // array of tag names

/**
 * Initialize search functionality
 */
export function initSearch() {
  const searchInput = document.getElementById('taskSearchInput');
  if (searchInput) {
    // Debounced search
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        setSearchTerm(e.target.value);
      }, 200);
    });

    // Clear on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        setSearchTerm('');
        searchInput.blur();
      }
    });
  }

  // Initialize column filter buttons
  const filterButtons = document.querySelectorAll('.column-filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const column = btn.dataset.column || null;
      setColumnFilter(column);
    });
  });
}

/**
 * Set the search term and filter tasks
 */
export function setSearchTerm(term) {
  currentSearchTerm = term.toLowerCase().trim();
  applyFilters();
}

/**
 * Set the column filter
 */
export function setColumnFilter(column) {
  currentColumnFilter = column;

  // Update button states
  const filterButtons = document.querySelectorAll('.column-filter-btn');
  filterButtons.forEach(btn => {
    const btnColumn = btn.dataset.column || null;
    if (btnColumn === column) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  applyFilters();
}

/**
 * Set tag filter
 */
export function setTagFilter(tags) {
  currentTagFilter = Array.isArray(tags) ? tags : [tags];
  applyFilters();
}

/**
 * Clear all filters
 */
export function clearFilters() {
  currentSearchTerm = '';
  currentColumnFilter = null;
  currentTagFilter = [];

  const searchInput = document.getElementById('taskSearchInput');
  if (searchInput) searchInput.value = '';

  const filterButtons = document.querySelectorAll('.column-filter-btn');
  filterButtons.forEach(btn => {
    if (btn.dataset.column === null || btn.dataset.column === '') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  applyFilters();
}

/**
 * Apply all active filters to task display
 */
export function applyFilters() {
  const tasks = state.notesData;

  tasks.forEach(task => {
    const noteElement = document.querySelector(`[data-id="${task.id}"]`);
    if (!noteElement) return;

    const isVisible = checkTaskVisibility(task);
    noteElement.style.display = isVisible ? '' : 'none';
  });

  // Update column counts
  updateColumnCounts();
}

/**
 * Check if a task should be visible based on current filters
 */
function checkTaskVisibility(task) {
  // Check column filter
  if (currentColumnFilter && task.column !== currentColumnFilter) {
    return false;
  }

  // Check tag filter
  if (currentTagFilter.length > 0) {
    const taskTags = task.tags || [];
    const hasMatchingTag = currentTagFilter.some(tag => taskTags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Check search term
  if (currentSearchTerm) {
    const searchableText = getSearchableText(task);
    if (!searchableText.includes(currentSearchTerm)) {
      return false;
    }
  }

  return true;
}

/**
 * Get all searchable text from a task
 */
function getSearchableText(task) {
  const parts = [];

  // Title
  if (task.title) {
    parts.push(task.title.toLowerCase());
  }

  // Notes content
  if (task.noteEntries) {
    task.noteEntries.forEach(entry => {
      const text = getTextPreview(entry.notesHTML);
      if (text) parts.push(text.toLowerCase());
    });
  }

  // Tags
  if (task.tags) {
    parts.push(...task.tags.map(t => t.toLowerCase()));
  }

  // Priority
  if (task.priority) {
    parts.push(task.priority.toLowerCase());
  }

  return parts.join(' ');
}

/**
 * Update visible task counts in column headers
 */
function updateColumnCounts() {
  const columns = ['todo', 'inProgress', 'onHold', 'done'];

  columns.forEach(columnId => {
    const column = document.getElementById(columnId);
    if (!column) return;

    const visibleTasks = column.querySelectorAll('.note:not([style*="display: none"])');
    const totalTasks = column.querySelectorAll('.note');

    const countSpan = column.querySelector('.column-count');
    if (countSpan) {
      if (currentSearchTerm || currentColumnFilter || currentTagFilter.length > 0) {
        countSpan.textContent = `(${visibleTasks.length}/${totalTasks.length})`;
      } else {
        countSpan.textContent = totalTasks.length > 0 ? `(${totalTasks.length})` : '';
      }
    }
  });
}

/**
 * Get current filter state
 */
export function getFilterState() {
  return {
    searchTerm: currentSearchTerm,
    columnFilter: currentColumnFilter,
    tagFilter: [...currentTagFilter]
  };
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters() {
  return currentSearchTerm !== '' ||
         currentColumnFilter !== null ||
         currentTagFilter.length > 0;
}
