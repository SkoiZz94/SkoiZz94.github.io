/***********************
 * Enhanced Kanban Board JS
 * Features: Modal editing, Timer, Images (clipboard), PDF/HTML Export, IndexedDB
 ***********************/

let notesData = [];
let currentTaskId = null; // For modal operations
let imageZoomLevel = 1; // For image viewer
let db = null; // IndexedDB instance
let modalPendingActions = []; // Store actions until modal is saved
let modalHasChanges = false; // Track if modal has unsaved changes
let originalTimerValue = 0; // Store original timer value to revert if needed
let originalPriorityValue = null; // Store original priority value to revert if needed
let currentModalPriority = null; // Track current modal priority

/***********************
 * INDEXEDDB SETUP
 ***********************/
function initIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('KanbanDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('images')) {
        database.createObjectStore('images', { keyPath: 'id' });
      }
    };
  });
}

// Store image in IndexedDB
async function storeImage(taskId, imageId, dataUrl) {
  if (!db) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    const request = store.put({ id: `${taskId}_${imageId}`, dataUrl });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get image from IndexedDB
async function getImage(taskId, imageId) {
  if (!db) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.get(`${taskId}_${imageId}`);
    request.onsuccess = () => resolve(request.result?.dataUrl || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete all images for a task
async function deleteTaskImages(taskId) {
  if (!db) await initIndexedDB();
  const task = notesData.find(t => t.id === taskId);
  if (!task || !task.noteEntries) return;

  const transaction = db.transaction(['images'], 'readwrite');
  const store = transaction.objectStore('images');

  // Delete images from all note entries
  task.noteEntries.forEach(entry => {
    if (entry.images) {
      entry.images.forEach(imageId => {
        store.delete(`${taskId}_${imageId}`);
      });
    }
  });
}

/***********************
 * CLOCKS SYSTEM
 ***********************/
let clocksData = [];
let draggedClock = null;
let chronometerIntervals = {};

// Comprehensive list of timezones
const timezones = [
  "Africa/Abidjan", "Africa/Accra", "Africa/Addis_Ababa", "Africa/Algiers", "Africa/Asmara",
  "Africa/Bamako", "Africa/Bangui", "Africa/Banjul", "Africa/Bissau", "Africa/Blantyre",
  "Africa/Cairo", "Africa/Casablanca", "Africa/Ceuta", "Africa/Conakry", "Africa/Dakar",
  "Africa/Dar_es_Salaam", "Africa/Djibouti", "Africa/Douala", "Africa/El_Aaiun", "Africa/Freetown",
  "Africa/Gaborone", "Africa/Harare", "Africa/Johannesburg", "Africa/Juba", "Africa/Kampala",
  "Africa/Khartoum", "Africa/Kigali", "Africa/Kinshasa", "Africa/Lagos", "Africa/Libreville",
  "Africa/Lome", "Africa/Luanda", "Africa/Lubumbashi", "Africa/Lusaka", "Africa/Malabo",
  "Africa/Maputo", "Africa/Maseru", "Africa/Mbabane", "Africa/Mogadishu", "Africa/Monrovia",
  "Africa/Nairobi", "Africa/Ndjamena", "Africa/Niamey", "Africa/Nouakchott", "Africa/Ouagadougou",
  "Africa/Porto-Novo", "Africa/Sao_Tome", "Africa/Tripoli", "Africa/Tunis", "Africa/Windhoek",
  "America/Adak", "America/Anchorage", "America/Anguilla", "America/Antigua", "America/Araguaina",
  "America/Argentina/Buenos_Aires", "America/Argentina/Catamarca", "America/Argentina/Cordoba",
  "America/Argentina/Jujuy", "America/Argentina/La_Rioja", "America/Argentina/Mendoza",
  "America/Argentina/Rio_Gallegos", "America/Argentina/Salta", "America/Argentina/San_Juan",
  "America/Argentina/San_Luis", "America/Argentina/Tucuman", "America/Argentina/Ushuaia",
  "America/Aruba", "America/Asuncion", "America/Atikokan", "America/Bahia", "America/Bahia_Banderas",
  "America/Barbados", "America/Belem", "America/Belize", "America/Blanc-Sablon", "America/Boa_Vista",
  "America/Bogota", "America/Boise", "America/Cambridge_Bay", "America/Campo_Grande", "America/Cancun",
  "America/Caracas", "America/Cayenne", "America/Cayman", "America/Chicago", "America/Chihuahua",
  "America/Costa_Rica", "America/Creston", "America/Cuiaba", "America/Curacao", "America/Danmarkshavn",
  "America/Dawson", "America/Dawson_Creek", "America/Denver", "America/Detroit", "America/Dominica",
  "America/Edmonton", "America/Eirunepe", "America/El_Salvador", "America/Fort_Nelson", "America/Fortaleza",
  "America/Glace_Bay", "America/Goose_Bay", "America/Grand_Turk", "America/Grenada", "America/Guadeloupe",
  "America/Guatemala", "America/Guayaquil", "America/Guyana", "America/Halifax", "America/Havana",
  "America/Hermosillo", "America/Indiana/Indianapolis", "America/Indiana/Knox", "America/Indiana/Marengo",
  "America/Indiana/Petersburg", "America/Indiana/Tell_City", "America/Indiana/Vevay", "America/Indiana/Vincennes",
  "America/Indiana/Winamac", "America/Inuvik", "America/Iqaluit", "America/Jamaica", "America/Juneau",
  "America/Kentucky/Louisville", "America/Kentucky/Monticello", "America/Kralendijk", "America/La_Paz",
  "America/Lima", "America/Los_Angeles", "America/Lower_Princes", "America/Maceio", "America/Managua",
  "America/Manaus", "America/Marigot", "America/Martinique", "America/Matamoros", "America/Mazatlan",
  "America/Menominee", "America/Merida", "America/Metlakatla", "America/Mexico_City", "America/Miquelon",
  "America/Moncton", "America/Monterrey", "America/Montevideo", "America/Montserrat", "America/Nassau",
  "America/New_York", "America/Nipigon", "America/Nome", "America/Noronha", "America/North_Dakota/Beulah",
  "America/North_Dakota/Center", "America/North_Dakota/New_Salem", "America/Nuuk", "America/Ojinaga",
  "America/Panama", "America/Pangnirtung", "America/Paramaribo", "America/Phoenix", "America/Port-au-Prince",
  "America/Port_of_Spain", "America/Porto_Velho", "America/Puerto_Rico", "America/Punta_Arenas",
  "America/Rainy_River", "America/Rankin_Inlet", "America/Recife", "America/Regina", "America/Resolute",
  "America/Rio_Branco", "America/Santarem", "America/Santiago", "America/Santo_Domingo", "America/Sao_Paulo",
  "America/Scoresbysund", "America/Sitka", "America/St_Barthelemy", "America/St_Johns", "America/St_Kitts",
  "America/St_Lucia", "America/St_Thomas", "America/St_Vincent", "America/Swift_Current", "America/Tegucigalpa",
  "America/Thule", "America/Thunder_Bay", "America/Tijuana", "America/Toronto", "America/Tortola",
  "America/Vancouver", "America/Whitehorse", "America/Winnipeg", "America/Yakutat", "America/Yellowknife",
  "Antarctica/Casey", "Antarctica/Davis", "Antarctica/DumontDUrville", "Antarctica/Macquarie",
  "Antarctica/Mawson", "Antarctica/McMurdo", "Antarctica/Palmer", "Antarctica/Rothera", "Antarctica/Syowa",
  "Antarctica/Troll", "Antarctica/Vostok", "Arctic/Longyearbyen",
  "Asia/Aden", "Asia/Almaty", "Asia/Amman", "Asia/Anadyr", "Asia/Aqtau", "Asia/Aqtobe", "Asia/Ashgabat",
  "Asia/Atyrau", "Asia/Baghdad", "Asia/Bahrain", "Asia/Baku", "Asia/Bangkok", "Asia/Barnaul", "Asia/Beirut",
  "Asia/Bishkek", "Asia/Brunei", "Asia/Chita", "Asia/Choibalsan", "Asia/Colombo", "Asia/Damascus",
  "Asia/Dhaka", "Asia/Dili", "Asia/Dubai", "Asia/Dushanbe", "Asia/Famagusta", "Asia/Gaza", "Asia/Hebron",
  "Asia/Ho_Chi_Minh", "Asia/Hong_Kong", "Asia/Hovd", "Asia/Irkutsk", "Asia/Jakarta", "Asia/Jayapura",
  "Asia/Jerusalem", "Asia/Kabul", "Asia/Kamchatka", "Asia/Karachi", "Asia/Kathmandu", "Asia/Khandyga",
  "Asia/Kolkata", "Asia/Krasnoyarsk", "Asia/Kuala_Lumpur", "Asia/Kuching", "Asia/Kuwait", "Asia/Macau",
  "Asia/Magadan", "Asia/Makassar", "Asia/Manila", "Asia/Muscat", "Asia/Nicosia", "Asia/Novokuznetsk",
  "Asia/Novosibirsk", "Asia/Omsk", "Asia/Oral", "Asia/Phnom_Penh", "Asia/Pontianak", "Asia/Pyongyang",
  "Asia/Qatar", "Asia/Qostanay", "Asia/Qyzylorda", "Asia/Riyadh", "Asia/Sakhalin", "Asia/Samarkand",
  "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Srednekolymsk", "Asia/Taipei", "Asia/Tashkent",
  "Asia/Tbilisi", "Asia/Tehran", "Asia/Thimphu", "Asia/Tokyo", "Asia/Tomsk", "Asia/Ulaanbaatar",
  "Asia/Urumqi", "Asia/Ust-Nera", "Asia/Vientiane", "Asia/Vladivostok", "Asia/Yakutsk", "Asia/Yangon",
  "Asia/Yekaterinburg", "Asia/Yerevan",
  "Atlantic/Azores", "Atlantic/Bermuda", "Atlantic/Canary", "Atlantic/Cape_Verde", "Atlantic/Faroe",
  "Atlantic/Madeira", "Atlantic/Reykjavik", "Atlantic/South_Georgia", "Atlantic/St_Helena", "Atlantic/Stanley",
  "Australia/Adelaide", "Australia/Brisbane", "Australia/Broken_Hill", "Australia/Darwin", "Australia/Eucla",
  "Australia/Hobart", "Australia/Lindeman", "Australia/Lord_Howe", "Australia/Melbourne", "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam", "Europe/Andorra", "Europe/Astrakhan", "Europe/Athens", "Europe/Belgrade",
  "Europe/Berlin", "Europe/Bratislava", "Europe/Brussels", "Europe/Bucharest", "Europe/Budapest",
  "Europe/Busingen", "Europe/Chisinau", "Europe/Copenhagen", "Europe/Dublin", "Europe/Gibraltar",
  "Europe/Guernsey", "Europe/Helsinki", "Europe/Isle_of_Man", "Europe/Istanbul", "Europe/Jersey",
  "Europe/Kaliningrad", "Europe/Kiev", "Europe/Kirov", "Europe/Lisbon", "Europe/Ljubljana",
  "Europe/London", "Europe/Luxembourg", "Europe/Madrid", "Europe/Malta", "Europe/Mariehamn",
  "Europe/Minsk", "Europe/Monaco", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Podgorica",
  "Europe/Prague", "Europe/Riga", "Europe/Rome", "Europe/Samara", "Europe/San_Marino", "Europe/Sarajevo",
  "Europe/Saratov", "Europe/Simferopol", "Europe/Skopje", "Europe/Sofia", "Europe/Stockholm",
  "Europe/Tallinn", "Europe/Tirane", "Europe/Ulyanovsk", "Europe/Uzhgorod", "Europe/Vaduz",
  "Europe/Vatican", "Europe/Vienna", "Europe/Vilnius", "Europe/Volgograd", "Europe/Warsaw",
  "Europe/Zagreb", "Europe/Zaporozhye", "Europe/Zurich",
  "Indian/Antananarivo", "Indian/Chagos", "Indian/Christmas", "Indian/Cocos", "Indian/Comoro",
  "Indian/Kerguelen", "Indian/Mahe", "Indian/Maldives", "Indian/Mauritius", "Indian/Mayotte",
  "Indian/Reunion",
  "Pacific/Apia", "Pacific/Auckland", "Pacific/Bougainville", "Pacific/Chatham", "Pacific/Chuuk",
  "Pacific/Easter", "Pacific/Efate", "Pacific/Enderbury", "Pacific/Fakaofo", "Pacific/Fiji",
  "Pacific/Funafuti", "Pacific/Galapagos", "Pacific/Gambier", "Pacific/Guadalcanal", "Pacific/Guam",
  "Pacific/Honolulu", "Pacific/Kiritimati", "Pacific/Kosrae", "Pacific/Kwajalein", "Pacific/Majuro",
  "Pacific/Marquesas", "Pacific/Midway", "Pacific/Nauru", "Pacific/Niue", "Pacific/Norfolk",
  "Pacific/Noumea", "Pacific/Pago_Pago", "Pacific/Palau", "Pacific/Pitcairn", "Pacific/Pohnpei",
  "Pacific/Port_Moresby", "Pacific/Rarotonga", "Pacific/Saipan", "Pacific/Tahiti", "Pacific/Tarawa",
  "Pacific/Tongatapu", "Pacific/Wake", "Pacific/Wallis",
  "UTC"
];

// Initialize default clocks
function initializeDefaultClocks() {
  return [
    { id: Date.now() + 1, type: 'timezone', name: 'Current Time', timezone: null, isCurrent: true },
    { id: Date.now() + 2, type: 'timezone', name: 'Europe', timezone: 'Europe/Paris' },
    { id: Date.now() + 3, type: 'timezone', name: 'China', timezone: 'Asia/Shanghai' },
    { id: Date.now() + 4, type: 'timezone', name: 'Americas', timezone: 'America/New_York' },
    { id: Date.now() + 5, type: 'timezone', name: 'Africa', timezone: 'Africa/Cairo' }
  ];
}

// Load clocks from localStorage
function loadClocks() {
  const saved = localStorage.getItem('kanbanClocks');
  if (saved) {
    clocksData = JSON.parse(saved);

    // Stop all chronometers that were running (they'll be paused on reload)
    clocksData.forEach(clock => {
      if (clock.type === 'chronometer' && clock.running) {
        clock.running = false;
      }
    });
  } else {
    clocksData = initializeDefaultClocks();
    saveClocks();
  }
  renderClocks();
}

// Save clocks to localStorage
function saveClocks() {
  localStorage.setItem('kanbanClocks', JSON.stringify(clocksData));
}

// Render all clocks
function renderClocks() {
  const container = document.getElementById('clockContainer');
  if (!container) return;

  container.innerHTML = '';

  clocksData.forEach(clock => {
    const clockEl = createClockElement(clock);
    container.appendChild(clockEl);
  });

  // Show/hide add button based on limit
  const addButton = document.querySelector('.clock-add-button');
  if (addButton) {
    if (clocksData.length >= 14) {
      addButton.style.display = 'none';
    } else {
      addButton.style.display = 'flex';
    }
  }
}

// Create a clock element
function createClockElement(clock) {
  const clockEl = document.createElement('div');
  clockEl.classList.add('clock');
  clockEl.dataset.id = clock.id;
  clockEl.draggable = true;

  if (clock.isCurrent) {
    clockEl.classList.add('clock-current');
  }

  // Delete button (not for current time clock)
  if (!clock.isCurrent) {
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('clock-delete');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteClock(clock.id);
    };
    clockEl.appendChild(deleteBtn);
  }

  // Clock name
  const nameEl = document.createElement('div');
  nameEl.classList.add('clock-name');
  nameEl.textContent = clock.name;
  clockEl.appendChild(nameEl);

  if (clock.type === 'timezone') {
    // Time display
    const timeEl = document.createElement('div');
    timeEl.classList.add('clock-time');
    timeEl.id = `clock-time-${clock.id}`;
    clockEl.appendChild(timeEl);

    // Date display
    const dateEl = document.createElement('div');
    dateEl.classList.add('clock-date');
    dateEl.id = `clock-date-${clock.id}`;
    clockEl.appendChild(dateEl);

  } else if (clock.type === 'chronometer') {
    // Chronometer display
    const timeEl = document.createElement('div');
    timeEl.classList.add('clock-time');
    timeEl.id = `chronometer-display-${clock.id}`;
    timeEl.textContent = formatChronometer(clock.elapsed || 0);
    clockEl.appendChild(timeEl);

    // Chronometer controls
    const controlsEl = document.createElement('div');
    controlsEl.classList.add('chronometer-controls');

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Start';
    startBtn.classList.add('start-btn');
    startBtn.onclick = (e) => { e.stopPropagation(); startChronometer(clock.id); };

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.classList.add('pause-btn');
    pauseBtn.onclick = (e) => { e.stopPropagation(); pauseChronometer(clock.id); };

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.classList.add('reset-btn');
    resetBtn.onclick = (e) => { e.stopPropagation(); resetChronometer(clock.id); };

    controlsEl.appendChild(startBtn);
    controlsEl.appendChild(pauseBtn);
    controlsEl.appendChild(resetBtn);
    clockEl.appendChild(controlsEl);
  }

  // Drag events
  clockEl.addEventListener('dragstart', handleClockDragStart);
  clockEl.addEventListener('dragend', handleClockDragEnd);
  clockEl.addEventListener('dragover', handleClockDragOver);
  clockEl.addEventListener('drop', handleClockDrop);

  return clockEl;
}

// Update all clocks
function updateClocks() {
  clocksData.forEach(clock => {
    if (clock.type === 'timezone') {
      updateTimezoneClock(clock);
    } else if (clock.type === 'chronometer' && clock.running) {
      updateChronometerDisplay(clock);
    }
  });
}

// Update timezone clock
function updateTimezoneClock(clock) {
  const timeEl = document.getElementById(`clock-time-${clock.id}`);
  const dateEl = document.getElementById(`clock-date-${clock.id}`);

  if (!timeEl || !dateEl) return;

  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  const dateOptions = clock.isCurrent
    ? { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
    : { weekday: 'long', day: '2-digit' };

  if (clock.timezone) {
    const time = new Date(new Date().toLocaleString('en-US', { timeZone: clock.timezone }));
    timeEl.textContent = time.toLocaleTimeString([], timeOptions);
    dateEl.textContent = time.toLocaleDateString([], dateOptions);
  } else {
    // Current time (no timezone conversion)
    const currentTime = new Date();
    timeEl.textContent = currentTime.toLocaleTimeString([], timeOptions);
    dateEl.textContent = currentTime.toLocaleDateString([], dateOptions);
  }
}

// Drag and drop handlers
function handleClockDragStart(e) {
  draggedClock = this;

  // Create a clone for the drag image (keeps original visible)
  const clone = this.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.top = '-9999px';
  document.body.appendChild(clone);
  e.dataTransfer.setDragImage(clone, 0, 0);

  // Remove the clone after a brief delay
  setTimeout(() => {
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }, 0);
}

function handleClockDragEnd(e) {
  document.querySelectorAll('.clock').forEach(el => {
    el.classList.remove('drag-over');
  });
  draggedClock = null;
}

function handleClockDragOver(e) {
  e.preventDefault();
  if (!draggedClock) return;

  // Add visual feedback
  document.querySelectorAll('.clock').forEach(el => {
    el.classList.remove('drag-over');
  });
  if (this !== draggedClock) {
    this.classList.add('drag-over');
  }
}

function handleClockDrop(e) {
  e.preventDefault();

  // Remove drag-over class
  this.classList.remove('drag-over');

  if (!draggedClock || draggedClock === this) return;

  const draggedId = parseInt(draggedClock.dataset.id);
  const targetId = parseInt(this.dataset.id);

  const draggedIndex = clocksData.findIndex(c => c.id === draggedId);
  const targetIndex = clocksData.findIndex(c => c.id === targetId);

  // Reorder array
  const [removed] = clocksData.splice(draggedIndex, 1);
  clocksData.splice(targetIndex, 0, removed);

  saveClocks();
  renderClocks();
}

// Delete clock
function deleteClock(id) {
  if (confirm('Are you sure you want to delete this clock?')) {
    // Stop chronometer if running
    if (chronometerIntervals[id]) {
      clearInterval(chronometerIntervals[id]);
      delete chronometerIntervals[id];
    }

    clocksData = clocksData.filter(c => c.id !== id);
    saveClocks();
    renderClocks();
  }
}

// Chronometer functions
function formatChronometer(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startChronometer(id) {
  const clock = clocksData.find(c => c.id === id);
  if (!clock || clock.running) return;

  clock.running = true;
  clock.startTime = Date.now() - (clock.elapsed || 0);

  chronometerIntervals[id] = setInterval(() => {
    clock.elapsed = Date.now() - clock.startTime;
    updateChronometerDisplay(clock);
    saveClocks();
  }, 100);

  saveClocks();
}

function pauseChronometer(id) {
  const clock = clocksData.find(c => c.id === id);
  if (!clock || !clock.running) return;

  clock.running = false;
  clock.elapsed = Date.now() - clock.startTime;

  if (chronometerIntervals[id]) {
    clearInterval(chronometerIntervals[id]);
    delete chronometerIntervals[id];
  }

  saveClocks();
  updateChronometerDisplay(clock);
}

function resetChronometer(id) {
  const clock = clocksData.find(c => c.id === id);
  if (!clock) return;

  clock.running = false;
  clock.elapsed = 0;
  clock.startTime = null;

  if (chronometerIntervals[id]) {
    clearInterval(chronometerIntervals[id]);
    delete chronometerIntervals[id];
  }

  saveClocks();
  updateChronometerDisplay(clock);
}

function updateChronometerDisplay(clock) {
  const displayEl = document.getElementById(`chronometer-display-${clock.id}`);
  if (displayEl) {
    displayEl.textContent = formatChronometer(clock.elapsed || 0);
  }
}

// Modal functions
function openAddClockModal() {
  const modal = document.getElementById('addClockModal');
  if (modal) modal.style.display = 'block';

  // Reset forms
  document.getElementById('timezoneClockForm').style.display = 'none';
  document.getElementById('chronometerForm').style.display = 'none';
}

function closeAddClockModal() {
  const modal = document.getElementById('addClockModal');
  if (modal) modal.style.display = 'none';

  // Reset forms
  document.getElementById('clockName').value = '';
  document.getElementById('chronometerName').value = '';
  document.getElementById('clockTimezoneSearch').value = '';
  document.getElementById('clockTimezoneSelected').value = '';
  document.getElementById('timezoneList').innerHTML = '';
}

function selectClockType(type) {
  if (type === 'timezone') {
    document.getElementById('timezoneClockForm').style.display = 'block';
    document.getElementById('chronometerForm').style.display = 'none';
    // Show initial timezone list
    filterTimezones();
  } else if (type === 'chronometer') {
    document.getElementById('timezoneClockForm').style.display = 'none';
    document.getElementById('chronometerForm').style.display = 'block';
  }
}

function filterTimezones() {
  const searchInput = document.getElementById('clockTimezoneSearch');
  const timezoneList = document.getElementById('timezoneList');
  const searchTerm = searchInput.value.toLowerCase();

  // Filter timezones based on search term - show ALL matching results
  const filtered = timezones.filter(tz =>
    tz.toLowerCase().includes(searchTerm)
  );

  // Render filtered list
  timezoneList.innerHTML = '';
  filtered.forEach(tz => {
    const item = document.createElement('div');
    item.classList.add('timezone-item');
    item.textContent = tz.replace(/_/g, ' ');
    item.dataset.timezone = tz;
    item.onclick = () => selectTimezone(tz, item);
    timezoneList.appendChild(item);
  });
}

function selectTimezone(timezone, element) {
  // Update hidden input
  document.getElementById('clockTimezoneSelected').value = timezone;

  // Update visual selection
  document.querySelectorAll('.timezone-item').forEach(item => {
    item.classList.remove('selected');
  });
  element.classList.add('selected');

  // Update search input to show selected
  document.getElementById('clockTimezoneSearch').value = timezone.replace(/_/g, ' ');
}

function addTimezoneClock() {
  const name = document.getElementById('clockName').value.trim();
  const timezone = document.getElementById('clockTimezoneSelected').value;

  if (!name) {
    alert('Please enter a clock name');
    return;
  }

  if (!timezone) {
    alert('Please select a timezone');
    return;
  }

  // Check for duplicate timezone
  const duplicate = clocksData.find(c => c.type === 'timezone' && c.timezone === timezone);
  if (duplicate) {
    alert('A clock with this timezone already exists');
    return;
  }

  const newClock = {
    id: Date.now(),
    type: 'timezone',
    name: name,
    timezone: timezone
  };

  clocksData.push(newClock);
  saveClocks();
  renderClocks();
  closeAddClockModal();
}

function addChronometer() {
  const name = document.getElementById('chronometerName').value.trim();

  if (!name) {
    alert('Please enter a chronometer name');
    return;
  }

  const newChronometer = {
    id: Date.now(),
    type: 'chronometer',
    name: name,
    elapsed: 0,
    running: false
  };

  clocksData.push(newChronometer);
  saveClocks();
  renderClocks();
  closeAddClockModal();
}

// Start clock updates
setInterval(updateClocks, 1000);

/***********************
 * STORAGE
 ***********************/
function loadNotesFromLocalStorage() {
  const savedNotes = localStorage.getItem('kanbanNotes');
  if (savedNotes) {
    notesData = JSON.parse(savedNotes);
    document.querySelectorAll('.note').forEach(note => note.remove());

    // Migrate old format to new format
    notesData = notesData.map(note => {
      if (!note.noteEntries) {
        note.noteEntries = [];
        // Migrate old notesHTML if it exists
        if (note.notesHTML) {
          note.noteEntries.push({
            timestamp: note.actions?.[0]?.timestamp || new Date().toLocaleString(),
            notesHTML: note.notesHTML,
            images: note.images || []
          });
          delete note.notesHTML;
          delete note.images;
        }
      }
      return note;
    });

    // Remove deleted items AND items in done column
    notesData = notesData.filter(note => !note.deleted && note.column !== 'done');

    notesData.forEach(note => {
      const noteElement = createNoteElement(note);
      const col = document.getElementById(note.column);
      if (col) col.appendChild(noteElement);
    });

    saveNotesToLocalStorage();
  }
}

function saveNotesToLocalStorage() {
  localStorage.setItem('kanbanNotes', JSON.stringify(notesData));
}

/***********************
 * MODAL FUNCTIONS
 ***********************/
async function openTaskModal(taskId) {
  currentTaskId = taskId;
  const task = notesData.find(t => t.id === taskId);
  if (!task) return;

  // Reset modal state
  modalPendingActions = [];
  modalHasChanges = false;
  originalTimerValue = task.timer || 0; // Store original timer value
  originalPriorityValue = task.priority || null; // Store original priority value
  currentModalPriority = task.priority || null; // Set current modal priority

  const modal = document.getElementById('taskModal');
  const title = document.getElementById('modalTitle');
  const notesEditor = document.getElementById('modalNotesEditor');
  const timerTotal = document.getElementById('modalTimerTotal');
  const historyList = document.getElementById('modalHistory');
  const clearNotesBtn = document.getElementById('clearNotesBtn');
  const priorityLabel = document.getElementById('modalPriorityLabel');

  title.textContent = task.title;

  // Clear notes editor and set placeholder
  notesEditor.innerHTML = '';
  clearNotesBtn.style.display = 'none'; // Hide clear button initially

  if (task.noteEntries && task.noteEntries.length > 0) {
    const lastEntry = task.noteEntries[task.noteEntries.length - 1];
    notesEditor.setAttribute('data-placeholder', getTextPreview(lastEntry.notesHTML));
  } else {
    notesEditor.setAttribute('data-placeholder', 'Write your notes here...');
  }

  // Display timer total
  const totalMinutes = task.timer || 0;
  timerTotal.textContent = formatTime(totalMinutes);

  // Display priority
  if (priorityLabel) {
    priorityLabel.textContent = getPriorityLabel(task.priority);
  }
  updateModalPriorityButtons(task.priority);

  // Always collapse history when opening modal
  historyList.style.display = 'none';
  const toggle = document.getElementById('historyToggle');
  if (toggle) toggle.textContent = '▼';

  // Display history with expandable notes
  await renderHistory(task);

  modal.style.display = 'block';
}

async function renderHistory(task) {
  const historyList = document.getElementById('modalHistory');
  historyList.innerHTML = '';

  if (!task.actions || task.actions.length === 0) {
    historyList.innerHTML = '<div class="history-item">No history yet</div>';
    return;
  }

  for (const action of task.actions) {
    const historyItem = document.createElement('div');
    historyItem.classList.add('history-item');

    if (action.type === 'note') {
      // This is a note entry - make it expandable
      const header = document.createElement('div');
      header.classList.add('history-note-header');
      header.innerHTML = `
        <span class="history-action type-note">Note added</span>
        <span class="history-timestamp">${escapeHtml(action.timestamp)}</span>
        <span class="history-expand">▼</span>
      `;

      const content = document.createElement('div');
      content.classList.add('history-note-content');
      content.style.display = 'none';
      content.innerHTML = action.notesHTML || 'Empty note';

      // Restore images from IndexedDB
      if (action.images && action.images.length > 0) {
        for (const imageId of action.images) {
          const dataUrl = await getImage(task.id, imageId);
          if (dataUrl) {
            const existingImg = content.querySelector(`img[data-image-id="${imageId}"]`);
            if (existingImg) {
              existingImg.src = dataUrl;
              existingImg.onclick = () => openImageViewer(dataUrl);
            }
          }
        }
      }

      header.onclick = () => {
        const isExpanded = content.style.display === 'block';
        content.style.display = isExpanded ? 'none' : 'block';
        header.querySelector('.history-expand').textContent = isExpanded ? '▼' : '▲';
      };

      historyItem.appendChild(header);
      historyItem.appendChild(content);
    } else {
      // Regular action with color coding
      const typeClass = action.type ? `type-${action.type}` : '';
      historyItem.innerHTML = `
        <span class="history-action ${typeClass}">${escapeHtml(action.action)}</span><br>
        <span class="history-timestamp">${escapeHtml(action.timestamp)}</span>
      `;
    }

    historyList.appendChild(historyItem);
  }
}

function closeTaskModal() {
  // Check if there are actual changes
  const task = notesData.find(t => t.id === currentTaskId);
  const notesEditor = document.getElementById('modalNotesEditor');

  const hasTextContent = notesEditor && notesEditor.textContent.trim().length > 0;
  const hasImages = notesEditor && notesEditor.querySelectorAll('img').length > 0;
  const hasNoteChanges = notesEditor && notesEditor.innerHTML.trim() && (hasTextContent || hasImages);
  const hasTimerChanges = task && (task.timer || 0) !== originalTimerValue;
  const hasPriorityChanges = currentModalPriority !== originalPriorityValue;
  const hasRealChanges = hasNoteChanges || hasTimerChanges || hasPriorityChanges;

  if (modalHasChanges && hasRealChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
      return;
    }

    // Revert timer changes if closing without saving
    if (task && hasTimerChanges) {
      task.timer = originalTimerValue;
      updateNoteCardDisplay(currentTaskId);
      saveNotesToLocalStorage();
    }
  }

  const modal = document.getElementById('taskModal');
  modal.style.display = 'none';
  currentTaskId = null;
  modalPendingActions = [];
  modalHasChanges = false;
  originalTimerValue = 0;
  originalPriorityValue = null;
  currentModalPriority = null;
}

function clearNotes() {
  const notesEditor = document.getElementById('modalNotesEditor');
  notesEditor.innerHTML = '';
  modalHasChanges = true;
}

function toggleHistory() {
  const historyList = document.getElementById('modalHistory');
  const toggle = document.getElementById('historyToggle');

  if (historyList.style.display === 'none') {
    historyList.style.display = 'block';
    toggle.textContent = '▲';
  } else {
    historyList.style.display = 'none';
    toggle.textContent = '▼';
  }
}

async function saveAndCloseModal() {
  if (!currentTaskId) return;

  const task = notesData.find(t => t.id === currentTaskId);
  if (!task) return;

  const notesEditor = document.getElementById('modalNotesEditor');

  // Save priority change if different
  if (currentModalPriority !== originalPriorityValue) {
    const timestamp = new Date().toLocaleString();
    task.priority = currentModalPriority;
    task.actions.push({
      action: `Priority changed from ${getPriorityLabel(originalPriorityValue)} to ${getPriorityLabel(currentModalPriority)}`,
      timestamp,
      type: 'priority'
    });
    updateNoteCardPriority(currentTaskId);
  }

  // Save all pending timer actions in a single summary entry
  if (modalPendingActions.length > 0) {
    // Calculate total time change
    let totalChange = 0;
    modalPendingActions.forEach(action => {
      const match = action.action.match(/(\d+) minute/);
      if (match) {
        const minutes = parseInt(match[1]);
        if (action.action.includes('Removed')) {
          totalChange -= minutes;
        } else {
          totalChange += minutes;
        }
      }
    });

    if (totalChange !== 0) {
      const timestamp = new Date().toLocaleString();
      const summaryAction = totalChange > 0
        ? `Added ${totalChange} minute(s) to timer`
        : `Removed ${Math.abs(totalChange)} minute(s) from timer`;
      task.actions.push({ action: summaryAction, timestamp, type: 'timer' });
    }
  }

  // Check if there's any content (text or images)
  const hasTextContent = notesEditor.textContent.trim().length > 0;
  const hasImages = notesEditor.querySelectorAll('img').length > 0;
  const hasContent = notesEditor.innerHTML.trim() && (hasTextContent || hasImages);

  // Only save notes if there's content
  if (hasContent) {
    const timestamp = new Date().toLocaleString();

    // Initialize noteEntries if it doesn't exist
    if (!task.noteEntries) {
      task.noteEntries = [];
    }

    // Extract and save images to IndexedDB
    const images = notesEditor.querySelectorAll('img');
    const imageIds = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imageId = img.dataset.imageId || `img_${Date.now()}_${i}`;
      img.dataset.imageId = imageId;
      imageIds.push(imageId);

      if (img.src.startsWith('data:')) {
        await storeImage(currentTaskId, imageId, img.src);
        // Keep original src in data-src for PDF export
        img.setAttribute('data-src', img.src);
        // Replace with placeholder to reduce localStorage size
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
    }

    // Save note entry
    const noteEntry = {
      timestamp,
      notesHTML: notesEditor.innerHTML,
      images: imageIds
    };

    task.noteEntries.push(noteEntry);

    // Add to actions history
    task.actions.push({
      type: 'note',
      timestamp,
      notesHTML: notesEditor.innerHTML,
      images: imageIds
    });
  }

  saveNotesToLocalStorage();

  // Update the card display
  updateNoteCardDisplay(currentTaskId);

  // Reset modal state
  modalHasChanges = false;
  modalPendingActions = [];

  closeTaskModal();
}

function updateNoteCardDisplay(taskId) {
  const task = notesData.find(t => t.id === taskId);
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
}

function getFirstLine(html) {
  if (!html) return 'No additional notes';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || '';
  const textTrimmed = text.trim();

  // If there's text, return it
  if (textTrimmed) {
    return textTrimmed;
  }

  // If no text but there are images, return "Image attached"
  const hasImages = tempDiv.querySelectorAll('img').length > 0;
  if (hasImages) {
    return 'Image attached';
  }

  return 'No additional notes';
}

function getTextPreview(html) {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || '';
}

/***********************
 * TIMER FUNCTIONS
 ***********************/
function addTime(minutes) {
  if (!currentTaskId) return;

  const task = notesData.find(t => t.id === currentTaskId);
  if (!task) return;

  task.timer = Math.max(0, (task.timer || 0) + minutes);

  // Mark modal as having changes
  modalHasChanges = true;

  // Store action for later
  const timestamp = new Date().toLocaleString();
  const action = minutes > 0 ? `Added ${minutes} minute(s) to timer` : `Removed ${Math.abs(minutes)} minute(s) from timer`;
  modalPendingActions.push({ action, timestamp });

  const timerTotal = document.getElementById('modalTimerTotal');
  if (timerTotal) {
    timerTotal.textContent = formatTime(task.timer);
  }

  // Don't save immediately - wait for Save & Close
  updateNoteCardDisplay(currentTaskId);
}

function showQuickTimeMenu(taskId, buttonElement, isSubtract = false) {
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

function quickAddTime(taskId, minutes) {
  const task = notesData.find(t => t.id === taskId);
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

function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

/***********************
 * PRIORITY FUNCTIONS
 ***********************/
function getPriorityLabel(priority) {
  switch (priority) {
    case 'low': return 'Low';
    case 'medium': return 'Medium';
    case 'high': return 'High';
    default: return 'None';
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'low': return '#4caf50'; // Green
    case 'medium': return '#ff9800'; // Orange
    case 'high': return '#f44336'; // Red
    default: return 'rgba(255, 255, 255, 0.5)'; // Neutral gray for none
  }
}

function showQuickPriorityMenu(taskId, buttonElement) {
  // Remove any existing menu
  const existingMenu = document.querySelector('.quick-priority-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const task = notesData.find(t => t.id === taskId);
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

function quickSetPriority(taskId, priority) {
  const task = notesData.find(t => t.id === taskId);
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

function updateNoteCardPriority(taskId) {
  const task = notesData.find(t => t.id === taskId);
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

function setModalPriority(priority) {
  if (!currentTaskId) return;

  currentModalPriority = priority;
  modalHasChanges = true;

  // Update the label
  const priorityLabel = document.getElementById('modalPriorityLabel');
  if (priorityLabel) {
    priorityLabel.textContent = getPriorityLabel(priority);
  }

  // Update button states
  updateModalPriorityButtons(priority);
}

function updateModalPriorityButtons(priority) {
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

/***********************
 * IMAGE FUNCTIONS
 ***********************/
function setupClipboardPaste() {
  const notesEditor = document.getElementById('modalNotesEditor');
  if (!notesEditor) return;

  // Mark changes when notes are edited and show/hide Clear All button
  notesEditor.addEventListener('input', () => {
    modalHasChanges = true;
    updateClearNotesButton();
  });

  // Prevent any formatting keyboard shortcuts
  notesEditor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      // Allow only basic shortcuts: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+Z, Ctrl+Y
      const allowedKeys = ['c', 'v', 'x', 'a', 'z', 'y'];
      if (!allowedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }
  });

  notesEditor.addEventListener('paste', async (e) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    // Check for images first
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        e.preventDefault();
        modalHasChanges = true;

        const blob = items[i].getAsFile();
        const reader = new FileReader();

        reader.onload = async (event) => {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.cursor = 'pointer';
          img.dataset.imageId = `img_${Date.now()}_${i}`;

          img.onclick = () => openImageViewer(img.src);

          // Insert at cursor position
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.collapse(false);
          } else {
            notesEditor.appendChild(img);
          }

          updateClearNotesButton();
        };

        reader.readAsDataURL(blob);
      }
    }

    // If no image, paste as plain text only
    if (!hasImage) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

      // Insert plain text at cursor position
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      modalHasChanges = true;
      updateClearNotesButton();
    }
  });
}

function updateClearNotesButton() {
  const notesEditor = document.getElementById('modalNotesEditor');
  const clearNotesBtn = document.getElementById('clearNotesBtn');

  if (notesEditor && clearNotesBtn) {
    const hasTextContent = notesEditor.textContent.trim().length > 0;
    const hasImages = notesEditor.querySelectorAll('img').length > 0;
    const hasContent = notesEditor.innerHTML.trim() && (hasTextContent || hasImages);
    clearNotesBtn.style.display = hasContent ? 'inline-block' : 'none';
  }
}

function getImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 150, height: 100 }); // Fallback dimensions
    };
    img.src = src;
  });
}

