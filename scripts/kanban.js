let notesData = [];
let deletedNotes = []; // reserved if you want to use later

/***********************
 * CLOCKS (single implementation)
 ***********************/
function updateClocks() {
  const currentTime = new Date();

  // Options for time format (hours and minutes only)
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  const currentDateOptions = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
  const otherDateOptions = { weekday: 'long', day: '2-digit' };

  // Current Time (Local)
  const clockCurrent = document.getElementById("clockCurrent");
  const currentDate = document.getElementById("currentDate");
  if (clockCurrent) clockCurrent.textContent = currentTime.toLocaleTimeString([], timeOptions);
  if (currentDate) currentDate.textContent = currentTime.toLocaleDateString([], currentDateOptions);

  // Europe Time (UTC+1)
  const europeTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const clockEurope = document.getElementById("clockEurope");
  const europeDate = document.getElementById("europeDate");
  if (clockEurope) clockEurope.textContent = europeTime.toLocaleTimeString([], timeOptions);
  if (europeDate) europeDate.textContent = europeTime.toLocaleDateString([], otherDateOptions);

  // China Time (UTC+8)
  const chinaTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  const clockChina = document.getElementById("clockChina");
  const chinaDate = document.getElementById("chinaDate");
  if (clockChina) clockChina.textContent = chinaTime.toLocaleTimeString([], timeOptions);
  if (chinaDate) chinaDate.textContent = chinaTime.toLocaleDateString([], otherDateOptions);

  // Americas Time (UTC-5, New York)
  const americasTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const clockAmericas = document.getElementById("clockAmericas");
  const americasDate = document.getElementById("americasDate");
  if (clockAmericas) clockAmericas.textContent = americasTime.toLocaleTimeString([], timeOptions);
  if (americasDate) americasDate.textContent = americasTime.toLocaleDateString([], otherDateOptions);

  // Africa Time (UTC+2, Cairo)
  const africaTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
  const clockAfrica = document.getElementById("clockAfrica");
  const africaDate = document.getElementById("africaDate");
  if (clockAfrica) clockAfrica.textContent = africaTime.toLocaleTimeString([], timeOptions);
  if (africaDate) africaDate.textContent = africaTime.toLocaleDateString([], otherDateOptions);
}

// Update clocks every second
setInterval(updateClocks, 1000);

/***********************
 * STORAGE
 ***********************/
function loadNotesFromLocalStorage() {
  const savedNotes = localStorage.getItem('kanbanNotes');
  if (savedNotes) {
    notesData = JSON.parse(savedNotes);

    // Clear all existing tasks in DOM to prevent duplication
    document.querySelectorAll('.note').forEach(note => note.remove());

    // Remove tasks from the 'done' column and not already deleted
    notesData = notesData.filter(note => note.column !== 'done' && !note.deleted);

    // Display remaining tasks in their respective columns
    notesData.forEach(note => {
      const noteElement = createNoteElement(note);
      const col = document.getElementById(note.column);
      if (col) col.appendChild(noteElement);
    });

    // Save filtered notes back (persist removal of done)
    saveNotesToLocalStorage();
  }
}

function saveNotesToLocalStorage() {
  localStorage.setItem('kanbanNotes', JSON.stringify(notesData));
}

/***********************
 * DRAG & DROP (desktop)
 ***********************/
let draggedItem = null;

// desktop HTML5 DnD for mouse/trackpad
document.querySelectorAll('.column').forEach(column => {
  // allow drop
  column.addEventListener('dragover', e => e.preventDefault());
  column.addEventListener('drop', function () {
    if (draggedItem) {
      const oldColumnId = draggedItem.parentElement.id;
      const newColumnId = this.id;
      const noteId = parseInt(draggedItem.dataset.id, 10);

      this.appendChild(draggedItem);
      updateNoteColumn(noteId, oldColumnId, newColumnId);

      draggedItem = null;
      saveNotesToLocalStorage(); // Save after column change
    }
  });
});

/***********************
 * DRAG & DROP (touch)
 * Simple touch handlers that simulate a drop onto the column under the finger
 ***********************/
