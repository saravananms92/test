const API_KEY = "AIzaSyAn3gGQMz5-YEMVXi83pY3VNj5Tdd_V-yc";

let images = [];
let i = 0;
let startX = 0;

function openFolder(folderId) {
  fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents and mimeType contains 'image/'&key=${API_KEY}&fields=files(id)`)
    .then(res => res.json())
    .then(data => {
      images = data.files.map(f => `https://drive.google.com/uc?id=${f.id}`);
      i = 0;
      show();
      document.getElementById("viewer").style.display = "block";
    });
}

function closeViewer() {
  document.getElementById("viewer").style.display = "none";
}

function show() {
  const main = document.getElementById("mainImg");
  const thumbs = document.getElementById("thumbs");
  main.src = images[i];
  thumbs.innerHTML = "";

  images.forEach((img, idx) => {
    const t = document.createElement("img");
    t.src = img;
    if (idx === i) t.classList.add("active");
    t.onclick = () => { i = idx; show(); };
    thumbs.appendChild(t);
  });
}

function next() { i = (i + 1) % images.length; show(); }
function prev() { i = (i - 1 + images.length) % images.length; show(); }

/* Swipe */
const mainImg = document.getElementById("mainImg");

mainImg.addEventListener("touchstart", e => startX = e.touches[0].clientX);
mainImg.addEventListener("touchend", e => {
  let endX = e.changedTouches[0].clientX;
  if (startX - endX > 50) next();
  if (endX - startX > 50) prev();
});

/* Auto slide */
setInterval(() => {
  if (document.getElementById("viewer").style.display === "block") next();
}, 4000);


/************************************************
 * GLOBAL STATE
 ************************************************/
const DATA_URL = 'https://script.google.com/macros/s/AKfycbxpK-mCvnnjvKx7kYT8wGWaPyqOx_ky2SvHunhLzD5gbzv6fGy3QsZUmB6HdpvvN4LH/exec';
let dataGlobal = null;
let resizeTimer;

/************************************************
 * ADMIN SYSTEM
 ************************************************/
function openAdminLogin() {
  const pw = prompt("Enter Admin Password:");
  if (pw === "1234") {
    sessionStorage.setItem("admin", "true");
    location.reload();
  } else alert("Invalid Password");
}

function logout() {
  sessionStorage.removeItem("admin");
  location.reload();
}

