/***********************
 * PRIORITY FUNCTIONS
 ***********************/
import * as state from './state.js';
import { saveNotesToLocalStorage } from './storage.js';
import { updateNoteCardDisplay } from './tasks.js';

export function getPriorityLabel(priority) {
  switch (priority) {
    case 'low': return 'Low';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    default: return 'None';
  }
}

export function getPriorityColor(priority) {
  switch (priority) {
    case 'low': return '#4caf50'; // Green
    case 'medium': return '#ff9800'; // Orange
    case 'high': return '#f44336'; // Red
    default: return 'rgba(255, 255, 255, 0.5)'; // Neutral gray for none
  }
}

export function showQuickPriorityMenu(taskId, buttonElement) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.quick-priority-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return;

  const menu = document.createElement('div');
  menu.classList.add('quick-priority-menu');

  const priorities = [
    { value: null, label: 'None', color: 'rgba(255, 255, 255, 0.5)' },
    { value: 'low', label: 'Low', color: '#4caf50' },
    { value: 'medium', label: 'Medium', color: '#ff9800' },
    { value: 'high', label: 'High', color: '#f44336' }
  ];

  priorities.forEach(priority => {
    const btn = document.createElement('button');
    btn.textContent = priority.label;
    btn.style.borderColor = priority.color;
    btn.style.color = priority.color;
    if (task.priority === priority.value) {
      btn.classList.add('active');
    }
    btn.onclick = (e) => {
      e.stopPropagation();
      quickSetPriority(taskId, priority.value);
      menu.remove();
    };
    menu.appendChild(btn);
  });

  // Position menu near the button
  const rect = buttonElement.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = `${rect.bottom + 5}px`;
  menu.style.left = `${rect.left}px`;

  document.body.appendChild(menu);

  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !buttonElement.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

export function quickSetPriority(taskId, priority) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return;

  const oldPriority = task.priority;
  if (oldPriority === priority) return;

  task.priority = priority;

  const timestamp = new Date().toLocaleString();
  task.actions.push({
    action: `Priority changed from ${getPriorityLabel(oldPriority)} to ${getPriorityLabel(priority)}`,
    timestamp,
    type: 'priority'
  });

  saveNotesToLocalStorage();
  updateNoteCardDisplay(taskId);
  updateNoteCardPriority(taskId);
}

export function updateNoteCardPriority(taskId) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return;

  const noteElement = document.querySelector(`[data-id="${taskId}"]`);
  if (!noteElement) return;

  // Update priority class
  noteElement.classList.remove('priority-low', 'priority-medium', 'priority-high');
  if (task.priority) {
    noteElement.classList.add(`priority-${task.priority}`);
  }

  // Update priority display text
  const priorityDisplay = noteElement.querySelector('.priority-display');
  if (priorityDisplay) {
    priorityDisplay.textContent = `Priority: ${getPriorityLabel(task.priority)}`;
  }

  // Update priority button color
  const priorityButton = noteElement.querySelector('.edit-delete button:first-child');
  if (priorityButton) {
    priorityButton.style.color = getPriorityColor(task.priority);
  }
}

export function setModalPriority(priority) {
  if (!state.currentTaskId) return;

  state.setCurrentModalPriority(priority);
  state.setModalHasChanges(true);

  // Update the label
  const priorityLabel = document.getElementById('modalPriorityLabel');
  if (priorityLabel) {
    priorityLabel.textContent = getPriorityLabel(priority);
  }

  // Update button states
  updateModalPriorityButtons(priority);
}

export function updateModalPriorityButtons(priority) {
  const buttons = document.querySelectorAll('.priority-controls .priority-btn');
  buttons.forEach(btn => {
    const btnPriority = btn.dataset.priority;
    // Handle null priority matching "none" button
    const isMatch = (priority === null && btnPriority === 'none') || btnPriority === priority;
    if (isMatch) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