function enableTouchDrag(noteEl) {
  // Start
  noteEl.addEventListener('touchstart', (e) => {
    draggedItem = noteEl;
    // prevent page scroll while dragging
    e.preventDefault();
  }, { passive: false });

  // Move
  noteEl.addEventListener('touchmove', (e) => {
    e.preventDefault(); // keep control, avoid scrolling
    const t = e.touches[0];
    const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
    const hoveredCol = elUnderFinger && elUnderFinger.closest('.column');

    // visual feedback
    document.querySelectorAll('.column').forEach(c =>
      c.classList.toggle('drop-hover', c === hoveredCol)
    );
  }, { passive: false });

  // End (drop)
  noteEl.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
    const dropCol = elUnderFinger && elUnderFinger.closest('.column');

    // clear feedback
    document.querySelectorAll('.column').forEach(c => c.classList.remove('drop-hover'));

    if (draggedItem && dropCol) {
      const oldColumnId = draggedItem.parentElement.id;
      const newColumnId = dropCol.id;
      const noteId = parseInt(draggedItem.dataset.id, 10);

      dropCol.appendChild(draggedItem);
      updateNoteColumn(noteId, oldColumnId, newColumnId);
      saveNotesToLocalStorage();
    }

    draggedItem = null;
  });
}

/***********************
 * NOTE UI
 ***********************/
function createNoteElement(content) {
  const note = document.createElement('div');
  note.classList.add('note');
  note.draggable = true;
  note.dataset.id = content.id;

  const noteContent = document.createElement('div');
  noteContent.classList.add('note-content');
  noteContent.innerHTML = `<strong>${escapeHtml(content.title)}</strong>`;

  const noteText = document.createElement('div');
  noteText.classList.add('note-text');
  noteText.textContent = content.notes || 'No additional notes';

  const timestamp = document.createElement('div');
  timestamp.classList.add('timestamp');
  timestamp.textContent = `Created: ${content.actions?.[0]?.timestamp || ''}`;

  const editDeleteContainer = document.createElement('div');
  editDeleteContainer.classList.add('edit-delete');

  // Edit button
  const editButton = document.createElement('button');
  editButton.textContent = "✏️";
  editButton.style.color = "#81c784";
  editButton.title = "Edit";
  editButton.onclick = function () {
    const newNotes = prompt("Edit notes:", content.notes || "");
    if (newNotes !== null) {
      noteText.textContent = newNotes;
      updateNoteContent(content.id, newNotes);
    }
  };

  // Delete button
  const deleteButton = document.createElement('button');
  deleteButton.textContent = "❌";
  deleteButton.style.color = "#e57373";
  deleteButton.title = "Delete";
  deleteButton.onclick = function () {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteNote(content.id);
      note.remove();
    }
  };

  // History button
  const historyButton = document.createElement('button');
  historyButton.textContent = "📜";
  historyButton.style.color = "#ffca28";
  historyButton.title = "History";
  historyButton.onclick = function () {
    viewNoteHistory(content.id);
  };

  editDeleteContainer.appendChild(editButton);
  editDeleteContainer.appendChild(deleteButton);
  editDeleteContainer.appendChild(historyButton);

  note.appendChild(noteContent);
  note.appendChild(noteText);
  note.appendChild(timestamp);
  note.appendChild(editDeleteContainer);

  // desktop drag start
  note.addEventListener('dragstart', () => {
    draggedItem = note;
  });

  // touch support for tablets/phones
  enableTouchDrag(note);

  return note;
}

/***********************
 * ACTIONS
 ***********************/
function addNote() {
  const input = document.getElementById('newNote');
  if (!input) return;
  const noteText = input.value;
  if (noteText.trim() !== '') {
    const id = Date.now(); // unique ID
    const timestamp = new Date().toLocaleString();
    const newNote = {
      id,
      title: noteText,
      notes: "",
      column: 'todo',  // Initial column set to 'todo'
      actions: [{ action: 'Created', timestamp }]
    };

    // Save first
    notesData.push(newNote);
    saveNotesToLocalStorage();

    // Then add to DOM
    const noteElement = createNoteElement(newNote);
    const todoCol = document.getElementById('todo');
    if (todoCol) todoCol.appendChild(noteElement);

    input.value = ''; // Clear input
  }
}

