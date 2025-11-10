const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio",
  "Junho","Julho","Agosto","Setembro","Outubro",
  "Novembro","Dezembro"
];

/* ---------- Utilities ---------- */
function toMonday(date){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : (1 - day);
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(date, n){
  const d = new Date(date);
  d.setDate(d.getDate()+n);
  return d;
}
function fmtDateBR(d){ return d.toLocaleDateString('pt-BR'); }
function formatHoursDecimalToHM(hours){
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h${String(m).padStart(2,'0')}`;
}

/* ---------- ISO Week ---------- */
function getISOWeek(date){
  const tmp = new Date(date);
  tmp.setHours(0,0,0,0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  const firstThursday = new Date(tmp.getFullYear(), 0, 4);
  return 1 + Math.round(((tmp - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
}

/* ---------- Time formatting ---------- */
function normalizeTimeInput(raw){
  const val = raw.trim();
  if(!val) return "";
  if(/^\d{1,2}$/.test(val)){
    const h = Number(val);
    if(h>=0 && h<=23) return `${String(h).padStart(2,'0')}:00`;
    return null;
  }
  if(/^\d{1,2}:\d{2}$/.test(val)){
    let [h,m] = val.split(':').map(Number);
    if(h>=0 && h<=23 && m>=0 && m<=59)
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    return null;
  }
  if(/^\d{3,4}$/.test(val)){
    let h,m;
    if(val.length===3){ h=Number(val.slice(0,1)); m=Number(val.slice(1)); }
    else { h=Number(val.slice(0,2)); m=Number(val.slice(2)); }
    if(h>=0 && h<=23 && m>=0 && m<=59)
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    return null;
  }
  return null;
}
function parseTime(val){
  if(!val || !/^\d{2}:\d{2}$/.test(val)) return null;
  const [h,m] = val.split(':').map(Number);
  if(h<0 || h>23 || m<0 || m>59) return null;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function attachTimeAutoFormat(){
  document.querySelectorAll('.time-input').forEach(inp=>{
    inp.addEventListener('input', ()=>{
      inp.value = inp.value.replace(/[^\d:]/g,'');
    });
    inp.addEventListener('blur', ()=>{
      const norm = normalizeTimeInput(inp.value);
      if(norm === null && inp.value.trim()!==""){
        inp.classList.add('invalid');
      } else {
        inp.classList.remove('invalid');
        inp.value = norm || "";
      }
    });
  });
}

/* ---------- Effective hours within 07:00–19:00, minus 1h lunch if >4h ---------- */
function effectiveHoursForDay(entryStr, exitStr){
  const e = parseTime(entryStr);
  const x = parseTime(exitStr);
  if(!e || !x) return 0;

  const entry = new Date(`1970-01-01T${e}:00`);
  const exit  = new Date(`1970-01-01T${x}:00`);
  const start = new Date(`1970-01-01T07:00:00`);
  const end   = new Date(`1970-01-01T19:00:00`);

  const validStart = entry < start ? start : entry;
  const validEnd   = exit  > end   ? end   : exit;

  let diff = Math.max(0, (validEnd - validStart) / 3600000);
  if(diff > 4) diff -= 1; // 1h lunch
  return Math.max(0, diff);
}

/* ---------- Holidays ---------- */
async function fetchWeekdayHolidaysForRange(start, end){
  try {
    const yearStart = start.getFullYear();
    const yearEnd = end.getFullYear();
    const urls = (yearStart === yearEnd)
      ? [`https://date.nager.at/api/v3/PublicHolidays/${yearStart}/PT`]
      : [
          `https://date.nager.at/api/v3/PublicHolidays/${yearStart}/PT`,
          `https://date.nager.at/api/v3/PublicHolidays/${yearEnd}/PT`
        ];

    const responses = await Promise.all(urls.map(u => fetch(u).then(r => r.ok ? r.json() : [])));
    const data = responses.flat();

    return data.filter(h => {
      const d = new Date(h.date);
      return (d >= start && d <= end && d.getDay() >= 1 && d.getDay() <= 5 && !h.counties);
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ---------- Build week grid ---------- */
async function updateWeekRange(){
  const input = document.getElementById('week_date');
  if(!input.value) return;

  const d = new Date(input.value + 'T12:00:00');
  const mon = toMonday(d);
  const fri = addDays(mon,4);
  const weekNum = getISOWeek(mon);

  const label = (mon.getMonth() === fri.getMonth() && mon.getFullYear() === fri.getFullYear())
    ? `Semana: ${mon.getDate()} a ${fri.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()}) - W${String(weekNum).padStart(2,'0')}`
    : `Semana: ${mon.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()}) a ${fri.getDate()} de ${monthNames[fri.getMonth()]} (${fri.getFullYear()}) - W${String(weekNum).padStart(2,'0')}`;
  document.getElementById('week-range').textContent = label;

  const today = new Date();
  document.getElementById("current-date").textContent =
    `Hoje é ${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`;

  const holidays = await fetchWeekdayHolidaysForRange(mon, fri);

  const grid = document.querySelector('.times-grid');
  grid.innerHTML = "";

  const dayNames = ["Segunda","Terça","Quarta","Quinta","Sexta"];

  for (let i = 0; i < dayNames.length; i++) {
    const date = addDays(mon, i);

    const col = document.createElement("div");
    col.className = "day-col";

    const feriasLabel = document.createElement("label");
    feriasLabel.className = "ferias-label";
    const feriasBox = document.createElement("input");
    feriasBox.type = "checkbox";
    feriasBox.className = "ferias-check";
    feriasLabel.append(feriasBox, " Férias");

    const entry = document.createElement("input");
    entry.type = "text";
    entry.className = "time-input";
    entry.placeholder = "00:00";

    const exit = document.createElement("input");
    exit.type = "text";
    exit.className = "time-input";
    exit.placeholder = "00:00";

    const holiday = holidays.find(h => new Date(h.date).toDateString() === date.toDateString());
    if (holiday) {
      col.classList.add("holiday-day", "holiday-row");
      col.innerHTML = `${dayNames[i]} (${date.getDate()} de ${monthNames[date.getMonth()]}) <span class="holiday-label">(Feriado — ${holiday.localName})</span>`;
      [entry, exit].forEach(inp => {
        inp.disabled = true;
        inp.classList.add("disabled-holiday");
      });
      feriasBox.disabled = true;               // no vacation on holiday
      feriasLabel.style.opacity = "0.4";
    } else {
      col.textContent = `${dayNames[i]} (${date.getDate()} de ${monthNames[date.getMonth()]})`;
    }

    // Vacation toggle (add blue tint background too)
    feriasBox.addEventListener("change", () => {
      const isVacation = feriasBox.checked;
      [entry, exit].forEach(inp => {
        inp.disabled = isVacation;
        inp.classList.toggle("disabled-vacation", isVacation);
      });
      col.classList.toggle("vacation-day", isVacation);
      col.classList.toggle("vacation-row", isVacation); // blue background tint
    });

    grid.append(col, feriasLabel, entry, exit);
  }

  attachTimeAutoFormat();
}

/* ---------- Init ---------- */
(function init(){
  const dateInput = document.getElementById('week_date');
  const today = new Date();
  dateInput.value = today.toISOString().slice(0,10);
  updateWeekRange();
  attachTimeAutoFormat();
  dateInput.addEventListener('change', updateWeekRange);
  document.getElementById("current-date").textContent =
    `Hoje é ${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`;
})();

/* ---------- Submit ---------- */
document.getElementById('holidayForm').onsubmit = async function(e){
  e.preventDefault();

  const picked = new Date(document.getElementById('week_date').value + 'T12:00:00');
  const mon = toMonday(picked), fri = addDays(mon,4);
  const weekNum = getISOWeek(mon);
  const feriados = await fetchWeekdayHolidaysForRange(mon, fri);

  const feriadosSemana = feriados.length;
  const feriasBoxes = document.querySelectorAll('.ferias-check');
  const diasFerias = Array.from(feriasBoxes).filter(b => b.checked).length;

  const inputs = Array.from(document.querySelectorAll('.time-input'));
  let totalHours = 0;
  let diasPresentes = 0;

  // ✅ FIX: there are 2 time inputs per day → step by 2
  for (let i = 0; i < inputs.length; i += 2) {
    const entry = inputs[i];
    const exit  = inputs[i+1];
    if (!entry || !exit || entry.disabled || exit.disabled) continue;

    const h = effectiveHoursForDay(entry.value, exit.value);
    if (h > 0) {
      totalHours += h;
      diasPresentes++;
    }
  }

  const availableDays = Math.max(0, 5 - feriadosSemana - diasFerias);

  const thresholdsRow = (min, yellow) => `
    <div class="thresholds">
      <span class="compliance-red">&lt;${min}h</span>
      <span class="sep">—</span>
      <span class="compliance-yellow">≥${min}h &amp; &lt;${yellow}h</span>
      <span class="sep">—</span>
      <span class="compliance-green">≥${yellow}h</span>
    </div>
  `;

  const evaluations = [
    { ...evaluateRule("2 dias", 16, 18, totalHours), thresholds: thresholdsRow(16, 18) },
    { ...evaluateRule("3 dias", 24, 27, totalHours), thresholds: thresholdsRow(24, 27) }
  ];

  const feriadosList = feriadosSemana > 0
    ? `<ul>${feriados.map(f=>`<li>${fmtDateBR(new Date(f.date))}: ${f.localName}</li>`).join('')}</ul>`
    : "";

  const weekLabel =
    (mon.getMonth() === fri.getMonth() && mon.getFullYear() === fri.getFullYear())
      ? `Semana: ${mon.getDate()} a ${fri.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()}) - W${String(weekNum).padStart(2,'0')}`
      : `Semana: ${mon.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()}) a ${fri.getDate()} de ${monthNames[fri.getMonth()]} (${fri.getFullYear()}) - W${String(weekNum).padStart(2,'0')}`;

  const resultsHTML = `
    <h3>${weekLabel}</h3>
    <p>Feriados na semana: ${feriadosSemana}</p>${feriadosList}
    <p>Dias de férias: ${diasFerias}</p>
    <p>Dias úteis disponíveis: ${availableDays}</p>
    <p><strong>Dias Presentes no Office:</strong> ${diasPresentes}</p>
    <hr>
    <div class="results-row">
      ${evaluations.map(ev=>`
        <div class="result-box">
          <h4>${ev.rule}</h4>
          ${ev.thresholds}
          <hr style="border:none;border-top:1px solid #444;margin:10px 0;">
          <p>Total de horas válidas: ${formatHoursDecimalToHM(totalHours)}</p>
          <p>Status: <span class="${ev.css}">${ev.text}</span></p>
        </div>
      `).join('')}
    </div>
    <small>* Contabilizam-se apenas horas entre 07:00 e 19:00. Se o dia tiver mais de 4h, é deduzida 1h de almoço.</small>
  `;

  document.getElementById('results').innerHTML = resultsHTML;
};

function evaluateRule(label,minHours,yellowThreshold,totalHours){
  let css,text;
  if(totalHours < minHours){
    css = "compliance-red"; text = "Não conforme (abaixo do mínimo)";
  } else if(totalHours < yellowThreshold){
    css = "compliance-yellow"; text = "Conforme (zona amarela)";
  } else {
    css = "compliance-green"; text = "Conforme (zona verde)";
  }
  return { rule: label, css, text };
}