let imagePanOffset = { x: 0, y: 0 };
let isDraggingImage = false;
let dragStart = { x: 0, y: 0 };

function openImageViewer(imageSrc) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('modalImage');
  const imageContainer = modal.querySelector('.image-container');
  const backButton = document.querySelector('.back-to-index');

  img.src = imageSrc;
  imageZoomLevel = 1;
  imagePanOffset = { x: 0, y: 0 };
  updateImageTransform(img);
  modal.style.display = 'block';
  if (backButton) backButton.style.display = 'none';

  // Add scroll wheel zoom
  imageContainer.onwheel = function(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomImage(delta);
  };

  // Click outside image to close
  imageContainer.onclick = function(e) {
    if (e.target === imageContainer) {
      closeImageModal();
    }
  };

  // Drag to pan when zoomed
  img.onmousedown = function(e) {
    if (imageZoomLevel > 1) {
      isDraggingImage = true;
      dragStart = { x: e.clientX - imagePanOffset.x, y: e.clientY - imagePanOffset.y };
      img.style.cursor = 'grabbing';
      e.preventDefault();
    }
  };

  document.onmousemove = function(e) {
    if (isDraggingImage) {
      imagePanOffset.x = e.clientX - dragStart.x;
      imagePanOffset.y = e.clientY - dragStart.y;
      updateImageTransform(img);
    }
  };

  document.onmouseup = function() {
    if (isDraggingImage) {
      isDraggingImage = false;
      img.style.cursor = imageZoomLevel > 1 ? 'grab' : 'default';
    }
  };
}

