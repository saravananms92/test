/************************************************
 * GOOGLE CHARTS LOADER
 ************************************************/
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(init);

/************************************************
 * GLOBAL VARIABLES
 ************************************************/
const DATA_URL = 'https://script.google.com/macros/s/AKfycbxpK-mCvnnjvKx7kYT8wGWaPyqOx_ky2SvHunhLzD5gbzv6fGy3QsZUmB6HdpvvN4LH/exec'; // <-- Replace with your deployed web app URL
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
  document.getElementById('total').innerText =
    `Total Students\n${data.totalStudents || 0}`;
  document.getElementById('opted').innerText =
    `Opted Placement\n${data.optedStudents || 0}`;
  document.getElementById('eligible').innerText =
    `Eligible Students\n${data.eligibleStudents || 0}`;
  document.getElementById('placed').innerText =
    `Placed Students\n${data.placedCount || 0}`;

function updateKPIs(data) {
  document.querySelector('#total strong').innerText = data.totalStudents || 0;
  document.querySelector('#opted strong').innerText = data.optedStudents || 0;
  document.querySelector('#eligible strong').innerText = data.eligibleStudents || 0;
  document.querySelector('#placed strong').innerText = data.placedCount || 0;
  document.querySelector('#percentage strong').innerText = percent + "%";
}
  const percent =
    data.optedStudents > 0
      ? ((data.placedCount / data.eligibleStudents) * 100).toFixed(1)
      : 0;
  document.getElementById('percentage').innerText =
    `Placement %\n${percent}%`;
}

/************************************************
 * PLACEMENT STATUS PIE CHART
 ************************************************/
function drawPlacementStatusChart(data) {
  const rows = [
    ['Status', 'Count'],
    ['Placed', data.placedCount || 0],
    ['Not Placed', (data.optedStudents || 0) - (data.placedCount || 0)]
  ];

  const table = google.visualization.arrayToDataTable(rows);

  new google.visualization.PieChart(
    document.getElementById('statusChart')
  ).draw(table, {
    title: 'Placement Status',
    pieHole: 0.4,
    chartArea: { width: '75%', height: '75%' }
  });
}

/************************************************
 * COMPANY TYPE PIE CHART
 ************************************************/
function drawCompanyChart(data) {
  const map = {};

  (data.placedStudents || []).forEach(s => {
    const type = s.type || 'Unknown';
    map[type] = (map[type] || 0) + 1;
  });

  const rows = [['Company Type', 'Count']];
  Object.keys(map).forEach(k => rows.push([k, map[k]]));

  const table = google.visualization.arrayToDataTable(rows);

  new google.visualization.PieChart(
    document.getElementById('companyChart')
  ).draw(table, {
    title: 'Company Type Distribution',
    pieHole: 0.4,
    chartArea: { width: '75%', height: '75%' }
  });
}

/************************************************
 * PROGRAMME-WISE PLACEMENT (VERTICAL BAR)
 ************************************************/
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
    vAxis: { title: 'Placed Students', minValue: 0, format: '0' },
    legend: { position: 'none' }
  });
}

/************************************************
 * CORE vs NON-CORE (GROUPED BAR)
 ************************************************/
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

/************************************************
 * COMPANY vs STUDENTS PLACED
 ************************************************/
function drawCompanyVsStudentsChart(data) {
  const container = document.getElementById('companyStudentsChart');
  if (!container) return;

  if (!data.Company_Filter || data.Company_Filter.length === 0) {
    container.innerHTML = '<b>No company placement data available</b>';
    return;
  }

  const sortedData = data.Company_Filter
    .map(row => ({
      company: row['Company Name'],
      count: Number(row['Total students placed']) || 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const colors = [
    '#0d6efd','#198754','#dc3545','#fd7e14','#6f42c1',
    '#20c997','#0dcaf0','#6610f2','#adb5bd','#212529'
  ];

  const rows = [['Company', 'Students Placed', { role: 'annotation' }, { role: 'style' }]];
  sortedData.forEach((item, i) => {
    rows.push([item.company, item.count, item.count.toString(), `color: ${colors[i % colors.length]}`]);
  });

  const table = google.visualization.arrayToDataTable(rows);

  const options = {
    title: 'Company-wise Student Placements',
    height: 500,
    chartArea: { left: 80, top: 60, width: '60%', height: '65%' },
    vAxis: { title: 'Total Students Placed', minValue: 0 },
    hAxis: { title: 'Company Name', slantedText: true, slantedTextAngle: 45 },
    legend: { position: 'none' },
    annotations: { alwaysOutside: true }
  };

  new google.visualization.ColumnChart(container).draw(table, options);
  drawCompanyLegend(sortedData, colors);
}

/************************************************
 * COMPANY LEGEND
 ************************************************/
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

/************************************************
 * TOP 5 HIGHEST PACKAGES
 ************************************************/
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
 * SEARCH STUDENTS
 ************************************************/
function searchTable() {
  const input = document.getElementById("studentSearch");
  const filter = input.value.toLowerCase();
  const tbody = document.getElementById("studentTable");
  if (!tbody) return;

  Array.from(tbody.getElementsByTagName("tr")).forEach(row => {
    const rowText = row.innerText.toLowerCase();
    row.style.display = rowText.includes(filter) ? "" : "none";
  });
}

/************************************************
 * STUDENT TABLE
 ************************************************/
function populateStudentTable(data) {
  const tbody = document.getElementById('studentTable');
  if (!tbody) return;

  tbody.innerHTML = '';
  (data.placedStudents || []).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${s.programme}</td>
      <td>${s.name}</td>
      <td>${s.company}</td>
      <td>${s.type}</td>
    `;
    tbody.appendChild(tr);
  });
}

/************************************************
 * RESPONSIVE REDRAW ON WINDOW RESIZE
 ************************************************/
window.addEventListener('resize', () => {
  if (!dataGlobal) return;
  drawProgrammeChart(dataGlobal);
  drawTopPackageChart(dataGlobal);
  drawPlacementStatusChart(dataGlobal);
  drawCompanyChart(dataGlobal);
  drawCompanyVsStudentsChart(dataGlobal);
});

/*****""*******""*****Download chart***"”********"""""*****/
function downloadChart(chartId, filename) {
  const chartDiv = document.getElementById(chartId);

  if (!chartDiv) {
    alert("Chart not found!");
    return;
  }

  const svg = chartDiv.getElementsByTagName("svg")[0];

  if (!svg) {
    alert("Chart not ready yet!");
    return;
  }

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
