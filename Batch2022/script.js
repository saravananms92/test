function switchBatch(folder) {
  if (!folder) return;
  window.location.href = "../" + folder + "/";
}

function setCurrentBatch() {
  const path = window.location.pathname.toLowerCase();

  const select = document.getElementById("batchSwitcher");
  if (!select) return;

  if (path.includes("batch2022")) {
    select.value = "Batch2022";
  } else if (path.includes("batch2023")) {
    select.value = "Batch2023";
  }
}

window.addEventListener("load", setCurrentBatch);

/************************************************
 * ADMIN SYSTEM (SINGLE SOURCE)
 ************************************************/
function openAdminLogin() {
  const pw = prompt("Enter Admin Password:");

  if (pw === "1234") {
    sessionStorage.setItem("admin", "true");
    applyAdminUI();
    location.reload(); // ✅ auto refresh
  } else {
    alert("Invalid Password");
  }
}

function logout() {
  sessionStorage.removeItem("admin");
  applyAdminUI();
  location.reload(); // ✅ auto refresh
}

function applyAdminUI() {
  const isAdmin = sessionStorage.getItem("admin") === "true";

  document.querySelectorAll('.adminOnly').forEach(el => {
    el.style.display = isAdmin ? "block" : "none";
  });

  document.getElementById("adminLoginBtn").style.display = isAdmin ? "none" : "inline-block";
  document.getElementById("logoutBtn").style.display = isAdmin ? "inline-block" : "none";

  toggleAdminView(isAdmin);
}

function toggleAdminView(isAdmin) {
  document.querySelectorAll('.adminCol').forEach(col => {
    col.style.display = isAdmin ? "" : "none";
  });
}

/************************************************
 * GOOGLE CHARTS LOADER
 ************************************************/
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(init);

/************************************************
 * GLOBAL VARIABLES
 ************************************************/
const DATA_URL = 'https://script.google.com/macros/s/AKfycbxpK-mCvnnjvKx7kYT8wGWaPyqOx_ky2SvHunhLzD5gbzv6fGy3QsZUmB6HdpvvN4LH/exec';
let dataGlobal = null;

/************************************************
 * INIT
 ************************************************/
function init() {
  fetchAndDrawCharts();
}

/************************************************
 * FETCH DATA AND DRAW ALL CHARTS
 ************************************************/
async function fetchAndDrawCharts() {
  try {
    console.log('Fetching placement data...');

    const response = await fetch(DATA_URL, { mode: 'cors' });
    if (!response.ok) throw new Error('HTTP error ' + response.status);

    const data = await response.json();
    console.log('DATA RECEIVED:', data);

    dataGlobal = data;

    updateKPIs(data);
    drawPlacementStatusChart(data);
    drawCompanyChart(data);
    drawProgrammeChart(data);
    drawCoreNonCoreChart(data);
    drawCompanyVsStudentsChart(data);
    drawTopPackageChart(data);
    populateStudentTable(data);

    // Apply admin UI based on session
    applyAdminUI();

  } catch (err) {
    console.error('FETCH ERROR:', err);
    document.body.insertAdjacentHTML(
      'afterbegin',
      "<p style='color:red;text-align:center'>⚠ Failed to load placement data</p>"
    );
  }
}

/************************************************
 * KPI CARDS
 ************************************************/
function updateKPIs(data) {
  const percent =
    data.eligibleStudents > 0
      ? ((data.placedCount / data.eligibleStudents) * 100).toFixed(1)
      : 0;

  const set = (id, value) => {
    const el = document.querySelector(`#${id} strong`);
    if (el) el.innerText = value;
  };

  set("total", data.totalStudents || 0);
  set("opted", data.optedStudents || 0);
  set("eligible", data.eligibleStudents || 0);
  set("placed", data.placedCount || 0);
  set("percentage", percent + "%");
}

/************************************************
 * CHART FUNCTIONS
 ************************************************/
