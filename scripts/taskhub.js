/***********************
 * KANBAN.JS - Main Entry Point
 * ES Module Version
 ***********************/

// Import all modules
import * as state from './modules/state.js';
import { initIndexedDB } from './modules/database.js';
import {
  loadNotesFromLocalStorage,
  saveNotesToLocalStorage,
  loadNotebookFromLocalStorage,
  loadPermanentNotes,
  savePermanentNotes
} from './modules/storage.js';
import {
  loadClocks,
  openAddClockModal,
  closeAddClockModal,
  selectClockType,
  filterTimezones,
  addTimezoneClock,
  addChronometer,
  deleteClock,
  startChronometer,
  pauseChronometer,
  resetChronometer
} from './modules/clocks.js';
import {
  openTaskModal,
  closeTaskModal,
  enableTitleEdit,
  clearNotes,
  toggleHistory,
  saveAndCloseModal
} from './modules/modal.js';
import {
  addNote,
  deleteTaskFromModal,
  createNoteElement,
  updateNoteCardDisplay
} from './modules/tasks.js';
import { setupDragAndDrop } from './modules/drag-drop.js';
import {
  addSubKanbanItem,
  toggleSubKanban
} from './modules/sub-kanban.js';
import { addTime } from './modules/timer.js';
import { setModalPriority } from './modules/priority.js';
import {
  setupClipboardPaste,
  openImageViewer,
  closeImageModal,
  zoomImage,
  resetZoom
} from './modules/images.js';
import {
  exportTaskAsPDF,
  exportBoardAsHTML,
  importBoardFromFile
} from './modules/export.js';
import { sortAllColumnsByPriority } from './modules/sorting.js';
import {
  toggleNotebookSidebar,
  renderNotebookTree,
  createNotebookItem,
  deletePageFromModal,
  closePageModal,
  saveAndClosePage,
  contextMenuAction,
  filterNotebookItems,
  setupNotebookEventListeners,
  importNotebookFromZip
} from './modules/notebook.js';
import {
  exportPageAsPDF,
  exportAllNotebook
} from './modules/notebook-export.js';
// Mentions system removed

/***********************
 * EXPOSE FUNCTIONS TO GLOBAL SCOPE
 * (For HTML onclick handlers)
 ***********************/

// Clocks
window.openAddClockModal = openAddClockModal;
window.closeAddClockModal = closeAddClockModal;
window.selectClockType = selectClockType;
window.filterTimezones = filterTimezones;
window.addTimezoneClock = addTimezoneClock;
window.addChronometer = addChronometer;
window.deleteClock = deleteClock;
window.startChronometer = startChronometer;
window.pauseChronometer = pauseChronometer;
window.resetChronometer = resetChronometer;

// Task Modal
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.enableTitleEdit = enableTitleEdit;
window.clearNotes = clearNotes;
window.toggleHistory = toggleHistory;
window.saveAndCloseModal = saveAndCloseModal;
window.deleteTaskFromModal = deleteTaskFromModal;

// Tasks
window.addNote = addNote;

// Sub-Kanban
window.addSubKanbanItem = addSubKanbanItem;
window.toggleSubKanban = toggleSubKanban;

// Timer
window.addTime = addTime;

// Priority
window.setModalPriority = setModalPriority;

// Images
window.openImageViewer = openImageViewer;
window.closeImageModal = closeImageModal;
window.zoomImage = zoomImage;
window.resetZoom = resetZoom;

// Export/Import
window.exportTaskAsPDF = exportTaskAsPDF;
window.exportBoardAsHTML = exportBoardAsHTML;
window.importBoardFromFile = importBoardFromFile;

// Notebook
window.toggleNotebookSidebar = toggleNotebookSidebar;
window.createNotebookItem = createNotebookItem;
window.deletePageFromModal = deletePageFromModal;
window.closePageModal = closePageModal;
window.saveAndClosePage = saveAndClosePage;
window.contextMenuAction = contextMenuAction;
window.filterNotebookItems = filterNotebookItems;
window.exportPageAsPDF = exportPageAsPDF;
window.exportAllNotebook = exportAllNotebook;
window.importNotebookFromZip = importNotebookFromZip;

/***********************
 * NAVIGATION GUARD
 ***********************/
window.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.returnValue = '';
});

/***********************
 * BOOTSTRAP
 ***********************/