function updateImageTransform(img) {
  img.style.transform = `scale(${imageZoomLevel}) translate(${imagePanOffset.x / imageZoomLevel}px, ${imagePanOffset.y / imageZoomLevel}px)`;
  img.style.cursor = imageZoomLevel > 1 ? 'grab' : 'default';
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  const backButton = document.querySelector('.back-to-index');
  modal.style.display = 'none';
  if (backButton) backButton.style.display = 'block';
  isDraggingImage = false;
  imagePanOffset = { x: 0, y: 0 };
  imageZoomLevel = 1;
}

function zoomImage(delta) {
  imageZoomLevel += delta;
  imageZoomLevel = Math.max(0.5, Math.min(5, imageZoomLevel));

  const img = document.getElementById('modalImage');

  // Reset pan if zooming back to 1 or less
  if (imageZoomLevel <= 1) {
    imagePanOffset = { x: 0, y: 0 };
  }

  updateImageTransform(img);
}

function resetZoom() {
  imageZoomLevel = 1;
  imagePanOffset = { x: 0, y: 0 };
  const img = document.getElementById('modalImage');
  updateImageTransform(img);
}

/***********************
 * TASK CRUD OPERATIONS
 ***********************/
function addNote() {
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

    notesData.push(newNote);
    saveNotesToLocalStorage();

    const noteElement = createNoteElement(newNote);
    const todoCol = document.getElementById('todo');
    if (todoCol) todoCol.appendChild(noteElement);

    input.value = '';
  }
}

