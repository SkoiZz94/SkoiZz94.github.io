/***********************
 * TASK CRUD & RENDERING
 ***********************/
import * as state from './state.js';
import { saveNotesToLocalStorage } from './storage.js';
import { deleteTaskImages } from './database.js';
import { getColumnName, formatTime, getFirstLine } from './utils.js';
import { getPriorityLabel, getPriorityColor, showQuickPriorityMenu } from './priority.js';
import { showQuickTimeMenu } from './timer.js';
import { exportTaskAsPDF } from './export.js';
import { enableTouchDrag, setDraggedItemRef } from './drag-drop.js';

// Forward declaration for openTaskModal (will be set from modal.js)
let openTaskModalFn = null;
export function setOpenTaskModal(fn) {
  openTaskModalFn = fn;
}

export function addNote() {
  const input = document.getElementById('newNote');
  if (!input) return;
  const noteText = input.value;
  if (noteText.trim() !== '') {
    const id = Date.now();
    const timestamp = new Date().toLocaleString();
    const newNote = {
      id,
      title: noteText,
      noteEntries: [],
      timer: 0,
      priority: null,
      column: 'todo',
      actions: [{ action: 'Created', timestamp, type: 'created' }]
    };

    state.pushToNotesData(newNote);
    saveNotesToLocalStorage();

    const noteElement = createNoteElement(newNote);
    const todoCol = document.getElementById('todo');
    if (todoCol) todoCol.appendChild(noteElement);

    input.value = '';
  }
}

export function deleteTaskFromModal() {
  if (!state.currentTaskId) return;

  if (confirm("Are you sure you want to delete this task?")) {
    const taskIdToDelete = state.currentTaskId;
    const task = state.notesData.find(t => t.id === taskIdToDelete);
    if (!task) return;

    const shouldExport = confirm("Do you want to export this task as PDF before deleting?");

    // Close modal first
    state.setModalHasChanges(false); // Prevent unsaved changes warning
    const modal = document.getElementById('taskModal');
    if (modal) modal.style.display = 'none';
    state.setCurrentTaskId(null);

    // Handle export and deletion
    if (shouldExport) {
      // Add deletion to history
      const timestamp = new Date().toLocaleString();
      task.actions.push({ action: 'Deleted', timestamp, type: 'deleted' });
      saveNotesToLocalStorage();

      // Export PDF then delete
      exportTaskAsPDF(taskIdToDelete).then(() => {
        deleteNote(taskIdToDelete, false);
      });
    } else {
      // Just delete
      deleteNote(taskIdToDelete, true);
    }
  }
}

export async function deleteNote(id, addToHistory = true) {
  const noteIndex = state.notesData.findIndex(n => n.id === id);
  if (noteIndex !== -1) {
    await deleteTaskImages(id);

    state.notesData[noteIndex].deleted = true;

    if (addToHistory) {
      const timestamp = new Date().toLocaleString();
      state.notesData[noteIndex].actions.push({ action: 'Deleted', timestamp, type: 'deleted' });
    }

    saveNotesToLocalStorage();

    const domEl = document.querySelector(`[data-id='${id}']`);
    if (domEl) domEl.remove();
  }
}

export function updateNoteColumn(id, oldColumn, newColumn) {
  const note = state.notesData.find(n => n.id === id);

  if (note && oldColumn !== newColumn) {
    note.column = newColumn;
    const timestamp = new Date().toLocaleString();

    // Ensure actions array exists (for imported or legacy data)
    if (!note.actions) {
      note.actions = [];
    }

    note.actions.push({
      action: `Moved from ${getColumnName(oldColumn)} to ${getColumnName(newColumn)}`,
      timestamp,
      type: 'status'
    });
    saveNotesToLocalStorage();

    if (newColumn === 'done') {
      // Use requestAnimationFrame to ensure we're outside the drag event context
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (confirm(`Task "${note.title}" moved to Done.\n\nDo you want to export it as PDF?`)) {
            exportTaskAsPDF(id);
          }
        }, 100);
      });
    }
  }
}

