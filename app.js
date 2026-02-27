// --- Stockage local ---
const STORAGE_KEY = "simple_health_tracker_v1";
// data = { "YYYY-MM-DD": { sport:bool, creatine:bool, mag_am:bool, mag_pm:bool, whey:bool, water:bool } }

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Dates / format ---
const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

function pad2(n){ return String(n).padStart(2,"0"); }
function keyOfDate(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function niceDateFR(d){
  const dd = d.getDate();
  const mm = MONTHS_FR[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

// --- Score sur 5 ---
// Magnésium = 1 item validé seulement si matin ET soir.
function scoreOn5(entry){
  if(!entry) return 0;
  let s = 0;
  if(entry.sport) s++;
  if(entry.creatine) s++;
  if(entry.whey) s++;
  if(entry.water) s++;
  if(entry.mag_am && entry.mag_pm) s++;
  return s; // 0..5
}
function colorClass(score){
  return `c${score}`; // c0..c5
}

// --- UI refs ---
const grid = document.getElementById("grid");
const monthLabel = document.getElementById("monthLabel");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

// Modal refs
const modal = document.getElementById("modal");
const modalDate = document.getElementById("modalDate");
const closeModal = document.getElementById("closeModal");
const saveBtn = document.getElementById("saveBtn");
const scoreLabel = document.getElementById("scoreLabel");

const chk_sport = document.getElementById("chk_sport");
const chk_creatine = document.getElementById("chk_creatine");
const chk_mag_am = document.getElementById("chk_mag_am");
const chk_mag_pm = document.getElementById("chk_mag_pm");
const chk_whey = document.getElementById("chk_whey");
const chk_water = document.getElementById("chk_water");

// --- State ---
let data = loadData();
let cursor = new Date();              // mois affiché
cursor.setDate(1);
let selectedDate = null;              // Date object

// --- Rendering calendar ---
function render(){
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  monthLabel.textContent = `${MONTHS_FR[month]} ${year}`;

  grid.innerHTML = "";

  const firstDay = new Date(year, month, 1);
  // Lundi=0 ... Dimanche=6
  const jsDow = firstDay.getDay(); // 0=dimanche ... 6=samedi
  const mondayIndex = (jsDow + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // cases vides avant le 1er
  for(let i=0;i<mondayIndex;i++){
    const cell = document.createElement("div");
    cell.className = "day disabled";
    grid.appendChild(cell);
  }

  for(let d=1; d<=daysInMonth; d++){
    const dateObj = new Date(year, month, d);
    const key = keyOfDate(dateObj);
    const entry = data[key];
    const sc = scoreOn5(entry);

    const cell = document.createElement("div");
    cell.className = `day ${colorClass(sc)}`;
    cell.dataset.key = key;

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = String(d);

    const badge = document.createElement("div");
    badge.className = "dayBadge";
    badge.textContent = `${sc}/5`;

    cell.appendChild(num);
    cell.appendChild(badge);

    cell.addEventListener("click", () => openDay(dateObj));
    grid.appendChild(cell);
  }
}

// --- Modal logic ---
function setChecksFromEntry(entry){
  chk_sport.checked = !!entry?.sport;
  chk_creatine.checked = !!entry?.creatine;
  chk_mag_am.checked = !!entry?.mag_am;
  chk_mag_pm.checked = !!entry?.mag_pm;
  chk_whey.checked = !!entry?.whey;
  chk_water.checked = !!entry?.water;
  updateScoreLabel();
}

function entryFromChecks(){
  return {
    sport: chk_sport.checked,
    creatine: chk_creatine.checked,
    mag_am: chk_mag_am.checked,
    mag_pm: chk_mag_pm.checked,
    whey: chk_whey.checked,
    water: chk_water.checked
  };
}

function updateScoreLabel(){
  const sc = scoreOn5(entryFromChecks());
  scoreLabel.textContent = `${sc}/5`;
}

[chk_sport, chk_creatine, chk_mag_am, chk_mag_pm, chk_whey, chk_water]
  .forEach(el => el.addEventListener("change", updateScoreLabel));

function openDay(dateObj){
  selectedDate = dateObj;
  const key = keyOfDate(dateObj);
  modalDate.textContent = niceDateFR(dateObj);
  setChecksFromEntry(data[key] || null);
  modal.classList.remove("hidden");
}

function closeDay(){
  modal.classList.add("hidden");
  selectedDate = null;
}

closeModal.addEventListener("click", closeDay);
modal.addEventListener("click", (e) => {
  if(e.target === modal) closeDay();
});

saveBtn.addEventListener("click", () => {
  if(!selectedDate) return;
  const key = keyOfDate(selectedDate);
  data[key] = entryFromChecks();
  saveData(data);
  closeDay();
  render();
});

// --- Nav month ---
prevBtn.addEventListener("click", () => {
  cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  render();
});
nextBtn.addEventListener("click", () => {
  cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  render();
});

// --- Init ---
render();