function deleteTaskFromModal() {
  if (!currentTaskId) return;

  if (confirm("Are you sure you want to delete this task?")) {
    const taskIdToDelete = currentTaskId;
    const task = notesData.find(t => t.id === taskIdToDelete);
    if (!task) return;

    const shouldExport = confirm("Do you want to export this task as PDF before deleting?");

    // Close modal first
    modalHasChanges = false; // Prevent unsaved changes warning
    closeTaskModal();

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

async function deleteNote(id, addToHistory = true) {
  const noteIndex = notesData.findIndex(n => n.id === id);
  if (noteIndex !== -1) {
    await deleteTaskImages(id);

    notesData[noteIndex].deleted = true;

    if (addToHistory) {
      const timestamp = new Date().toLocaleString();
      notesData[noteIndex].actions.push({ action: 'Deleted', timestamp, type: 'deleted' });
    }

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
    note.actions.push({
      action: `Moved from ${getColumnName(oldColumn)} to ${getColumnName(newColumn)}`,
      timestamp,
      type: 'status'
    });
    saveNotesToLocalStorage();

    if (newColumn === 'done') {
      setTimeout(() => {
        if (confirm(`Task "${note.title}" moved to Done.\n\nDo you want to export it as PDF?`)) {
          exportTaskAsPDF(id);
        }
      }, 300);
    }
  }
}

/***********************
 * NOTE UI
 ***********************/
function createNoteElement(content) {
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
      openTaskModal(content.id);
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
    // Don't interfere if already long-pressed and menu is showing
    if (!isLongPress) {
      clearTimeout(pressTimer);
    }
  };

  // Cancel timer if mouse button released before long press completes
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
  deleteButton.onclick = async function (e) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      const task = notesData.find(t => t.id === content.id);
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
      await deleteNote(content.id, !shouldExport); // Only add to history if not exported
    }
  };

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
  note.appendChild(editDeleteContainer);

  note.addEventListener('dragstart', (e) => {
    if (e.target.closest('button')) {
      e.preventDefault();
      return;
    }
    draggedItem = note;
  });

  enableTouchDrag(note);

  return note;
}

