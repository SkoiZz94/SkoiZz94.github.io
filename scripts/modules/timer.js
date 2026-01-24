/***********************
 * TIMER FUNCTIONS
 ***********************/
import * as state from './state.js';
import { formatTime } from './utils.js';
import { saveNotesToLocalStorage } from './storage.js';
import { updateNoteCardDisplay } from './tasks.js';

export function addTime(minutes) {
  if (!state.currentTaskId) return;

  const task = state.notesData.find(t => t.id === state.currentTaskId);
  if (!task) return;

  task.timer = Math.max(0, (task.timer || 0) + minutes);

  // Mark modal as having changes
  state.setModalHasChanges(true);

  // Store action for later
  const timestamp = new Date().toLocaleString();
  const action = minutes > 0 ? `Added ${minutes} minute(s) to timer` : `Removed ${Math.abs(minutes)} minute(s) from timer`;
  state.pushToModalPendingActions({ action, timestamp });

  const timerTotal = document.getElementById('modalTimerTotal');
  if (timerTotal) {
    timerTotal.textContent = formatTime(task.timer);
  }

  // Don't save immediately - wait for Save & Close
  updateNoteCardDisplay(state.currentTaskId);
}

export function showQuickTimeMenu(taskId, buttonElement, isSubtract = false) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.quick-time-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const menu = document.createElement('div');
  menu.classList.add('quick-time-menu');
  menu.dataset.sourceButton = buttonElement.id || 'timer-btn';
  if (isSubtract) {
    menu.classList.add('subtract');
  }

  const times = [1, 5, 10, 15, 30, 60];
  times.forEach(minutes => {
    const btn = document.createElement('button');
    btn.textContent = isSubtract ? `-${minutes}m` : `+${minutes}m`;
    btn.onclick = (e) => {
      e.stopPropagation();
      quickAddTime(taskId, isSubtract ? -minutes : minutes);
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

  // Close menu when clicking outside (but not on the button that opened it)
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && !buttonElement.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

export function quickAddTime(taskId, minutes) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return;

  task.timer = Math.max(0, (task.timer || 0) + minutes);

  const timestamp = new Date().toLocaleString();
  const action = minutes > 0
    ? `Added ${minutes} minute(s) to timer`
    : `Removed ${Math.abs(minutes)} minute(s) from timer`;
  task.actions.push({ action, timestamp, type: 'timer' });

  saveNotesToLocalStorage();
  updateNoteCardDisplay(taskId);
}