function deleteNote(id) {
  const noteIndex = notesData.findIndex(n => n.id === id);
  if (noteIndex !== -1) {
    notesData[noteIndex].deleted = true;
    const timestamp = new Date().toLocaleString();
    notesData[noteIndex].actions.push({ action: 'Deleted', timestamp });

    saveNotesToLocalStorage();

    const domEl = document.querySelector(`[data-id='${id}']`);
    if (domEl) domEl.remove();
  }
}

function updateNoteColumn(id, oldColumn, newColumn) {
  const note = notesData.find(n => n.id === id);
  if (note && oldColumn !== newColumn) {
    note.column = newColumn;
    const timestamp = new Date().toLocaleString();
    note.actions.push({ action: `Moved from ${getColumnName(oldColumn)} to ${getColumnName(newColumn)}`, timestamp });
    saveNotesToLocalStorage();
  }
}

function updateNoteContent(id, newNotes) {
  const note = notesData.find(n => n.id === id);
  if (note) {
    note.notes = newNotes;
    const timestamp = new Date().toLocaleString();
    note.actions.push({ action: `Edited Notes: "${newNotes}"`, timestamp });
    saveNotesToLocalStorage();
  }
}

function viewNoteHistory(id) {
  const note = notesData.find(n => n.id === id);
  if (note) {
    let historyLog = `History for task: ${note.title}\n\n`;
    note.actions.forEach(action => {
      historyLog += `${action.action} - ${action.timestamp}\n`;
    });
    alert(historyLog);
  }
}

/***********************
 * EXPORT
 ***********************/
function exportNotes() {
  let fileContent = `Kanban Board Export - ${getCurrentDate()}\n\n`;

  ['todo', 'inProgress', 'done', 'onHold'].forEach(columnId => {
    const colEl = document.getElementById(columnId);
    if (!colEl) return;
    const notes = Array.from(colEl.querySelectorAll('.note'));
    notes.forEach(noteElement => {
      const noteId = parseInt(noteElement.dataset.id, 10);
      const note = notesData.find(n => n.id === noteId);
      if (note) {
        fileContent += `Title: ${note.title}\n`;
        fileContent += `Notes: ${note.notes || "No additional notes"}\n`;
        fileContent += `Current Column: ${getColumnName(note.column)}\n`;
        fileContent += `Actions:\n`;
        note.actions.forEach(action => {
          fileContent += `  - ${action.action} at ${action.timestamp}\n`;
        });
        fileContent += '----------------------\n';
      }
    });
  });

  // Include deleted items
  fileContent += `Deleted Items:\n`;
  notesData.filter(note => note.deleted).forEach(note => {
    fileContent += `Title: ${note.title}\n`;
    fileContent += `Notes: ${note.notes || "No additional notes"}\n`;
    fileContent += `Actions:\n`;
    note.actions.forEach(action => {
      fileContent += `  - ${action.action} at ${action.timestamp}\n`;
    });
    fileContent += '----------------------\n';
  });

  // Create and download the file
  const blob = new Blob([fileContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Kanban_Export_${getCurrentDate()}.txt`;
  link.click();
}

/***********************
 * UTILS
 ***********************/
function getColumnName(columnId) {
  switch (columnId) {
    case 'todo': return 'To Do';
    case 'inProgress': return 'In Progress';
    case 'done': return 'Done';
    case 'onHold': return 'On Hold';
    default: return '';
  }
}

function getCurrentDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

// Basic HTML escape for safety when injecting strings into innerHTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[s]));
}

/***********************
 * NAVIGATION GUARD (optional)
 ***********************/
window.addEventListener('beforeunload', function (e) {
  // Some mobile browsers ignore this prompt; harmless if not shown.
  e.preventDefault();
  e.returnValue = '';
  const confirmation = confirm('Do you want to export the data to a file before leaving?');
  if (confirmation) {
    exportNotes();
  }
});

/***********************
 * BOOTSTRAP
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
  updateClocks();
  loadNotesFromLocalStorage();

  // If the add button exists, wire it (keeps HTML simple)
  const addBtn = document.getElementById('addNoteBtn');
  if (addBtn) addBtn.addEventListener('click', addNote);

  // If input supports pressing Enter to add
  const input = document.getElementById('newNote');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNote();
    });
  }
});