/***********************
 * DRAG & DROP
 ***********************/
let draggedItem = null;

document.querySelectorAll('.column').forEach(column => {
  column.addEventListener('dragover', e => e.preventDefault());
  column.addEventListener('drop', function () {
    if (draggedItem) {
      const oldColumnId = draggedItem.parentElement.id;
      const newColumnId = this.id;
      const noteId = parseInt(draggedItem.dataset.id, 10);

      this.appendChild(draggedItem);
      updateNoteColumn(noteId, oldColumnId, newColumnId);

      draggedItem = null;
      saveNotesToLocalStorage();
    }
  });
});

function enableTouchDrag(noteEl) {
  noteEl.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;
    draggedItem = noteEl;
    e.preventDefault();
  }, { passive: false });

  noteEl.addEventListener('touchmove', (e) => {
    if (!draggedItem) return;
    e.preventDefault();
    const t = e.touches[0];
    const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
    const hoveredCol = elUnderFinger && elUnderFinger.closest('.column');

    document.querySelectorAll('.column').forEach(c =>
      c.classList.toggle('drop-hover', c === hoveredCol)
    );
  }, { passive: false });

  noteEl.addEventListener('touchend', (e) => {
    if (!draggedItem) return;

    const t = e.changedTouches[0];
    const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
    const dropCol = elUnderFinger && elUnderFinger.closest('.column');

    document.querySelectorAll('.column').forEach(c => c.classList.remove('drop-hover'));

    if (dropCol) {
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
 * PDF EXPORT (Individual Task)
 ***********************/
async function exportTaskAsPDF(taskId = null) {
  const id = taskId || currentTaskId;
  if (!id) return;

  const task = notesData.find(t => t.id === id);
  if (!task) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Title (split to fit page width)
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  const titleLines = doc.splitTextToSize(task.title, maxWidth);
  titleLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 10;
  });
  yPos += 2;

  // Priority
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  const priorityColor = task.priority === 'high' ? [244, 67, 54] :
                        task.priority === 'low' ? [76, 175, 80] :
                        task.priority === 'medium' ? [255, 152, 0] : [128, 128, 128];
  doc.setTextColor(...priorityColor);
  doc.text(`Priority: ${getPriorityLabel(task.priority)}`, margin, yPos);
  doc.setTextColor(0, 0, 0);
  yPos += 8;

  // Timer
  doc.text(`Total Worked Time: ${formatTime(task.timer || 0)}`, margin, yPos);
  yPos += 15;

  // Merge timeline (notes + history) in chronological order
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Timeline:', margin, yPos);
  yPos += 8;

  if (task.actions && task.actions.length > 0) {
    for (const action of task.actions) {
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = 20;
      }

      if (action.type === 'note') {
        // This is a note entry
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(76, 175, 80); // Green for notes
        doc.text(`[${action.timestamp}] Note added:`, margin, yPos);
        yPos += 6;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0); // Reset to black for content

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = action.notesHTML;

        const childNodes = tempDiv.childNodes;
        for (let i = 0; i < childNodes.length; i++) {
          const node = childNodes[i];

          if (node.nodeName === 'IMG') {
            try {
              let imgSrc = null;

              // Try to get from IndexedDB first using imageId
              if (node.dataset.imageId) {
                imgSrc = await getImage(id, node.dataset.imageId);
              }

              // If not found, try data-src attribute
              if (!imgSrc && node.dataset.src) {
                imgSrc = node.dataset.src;
              }

              // Fallback to src if still not found
              if (!imgSrc) {
                imgSrc = node.src;
              }

              if (imgSrc && imgSrc.startsWith('data:')) {
                // Calculate proper dimensions maintaining aspect ratio
                const dimensions = await getImageDimensions(imgSrc);

                const maxWidth = 150;
                const maxHeight = 100;

                // Scale down to fit within max dimensions while maintaining aspect ratio
                const widthRatio = maxWidth / dimensions.width;
                const heightRatio = maxHeight / dimensions.height;
                const scale = Math.min(widthRatio, heightRatio, 1); // Don't scale up

                const imgWidth = dimensions.width * scale;
                const imgHeight = dimensions.height * scale;

                if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
                  doc.addPage();
                  yPos = 20;
                }

                doc.addImage(imgSrc, 'PNG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 5;
              }
            } catch (err) {
              console.error('Error adding image to PDF:', err);
            }
          } else if (node.textContent && node.textContent.trim()) {
            const text = node.textContent.trim();
            const lines = doc.splitTextToSize(text, maxWidth);

            lines.forEach(line => {
              if (yPos > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                yPos = 20;
              }
              doc.text(line, margin, yPos);
              yPos += 7;
            });
          }
        }

        yPos += 5;
      } else {
        // Regular history action with color coding
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        // Set color based on action type
        switch (action.type) {
          case 'created':
            doc.setTextColor(33, 150, 243); // Blue
            break;
          case 'deleted':
            doc.setTextColor(244, 67, 54); // Red
            break;
          case 'status':
            doc.setTextColor(156, 39, 176); // Purple
            break;
          case 'timer':
            doc.setTextColor(255, 152, 0); // Orange
            break;
          case 'priority':
            doc.setTextColor(38, 198, 218); // Cyan
            break;
          default:
            doc.setTextColor(0, 0, 0); // Black
        }

        doc.text(`[${action.timestamp}] ${action.action}`, margin, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black
        yPos += 6;
      }
    }
  } else {
    doc.setFontSize(11);
    doc.text('No timeline events', margin, yPos);
    yPos += 10;
  }

  const filename = `${task.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(filename);
}

/***********************
 * HTML EXPORT/IMPORT (Full Board)
 ***********************/
async function exportBoardAsHTML() {
  const exportData = {
    exportDate: new Date().toISOString(),
    tasks: []
  };

  for (const task of notesData) {
    const taskExport = { ...task };

    if (task.noteEntries && task.noteEntries.length > 0) {
      taskExport.noteEntriesWithImages = [];
      for (const entry of task.noteEntries) {
        const entryExport = { ...entry };
        if (entry.images && entry.images.length > 0) {
          entryExport.imageData = {};
          for (const imageId of entry.images) {
            const dataUrl = await getImage(task.id, imageId);
            if (dataUrl) {
              entryExport.imageData[imageId] = dataUrl;
            }
          }
        }
        taskExport.noteEntriesWithImages.push(entryExport);
      }
      delete taskExport.noteEntries;
    }

    exportData.tasks.push(taskExport);
  }

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kanban Board Export - ${getCurrentDate()}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #1e1e1e; color: #e0e0e0; padding: 20px; }
    h1 { color: #4caf50; }
    .task { background: #2c2c2c; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .task h3 { color: #4caf50; margin-top: 0; }
    img { max-width: 100%; margin: 10px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Kanban Board Export</h1>
  <p>Export Date: ${new Date().toLocaleString()}</p>
  <script type="application/json" id="kanbanData">
${JSON.stringify(exportData, null, 2)}
  </script>
  <div id="preview">
    ${generatePreviewHTML(exportData.tasks)}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Kanban_Board_${getCurrentDate()}.html`;
  link.click();
}

