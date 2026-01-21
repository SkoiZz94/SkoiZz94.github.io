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
      // Ensure all required properties exist
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
      
      // Ensure all properties exist with proper defaults
      if (!note.actions) {
        note.actions = [{
          action: 'Created',
          timestamp: new Date().toLocaleString(),
          type: 'created'
        }];
      }
      
      if (note.timer === undefined) {
        note.timer = 0;
      }
      
      if (note.priority === undefined) {
        note.priority = null;
      }
      
      if (!note.column) {
        note.column = 'todo';
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
      // This helps Chrome's popup blocker allow the confirm dialog
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
  const handleDelete = async function (e) {
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

function setupDragAndDrop() {
  const columns = document.querySelectorAll('.column');
  
  columns.forEach(column => {
    column.addEventListener('dragover', e => e.preventDefault());
    column.addEventListener('drop', function () {
      if (draggedItem) {
        const oldColumnId = draggedItem.parentElement.id;
        const newColumnId = this.id;
        const noteId = parseFloat(draggedItem.dataset.id); // Use parseFloat to preserve decimal IDs

        this.appendChild(draggedItem);
        updateNoteColumn(noteId, oldColumnId, newColumnId);

        draggedItem = null;
        saveNotesToLocalStorage();
      }
    });
  });
}

function enableTouchDrag(noteEl) {
  let touchStartX = 0;
  let touchStartY = 0;
  let isDragging = false;
  const dragThreshold = 10; // pixels of movement before considered a drag

  noteEl.addEventListener('touchstart', (e) => {
    if (e.target.closest('button')) return;

    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    isDragging = false;
    draggedItem = noteEl;
    // Don't preventDefault here - allow click/tap to work
  }, { passive: true });

  noteEl.addEventListener('touchmove', (e) => {
    if (!draggedItem) return;

    const t = e.touches[0];
    const deltaX = Math.abs(t.clientX - touchStartX);
    const deltaY = Math.abs(t.clientY - touchStartY);

    // Only start dragging if moved beyond threshold
    if (!isDragging && (deltaX > dragThreshold || deltaY > dragThreshold)) {
      isDragging = true;
    }

    if (isDragging) {
      e.preventDefault();
      const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
      const hoveredCol = elUnderFinger && elUnderFinger.closest('.column');

      document.querySelectorAll('.column').forEach(c =>
        c.classList.toggle('drop-hover', c === hoveredCol)
      );
    }
  }, { passive: false });

  noteEl.addEventListener('touchend', (e) => {
    if (!draggedItem) return;

    document.querySelectorAll('.column').forEach(c => c.classList.remove('drop-hover'));

    if (isDragging) {
      // It was a drag - handle the drop
      const t = e.changedTouches[0];
      const elUnderFinger = document.elementFromPoint(t.clientX, t.clientY);
      const dropCol = elUnderFinger && elUnderFinger.closest('.column');

      if (dropCol) {
        const oldColumnId = draggedItem.parentElement.id;
        const newColumnId = dropCol.id;
        const noteId = parseInt(draggedItem.dataset.id, 10);

        dropCol.appendChild(draggedItem);
        updateNoteColumn(noteId, oldColumnId, newColumnId);
        saveNotesToLocalStorage();
      }
    } else {
      // It was a tap - open the modal
      const noteId = parseInt(noteEl.dataset.id, 10);
      if (!e.target.closest('button') && !e.target.closest('.quick-time-menu')) {
        openTaskModal(noteId);
      }
    }

    draggedItem = null;
    isDragging = false;
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

        // Create the task object with exact same structure as new notes
        const newTask = {
          id: Date.now() + Math.random(),
          title: title,
          noteEntries: [],
          timer: 0,
          priority: null,
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
  setupDragAndDrop(); // Set up drag and drop handlers after DOM is ready
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
  // This ensures taps work reliably on touch devices
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
              modal.style.display = 'none';
              currentTaskId = null;
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

/***********************
 * NOTEBOOK SIDEBAR SYSTEM
 ***********************/
let notebookItems = [];
let currentPageId = null;
let contextMenuTargetId = null;
let notebookSidebarOpen = false;
let pageHasChanges = false;
let notebookDraggedItem = null;

/***********************
 * NOTEBOOK STORAGE
 ***********************/
function loadNotebookFromLocalStorage() {
  const saved = localStorage.getItem('notebookItems');
  if (saved) {
    notebookItems = JSON.parse(saved);
  } else {
    notebookItems = [];
  }
}

function saveNotebookToLocalStorage() {
  localStorage.setItem('notebookItems', JSON.stringify(notebookItems));
}

// Store notebook image in IndexedDB
async function storeNotebookImage(pageId, imageId, dataUrl) {
  if (!db) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    const request = store.put({ id: `notebook_${pageId}_${imageId}`, dataUrl });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get notebook image from IndexedDB
async function getNotebookImage(pageId, imageId) {
  if (!db) await initIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const request = store.get(`notebook_${pageId}_${imageId}`);
    request.onsuccess = () => resolve(request.result?.dataUrl || null);
    request.onerror = () => reject(request.error);
  });
}

// Delete all images for a page
async function deletePageImages(pageId) {
  if (!db) await initIndexedDB();
  const page = notebookItems.find(p => p.id === pageId);
  if (!page || !page.images) return;

  const transaction = db.transaction(['images'], 'readwrite');
  const store = transaction.objectStore('images');

  for (const imageId of page.images) {
    store.delete(`notebook_${pageId}_${imageId}`);
  }
}

/***********************
 * SIDEBAR UI
 ***********************/
function toggleNotebookSidebar() {
  notebookSidebarOpen = !notebookSidebarOpen;
  const sidebar = document.getElementById('notebookSidebar');
  const toggleBtn = document.querySelector('.notebook-toggle-btn');

  if (notebookSidebarOpen) {
    sidebar.classList.add('open');
    toggleBtn.classList.add('active');
    document.body.classList.add('notebook-sidebar-open');
  } else {
    sidebar.classList.remove('open');
    toggleBtn.classList.remove('active');
    document.body.classList.remove('notebook-sidebar-open');
  }

  // Persist sidebar state
  localStorage.setItem('notebookSidebarOpen', notebookSidebarOpen);
}

function setupSidebarResize() {
  const resizeHandle = document.getElementById('notebookSidebarResize');
  const sidebar = document.getElementById('notebookSidebar');
  if (!resizeHandle || !sidebar) return;

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  const startResize = (e) => {
    isResizing = true;
    startX = e.clientX || e.touches[0].clientX;
    startWidth = sidebar.offsetWidth;

    resizeHandle.classList.add('resizing');
    sidebar.classList.add('resizing');
    document.body.classList.add('sidebar-resizing');

    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', doResize);
    document.addEventListener('touchend', stopResize);

    e.preventDefault();
  };

  const doResize = (e) => {
    if (!isResizing) return;

    const clientX = e.clientX || e.touches[0].clientX;
    const delta = clientX - startX;
    let newWidth = startWidth + delta;

    // Clamp between min and max
    newWidth = Math.max(200, Math.min(600, newWidth));

    document.documentElement.style.setProperty('--notebook-sidebar-width', `${newWidth}px`);
  };

  const stopResize = () => {
    if (!isResizing) return;

    isResizing = false;
    resizeHandle.classList.remove('resizing');
    sidebar.classList.remove('resizing');
    document.body.classList.remove('sidebar-resizing');

    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);

    // Save the width
    const currentWidth = getComputedStyle(document.documentElement).getPropertyValue('--notebook-sidebar-width');
    localStorage.setItem('notebookSidebarWidth', currentWidth.trim());
  };

  resizeHandle.addEventListener('mousedown', startResize);
  resizeHandle.addEventListener('touchstart', startResize);
}

function renderNotebookTree() {
  const treeContainer = document.getElementById('notebookTree');
  if (!treeContainer) return;

  treeContainer.innerHTML = '';

  const searchTerm = document.getElementById('notebookSearchInput')?.value.toLowerCase() || '';

  // Get root items (parentId === null)
  const rootItems = getChildItems(null);

  if (rootItems.length === 0 && !searchTerm) {
    treeContainer.innerHTML = '<div class="notebook-tree-empty">No items yet. Click the folder or page icon above to create one.</div>';
    return;
  }

  // Render tree recursively
  rootItems.forEach(item => {
    renderTreeItem(treeContainer, item, 0, searchTerm);
  });
}

function renderTreeItem(container, item, level, searchTerm = '') {
  // Filter logic
  const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm);
  const children = getChildItems(item.id);
  const hasMatchingChildren = children.some(child =>
    child.name.toLowerCase().includes(searchTerm) ||
    getChildItems(child.id).some(grandchild => grandchild.name.toLowerCase().includes(searchTerm))
  );

  // Skip if doesn't match and has no matching children
  if (searchTerm && !matchesSearch && !hasMatchingChildren) {
    return;
  }

  const itemEl = document.createElement('div');
  itemEl.classList.add('notebook-tree-item');
  itemEl.dataset.id = item.id;
  itemEl.dataset.type = item.type;
  itemEl.dataset.level = level;
  itemEl.draggable = true;

  // Expand arrow (only for folders)
  const expandEl = document.createElement('div');
  expandEl.classList.add('tree-item-expand');
  if (item.type === 'folder') {
    if (item.expanded) {
      expandEl.classList.add('expanded');
    }
    expandEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    expandEl.onclick = (e) => {
      e.stopPropagation();
      toggleFolderExpand(item.id);
    };
  } else {
    expandEl.classList.add('hidden');
  }
  itemEl.appendChild(expandEl);

  // Icon
  const iconEl = document.createElement('div');
  iconEl.classList.add('tree-item-icon', item.type);
  if (item.type === 'folder') {
    iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
  } else {
    iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;
  }
  itemEl.appendChild(iconEl);

  // Name
  const nameEl = document.createElement('div');
  nameEl.classList.add('tree-item-name');
  nameEl.textContent = item.name;
  itemEl.appendChild(nameEl);

  // Double-click to rename
  nameEl.ondblclick = (e) => {
    e.stopPropagation();
    startInlineRename(item.id);
  };

  // Click to open page or select folder
  itemEl.onclick = () => {
    if (item.type === 'page') {
      openPageModal(item.id);
    } else {
      toggleFolderExpand(item.id);
    }
  };

  // Right-click context menu
  itemEl.oncontextmenu = (e) => {
    e.preventDefault();
    showContextMenu(e, item.id);
  };

  // Drag events
  itemEl.ondragstart = (e) => handleTreeDragStart(e, item);
  itemEl.ondragover = (e) => handleTreeDragOver(e, item);
  itemEl.ondrop = (e) => handleTreeDrop(e, item);
  itemEl.ondragend = handleTreeDragEnd;
  itemEl.ondragleave = handleTreeDragLeave;

  container.appendChild(itemEl);

  // Render children if folder is expanded
  if (item.type === 'folder' && (item.expanded || searchTerm)) {
    children.forEach(child => {
      renderTreeItem(container, child, level + 1, searchTerm);
    });
  }
}

function getChildItems(parentId) {
  return notebookItems
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/***********************
 * CRUD OPERATIONS
 ***********************/
function createNotebookItem(type, parentId) {
  const timestamp = new Date().toISOString();
  const siblings = getChildItems(parentId);
  const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.order)) : -1;

  const newItem = {
    id: Date.now(),
    type: type,
    parentId: parentId,
    name: type === 'folder' ? 'New Folder' : 'New Page',
    order: maxOrder + 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (type === 'folder') {
    newItem.expanded = true;
  } else {
    newItem.content = '';
    newItem.images = [];
  }

  notebookItems.push(newItem);
  saveNotebookToLocalStorage();

  // Expand parent folder if creating inside one
  if (parentId !== null) {
    const parent = notebookItems.find(i => i.id === parentId);
    if (parent && parent.type === 'folder') {
      parent.expanded = true;
      saveNotebookToLocalStorage();
    }
  }

  renderNotebookTree();

  // Start inline rename for new item
  setTimeout(() => {
    startInlineRename(newItem.id);
  }, 50);

  return newItem;
}

function startInlineRename(itemId) {
  const itemEl = document.querySelector(`.notebook-tree-item[data-id="${itemId}"]`);
  if (!itemEl) return;

  const nameEl = itemEl.querySelector('.tree-item-name');
  if (!nameEl) return;

  const item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  nameEl.contentEditable = true;
  nameEl.classList.add('editing');
  nameEl.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(nameEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const finishRename = () => {
    nameEl.contentEditable = false;
    nameEl.classList.remove('editing');
    const newName = nameEl.textContent.trim();
    if (newName && newName !== item.name) {
      renameNotebookItem(itemId, newName);
    } else {
      nameEl.textContent = item.name;
    }
  };

  nameEl.onblur = finishRename;
  nameEl.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameEl.blur();
    } else if (e.key === 'Escape') {
      nameEl.textContent = item.name;
      nameEl.blur();
    }
  };
}

function renameNotebookItem(itemId, newName) {
  const item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  item.name = newName;
  item.updatedAt = new Date().toISOString();
  saveNotebookToLocalStorage();
  renderNotebookTree();
}

async function deleteNotebookItem(itemId, skipConfirm = false) {
  const item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  // Get all descendants
  const getDescendants = (parentId) => {
    const children = notebookItems.filter(i => i.parentId === parentId);
    let descendants = [...children];
    children.forEach(child => {
      descendants = descendants.concat(getDescendants(child.id));
    });
    return descendants;
  };

  const descendants = getDescendants(itemId);
  const totalItems = 1 + descendants.length;

  if (!skipConfirm) {
    const message = item.type === 'folder' && descendants.length > 0
      ? `Delete "${item.name}" and ${descendants.length} item(s) inside it?`
      : `Delete "${item.name}"?`;

    if (!confirm(message)) {
      return;
    }
  }

  // Delete images for pages
  const pagesToDelete = [item, ...descendants].filter(i => i.type === 'page');
  for (const page of pagesToDelete) {
    await deletePageImages(page.id);
  }

  // Remove from array
  const idsToDelete = new Set([itemId, ...descendants.map(d => d.id)]);
  notebookItems = notebookItems.filter(i => !idsToDelete.has(i.id));

  saveNotebookToLocalStorage();
  renderNotebookTree();
  hideContextMenu();
}

function moveNotebookItem(itemId, newParentId, newOrder = null) {
  const item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  // Prevent moving a folder into itself or its descendants
  if (item.type === 'folder' && newParentId !== null) {
    const isDescendant = (parentId, targetId) => {
      if (parentId === targetId) return true;
      const children = notebookItems.filter(i => i.parentId === parentId);
      return children.some(child => isDescendant(child.id, targetId));
    };
    if (isDescendant(itemId, newParentId)) {
      return; // Can't move into own descendant
    }
  }

  // Update parent
  item.parentId = newParentId;

  // Update order
  if (newOrder !== null) {
    const siblings = getChildItems(newParentId).filter(i => i.id !== itemId);
    siblings.splice(newOrder, 0, item);
    siblings.forEach((sibling, index) => {
      sibling.order = index;
    });
  }

  item.updatedAt = new Date().toISOString();
  saveNotebookToLocalStorage();
  renderNotebookTree();
}

/***********************
 * FOLDER ACTIONS
 ***********************/
function toggleFolderExpand(folderId) {
  const folder = notebookItems.find(i => i.id === folderId && i.type === 'folder');
  if (!folder) return;

  folder.expanded = !folder.expanded;
  saveNotebookToLocalStorage();
  renderNotebookTree();
}

function expandToItem(itemId) {
  let item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  // Walk up the tree and expand all parent folders
  while (item.parentId !== null) {
    const parent = notebookItems.find(i => i.id === item.parentId);
    if (parent && parent.type === 'folder') {
      parent.expanded = true;
    }
    item = parent;
  }

  saveNotebookToLocalStorage();
  renderNotebookTree();
}

/***********************
 * PAGE MODAL
 ***********************/
async function openPageModal(pageId) {
  const page = notebookItems.find(i => i.id === pageId && i.type === 'page');
  if (!page) return;

  currentPageId = pageId;
  pageHasChanges = false;

  const modal = document.getElementById('pageModal');
  const titleEl = document.getElementById('pageModalTitle');
  const editorEl = document.getElementById('pageEditor');

  titleEl.textContent = page.name;
  editorEl.innerHTML = page.content || '';

  // Restore images from IndexedDB
  if (page.images && page.images.length > 0) {
    const images = editorEl.querySelectorAll('img');
    for (const img of images) {
      const imageId = img.dataset.imageId;
      if (imageId) {
        const dataUrl = await getNotebookImage(pageId, imageId);
        if (dataUrl) {
          img.src = dataUrl;
          img.onclick = () => openImageViewer(dataUrl);
        }
      }
    }
  }

  // Mark title changes
  titleEl.oninput = () => { pageHasChanges = true; };

  // Setup clipboard paste for page editor
  setupPageClipboardPaste();

  modal.style.display = 'block';
}

function closePageModal() {
  if (pageHasChanges) {
    if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
  }

  const modal = document.getElementById('pageModal');
  modal.style.display = 'none';
  currentPageId = null;
  pageHasChanges = false;
}

async function saveAndClosePage() {
  if (!currentPageId) return;

  const page = notebookItems.find(i => i.id === currentPageId);
  if (!page) return;

  const titleEl = document.getElementById('pageModalTitle');
  const editorEl = document.getElementById('pageEditor');

  // Update name
  const newName = titleEl.textContent.trim() || 'Untitled Page';
  page.name = newName;

  // Extract and save images to IndexedDB
  const images = editorEl.querySelectorAll('img');
  const imageIds = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imageId = img.dataset.imageId || `img_${Date.now()}_${i}`;
    img.dataset.imageId = imageId;
    imageIds.push(imageId);

    if (img.src.startsWith('data:')) {
      await storeNotebookImage(currentPageId, imageId, img.src);
      // Keep original src in data-src for PDF export
      img.setAttribute('data-src', img.src);
      // Replace with placeholder to reduce localStorage size
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  }

  page.content = editorEl.innerHTML;
  page.images = imageIds;
  page.updatedAt = new Date().toISOString();

  saveNotebookToLocalStorage();
  renderNotebookTree();

  pageHasChanges = false;
  const modal = document.getElementById('pageModal');
  modal.style.display = 'none';
  currentPageId = null;
}

function setupPageClipboardPaste() {
  const editorEl = document.getElementById('pageEditor');
  if (!editorEl) return;

  // Mark changes on input
  editorEl.oninput = () => { pageHasChanges = true; };

  // Prevent formatting shortcuts
  editorEl.onkeydown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      const allowedKeys = ['c', 'v', 'x', 'a', 'z', 'y'];
      if (!allowedKeys.includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    }
  };

  editorEl.onpaste = async (e) => {
    const items = e.clipboardData.items;
    let hasImage = false;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        hasImage = true;
        e.preventDefault();
        pageHasChanges = true;

        const blob = items[i].getAsFile();
        const reader = new FileReader();

        reader.onload = (event) => {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.cursor = 'pointer';
          img.dataset.imageId = `img_${Date.now()}_${i}`;
          img.onclick = () => openImageViewer(img.src);

          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.collapse(false);
          } else {
            editorEl.appendChild(img);
          }
        };

        reader.readAsDataURL(blob);
      }
    }

    if (!hasImage) {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

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

      pageHasChanges = true;
    }
  };
}

