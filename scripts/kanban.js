let notesData = [];
let deletedNotes = [];

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

            note.addEventListener('dragstart', () => {
                draggedItem = note;
            });

            return note;
        }

function addNote() {
            const noteText = document.getElementById('newNote').value;
            if (noteText.trim() !== '') {
                const id = Date.now(); // unique ID based on timestamp
                const timestamp = new Date().toLocaleString();
                const newNote = {
                    id,
                    title: noteText,
                    notes: "",
                    column: 'todo',  // Initial column set to 'todo'
                    actions: [{ action: 'Created', timestamp }]
                };
                notesData.push(newNote);
                const noteElement = createNoteElement(newNote);
                document.getElementById('todo').appendChild(noteElement);
                document.getElementById('newNote').value = ''; // Clear input
                saveNotesToLocalStorage();  // Save after adding a note
            }
        }

function deleteNote(id) {
            const noteIndex = notesData.findIndex(n => n.id === id);
            if (noteIndex !== -1) {
                notesData[noteIndex].deleted = true;
                const timestamp = new Date().toLocaleString();
                notesData[noteIndex].actions.push({ action: 'Deleted', timestamp });
                saveNotesToLocalStorage();  // Save after deletion
            }
        }

function updateNoteColumn(id, oldColumn, newColumn) {
            const note = notesData.find(n => n.id === id);
            if (note) {
                note.column = newColumn;
                const timestamp = new Date().toLocaleString();
                note.actions.push({ action: `Moved from ${getColumnName(oldColumn)} to ${getColumnName(newColumn)}`, timestamp });
                saveNotesToLocalStorage();  // Save after moving
            }
        }

function updateNoteContent(id, newNotes) {
            const note = notesData.find(n => n.id === id);
            if (note) {
                note.notes = newNotes;
                const timestamp = new Date().toLocaleString();
                note.actions.push({ action: `Edited Notes: "${newNotes}"`, timestamp });
                saveNotesToLocalStorage();  // Save after editing
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

function exportNotes() {
            let fileContent = `Kanban Board Export - ${getCurrentDate()}\n\n`;

            ['todo', 'inProgress', 'onHold'].forEach(columnId => {
                const notes = Array.from(document.getElementById(columnId).querySelectorAll('.note'));
                notes.forEach(noteElement => {
                    const noteId = parseInt(noteElement.dataset.id);
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
		window.addEventListener('beforeunload', function (e) {
            e.preventDefault();
            e.returnValue = '';
            const confirmation = confirm('Do you want to export the data to a file before leaving?');
            if (confirmation) {
                exportNotes();
            }
        });
		function updateClocks() {
            const now = new Date();

            // Current Time
            const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const currentDate = now.toLocaleDateString([], { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            document.getElementById('clockCurrent').textContent = currentTime;
            document.getElementById('currentDate').textContent = currentDate;

            // Timezone Offsets
            const timezones = {
                Europe: { offset: 0, name: 'Europe' },
                China: { offset: 7, name: 'China' },
                Americas: { offset: -6, name: 'Americas' },
                Africa: { offset: 1, name: 'Africa' }
            };

            // Helper function to get time with offset
            function getTimeWithOffset(offset) {
                const localOffset = now.getTimezoneOffset() / 60;
                const timeOffset = offset - localOffset;
                const offsetTime = new Date(now.getTime() + timeOffset * 3600 * 1000);
                return offsetTime;
            }

            // Update Clocks
            const optionsTime = { hour: '2-digit', minute: '2-digit' };
            const optionsDate = { weekday: 'long', day: '2-digit' };

            const europeTime = getTimeWithOffset(timezones.Europe.offset);
            document.getElementById('clockEurope').textContent = europeTime.toLocaleTimeString([], optionsTime);
            document.getElementById('europeDate').textContent = europeTime.toLocaleDateString([], optionsDate);

            const chinaTime = getTimeWithOffset(timezones.China.offset);
            document.getElementById('clockChina').textContent = chinaTime.toLocaleTimeString([], optionsTime);
            document.getElementById('chinaDate').textContent = chinaTime.toLocaleDateString([], optionsDate);

            const americasTime = getTimeWithOffset(timezones.Americas.offset);
            document.getElementById('clockAmericas').textContent = americasTime.toLocaleTimeString([], optionsTime);
            document.getElementById('americasDate').textContent = americasTime.toLocaleDateString([], optionsDate);

            const africaTime = getTimeWithOffset(timezones.Africa.offset);
            document.getElementById('clockAfrica').textContent = africaTime.toLocaleTimeString([], optionsTime);
            document.getElementById('africaDate').textContent = africaTime.toLocaleDateString([], optionsDate);
        }

        // Update clocks every minute
        setInterval(updateClocks, 1000);
        document.addEventListener('DOMContentLoaded', () => {
            updateClocks();
            loadNotesFromLocalStorage();
        });