function generatePreviewHTML(tasks) {
  let html = '';

  tasks.forEach(task => {
    if (task.deleted) return;

    const priorityColor = task.priority === 'high' ? '#f44336' :
                          task.priority === 'low' ? '#4caf50' :
                          task.priority === 'medium' ? '#ff9800' : 'rgba(255, 255, 255, 0.5)';

    html += `<div class="task">
      <h3>${escapeHtml(task.title)} - ${getColumnName(task.column)}</h3>
      <p><strong>Priority:</strong> <span style="color: ${priorityColor}">${getPriorityLabel(task.priority)}</span></p>
      <p><strong>Timer:</strong> ${formatTime(task.timer || 0)}</p>
    </div>`;
  });

  return html || '<p>No tasks to display</p>';
}

// Main import handler - routes to appropriate parser based on file type
async function importBoardFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.html')) {
    await importBoardFromHTML(file);
  } else if (fileName.endsWith('.txt')) {
    await importBoardFromTXT(file);
  } else {
    alert('Unsupported file type. Please use .html or .txt files.');
  }

  // Reset file input
  event.target.value = '';
}

// Import from HTML (current format)
async function importBoardFromHTML(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const htmlContent = e.target.result;
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const dataScript = doc.getElementById('kanbanData');

      if (!dataScript) {
        alert('Invalid import file: No data found');
        return;
      }

      const importData = JSON.parse(dataScript.textContent);

      if (!importData.tasks) {
        alert('Invalid import file: No tasks found');
        return;
      }

      if (confirm(`This will replace your current board with ${importData.tasks.length} tasks.\n\nContinue?`)) {
        notesData = [];
        document.querySelectorAll('.note').forEach(note => note.remove());

        for (const task of importData.tasks) {
          if (task.noteEntriesWithImages) {
            task.noteEntries = [];
            for (const entry of task.noteEntriesWithImages) {
              if (entry.imageData) {
                for (const [imageId, dataUrl] of Object.entries(entry.imageData)) {
                  await storeImage(task.id, imageId, dataUrl);
                }
                delete entry.imageData;
              }
              task.noteEntries.push(entry);
            }
            delete task.noteEntriesWithImages;
          }

          notesData.push(task);

          if (!task.deleted) {
            const noteElement = createNoteElement(task);
            const col = document.getElementById(task.column);
            if (col) col.appendChild(noteElement);
          }
        }

        saveNotesToLocalStorage();
        alert('Board imported successfully!');
      }
    } catch (err) {
      console.error('Import error:', err);
      alert('Error importing file: ' + err.message);
    }
  };

  reader.readAsText(file);
}

