/***********************
 * TASK TAGGING SYSTEM
 * Color-coded labels for task categorization
 ***********************/
import * as state from './state.js';
import { saveNotesToLocalStorage } from './storage.js';
import { escapeHtml } from './utils.js';

// Maximum tags per task
export const MAX_TAGS_PER_TASK = 5;

// Predefined tag colors
export const TAG_COLORS = [
  { name: 'red', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
  { name: 'orange', color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' },
  { name: 'yellow', color: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
  { name: 'green', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
  { name: 'teal', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.2)' },
  { name: 'blue', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
  { name: 'indigo', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.2)' },
  { name: 'purple', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
  { name: 'pink', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' },
  { name: 'gray', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.2)' }
];

// Storage key for user-created tags
const TAGS_STORAGE_KEY = 'taskhubTags';

// In-memory tag definitions
let tagDefinitions = [];

/**
 * Initialize tags system
 */
export function initTags() {
  loadTagDefinitions();
}

/**
 * Load tag definitions from localStorage
 */
function loadTagDefinitions() {
  try {
    const saved = localStorage.getItem(TAGS_STORAGE_KEY);
    if (saved) {
      tagDefinitions = JSON.parse(saved);
    } else {
      // Create default tags
      tagDefinitions = [
        { id: 'bug', name: 'Bug', colorIndex: 0 },
        { id: 'feature', name: 'Feature', colorIndex: 5 },
        { id: 'urgent', name: 'Urgent', colorIndex: 0 },
        { id: 'review', name: 'Review', colorIndex: 7 }
      ];
      saveTagDefinitions();
    }
  } catch (e) {
    console.warn('Error loading tags:', e);
    tagDefinitions = [];
  }
}

/**
 * Save tag definitions to localStorage
 */
function saveTagDefinitions() {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tagDefinitions));
  } catch (e) {
    console.warn('Error saving tags:', e);
  }
}

/**
 * Get all tag definitions
 */
export function getTagDefinitions() {
  return [...tagDefinitions];
}

/**
 * Get tag by ID
 */
export function getTagById(id) {
  return tagDefinitions.find(t => t.id === id);
}

/**
 * Get tag color info
 */
export function getTagColor(tagId) {
  const tag = getTagById(tagId);
  if (!tag) return TAG_COLORS[9]; // default gray

  return TAG_COLORS[tag.colorIndex] || TAG_COLORS[9];
}

/**
 * Create a new tag
 */
export function createTag(name, colorIndex = 9) {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Check for duplicate
  if (tagDefinitions.find(t => t.id === id)) {
    return null;
  }

  const tag = {
    id,
    name,
    colorIndex: Math.min(Math.max(0, colorIndex), TAG_COLORS.length - 1)
  };

  tagDefinitions.push(tag);
  saveTagDefinitions();

  return tag;
}

/**
 * Update a tag
 */
export function updateTag(id, updates) {
  const index = tagDefinitions.findIndex(t => t.id === id);
  if (index === -1) return false;

  tagDefinitions[index] = { ...tagDefinitions[index], ...updates };
  saveTagDefinitions();

  return true;
}

/**
 * Delete a tag
 */
export function deleteTag(id) {
  const index = tagDefinitions.findIndex(t => t.id === id);
  if (index === -1) return false;

  tagDefinitions.splice(index, 1);
  saveTagDefinitions();

  // Remove tag from all tasks
  state.notesData.forEach(task => {
    if (task.tags) {
      task.tags = task.tags.filter(t => t !== id);
    }
  });
  saveNotesToLocalStorage();

  return true;
}

/**
 * Add tag to a task
 */
export function addTagToTask(taskId, tagId) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return false;

  if (!task.tags) {
    task.tags = [];
  }

  // Check max tags limit
  if (task.tags.length >= MAX_TAGS_PER_TASK) {
    return false; // Already at max
  }

  if (!task.tags.includes(tagId)) {
    task.tags.push(tagId);

    // Add to history
    const tag = getTagById(tagId);
    const timestamp = new Date().toLocaleString();
    task.actions.push({
      action: `Added tag "${tag ? tag.name : tagId}"`,
      timestamp,
      type: 'tag'
    });

    saveNotesToLocalStorage();
  }

  return true;
}

/**
 * Remove tag from a task
 */
export function removeTagFromTask(taskId, tagId) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task || !task.tags) return false;

  const index = task.tags.indexOf(tagId);
  if (index !== -1) {
    task.tags.splice(index, 1);

    // Add to history
    const tag = getTagById(tagId);
    const timestamp = new Date().toLocaleString();
    task.actions.push({
      action: `Removed tag "${tag ? tag.name : tagId}"`,
      timestamp,
      type: 'tag'
    });

    saveNotesToLocalStorage();
  }

  return true;
}

/**
 * Get tags for a task
 */
export function getTaskTags(taskId) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task || !task.tags) return [];

  return task.tags.map(tagId => {
    const tagDef = getTagById(tagId);
    const color = getTagColor(tagId);
    return {
      id: tagId,
      name: tagDef ? tagDef.name : tagId,
      color: color.color,
      bg: color.bg
    };
  });
}