function drawPlacementStatusChart(data) {
  const rows = [
    ['Status', 'Count'],
    ['Placed', data.placedCount || 0],
    ['Not Placed', (data.eligibleStudents || 0) - (data.placedCount || 0)]
  ];

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.PieChart(document.getElementById('statusChart')).draw(table, {
    title: 'Placement Status',
    pieHole: 0.4,
    chartArea: { width: '75%', height: '75%' }
  });
}

function drawCompanyChart(data) {
  const map = {};
  (data.placedStudents || []).forEach(s => {
    const type = s.type || 'Unknown';
    map[type] = (map[type] || 0) + 1;
  });

  const rows = [['Company Type', 'Count']];
  Object.keys(map).forEach(k => rows.push([k, map[k]]));

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.PieChart(document.getElementById('companyChart')).draw(table, {
    title: 'Company Type Distribution',
    pieHole: 0.4,
    chartArea: { width: '75%', height: '75%' }
  });
}

function drawProgrammeChart(data) {
  const container = document.getElementById('programmeChart');
  if (!data.programmeCount || Object.keys(data.programmeCount).length === 0) {
    container.innerHTML = '<b>No Programme data available</b>';
    return;
  }

  const colors = ['#0aa1d8', '#9c312c'];
  const rows = [['Programme', 'Placed Students', { role: 'style' }]];

  let i = 0;
  for (const p in data.programmeCount) {
    rows.push([p, Number(data.programmeCount[p]) || 0, colors[i % colors.length]]);
    i++;
  }

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.ColumnChart(container).draw(table, {
    height: 420,
    chartArea: { left: 80, top: 60, width: '65%', height: '60%' },
    vAxis: { title: 'Placed Students', minValue: 0 },
    legend: { position: 'none' }
  });
}

function drawCoreNonCoreChart(data) {
  const el = document.getElementById('coreNonCoreChart');
  if (!el || !data.coreNonCoreCount) return;

  const rows = [['Programme', 'Core', 'Non-Core']];
  Object.keys(data.coreNonCoreCount).forEach(p => {
    rows.push([p, data.coreNonCoreCount[p].Core, data.coreNonCoreCount[p].NonCore]);
  });

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.ColumnChart(el).draw(table, {
    height: 420,
    chartArea: { left: 80, top: 60, width: '65%', height: '60%' },
    vAxis: { title: 'No. of Students', minValue: 0 },
    colors: ['#c1ca51', '#c55885'],
    legend: { position: 'bottom' },
    bar: { groupWidth: '55%' }
  });
}

function drawCompanyVsStudentsChart(data) {
  const container = document.getElementById('companyStudentsChart');
  if (!container) return;

  if (!data.Company_Filter || data.Company_Filter.length === 0) {
    container.innerHTML = '<b>No company placement data available</b>';
    return;
  }

  const sortedData = data.Company_Filter
    .map(row => ({ company: row['Company Name'], count: Number(row['Total students placed']) || 0 }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const colors = [
    "#0d6efd", "#198754", "#dc3545", "#fd7e14", "#6f42c1",
    "#20c997", "#0dcaf0", "#6610f2", "#adb5bd", "#212529",
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
    "#393b79", "#637939", "#8c6d31", "#843c39", "#7b4173",
    "#3182bd", "#31a354", "#756bb1", "#636363", "#e6550d"
  ];

  const rows = [['Company', 'Students Placed', { role: 'annotation' }, { role: 'style' }]];
  sortedData.forEach((item, i) => {
    rows.push([item.company, item.count, item.count.toString(), `color: ${colors[i % colors.length]}`]);
  });

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.ColumnChart(container).draw(table, {
    title: 'Company-wise Student Placements',
    height: 500,
    chartArea: { left: 80, top: 60, width: '60%', height: '65%' },
    vAxis: { title: 'Total Students Placed', minValue: 0 },
    legend: { position: 'none' },
    annotations: { alwaysOutside: true }
  });

  drawCompanyLegend(sortedData, colors);
}

function drawCompanyLegend(data, colors) {
  const legendContainer = document.getElementById('companyLegend');
  if (!legendContainer) return;

  legendContainer.innerHTML = '<b>Companies</b><br>';
  data.forEach((item, i) => {
    const color = colors[i % colors.length];
    legendContainer.innerHTML += `
      <div style="display:flex;align-items:center;margin-bottom:6px">
        <span style="width:14px;height:14px;background:${color};display:inline-block;margin-right:8px"></span>
        <span style="font-size:13px">${item.company}</span>
      </div>
    `;
  });
}

function drawTopPackageChart(data) {
  const container = document.getElementById('topPackageChart');
  if (!data.topPackages || data.topPackages.length === 0) {
    container.innerHTML = '<b>No package data available</b>';
    return;
  }

  const colors = ['#1b9e77','#d95f02','#7570b3','#e7298a','#66a61e'];
  const rows = [['Student','Package',{ role: 'annotation' },{ role: 'style' }]];
  data.topPackages.forEach((s, i) => {
    rows.push([s.name, Number(s.package) || 0, s.package + ' LPA', colors[i]]);
  });

  const table = google.visualization.arrayToDataTable(rows);
  new google.visualization.ColumnChart(container).draw(table, {
    height: 400,
    chartArea: { left: 60, top: 60, width: '60%', height: '70%' },
    vAxis: { title: 'Package (LPA)', minValue: 0 },
    legend: { position: 'none' },
    annotations: { alwaysOutside: true }
  });
}

/************************************************
 * SEARCH FUNCTION
 ************************************************/
function searchTable() {
  const input = document.getElementById("studentSearch");
  const filter = input.value.toLowerCase();
  const tbody = document.getElementById("studentTable");
  if (!tbody) return;

  Array.from(tbody.getElementsByTagName("tr")).forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(filter) ? "" : "none";
  });
}

