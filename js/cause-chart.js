// ============================================================
// cause-chart.js
// 원인 유형별 등록 현황 차트 위젯 (지도1·지도2 공용, 완전히 동일한 구현)
//
// 기본은 자동 모드: 전달받은 entries 배열에서 원인 유형별 개수를 집계합니다.
// "숫자 직접 입력" 토글을 켜면 자동 집계를 무시하고, 사용자가 입력한 숫자를
// 그래프에 그대로 반영합니다(JSON 자료를 등록하지 않고 그래프만 쓰고 싶을 때 용도).
// 수동 입력값은 지도1/지도2가 서로 다른 localStorage 키(storagePrefix)를 쓰므로 섞이지 않습니다.
// ============================================================

if (typeof Chart !== "undefined" && typeof ChartDataLabels !== "undefined") {
  Chart.register(ChartDataLabels);
}

function ccEscapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function createCauseChartWidget({ getEntries, storagePrefix, canvasId, manualToggleId, manualInputsId }) {
  const MANUAL_MODE_KEY = `${storagePrefix}_cause_manual_mode`;
  const MANUAL_VALUES_KEY = `${storagePrefix}_cause_manual_values`;

  let chartInstance = null;

  function isManualMode() {
    return localStorage.getItem(MANUAL_MODE_KEY) === "1";
  }
  function setManualMode(on) {
    localStorage.setItem(MANUAL_MODE_KEY, on ? "1" : "0");
  }
  function loadManualValues() {
    try {
      return JSON.parse(localStorage.getItem(MANUAL_VALUES_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveManualValues(v) {
    localStorage.setItem(MANUAL_VALUES_KEY, JSON.stringify(v));
  }

  function computeAutoCounts() {
    const counts = {};
    getCauses().forEach((c) => (counts[c.id] = 0));
    (getEntries() || []).forEach((e) => {
      if (counts[e.cause] !== undefined) counts[e.cause]++;
    });
    return counts;
  }

  function renderManualInputs() {
    const wrap = document.getElementById(manualInputsId);
    if (!wrap) return;
    const manual = isManualMode();
    wrap.hidden = !manual;
    if (!manual) return;

    const causes = getCauses();
    const values = loadManualValues();
    wrap.innerHTML = causes
      .map(
        (c) => `
      <div class="manual-input-row">
        <span class="manual-input-label"><i style="background:${c.color}"></i>${ccEscapeHtml(c.name)}</span>
        <input type="number" min="0" step="1" inputmode="numeric" data-cause="${c.id}" value="${values[c.id] ?? 0}" />
      </div>`
      )
      .join("");

    wrap.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const v = loadManualValues();
        v[inp.dataset.cause] = Math.max(0, parseInt(inp.value || "0", 10) || 0);
        saveManualValues(v);
        render();
      });
    });
  }

  function render() {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") return;

    const causes = getCauses();
    const manual = isManualMode();
    const autoCounts = computeAutoCounts();
    const manualValues = loadManualValues();

    const labels = causes.map((c) => c.name);
    const values = causes.map((c) => (manual ? manualValues[c.id] ?? 0 : autoCounts[c.id] || 0));
    const colors = causes.map((c) => c.color);

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(canvas, {
      type: "bar",
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            anchor: "end",
            align: "end",
            color: "#22291f",
            font: { weight: 700, size: 12 },
            formatter: (v) => `${v}건`,
          },
        },
        layout: { padding: { right: 30 } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#e4e0d4" } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });

    renderManualInputs();
  }

  const toggle = document.getElementById(manualToggleId);
  if (toggle) {
    toggle.checked = isManualMode();
    toggle.addEventListener("change", () => {
      setManualMode(toggle.checked);
      render();
    });
  }

  return { render };
}