// Import from TXT (old format - backward compatibility)
async function importBoardFromTXT(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const txtContent = e.target.result;

      // Parse the text format
      const sections = txtContent.split('----------------------').filter(s => s.trim().length > 0);
      const convertedTasks = [];

      // Helper function to map column names to IDs
      function mapColumnToId(columnName) {
        const mapping = {
          'To Do': 'todo',
          'In Progress': 'inProgress',
          'On Hold': 'onHold',
          'Done': 'done'
        };
        return mapping[columnName] || 'todo';
      }

      // Helper function to parse action type from action text
      function parseActionType(actionText) {
        if (actionText.includes('Created')) return 'created';
        if (actionText.includes('Moved')) return 'moved';
        if (actionText.includes('Edited Notes')) return 'edited';
        if (actionText.includes('Timer')) return 'timer';
        return 'other';
      }

      // Parse each section
      for (let section of sections) {
        const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        let title = 'Untitled';
        let notes = '';
        let column = 'todo';
        let actions = [];
        let inActionsSection = false;
        let hasValidData = false;

        for (let line of lines) {
          // Skip header and footer lines
          if (line.includes('Kanban Board Export') || line === 'Deleted Items:') {
            continue;
          }

          if (line.startsWith('Title: ')) {
            title = line.substring(7).trim();
            hasValidData = true;
          } else if (line.startsWith('Notes: ')) {
            notes = line.substring(7).trim();
            if (notes === 'No additional notes') {
              notes = '';
            }
          } else if (line.startsWith('Current Column: ')) {
            const columnName = line.substring(16).trim();
            column = mapColumnToId(columnName);
          } else if (line === 'Actions:') {
            inActionsSection = true;
          } else if (inActionsSection && line.startsWith('- ')) {
            // Parse action line
            const actionText = line.substring(2).trim();

            // Extract timestamp (text after " at ")
            let timestamp = new Date().toLocaleString();
            const atIndex = actionText.lastIndexOf(' at ');
            if (atIndex !== -1) {
              timestamp = actionText.substring(atIndex + 4).trim();
            }

            actions.push({
              action: actionText,
              timestamp: timestamp,
              type: parseActionType(actionText)
            });
          }
        }

        // Only create task if we found valid data
        if (!hasValidData) {
          continue;
        }

        // Create the task object
        const newTask = {
          id: Date.now() + Math.random(),
          title: title,
          noteEntries: [],
          timer: 0,
          column: column,
          actions: actions.length > 0 ? actions : [{
            action: 'Created (imported from TXT)',
            timestamp: new Date().toLocaleString(),
            type: 'created'
          }]
        };

        // If there are notes, add them as a note entry
        if (notes && notes.length > 0) {
          newTask.noteEntries.push({
            timestamp: actions.length > 0 ? actions[0].timestamp : new Date().toLocaleString(),
            notesHTML: notes,
            images: []
          });
        }

        convertedTasks.push(newTask);
      }

      if (convertedTasks.length === 0) {
        alert('No valid tasks found in TXT file');
        return;
      }

      if (confirm(`This will replace your current board with ${convertedTasks.length} imported tasks.\n\nContinue?`)) {
        notesData = [];
        document.querySelectorAll('.note').forEach(note => note.remove());

        convertedTasks.forEach(task => {
          notesData.push(task);
          const noteElement = createNoteElement(task);
          const col = document.getElementById(task.column);
          if (col) col.appendChild(noteElement);
        });

        saveNotesToLocalStorage();
        alert('Board imported successfully from TXT!');
      }
    } catch (err) {
      console.error('TXT Import error:', err);
      alert('Error importing TXT file: ' + err.message);
    }
  };

  reader.readAsText(file);
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

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[s]));
}

