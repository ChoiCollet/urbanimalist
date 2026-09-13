// ============================================================
// stats.js
// 전국 야생동물 구조·치료 통계 페이지 (2020~2025)
// ============================================================

const CHART_COLORS = [
  "#2f6b4f", "#d98236", "#7a8fae", "#c9524a", "#9a6bae", "#3f8a8a", "#b08a3f", "#5b7a3f",
];

const REGION_LABELS = {
  seoul: "서울", busan: "부산", daegu: "대구", incheon: "인천", gwangju: "광주",
  daejeon: "대전", ulsan: "울산", gyeonggi: "경기", gangwon: "강원",
  "north-chungcheong": "충북", "south-chungcheong": "충남",
  "north-jeolla": "전북", "south-jeolla": "전남",
  "north-gyeongsang": "경북", "south-gyeongsang": "경남",
  jeju: "제주", nationalpark: "국립공원(전국)",
};

const TOP_REGIONS = ["gyeonggi", "south-chungcheong", "seoul", "busan", "north-chungcheong", "gangwon"];

let STATS = null;
let selectedYearIdx = 5; // 기본값: 가장 최근 연도(2025)

function baseChartOptions(extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 12 } } },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: "#e4e0d4" } },
    },
    ...extra,
  };
}

function lineDataset(label, data, color, extraOpts = {}) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color,
    tension: 0.3,
    pointRadius: 3,
    borderWidth: 2,
    ...extraOpts,
  };
}

// ---------- 1. 총 구조개체수 ----------

function renderTotalChart() {
  new Chart(document.getElementById("chart-total"), {
    type: "line",
    data: {
      labels: STATS.years,
      datasets: [lineDataset("총 구조개체수 (마리)", STATS.totalRescued, CHART_COLORS[0], { fill: true, backgroundColor: "rgba(47,107,79,0.08)" })],
    },
    options: baseChartOptions({ plugins: { legend: { display: false } } }),
  });
}

// ---------- 2. 지역별 지도 + 순위 + 추이 ----------

function regionColorScale(count) {
  if (count === 0) return "var(--map-empty)";
  if (count < 800) return "var(--map-low)";
  if (count < 1800) return "var(--map-mid)";
  return "var(--map-high)";
}

function paintRegionMap(yearIdx) {
  Object.keys(PROVINCES).forEach((id) => {
    const path = document.getElementById(id);
    if (!path) return;
    const series = STATS.byRegion[id];
    const count = series ? series[yearIdx] : 0;
    path.style.fill = regionColorScale(count);
    let title = path.querySelector("title");
    if (!title) {
      title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      path.appendChild(title);
    }
    title.textContent = `${provinceName(id)} · ${count.toLocaleString()}마리 (${STATS.years[yearIdx]}년)`;
  });
}

function renderRegionRankList(yearIdx) {
  const heading = document.getElementById("region-year-heading");
  heading.textContent = `${STATS.years[yearIdx]}년 지역별 구조 순위`;

  const entries = Object.entries(STATS.byRegion)
    .map(([id, series]) => ({ id, count: series[yearIdx] }))
    .sort((a, b) => b.count - a.count);

  const list = document.getElementById("region-rank-list");
  list.innerHTML = entries
    .map((e, i) => {
      const name = REGION_LABELS[e.id] || e.id;
      return `
      <article class="entry-card rank-card">
        <div class="entry-top">
          <span class="rank-num">${i + 1}</span>
          <span class="entry-region">${name}</span>
          <span class="entry-actions rank-count">${e.count.toLocaleString()}마리</span>
        </div>
      </article>`;
    })
    .join("");
}

function bindMapClicks() {
  Object.keys(PROVINCES).forEach((id) => {
    const path = document.getElementById(id);
    if (!path) return;
    path.style.cursor = "default";
    path.addEventListener("mouseenter", () => path.classList.add("hovered"));
    path.addEventListener("mouseleave", () => path.classList.remove("hovered"));
  });
}

function renderYearTabs() {
  const wrap = document.getElementById("region-year-tabs");
  wrap.innerHTML = STATS.years
    .map((y, i) => `<button class="year-tab${i === selectedYearIdx ? " active" : ""}" data-idx="${i}">${y}</button>`)
    .join("");
  wrap.querySelectorAll(".year-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedYearIdx = Number(btn.dataset.idx);
      wrap.querySelectorAll(".year-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      paintRegionMap(selectedYearIdx);
      renderRegionRankList(selectedYearIdx);
    });
  });
}

function renderRegionTrendChart() {
  const datasets = TOP_REGIONS.map((id, i) => lineDataset(REGION_LABELS[id], STATS.byRegion[id], CHART_COLORS[i % CHART_COLORS.length]));
  new Chart(document.getElementById("chart-region"), {
    type: "line",
    data: { labels: STATS.years, datasets },
    options: baseChartOptions(),
  });
}

// ---------- 3. 종별 비중 ----------

function renderSpeciesChart() {
  const names = Object.keys(STATS.bySpeciesPct);
  const datasets = names.map((n, i) => lineDataset(n, STATS.bySpeciesPct[n], CHART_COLORS[i % CHART_COLORS.length]));
  new Chart(document.getElementById("chart-species"), {
    type: "line",
    data: { labels: STATS.years, datasets },
    options: baseChartOptions(),
  });
}

// ---------- 4. 사고원인별 ----------

function renderCauseChart() {
  const names = Object.keys(STATS.byCausePct);
  const datasets = names.map((n, i) => lineDataset(n, STATS.byCausePct[n], CHART_COLORS[i % CHART_COLORS.length]));
  new Chart(document.getElementById("chart-cause"), {
    type: "line",
    data: { labels: STATS.years, datasets },
    options: baseChartOptions(),
  });
}

// ---------- 5. 치료결과 ----------

function renderTreatmentChart() {
  const names = Object.keys(STATS.treatmentPct);
  const datasets = names.map((n, i) => lineDataset(n, STATS.treatmentPct[n], CHART_COLORS[i % CHART_COLORS.length]));
  new Chart(document.getElementById("chart-treatment"), {
    type: "line",
    data: { labels: STATS.years, datasets },
    options: baseChartOptions(),
  });
}

// ---------- 초기화 ----------

async function initStats() {
  const res = await fetch("data/wildlife_stats.json", { cache: "no-cache" });
  STATS = await res.json();

  bindMapClicks();
  renderYearTabs();
  paintRegionMap(selectedYearIdx);
  renderRegionRankList(selectedYearIdx);

  renderTotalChart();
  renderRegionTrendChart();
  renderSpeciesChart();
  renderCauseChart();
  renderTreatmentChart();
}

document.addEventListener("DOMContentLoaded", initStats);