/**
 * Render tags display for a task card
 */
export function renderTaskTagsHTML(taskId) {
  const tags = getTaskTags(taskId);
  if (tags.length === 0) return '';

  return `<div class="task-tags">${
    tags.map(tag =>
      `<span class="task-tag" style="background: ${tag.bg}; color: ${tag.color}; border-color: ${tag.color};">${escapeHtml(tag.name)}</span>`
    ).join('')
  }</div>`;
}

/**
 * Render tag selector UI in modal
 */
export function renderTagSelector(taskId, container) {
  if (!container) return;

  const task = state.notesData.find(t => t.id === taskId);
  const currentTags = task?.tags || [];
  const atMaxTags = currentTags.length >= MAX_TAGS_PER_TASK;

  container.innerHTML = `
    <div class="tag-selector">
      <div class="tag-selector-current">
        ${currentTags.length === 0 ? '<span class="no-tags">No tags</span>' : ''}
        ${currentTags.map(tagId => {
          const tag = getTagById(tagId);
          const color = getTagColor(tagId);
          return `
            <span class="tag-chip" style="background: ${color.bg}; color: ${color.color}; border-color: ${color.color};">
              ${escapeHtml(tag ? tag.name : tagId)}
              <button class="tag-remove" data-tag-id="${tagId}" title="Remove tag">&times;</button>
            </span>
          `;
        }).join('')}
      </div>
      <div class="tag-selector-add">
        ${atMaxTags
          ? '<span class="max-tags-message">Maximum 5 tags reached</span>'
          : '<button class="tag-add-btn" id="tagAddBtn">+ Add Tag</button>'
        }
      </div>
      <div class="tag-selector-dropdown" id="tagDropdown" style="display: none;">
        <div class="tag-dropdown-list">
          ${tagDefinitions.filter(t => !currentTags.includes(t.id)).map(tag => {
            const color = TAG_COLORS[tag.colorIndex];
            return `
              <button class="tag-dropdown-item" data-tag-id="${tag.id}" style="--tag-color: ${color.color}; --tag-bg: ${color.bg};">
                <span class="tag-color-dot" style="background: ${color.color};"></span>
                ${escapeHtml(tag.name)}
              </button>
            `;
          }).join('')}
        </div>
        <div class="tag-dropdown-create">
          <input type="text" id="newTagInput" placeholder="Create new tag..." maxlength="20">
          <div class="tag-color-picker" id="tagColorPicker">
            ${TAG_COLORS.map((c, i) =>
              `<button class="tag-color-option${i === 5 ? ' selected' : ''}" data-color-index="${i}" style="background: ${c.color};" title="${c.name}"></button>`
            ).join('')}
          </div>
          <button id="createTagBtn" class="tag-create-btn">Create</button>
        </div>
      </div>
    </div>
  `;

  // Setup event handlers
  setupTagSelectorEvents(taskId, container);
}

/**
 * Setup event handlers for tag selector
 */
function setupTagSelectorEvents(taskId, container) {
  const addBtn = container.querySelector('#tagAddBtn');
  const dropdown = container.querySelector('#tagDropdown');
  const newTagInput = container.querySelector('#newTagInput');
  const createTagBtn = container.querySelector('#createTagBtn');
  const colorPicker = container.querySelector('#tagColorPicker');

  let selectedColorIndex = 5;

  // Toggle dropdown
  addBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });

  // Add existing tag
  container.querySelectorAll('.tag-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = item.dataset.tagId;
      addTagToTask(taskId, tagId);
      renderTagSelector(taskId, container);
      state.setModalHasChanges(true);
    });
  });

  // Remove tag
  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagId = btn.dataset.tagId;
      removeTagFromTask(taskId, tagId);
      renderTagSelector(taskId, container);
      state.setModalHasChanges(true);
    });
  });

  // Color picker
  colorPicker?.querySelectorAll('.tag-color-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      colorPicker.querySelectorAll('.tag-color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColorIndex = parseInt(opt.dataset.colorIndex);
    });
  });

  // Create new tag
  createTagBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const name = newTagInput.value.trim();
    if (name) {
      const tag = createTag(name, selectedColorIndex);
      if (tag) {
        addTagToTask(taskId, tag.id);
        renderTagSelector(taskId, container);
        state.setModalHasChanges(true);
      }
    }
  });

  // Enter key in input
  newTagInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createTagBtn?.click();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function closeDropdown(e) {
    if (!container.contains(e.target)) {
      dropdown.style.display = 'none';
      document.removeEventListener('click', closeDropdown);
    }
  });
}