function applyAdminUI() {
  const isAdmin = sessionStorage.getItem("admin") === "true";

  document.querySelectorAll('.adminOnly').forEach(el => {
    el.style.display = isAdmin ? "block" : "none";
  });

  document.querySelectorAll('.adminCol').forEach(col => {
    col.style.display = isAdmin ? "" : "none";
  });

  const loginBtn = document.getElementById("adminLoginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.style.display = isAdmin ? "none" : "inline-block";
  if (logoutBtn) logoutBtn.style.display = isAdmin ? "inline-block" : "none";
}

/************************************************
 * GOOGLE CHARTS
 ************************************************/
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(init);

/************************************************
 * INIT
 ************************************************/
function init() {
  fetchAndDrawCharts();
}

/************************************************
 * FETCH + BUILD
 ************************************************/
async function fetchAndDrawCharts() {
  try {
    let data;
    const cached = sessionStorage.getItem('placementData');

    if (cached) data = JSON.parse(cached);
    else {
      const res = await fetch(DATA_URL);
      data = await res.json();
      sessionStorage.setItem('placementData', JSON.stringify(data));
    }

    dataGlobal = data;

    updateKPIs(data);
    drawPlacementStatusChart(data);
    drawCompanyChart(data);
    drawProgrammeChart(data);
    drawCoreNonCoreChart(data);
    drawCompanyVsStudentsChart(data);
    drawTopPackageChart(data);
    drawPackageDistribution(data);

    populateStudentTable(data);
    populateProgrammeFilter();
    populateCompanyFilter();
    buildStudentGrid(data);

    applyAdminUI();

    document.getElementById("loading")?.style.setProperty("display", "none");

  } catch (e) {
    console.error(e);
    alert("Failed to load data");
  }
}

/************************************************
 * KPI
 ************************************************/
function updateKPIs(data) {
  const percent = data.eligibleStudents > 0
    ? ((data.placedCount / data.eligibleStudents) * 100).toFixed(1)
    : 0;

  const set = (id, v) => document.querySelector(`#${id} strong`) && (document.querySelector(`#${id} strong`).innerText = v);

  set("total", data.totalStudents || 0);
  set("opted", data.optedStudents || 0);
  set("eligible", data.eligibleStudents || 0);
  set("placed", data.placedCount || 0);
  set("percentage", percent + "%");
}

/************************************************
 * CHARTS
 ************************************************/
function drawPlacementStatusChart(data) {
  const table = google.visualization.arrayToDataTable([
    ['Status', 'Count'],
    ['Placed', data.placedCount || 0],
    ['Not Placed', (data.eligibleStudents || 0) - (data.placedCount || 0)]
  ]);

  new google.visualization.PieChart(statusChart).draw(table, { pieHole: .4 });
}

function drawCompanyChart(data) {
  const map = {};
  (data.placedStudents || []).forEach(s => map[s.type || "Unknown"] = (map[s.type || "Unknown"] || 0) + 1);

  const rows = [['Company Type', 'Count']];
  Object.keys(map).forEach(k => rows.push([k, map[k]]));

  new google.visualization.PieChart(companyChart)
    .draw(google.visualization.arrayToDataTable(rows), { pieHole: .4 });
}

function drawProgrammeChart(data) {
  if (!data.programmeCount) return;

  const rows = [['Programme', 'Placed', { role: 'annotation' }]];
  let max = 1;

  Object.entries(data.programmeCount).forEach(([k, v]) => {
    v = Number(v) || 0;
    max = Math.max(max, v);
    rows.push([k, v, v.toString()]);
  });

  new google.visualization.ColumnChart(programmeChart)
    .draw(google.visualization.arrayToDataTable(rows), { vAxis: { viewWindow: { max: max + 2 } } });
}

function drawCoreNonCoreChart(data) {
  if (!data.coreNonCoreCount) return;

  const rows = [['Programme', 'Core', { role: 'annotation' }, 'Non-Core', { role: 'annotation' }]];
  let max = 1;

  Object.entries(data.coreNonCoreCount).forEach(([k, v]) => {
    const c = Number(v.Core) || 0;
    const n = Number(v.NonCore) || 0;
    max = Math.max(max, c, n);
    rows.push([k, c, c.toString(), n, n.toString()]);
  });

  new google.visualization.ColumnChart(coreNonCoreChart)
    .draw(google.visualization.arrayToDataTable(rows), { vAxis: { viewWindow: { max: max + 2 } } });
}

function drawCompanyVsStudentsChart(data) {
  if (!data.Company_Filter?.length) return;

  const sorted = data.Company_Filter.map(r => ({
    company: r["Company Name"],
    count: Number(r["Total students placed"]) || 0
  })).filter(r => r.count > 0).sort((a, b) => b.count - a.count);

  const rows = [['Company', 'Students', { role: 'annotation' }]];
  let max = 1;

  sorted.forEach(s => {
    max = Math.max(max, s.count);
    rows.push([s.company, s.count, s.count.toString()]);
  });

  new google.visualization.ColumnChart(companyStudentsChart)
    .draw(google.visualization.arrayToDataTable(rows), { vAxis: { viewWindow: { max: max + 1 } } });
}

function drawTopPackageChart(data) {
  if (!data.topPackages) return;

  const rows = [['Student', 'Package', { role: 'annotation' }]];
  let max = 1;

  data.topPackages.forEach(s => {
    const v = Number(s.package) || 0;
    max = Math.max(max, v);
    rows.push([s.name, v, v + " LPA"]);
  });

  new google.visualization.ColumnChart(topPackageChart)
    .draw(google.visualization.arrayToDataTable(rows), { vAxis: { viewWindow: { max: max + 2 } } });
}

function drawPackageDistribution(data) {
  if (!data.placedStudents) return;

  let ranges = { "<3":0,"3-5":0,"5-8":0,"8-10":0,">10":0 };

  data.placedStudents.forEach(s => {
    const p = parseFloat(s.package||0);
    if(p<3)ranges["<3"]++; else if(p<5)ranges["3-5"]++; else if(p<8)ranges["5-8"]++;
    else if(p<=10)ranges["8-10"]++; else ranges[">10"]++;
  });

  const rows = [['Range','Students',{role:'annotation'}]];
  Object.entries(ranges).forEach(([k,v])=>rows.push([k,v,v.toString()]));

  new google.visualization.ColumnChart(packageDistChart)
    .draw(google.visualization.arrayToDataTable(rows), {});
}

/************************************************
 * TABLE + FILTERS
 ************************************************/
function populateStudentTable(data) {
  const tbody = document.getElementById("studentTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  (data.placedStudents||[]).forEach((s,i)=>{
    const tr=document.createElement("tr");
    tr.dataset.programme=s.programme||"";
    tr.dataset.company=s.company||"";
    tr.dataset.type=s.type||"";
    tr.dataset.package=s.package||0;

    tr.innerHTML=`
      <td>${i+1}</td>
      <td>${s.programme||""}</td>
      <td>${s.name||""}</td>
      <td>${s.company||""}</td>
      <td>${s.type||""}</td>
      <td>${s.package||""}</td>`;
    tbody.appendChild(tr);
  });
}

function populateProgrammeFilter() {
  const set=new Set();
  document.querySelectorAll("#studentTable tr").forEach(r=>set.add(r.dataset.programme));
  const sel=document.getElementById("filterProgramme");
  if(!sel)return;
  sel.innerHTML='<option value="">All</option>';
  set.forEach(v=>sel.innerHTML+=`<option>${v}</option>`);
}

function populateCompanyFilter() {
  const set=new Set();
  document.querySelectorAll("#studentTable tr").forEach(r=>set.add(r.dataset.company));
  const sel=document.getElementById("filterCompany");
  if(!sel)return;
  sel.innerHTML='<option value="">All</option>';
  set.forEach(v=>sel.innerHTML+=`<option>${v}</option>`);
}

/************************************************
 * GRID
 ************************************************/
function buildStudentGrid(data){
  const g=document.getElementById("studentGrid");
  if(!g)return;
  g.innerHTML="";
  (data.placedStudents||[]).forEach(s=>{
    g.innerHTML+=`<div class="student-card">${s.name}</div>`;
  });
}

/************************************************
 * RESIZE
 ************************************************/
window.addEventListener("resize",()=>{
  if(!dataGlobal)return;
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>fetchAndDrawCharts(),300);
});
