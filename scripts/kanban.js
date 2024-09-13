let notesData = [];

// Function to update time for different regions
function updateClocks() {
    const currentTime = new Date();

    // Options for time format (hours and minutes only)
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const currentDateOptions = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    const otherDateOptions = { weekday: 'long', day: '2-digit' };

    // Current Time (Local)
    document.getElementById("clockCurrent").textContent = currentTime.toLocaleTimeString([], timeOptions);
    document.getElementById("currentDate").textContent = currentTime.toLocaleDateString([], currentDateOptions);

    // Europe Time (UTC+1)
    const europeTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    document.getElementById("clockEurope").textContent = europeTime.toLocaleTimeString([], timeOptions);
    document.getElementById("europeDate").textContent = europeTime.toLocaleDateString([], otherDateOptions);

    // China Time (UTC+8)
    const chinaTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    document.getElementById("clockChina").textContent = chinaTime.toLocaleTimeString([], timeOptions);
    document.getElementById("chinaDate").textContent = chinaTime.toLocaleDateString([], otherDateOptions);

    // Americas Time (UTC-5, New York)
    const americasTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    document.getElementById("clockAmericas").textContent = americasTime.toLocaleTimeString([], timeOptions);
    document.getElementById("americasDate").textContent = americasTime.toLocaleDateString([], otherDateOptions);

    // Africa Time (UTC+2, Cairo)
    const africaTime = new Date(currentTime.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    document.getElementById("clockAfrica").textContent = africaTime.toLocaleTimeString([], timeOptions);
    document.getElementById("africaDate").textContent = africaTime.toLocaleDateString([], otherDateOptions);
}

// Call updateClocks every second
setInterval(updateClocks, 1000);

// Load notes on page load
window.onload = loadNotesFromLocalStorage;



// Load notes from localStorage
function loadNotesFromLocalStorage() {
    const savedNotes = localStorage.getItem('kanbanNotes');
    if (savedNotes) {
        notesData = JSON.parse(savedNotes);

        // Remove all tasks from the Done column
        notesData = notesData.filter(note => note.column !== 'done' && !note.deleted);

        // Display remaining tasks in their respective columns
        notesData.forEach(note => {
            const noteElement = createNoteElement(note);
            document.getElementById(note.column).appendChild(noteElement);
        });

        // Save the filtered notes back to localStorage after clearing Done tasks
        saveNotesToLocalStorage();
    }
}

// Save notes to localStorage
function saveNotesToLocalStorage() {
    localStorage.setItem('kanbanNotes', JSON.stringify(notesData));
}

// Drag and Drop functionality
let draggedItem = null;

document.querySelectorAll('.column').forEach(column => {
    column.addEventListener('dragover', e => e.preventDefault());

    column.addEventListener('drop', function () {
        if (draggedItem) {
            const oldColumnId = draggedItem.parentElement.id;
            const newColumnId = this.id;
            const noteId = parseInt(draggedItem.dataset.id);

            this.appendChild(draggedItem);
            updateNoteColumn(noteId, oldColumnId, newColumnId);

            draggedItem = null;
            saveNotesToLocalStorage();  // Save after column change
        }
    });
});

function createNoteElement(content) {
    const note = document.createElement('div');
    note.classList.add('note');
    note.draggable = true;
    note.dataset.id = content.id;

    const noteContent = document.createElement('div');
    noteContent.classList.add('note-content');
    noteContent.innerHTML = `<strong>${content.title}</strong>`;

    const noteText = document.createElement('div');
    noteText.classList.add('note-text');
    noteText.textContent = content.notes || 'No additional notes';

    const timestamp = document.createElement('div');
    timestamp.classList.add('timestamp');
    timestamp.textContent = `Created: ${content.actions[0].timestamp}`;

    const editDeleteContainer = document.createElement('div');
    editDeleteContainer.classList.add('edit-delete');

    // Edit button
    const editButton = document.createElement('button');
    editButton.textContent = "✏️";
    editButton.style.color = "#81c784";
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

    // Drag events
    note.addEventListener('dragstart', function () {
        draggedItem = note;
    });

    return note;
}

function addNote() {
    const title = document.getElementById('newNote').value;
    if (title.trim() === "") {
        alert("Please enter a title for the new task.");
        return;
    }

    const newNote = {
        id: Date.now(),
        title: title,
        notes: "",
        column: 'todo',
        actions: [
            {
                action: 'created',
                timestamp: new Date().toLocaleString()
            }
        ]
    };

    notesData.push(newNote);

    const noteElement = createNoteElement(newNote);
    document.getElementById('todo').appendChild(noteElement);

    document.getElementById('newNote').value = "";  // Clear input field
    saveNotesToLocalStorage();  // Save new note
}

function deleteNote(id) {
    notesData = notesData.filter(note => note.id !== id);
    saveNotesToLocalStorage();
}

function updateNoteColumn(id, oldColumn, newColumn) {
    const note = notesData.find(note => note.id === id);
    if (note) {
        note.actions.push({
            action: `Moved from ${oldColumn} to ${newColumn}`,
            timestamp: new Date().toLocaleString()
        });
        note.column = newColumn;
        saveNotesToLocalStorage();
    }
}

function updateNoteContent(id, newNotes) {
    const note = notesData.find(note => note.id === id);
    if (note) {
        note.notes = newNotes;
        note.actions.push({
            action: `Updated notes`,
            timestamp: new Date().toLocaleString()
        });
        saveNotesToLocalStorage();
    }
}

function viewNoteHistory(id) {
    const note = notesData.find(note => note.id === id);
    if (note) {
        let history = "";
        note.actions.forEach(action => {
            history += `${action.action} - ${action.timestamp}\n`;
        });
        alert(history);
    }
}

function exportNotes() {
    const data = notesData.map(note => ({
        title: note.title,
        notes: note.notes,
        column: note.column,
        history: note.actions
    }));

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "kanban_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Update clocks every second
setInterval(updateClocks, 1000);

// Load notes on page load
window.onload = loadNotesFromLocalStorage;