export function createNoteElement(content) {
  const note = document.createElement('div');
  note.classList.add('note');
  // Add priority class for color tint (only if priority is set)
  if (content.priority) {
    note.classList.add(`priority-${content.priority}`);
  }
  note.draggable = true;
  note.dataset.id = content.id;

  note.style.cursor = 'pointer';
  note.onclick = (e) => {
    if (!e.target.closest('button') && !e.target.closest('.quick-time-menu')) {
      if (openTaskModalFn) openTaskModalFn(content.id);
    }
  };

  const noteContent = document.createElement('div');
  noteContent.classList.add('note-content');

  const titleSpan = document.createElement('strong');
  titleSpan.textContent = content.title;
  noteContent.appendChild(titleSpan);

  const noteText = document.createElement('div');
  noteText.classList.add('note-text');
  if (content.noteEntries && content.noteEntries.length > 0) {
    const latestNote = content.noteEntries[content.noteEntries.length - 1];
    const firstLine = getFirstLine(latestNote.notesHTML);
    noteText.textContent = firstLine;
  } else {
    noteText.textContent = 'No additional notes';
  }

  const timestamp = document.createElement('div');
  timestamp.classList.add('timestamp');
  timestamp.textContent = `Created: ${content.actions?.[0]?.timestamp || ''}`;

  const priorityDisplay = document.createElement('div');
  priorityDisplay.classList.add('priority-display');
  priorityDisplay.textContent = `Priority: ${getPriorityLabel(content.priority)}`;

  const workedTime = document.createElement('div');
  workedTime.classList.add('worked-time');
  workedTime.textContent = `Worked Time: ${formatTime(content.timer || 0)}`;

  const editDeleteContainer = document.createElement('div');
  editDeleteContainer.classList.add('edit-delete');

  const priorityButton = document.createElement('button');
  priorityButton.textContent = "🏷️";
  priorityButton.style.color = getPriorityColor(content.priority);
  priorityButton.title = "Set Priority";
  priorityButton.onclick = function(e) {
    e.stopPropagation();
    showQuickPriorityMenu(content.id, priorityButton);
  };
  // iOS touch support
  priorityButton.addEventListener('touchend', function(e) {
    e.stopPropagation();
    e.preventDefault();
    showQuickPriorityMenu(content.id, priorityButton);
  });

  const timerButton = document.createElement('button');
  timerButton.textContent = "⏱️";
  timerButton.style.color = "#ff9800";
  timerButton.title = "Quick Add Time (Long press to subtract)";

  // Long press detection
  let pressTimer = null;
  let isLongPress = false;

  timerButton.onmousedown = function (e) {
    e.stopPropagation();
    isLongPress = false;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      showQuickTimeMenu(content.id, timerButton, true); // subtract mode
    }, 500); // 500ms for long press
  };

  timerButton.onmouseup = function (e) {
    e.stopPropagation();
    clearTimeout(pressTimer);
    if (!isLongPress) {
      showQuickTimeMenu(content.id, timerButton, false); // add mode
    }
  };

  // Prevent click event after long press to avoid closing menu
  timerButton.onclick = function (e) {
    if (isLongPress) {
      e.stopPropagation();
      e.preventDefault();
      return false;
    }
  };

  timerButton.onmouseleave = function () {
    if (!isLongPress) {
      clearTimeout(pressTimer);
    }
  };

  timerButton.onmouseout = function() {
    if (!isLongPress) {
      clearTimeout(pressTimer);
    }
  };

  // Touch support for long press
  timerButton.ontouchstart = function (e) {
    e.stopPropagation();
    isLongPress = false;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      showQuickTimeMenu(content.id, timerButton, true); // subtract mode
    }, 500);
  };

  timerButton.ontouchend = function (e) {
    e.stopPropagation();
    clearTimeout(pressTimer);
    if (!isLongPress) {
      showQuickTimeMenu(content.id, timerButton, false); // add mode
    }
  };

  const deleteButton = document.createElement('button');
  deleteButton.textContent = "❌";
  deleteButton.style.color = "#e57373";
  deleteButton.title = "Delete";
  const handleDelete = async function (e) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      const task = state.notesData.find(t => t.id === content.id);
      if (!task) return;

      const shouldExport = confirm("Do you want to export this task as PDF before deleting?");

      if (shouldExport) {
        // Add deletion to history
        const timestamp = new Date().toLocaleString();
        task.actions.push({ action: 'Deleted', timestamp, type: 'deleted' });
        saveNotesToLocalStorage();

        // Export PDF
        await exportTaskAsPDF(content.id);
      }

      // Delete task
      await deleteNote(content.id, !shouldExport);
    }
  };
  deleteButton.onclick = handleDelete;
  // iOS touch support
  deleteButton.addEventListener('touchend', function(e) {
    e.preventDefault();
    handleDelete(e);
  });

  [priorityButton, timerButton, deleteButton].forEach(btn => {
    btn.draggable = false;
    btn.addEventListener('mousedown', e => e.stopPropagation());
    btn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
  });

  editDeleteContainer.appendChild(priorityButton);
  editDeleteContainer.appendChild(timerButton);
  editDeleteContainer.appendChild(deleteButton);

  note.appendChild(noteContent);
  note.appendChild(noteText);
  note.appendChild(timestamp);
  note.appendChild(priorityDisplay);
  note.appendChild(workedTime);

  // Add sub-task indicator if task has sub-items
  if (content.subKanban && content.subKanban.items && content.subKanban.items.length > 0) {
    const subTaskIndicator = document.createElement('div');
    subTaskIndicator.classList.add('sub-task-indicator');
    const totalSubTasks = content.subKanban.items.length;
    const doneSubTasks = content.subKanban.items.filter(i => i.column === 'done').length;
    subTaskIndicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="9"></line>
        <line x1="9" y1="13" x2="15" y2="13"></line>
        <line x1="9" y1="17" x2="13" y2="17"></line>
      </svg>
      <span>${doneSubTasks}/${totalSubTasks} sub-tasks</span>
    `;
    note.appendChild(subTaskIndicator);
  }

  note.appendChild(editDeleteContainer);

  note.addEventListener('dragstart', (e) => {
    if (e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    setDraggedItemRef(note);
  });

  enableTouchDrag(note, openTaskModalFn);

  return note;
}

export function updateNoteCardDisplay(taskId) {
  const task = state.notesData.find(t => t.id === taskId);
  if (!task) return;

  const noteElement = document.querySelector(`[data-id="${taskId}"]`);
  if (!noteElement) return;

  const noteText = noteElement.querySelector('.note-text');
  if (noteText) {
    // Show first line of latest note
    if (task.noteEntries && task.noteEntries.length > 0) {
      const latestNote = task.noteEntries[task.noteEntries.length - 1];
      const firstLine = getFirstLine(latestNote.notesHTML);
      noteText.textContent = firstLine;
    } else {
      noteText.textContent = 'No additional notes';
    }
  }

  // Update timer badge
  const timerBadge = noteElement.querySelector('.timer-badge');
  if (timerBadge) {
    timerBadge.textContent = formatTime(task.timer || 0);
  }

  // Update worked time display
  const workedTime = noteElement.querySelector('.worked-time');
  if (workedTime) {
    workedTime.textContent = `Worked Time: ${formatTime(task.timer || 0)}`;
  }

  // Update sub-task indicator
  let subTaskIndicator = noteElement.querySelector('.sub-task-indicator');
  if (task.subKanban && task.subKanban.items && task.subKanban.items.length > 0) {
    const totalSubTasks = task.subKanban.items.length;
    const doneSubTasks = task.subKanban.items.filter(i => i.column === 'done').length;

    if (!subTaskIndicator) {
      subTaskIndicator = document.createElement('div');
      subTaskIndicator.classList.add('sub-task-indicator');
      const editDelete = noteElement.querySelector('.edit-delete');
      if (editDelete) {
        noteElement.insertBefore(subTaskIndicator, editDelete);
      } else {
        noteElement.appendChild(subTaskIndicator);
      }
    }

    subTaskIndicator.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="9"></line>
        <line x1="9" y1="13" x2="15" y2="13"></line>
        <line x1="9" y1="17" x2="13" y2="17"></line>
      </svg>
      <span>${doneSubTasks}/${totalSubTasks} sub-tasks</span>
    `;
  } else if (subTaskIndicator) {
    subTaskIndicator.remove();
  }
}
