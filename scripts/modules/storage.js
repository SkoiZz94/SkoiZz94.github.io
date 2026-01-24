/***********************
 * STORAGE FUNCTIONS
 ***********************/
import { notesData, setNotesData, notebookItems, setNotebookItems } from './state.js';

export function loadNotesFromLocalStorage() {
  const savedNotes = localStorage.getItem('kanbanNotes');
  if (savedNotes) {
    const parsedNotes = JSON.parse(savedNotes);

    // Migrate old format (single notes field) to new format (noteEntries array)
    parsedNotes.forEach(note => {
      if (note.notes && !note.noteEntries) {
        note.noteEntries = [{
          timestamp: note.actions?.[0]?.timestamp || new Date().toLocaleString(),
          notesHTML: note.notes,
          images: note.images || []
        }];
        delete note.notes;
      }
      if (!note.noteEntries) {
        note.noteEntries = [];
      }
    });

    setNotesData(parsedNotes);
  }
  return notesData;
}

export function saveNotesToLocalStorage() {
  localStorage.setItem('kanbanNotes', JSON.stringify(notesData));
}

export function loadNotebookFromLocalStorage() {
  const saved = localStorage.getItem('notebookItems');
  if (saved) {
    setNotebookItems(JSON.parse(saved));
  } else {
    setNotebookItems([]);
  }
  return notebookItems;
}

export function saveNotebookToLocalStorage() {
  localStorage.setItem('notebookItems', JSON.stringify(notebookItems));
}

export function loadPermanentNotes() {
  const savedNotes = localStorage.getItem('permanentNotes');
  const permanentNotesField = document.getElementById('permanentNotes');
  if (permanentNotesField && savedNotes) {
    permanentNotesField.value = savedNotes;
  }
}

export function savePermanentNotes() {
  const permanentNotesField = document.getElementById('permanentNotes');
  if (permanentNotesField) {
    localStorage.setItem('permanentNotes', permanentNotesField.value);
  }
}
