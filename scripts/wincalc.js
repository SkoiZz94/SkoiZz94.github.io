const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio",
  "Junho","Julho","Agosto","Setembro","Outubro",
  "Novembro","Dezembro"
];

/* ---------- Utilities ---------- */
function toMonday(date){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();                  // 0 Sun ... 6 Sat
  const diff = day === 0 ? -6 : (1 - day); // to Monday
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

/* clip to 07:00–19:00 and subtract 1h lunch when > 4h */
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

/* ---------- Time input formatting ---------- */
function normalizeTimeInput(raw){
  const val = raw.trim();
  if(!val) return "";

  // "8" or "18" -> "08:00" or "18:00"
  if(/^\d{1,2}$/.test(val)){
    const h = Number(val);
    if(h>=0 && h<=23) return `${String(h).padStart(2,'0')}:00`;
    return null;
  }

  // "HH:MM"
  if(/^\d{1,2}:\d{2}$/.test(val)){
    let [h,m] = val.split(':').map(Number);
    if(h>=0 && h<=23 && m>=0 && m<=59)
      return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    return null;
  }

  // "HMM" or "HHMM"
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

/* ---------- Week range ---------- */
function updateWeekRange(){
  const input = document.getElementById('week_date');
  if(!input.value) return;

  const d = new Date(input.value + 'T12:00:00');
  const mon = toMonday(d);
  const fri = addDays(mon,4);

  // show "Semana: 10 a 14 de Novembro (2025)"
  document.getElementById('week-range').textContent =
    `Semana: ${mon.getDate()} a ${fri.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()})`;

  // top simple date
  const today = new Date();
  document.getElementById("current-date").textContent =
    `Hoje é ${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`;
}

/* ---------- Holidays ---------- */
async function fetchWeekdayHolidaysForRange(year,start,end){
  try{
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PT`);
    if(!res.ok) throw new Error("Erro ao buscar feriados");
    const data = await res.json();
    return data.filter(h=>{
      const d = new Date(h.date);
      return d>=start && d<=end && d.getDay()>=1 && d.getDay()<=5 && !h.counties;
    });
  }catch(e){ console.error(e); return []; }
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
  const mon = toMonday(picked), fri = addDays(mon,4), year = mon.getFullYear();

  const feriados = await fetchWeekdayHolidaysForRange(year,mon,fri);
  const feriadosSemana = feriados.length;
  const diasFerias = Math.max(0, Math.min(5, parseInt(document.getElementById('vacation_days').value || '0',10)));

  // Sum valid hours Mon–Fri
  const rows = document.querySelectorAll('.times-grid .time-input');
  let totalHours = 0;
  for(let i=0;i<rows.length;i+=2){
    const h = effectiveHoursForDay(rows[i].value, rows[i+1].value);
    if(h>0) totalHours += h;
  }

  const availableDays = Math.max(0, 5 - feriadosSemana - diasFerias);

  // Helper to build thresholds row centered
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
    {
      ...evaluateRule("2 dias / 16h min", 16, 18, totalHours),
      thresholds: thresholdsRow(16, 18)
    },
    {
      ...evaluateRule("3 dias / 24h min", 24, 27, totalHours),
      thresholds: thresholdsRow(24, 27)
    }
  ];

  const feriadosList = feriadosSemana > 0
    ? `<ul>${feriados.map(f=>`<li>${fmtDateBR(new Date(f.date))}: ${f.localName}</li>`).join('')}</ul>`
    : "";

  const resultsHTML = `
    <h3>Semana: ${mon.getDate()} a ${fri.getDate()} de ${monthNames[mon.getMonth()]} (${mon.getFullYear()})</h3>
    <p>Feriados na semana: ${feriadosSemana}</p>${feriadosList}
    <p>Dias de férias: ${diasFerias}</p>
    <p>Dias úteis disponíveis: ${availableDays}</p>
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
    css = "compliance-red";    text = "Não conforme (abaixo do mínimo)";
  } else if(totalHours < yellowThreshold){
    css = "compliance-yellow"; text = "Conforme (zona amarela)";
  } else {
    css = "compliance-green";  text = "Conforme (zona verde)";
  }
  return { rule: label, css, text };
}
