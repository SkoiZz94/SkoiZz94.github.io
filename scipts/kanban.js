let notesData = [];

// Load notes from localStorage
function loadNotesFromLocalStorage() {
    const savedNotes = localStorage.getItem('kanbanNotes');
    if (savedNotes) {
        notesData = JSON.parse(savedNotes);
        notesData.forEach(note => {
            const noteElement = createNoteElement(note);
            document.getElementById(note.column).appendChild(noteElement);
        });
    }
}

// Save notes to localStorage
function saveNotesToLocalStorage() {
    localStorage.setItem('kanbanNotes', JSON.stringify(notesData));
}

// Add a new note
function addNote() {
    const noteText = document.getElementById('newNote').value;
    if (noteText.trim() !== '') {
        const newNote = {
            id: Date.now(),
            content: noteText,
            column: 'todo',
        };
        notesData.push(newNote);
        const noteElement = createNoteElement(newNote);
        document.getElementById('todo').appendChild(noteElement);
        document.getElementById('newNote').value = '';
        saveNotesToLocalStorage();
    }
}

// Create note element
function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.classList.add('note');
    noteDiv.textContent = note.content;
    return noteDiv;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadNotesFromLocalStorage();
});