async function deletePageFromModal() {
  if (!currentPageId) return;

  const page = notebookItems.find(i => i.id === currentPageId);
  if (!page) return;

  if (confirm(`Delete "${page.name}"?`)) {
    await deleteNotebookItem(currentPageId, true);
    pageHasChanges = false;
    const modal = document.getElementById('pageModal');
    modal.style.display = 'none';
    currentPageId = null;
  }
}

/***********************
 * CONTEXT MENU
 ***********************/
function showContextMenu(e, itemId) {
  e.stopPropagation();

  const menu = document.getElementById('notebookContextMenu');
  if (!menu) return;

  contextMenuTargetId = itemId;
  const item = notebookItems.find(i => i.id === itemId);
  if (!item) return;

  // Show/hide folder-only options
  const folderOnlyItems = menu.querySelectorAll('.folder-only');
  folderOnlyItems.forEach(el => {
    el.style.display = item.type === 'folder' ? 'flex' : 'none';
  });

  // Position menu initially
  menu.style.left = `${e.clientX}px`;
  menu.style.top = `${e.clientY}px`;

  // Make visible first so we can measure
  menu.classList.add('visible');

  // Ensure menu stays within viewport
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 10}px`;
  }
}

function hideContextMenu() {
  const menu = document.getElementById('notebookContextMenu');
  if (menu) {
    menu.classList.remove('visible');
  }
  contextMenuTargetId = null;
}

function contextMenuAction(action) {
  if (!contextMenuTargetId) return;

  const targetId = contextMenuTargetId; // Save before hideContextMenu clears it
  const item = notebookItems.find(i => i.id === targetId);
  if (!item) {
    hideContextMenu();
    return;
  }

  switch (action) {
    case 'rename':
      hideContextMenu();
      setTimeout(() => startInlineRename(targetId), 50);
      break;
    case 'newFolder':
      createNotebookItem('folder', targetId);
      hideContextMenu();
      break;
    case 'newPage':
      createNotebookItem('page', targetId);
      hideContextMenu();
      break;
    case 'exportFolder':
      hideContextMenu();
      exportFolderAsZip(targetId);
      break;
    case 'delete':
      deleteNotebookItem(targetId);
      break;
  }
}

/***********************
 * DRAG & DROP
 ***********************/
function handleTreeDragStart(e, item) {
  notebookDraggedItem = item;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', item.id);

  // Add dragging class after a small delay
  setTimeout(() => {
    const el = document.querySelector(`.notebook-tree-item[data-id="${item.id}"]`);
    if (el) el.style.opacity = '0.5';
  }, 0);
}

function handleTreeDragOver(e, item) {
  e.preventDefault();
  if (!notebookDraggedItem || notebookDraggedItem.id === item.id) return;

  const el = e.currentTarget;

  // Clear all drag states
  document.querySelectorAll('.notebook-tree-item').forEach(i => {
    i.classList.remove('drag-over', 'drag-over-folder');
  });

  // If dropping on a folder, highlight it
  if (item.type === 'folder') {
    el.classList.add('drag-over-folder');
  } else {
    el.classList.add('drag-over');
  }
}

function handleTreeDragLeave(e) {
  e.currentTarget.classList.remove('drag-over', 'drag-over-folder');
}

function handleTreeDrop(e, targetItem) {
  e.preventDefault();

  // Clear all drag states
  document.querySelectorAll('.notebook-tree-item').forEach(i => {
    i.classList.remove('drag-over', 'drag-over-folder');
    i.style.opacity = '';
  });

  if (!notebookDraggedItem || notebookDraggedItem.id === targetItem.id) {
    notebookDraggedItem = null;
    return;
  }

  // Determine new parent and order
  if (targetItem.type === 'folder') {
    // Drop into folder
    moveNotebookItem(notebookDraggedItem.id, targetItem.id, 0);
    // Expand the target folder
    targetItem.expanded = true;
    saveNotebookToLocalStorage();
  } else {
    // Drop as sibling (before target)
    const targetIndex = getChildItems(targetItem.parentId).findIndex(i => i.id === targetItem.id);
    moveNotebookItem(notebookDraggedItem.id, targetItem.parentId, targetIndex);
  }

  notebookDraggedItem = null;
  renderNotebookTree();
}

function handleTreeDragEnd() {
  // Clear all drag states
  document.querySelectorAll('.notebook-tree-item').forEach(i => {
    i.classList.remove('drag-over', 'drag-over-folder');
    i.style.opacity = '';
  });
  notebookDraggedItem = null;
}

/***********************
 * SEARCH
 ***********************/
function filterNotebookItems() {
  renderNotebookTree();
}

/***********************
 * PDF EXPORT
 ***********************/
async function exportPageAsPDF() {
  if (!currentPageId) return;

  const page = notebookItems.find(i => i.id === currentPageId);
  if (!page) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Title with "Note:" prefix
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  const titleLines = doc.splitTextToSize(`Note: ${page.name}`, maxWidth);
  titleLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 10;
  });
  yPos += 5;

  // Content
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');

  const editorEl = document.getElementById('pageEditor');
  if (!editorEl) return;

  // Process content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = editorEl.innerHTML;

  const childNodes = tempDiv.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    if (node.nodeName === 'IMG') {
      try {
        let imgSrc = node.dataset.src || node.src;

        // Try to get from IndexedDB
        if (node.dataset.imageId) {
          const dbSrc = await getNotebookImage(currentPageId, node.dataset.imageId);
          if (dbSrc) imgSrc = dbSrc;
        }

        if (imgSrc && imgSrc.startsWith('data:')) {
          const dimensions = await getImageDimensions(imgSrc);
          let imgWidth = Math.min(dimensions.width, maxWidth);
          let imgHeight = (imgWidth / dimensions.width) * dimensions.height;
          const maxHeight = 120;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (imgHeight / dimensions.height) * dimensions.width;
          }

          if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }

          doc.addImage(imgSrc, 'JPEG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
        }
      } catch (err) {
        console.warn('Could not add image to PDF:', err);
      }
    } else {
      const text = node.textContent || '';
      if (text.trim()) {
        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += 6;
        }
      }
    }
  }

  const safeFileName = page.name.replace(/[^a-z0-9]/gi, '_');
  doc.save(`Note_${safeFileName}.pdf`);
}

/***********************
 * ZIP EXPORT
 ***********************/

// Generate PDF for a page and return as blob
async function generatePagePDFBlob(pageId) {
  const page = notebookItems.find(i => i.id === pageId);
  if (!page || page.type !== 'page') return null;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Title with "Note:" prefix
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  const titleLines = doc.splitTextToSize(`Note: ${page.name}`, maxWidth);
  titleLines.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 10;
  });
  yPos += 5;

  // Content
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');

  // Process content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = page.content || '';

  const childNodes = tempDiv.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    if (node.nodeName === 'IMG') {
      try {
        let imgSrc = node.dataset.src || node.src;

        // Try to get from IndexedDB
        if (node.dataset.imageId) {
          const dbSrc = await getNotebookImage(pageId, node.dataset.imageId);
          if (dbSrc) imgSrc = dbSrc;
        }

        if (imgSrc && imgSrc.startsWith('data:')) {
          const dimensions = await getImageDimensions(imgSrc);
          let imgWidth = Math.min(dimensions.width, maxWidth);
          let imgHeight = (imgWidth / dimensions.width) * dimensions.height;
          const maxHeight = 120;
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (imgHeight / dimensions.height) * dimensions.width;
          }

          if (yPos + imgHeight > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }

          doc.addImage(imgSrc, 'JPEG', margin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 10;
        }
      } catch (err) {
        console.warn('Could not add image to PDF:', err);
      }
    } else {
      const text = node.textContent || '';
      if (text.trim()) {
        const lines = doc.splitTextToSize(text, maxWidth);
        for (const line of lines) {
          if (yPos > doc.internal.pageSize.getHeight() - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin, yPos);
          yPos += 6;
        }
      }
    }
  }

  return doc.output('blob');
}

// Get all descendants of a folder (recursive)
function getAllDescendants(parentId) {
  const children = notebookItems.filter(i => i.parentId === parentId);
  let descendants = [...children];
  children.forEach(child => {
    if (child.type === 'folder') {
      descendants = descendants.concat(getAllDescendants(child.id));
    }
  });
  return descendants;
}

// Build folder path for an item
function getItemPath(itemId) {
  const parts = [];
  let current = notebookItems.find(i => i.id === itemId);

  while (current) {
    parts.unshift(current.name.replace(/[^a-z0-9 ]/gi, '_'));
    current = current.parentId ? notebookItems.find(i => i.id === current.parentId) : null;
  }

  return parts.join('/');
}

// Export a folder and all its contents as ZIP
async function exportFolderAsZip(folderId) {
  const folder = notebookItems.find(i => i.id === folderId && i.type === 'folder');
  if (!folder) return;

  const zip = new JSZip();
  const folderName = folder.name.replace(/[^a-z0-9 ]/gi, '_');

  // Get all items in this folder (recursive)
  const descendants = getAllDescendants(folderId);
  const pages = descendants.filter(i => i.type === 'page');

  if (pages.length === 0) {
    alert('This folder has no pages to export.');
    return;
  }

  // Show progress
  const totalPages = pages.length;
  let processed = 0;

  for (const page of pages) {
    const pdfBlob = await generatePagePDFBlob(page.id);
    if (pdfBlob) {
      // Get relative path from the folder
      const fullPath = getItemPath(page.id);
      const folderPath = getItemPath(folderId);
      let relativePath = fullPath;
      if (fullPath.startsWith(folderPath + '/')) {
        relativePath = fullPath.substring(folderPath.length + 1);
      }

      const safeName = page.name.replace(/[^a-z0-9 ]/gi, '_');
      zip.file(`${relativePath.replace(safeName, '')}Note_${safeName}.pdf`, pdfBlob);
    }
    processed++;
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}_Notes.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export all notebook items as ZIP
async function exportAllNotebook() {
  const allPages = notebookItems.filter(i => i.type === 'page');

  if (allPages.length === 0) {
    alert('No pages to export.');
    return;
  }

  const zip = new JSZip();

  for (const page of allPages) {
    const pdfBlob = await generatePagePDFBlob(page.id);
    if (pdfBlob) {
      const fullPath = getItemPath(page.id);
      const pathParts = fullPath.split('/');
      const pageName = pathParts.pop();
      const folderPath = pathParts.join('/');

      const safeName = page.name.replace(/[^a-z0-9 ]/gi, '_');
      const filePath = folderPath ? `${folderPath}/Note_${safeName}.pdf` : `Note_${safeName}.pdf`;
      zip.file(filePath, pdfBlob);
    }
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  a.download = `Notebook_Export_${timestamp}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/***********************
 * EVENT LISTENERS
 ***********************/
