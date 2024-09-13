// Event data
let eventsData = [];

// Load events from localStorage
function loadEventsFromLocalStorage() {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
        eventsData = JSON.parse(savedEvents);
        eventsData.forEach(event => {
            createEventElement(event);
        });
    }
}

// Save events to localStorage
function saveEventsToLocalStorage() {
    localStorage.setItem('calendarEvents', JSON.stringify(eventsData));
}

// Create an event element
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.classList.add('event');
    eventElement.dataset.id = event.id;
    eventElement.textContent = event.title;
    eventElement.style.gridColumn = `${event.day + 1}`;
    eventElement.style.gridRow = `${event.hour + 1}`;
    eventElement.draggable = true;

    eventElement.addEventListener('dragstart', () => {
        eventElement.classList.add('dragging');
    });

    eventElement.addEventListener('dragend', () => {
        eventElement.classList.remove('dragging');
    });

    document.querySelector(`.calendar`).appendChild(eventElement);

    // Handle drag and drop events
    document.querySelectorAll('.hour-slot').forEach(slot => {
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', function () {
            const draggedEvent = document.querySelector('.event.dragging');
            if (draggedEvent) {
                const eventId = parseInt(draggedEvent.dataset.id);
                const newDay = parseInt(this.dataset.day);
                const newHour = parseInt(this.dataset.hour);

                updateEventPosition(eventId, newDay, newHour);
                saveEventsToLocalStorage();
            }
        });
    });
}

// Add a new event
function addEvent() {
    const title = prompt("Enter event title:");
    if (title) {
        const id = Date.now();
        const day = 0; // Default day (Monday)
        const hour = 0; // Default hour (00:00)

        const newEvent = {
            id,
            title,
            day,
            hour
        };
        eventsData.push(newEvent);
        createEventElement(newEvent);
        saveEventsToLocalStorage();
    }
}

// Update event position
function updateEventPosition(id, newDay, newHour) {
    const event = eventsData.find(e => e.id === id);
    if (event) {
        event.day = newDay;
        event.hour = newHour;
        saveEventsToLocalStorage();
    }
}

// Initialize calendar
function initializeCalendar() {
    const calendar = document.getElementById('calendar');
    
    // Add day headers
    for (let i = 0; i < 5; i++) {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('hour-label');
        dayHeader.textContent = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i];
        calendar.appendChild(dayHeader);
    }

    // Add hour labels
    for (let i = 0; i < 24; i++) {
        const hourLabel = document.createElement('div');
        hourLabel.classList.add('hour-label');
        hourLabel.textContent = `${i}:00`;
        calendar.appendChild(hourLabel);
    }

    // Add hour slots
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 5; j++) {
            const hourSlot = document.createElement('div');
            hourSlot.classList.add('hour-slot');
            hourSlot.dataset.day = j;
            hourSlot.dataset.hour = i;
            calendar.appendChild(hourSlot);
        }
    }

    loadEventsFromLocalStorage();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeCalendar);