document.addEventListener('DOMContentLoaded', async () => {
  await initIndexedDB();
  loadClocks();

  // Load notes and render them
  const notes = loadNotesFromLocalStorage();
  notes.forEach(note => {
    if (!note.deleted) {
      const noteElement = createNoteElement(note);
      const col = document.getElementById(note.column);
      if (col) col.appendChild(noteElement);
    }
  });

  // Sort all columns by priority after loading
  sortAllColumnsByPriority();

  setupDragAndDrop();
  setupClipboardPaste();
  loadPermanentNotes();

  const input = document.getElementById('newNote');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNote();
    });
  }

  // Auto-save permanent notes on input
  const permanentNotesField = document.getElementById('permanentNotes');
  if (permanentNotesField) {
    permanentNotesField.addEventListener('input', savePermanentNotes);
  }

  // iOS Safari touch support for elements with onclick attributes
  const clockAddButton = document.querySelector('.clock-add-button');
  if (clockAddButton) {
    clockAddButton.addEventListener('touchend', (e) => {
      if (!e.target.closest('button')) {
        e.preventDefault();
        openAddClockModal();
      }
    });
  }

  // iOS touch support for modal close buttons
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      const modal = closeBtn.closest('.modal');
      if (modal) {
        if (modal.id === 'taskModal') closeTaskModal();
        else if (modal.id === 'imageModal') closeImageModal();
        else if (modal.id === 'addClockModal') closeAddClockModal();
      }
    });
  });

  // iOS touch support for modal backdrop tap-to-close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('touchend', (e) => {
      if (e.target === modal) {
        e.preventDefault();
        if (modal.id === 'taskModal') {
          // Use existing close logic with unsaved changes check
          const task = state.notesData.find(t => t.id === state.currentTaskId);
          const notesEditor = document.getElementById('modalNotesEditor');
          const hasTextContent = notesEditor && notesEditor.textContent.trim().length > 0;
          const hasImages = notesEditor && notesEditor.querySelectorAll('img').length > 0;
          const hasNoteChanges = notesEditor && notesEditor.innerHTML.trim() && (hasTextContent || hasImages);
          const hasTimerChanges = task && (task.timer || 0) !== state.originalTimerValue;
          const hasPriorityChanges = state.currentModalPriority !== state.originalPriorityValue;
          const hasRealChanges = hasNoteChanges || hasTimerChanges || hasPriorityChanges;

          if (state.modalHasChanges && hasRealChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
              if (task && hasTimerChanges) {
                task.timer = state.originalTimerValue;
                updateNoteCardDisplay(state.currentTaskId);
                saveNotesToLocalStorage();
              }
              state.setModalHasChanges(false);
              state.setModalPendingActions([]);
              state.setOriginalTimerValue(0);
              state.setOriginalPriorityValue(null);
              state.setCurrentModalPriority(null);
              modal.style.display = 'none';
              state.setCurrentTaskId(null);
            }
          } else {
            closeTaskModal();
          }
        } else if (modal.id === 'imageModal') {
          closeImageModal();
        } else if (modal.id === 'addClockModal') {
          closeAddClockModal();
        }
      }
    });
  });

  window.onclick = function(event) {
    const taskModal = document.getElementById('taskModal');
    const imageModal = document.getElementById('imageModal');
    const addClockModal = document.getElementById('addClockModal');

    if (event.target === addClockModal) {
      closeAddClockModal();
    }

    if (event.target === taskModal) {
      // Check if there are actual changes
      const task = state.notesData.find(t => t.id === state.currentTaskId);
      const notesEditor = document.getElementById('modalNotesEditor');

      const hasTextContent = notesEditor && notesEditor.textContent.trim().length > 0;
      const hasImages = notesEditor && notesEditor.querySelectorAll('img').length > 0;
      const hasNoteChanges = notesEditor && notesEditor.innerHTML.trim() && (hasTextContent || hasImages);
      const hasTimerChanges = task && (task.timer || 0) !== state.originalTimerValue;
      const hasPriorityChanges = state.currentModalPriority !== state.originalPriorityValue;
      const hasRealChanges = hasNoteChanges || hasTimerChanges || hasPriorityChanges;

      if (state.modalHasChanges && hasRealChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
          // Revert timer changes if closing without saving
          if (task && hasTimerChanges) {
            task.timer = state.originalTimerValue;
            updateNoteCardDisplay(state.currentTaskId);
            saveNotesToLocalStorage();
          }

          state.setModalHasChanges(false);
          state.setModalPendingActions([]);
          state.setOriginalTimerValue(0);
          state.setOriginalPriorityValue(null);
          state.setCurrentModalPriority(null);
          taskModal.style.display = 'none';
          state.setCurrentTaskId(null);
        }
      } else {
        closeTaskModal();
      }
    }
    if (event.target === imageModal) {
      closeImageModal();
    }

    // Page modal click outside
    const pageModal = document.getElementById('pageModal');
    if (event.target === pageModal) {
      closePageModal();
    }
  };

  // Initialize notebook
  loadNotebookFromLocalStorage();
  renderNotebookTree();
  setupNotebookEventListeners();
});