function setupNotebookEventListeners() {
  // Click outside to close context menu
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('notebookContextMenu');
    if (menu && !menu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // Keyboard shortcut: Ctrl+B to toggle sidebar
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      toggleNotebookSidebar();
    }
  });

  // Restore sidebar state
  const savedSidebarState = localStorage.getItem('notebookSidebarOpen');
  if (savedSidebarState === 'true') {
    toggleNotebookSidebar();
  }

  // Restore sidebar width
  const savedSidebarWidth = localStorage.getItem('notebookSidebarWidth');
  if (savedSidebarWidth) {
    document.documentElement.style.setProperty('--notebook-sidebar-width', savedSidebarWidth);
  }

  // Sidebar resize functionality
  setupSidebarResize();

  // Touch support for tree items
  const treeContainer = document.getElementById('notebookTree');
  if (treeContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    let touchedItem = null;

    treeContainer.addEventListener('touchstart', (e) => {
      const itemEl = e.target.closest('.notebook-tree-item');
      if (!itemEl) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      touchedItem = itemEl;

      // Long press for context menu
      longPressTimer = setTimeout(() => {
        const itemId = parseInt(itemEl.dataset.id);
        showContextMenu({ clientX: touchStartX, clientY: touchStartY }, itemId);
        touchedItem = null;
      }, 600);
    }, { passive: true });

    treeContainer.addEventListener('touchmove', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    treeContainer.addEventListener('touchend', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (!touchedItem) return;

      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 300) {
        // Short tap - trigger click
        const itemId = parseInt(touchedItem.dataset.id);
        const item = notebookItems.find(i => i.id === itemId);
        if (item) {
          if (item.type === 'page') {
            openPageModal(itemId);
          } else {
            toggleFolderExpand(itemId);
          }
        }
      }

      touchedItem = null;
    }, { passive: true });
  }

  // iOS touch support for page modal close
  const pageModal = document.getElementById('pageModal');
  if (pageModal) {
    const pageCloseBtn = pageModal.querySelector('.modal-close');
    if (pageCloseBtn) {
      pageCloseBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        closePageModal();
      });
    }

    pageModal.addEventListener('touchend', (e) => {
      if (e.target === pageModal) {
        e.preventDefault();
        closePageModal();
      }
    });
  }
}