/************************************************
 * POPULATE STUDENT TABLE
 ************************************************/
// ───────── Helper for Safe Photo URL ─────────
function getPhotoUrl(photo) {
  // If photo is empty or invalid, you can show a placeholder image
  return photo && photo.trim() !== ""
    ? photo
    : "img/default-user.png"; // optional default photo
}
// ───────── Populate Placed Students Table ─────────
function populateStudentTable(data) {
  const tbody = document.getElementById('studentTable');
  if (!tbody) return;

  tbody.innerHTML = '';

  (data.placedStudents || []).forEach((s, i) => {
    
    // Offer letter HTML
    const offerLink = s.offerLetterUrl
      ? `<a href="${s.offerLetterUrl}" target="_blank">View</a>`
      : 'N/A';

    // Photo URL — use direct link from JSON
    const photoUrl = getPhotoUrl(s.photo);
    
    // Create table row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.programme || ''}</td>
      <td>${s.registerNo || ''}</td>
      <td>${s.name || ''}</td>
      <td>
        <img src="${photoUrl}" alt="${s.name || ""}" loading="lazy" class="stud-photo">
      </td>
      <td>${s.company || ''}</td>
      <td>${s.type || ''}</td>
      <td>${s.package || ''}</td>
      <td class="adminCol">${offerLink}</td>
    `;
    tbody.appendChild(tr);
  });

  // Apply admin toggle immediately
  const isAdmin = sessionStorage.getItem("admin") === "true";
  toggleAdminView(isAdmin);
}

/************************************************
 * WINDOW RESIZE REDRAW
 ************************************************/
window.addEventListener('resize', () => {
  if (!dataGlobal) return;
  drawProgrammeChart(dataGlobal);
  drawTopPackageChart(dataGlobal);
  drawPlacementStatusChart(dataGlobal);
  drawCompanyChart(dataGlobal);
  drawCompanyVsStudentsChart(dataGlobal);
});

/************************************************
 * DOWNLOAD CHART FUNCTION
 ************************************************/
function downloadChart(chartId, filename) {
  const chartDiv = document.getElementById(chartId);
  if (!chartDiv) return alert("Chart not found!");

  const svg = chartDiv.getElementsByTagName("svg")[0];
  if (!svg) return alert("Chart not ready yet!");

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svg);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const imgURI = canvas.toDataURL("image/jpeg");
    const a = document.createElement("a");
    a.download = filename;
    a.href = imgURI;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.src = url;
}