/***********************
 * NAVIGATION GUARD
 ***********************/
window.addEventListener('beforeunload', function (e) {
  e.preventDefault();
  e.returnValue = '';
});

/***********************
 * PERMANENT NOTES MANAGEMENT
 ***********************/
function loadPermanentNotes() {
  const savedNotes = localStorage.getItem('permanentNotes');
  const permanentNotesField = document.getElementById('permanentNotes');
  if (permanentNotesField && savedNotes) {
    permanentNotesField.value = savedNotes;
  }
}

function savePermanentNotes() {
  const permanentNotesField = document.getElementById('permanentNotes');
  if (permanentNotesField) {
    localStorage.setItem('permanentNotes', permanentNotesField.value);
  }
}

/***********************
 * BOOTSTRAP
 ***********************/
document.addEventListener('DOMContentLoaded', async () => {
  await initIndexedDB();
  loadClocks();
  loadNotesFromLocalStorage();
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

  window.onclick = function(event) {
    const taskModal = document.getElementById('taskModal');
    const imageModal = document.getElementById('imageModal');
    const addClockModal = document.getElementById('addClockModal');

    if (event.target === addClockModal) {
      closeAddClockModal();
    }

    if (event.target === taskModal) {
      // Check if there are actual changes
      const task = notesData.find(t => t.id === currentTaskId);
      const notesEditor = document.getElementById('modalNotesEditor');

      const hasTextContent = notesEditor && notesEditor.textContent.trim().length > 0;
      const hasImages = notesEditor && notesEditor.querySelectorAll('img').length > 0;
      const hasNoteChanges = notesEditor && notesEditor.innerHTML.trim() && (hasTextContent || hasImages);
      const hasTimerChanges = task && (task.timer || 0) !== originalTimerValue;
      const hasPriorityChanges = currentModalPriority !== originalPriorityValue;
      const hasRealChanges = hasNoteChanges || hasTimerChanges || hasPriorityChanges;

      if (modalHasChanges && hasRealChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
          // Revert timer changes if closing without saving
          if (task && hasTimerChanges) {
            task.timer = originalTimerValue;
            updateNoteCardDisplay(currentTaskId);
            saveNotesToLocalStorage();
          }

          modalHasChanges = false;
          modalPendingActions = [];
          originalTimerValue = 0;
          originalPriorityValue = null;
          currentModalPriority = null;
          taskModal.style.display = 'none';
          currentTaskId = null;
        }
      } else {
        closeTaskModal();
      }
    }
    if (event.target === imageModal) {
      closeImageModal();
    }
  };
});
