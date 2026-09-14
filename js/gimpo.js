// ============================================================
// gimpo.js
// 김포시 전용 지도(지도2) - 전국 지도(지도1)와 완전히 독립된 상태/저장소 사용
// 원인 유형 정의는 js/causes.js 공용 모듈을 그대로 사용합니다.
// ============================================================

const GIMPO_STORAGE_KEY = "ua_gimpo_local_entries_v1";

const gimpoState = {
  dong: null, // 선택된 읍면동명 (null이면 전체)
  search: "",
  allEntries: [],
  editingId: null,
};

// ---------- 데이터 로드 / 저장 ----------

async function loadGimpoSeed() {
  try {
    const res = await fetch("data/gimpo_incidents.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("seed fetch failed");
    return await res.json();
  } catch (e) {
    console.error("김포시 기본 데이터를 불러오지 못했습니다.", e);
    return [];
  }
}

function loadGimpoLocal() {
  try {
    const raw = localStorage.getItem(GIMPO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveGimpoLocal(entries) {
  localStorage.setItem(GIMPO_STORAGE_KEY, JSON.stringify(entries));
}

async function refreshGimpoEntries() {
  const seed = await loadGimpoSeed();
  const local = loadGimpoLocal();
  gimpoState.allEntries = [...seed, ...local];
}

// ---------- 집계 ----------

function gimpoCountByDong(name) {
  return gimpoState.allEntries.filter((e) => (e.dong || "") === name).length;
}

function gimpoEntriesForDong(name) {
  if (!name) return gimpoState.allEntries.slice();
  return gimpoState.allEntries.filter((e) => (e.dong || "") === name);
}

function gimpoColorScale(count) {
  if (count === 0) return "var(--map-empty)";
  if (count <= 2) return "var(--map-low)";
  if (count <= 5) return "var(--map-mid)";
  return "var(--map-high)";
}

// ---------- 지도 색칠 ----------

function paintGimpoMap() {
  document.querySelectorAll('#gimpo-map path[data-name]').forEach((path) => {
    const name = path.getAttribute("data-name");
    const count = gimpoCountByDong(name);
    path.style.fill = gimpoColorScale(count);
    let title = path.querySelector("title");
    if (!title) {
      title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      path.appendChild(title);
    }
    title.textContent = `${name} · 자료 ${count}건`;
  });
}

function bindGimpoMapEvents() {
  document.querySelectorAll('#gimpo-map path[data-name]').forEach((path) => {
    const name = path.getAttribute("data-name");
    path.style.cursor = "pointer";
    path.addEventListener("click", () => selectDong(name));
    path.addEventListener("mouseenter", () => path.classList.add("hovered"));
    path.addEventListener("mouseleave", () => path.classList.remove("hovered"));
  });
}

// ---------- 브레드크럼 ----------

const gimpoBreadcrumbEl = document.getElementById("gimpo-breadcrumb");

function renderGimpoBreadcrumb() {
  const parts = [`<button class="crumb" data-all>김포시 전체</button>`];
  if (gimpoState.dong) {
    parts.push(`<span class="crumb-sep">›</span><span class="crumb crumb-current">${gimpoState.dong}</span>`);
  }
  gimpoBreadcrumbEl.innerHTML = parts.join("");
  gimpoBreadcrumbEl.querySelector("[data-all]").addEventListener("click", () => selectDong(null));
}

function selectDong(name) {
  gimpoState.dong = name;
  paintGimpoMap();
  renderGimpoBreadcrumb();
  renderGimpoEntries();
}

// ---------- 자료 카드 ----------

function gimpoEntryCardHTML(entry) {
  const causeTag = `<span class="tag" style="--tag-color:${causeColor(entry.cause)}">${causeName(entry.cause)}</span>`;
  const src = entry.sourceUrl
    ? `<a href="${gimpoEscapeAttr(entry.sourceUrl)}" target="_blank" rel="noopener noreferrer">${gimpoEscapeHtml(entry.source || "출처 보기")}</a>`
    : gimpoEscapeHtml(entry.source || "출처 미기재");
  const isLocal = String(entry.id).startsWith("local-");
  const actions = isLocal
    ? `<button class="entry-edit" data-id="${entry.id}">수정</button><button class="entry-del" data-id="${entry.id}">삭제</button>`
    : "";
  return `
    <article class="entry-card">
      <div class="entry-top">
        ${causeTag}
        <span class="entry-region">김포시 ${gimpoEscapeHtml(entry.dong || "")}</span>
        <span class="entry-actions">${actions}</span>
      </div>
      <h4>${gimpoEscapeHtml(entry.title)}</h4>
      <p>${gimpoEscapeHtml(entry.desc || "")}</p>
      <div class="entry-meta">
        <span>${gimpoEscapeHtml(entry.date || "")}</span>
        <span>${src}</span>
      </div>
    </article>`;
}

function bindGimpoEntryActions(container) {
  container.querySelectorAll(".entry-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteGimpoEntry(btn.dataset.id));
  });
  container.querySelectorAll(".entry-edit").forEach((btn) => {
    btn.addEventListener("click", () => startGimpoEdit(btn.dataset.id));
  });
}

function renderGimpoEntries() {
  const heading = document.getElementById("gimpo-panel-heading");
  let entries = gimpoEntriesForDong(gimpoState.dong);
  const label = gimpoState.dong ? `김포시 ${gimpoState.dong}` : "김포시 전체";
  heading.textContent = `${label} · ${entries.length}건`;

  if (gimpoState.search.trim()) {
    const q = gimpoState.search.trim().toLowerCase();
    entries = entries.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q) ||
        (e.source || "").toLowerCase().includes(q)
    );
  }

  const list = document.getElementById("gimpo-entry-list");
  list.innerHTML = entries.length
    ? entries.map(gimpoEntryCardHTML).join("")
    : `<p class="empty-msg">조건에 맞는 자료가 없습니다.</p>`;
  bindGimpoEntryActions(list);
}

// ---------- 검색 ----------

document.getElementById("gimpo-search").addEventListener("input", (e) => {
  gimpoState.search = e.target.value;
  renderGimpoEntries();
});

// ---------- 등록 / 수정 폼 ----------

const gimpoForm = document.getElementById("gimpo-entry-form");
const gimpoDongSelect = document.getElementById("gimpo-field-dong");
const gimpoCauseSelect = document.getElementById("gimpo-field-cause");
const gimpoSubmitBtn = document.getElementById("gimpo-form-submit-btn");
const gimpoCancelBtn = document.getElementById("gimpo-form-cancel-btn");

function populateGimpoSelects() {
  const dongNames = Array.from(document.querySelectorAll('#gimpo-map path[data-name]'))
    .map((p) => p.getAttribute("data-name"))
    .sort((a, b) => a.localeCompare(b, "ko"));
  gimpoDongSelect.innerHTML =
    `<option value="">읍·면·동 선택</option>` +
    dongNames.map((n) => `<option value="${n}">${n}</option>`).join("") +
    `<option value="기타/미상">기타 · 미상</option>`;
  gimpoCauseSelect.innerHTML = getCauses().map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

function fillGimpoForm(entry) {
  gimpoForm.dong.value = entry.dong || "";
  gimpoForm.cause.value = entry.cause || "etc";
  gimpoForm.title.value = entry.title || "";
  gimpoForm.desc.value = entry.desc || "";
  gimpoForm.source.value = entry.source || "";
  gimpoForm.sourceUrl.value = entry.sourceUrl || "";
  gimpoForm.date.value = entry.date || "";
}

function startGimpoEdit(id) {
  const entry = loadGimpoLocal().find((e) => e.id === id);
  if (!entry) return;
  gimpoState.editingId = id;
  fillGimpoForm(entry);
  gimpoSubmitBtn.textContent = "수정 완료";
  gimpoCancelBtn.hidden = false;
  document.getElementById("gimpo-register").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelGimpoEdit() {
  gimpoState.editingId = null;
  gimpoForm.reset();
  gimpoSubmitBtn.textContent = "자료 등록";
  gimpoCancelBtn.hidden = true;
  const dateField = document.getElementById("gimpo-field-date");
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
}

gimpoCancelBtn.addEventListener("click", cancelGimpoEdit);

gimpoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(gimpoForm);
  const dong = fd.get("dong");
  const title = (fd.get("title") || "").trim();
  if (!dong || !title) {
    alert("읍·면·동과 제목은 필수 입력 항목입니다.");
    return;
  }
  const payload = {
    dong,
    cause: fd.get("cause"),
    title,
    desc: (fd.get("desc") || "").trim(),
    source: (fd.get("source") || "").trim(),
    sourceUrl: (fd.get("sourceUrl") || "").trim(),
    date: fd.get("date") || "",
  };

  const local = loadGimpoLocal();
  let statusMsg = "등록되었습니다. 이 브라우저에 저장되며, 지도에 즉시 반영됩니다.";

  if (gimpoState.editingId) {
    const idx = local.findIndex((e) => e.id === gimpoState.editingId);
    if (idx !== -1) local[idx] = { ...local[idx], ...payload };
    statusMsg = "수정되었습니다.";
  } else {
    local.push({ id: "local-" + Date.now() + "-" + Math.floor(Math.random() * 1000), ...payload });
  }

  saveGimpoLocal(local);
  cancelGimpoEdit();

  refreshGimpoEntries().then(() => {
    paintGimpoMap();
    renderGimpoCauseChart();
    document.getElementById("gimpo-entries-count").textContent = loadGimpoLocal().length;
    renderGimpoEntries();
    const statusEl = document.getElementById("gimpo-form-status");
    statusEl.textContent = statusMsg;
    setTimeout(() => (statusEl.textContent = ""), 4000);
  });
});

function deleteGimpoEntry(id) {
  if (!confirm("이 자료를 삭제할까요?")) return;
  const local = loadGimpoLocal().filter((e) => e.id !== id);
  saveGimpoLocal(local);
  if (gimpoState.editingId === id) cancelGimpoEdit();
  refreshGimpoEntries().then(() => {
    paintGimpoMap();
    renderGimpoCauseChart();
    document.getElementById("gimpo-entries-count").textContent = loadGimpoLocal().length;
    renderGimpoEntries();
  });
}

// ---------- 내보내기 / 불러오기 ----------

document.getElementById("gimpo-export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(gimpoState.allEntries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `urbanimalist-gimpo-data-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("gimpo-import-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error("배열 형식이 아닙니다.");
      const local = loadGimpoLocal();
      const existingIds = new Set(local.map((e) => e.id));
      const merged = [...local];
      imported.forEach((e) => {
        if (!existingIds.has(e.id) && String(e.id).startsWith("local-")) {
          merged.push(e);
          existingIds.add(e.id);
        }
      });
      saveGimpoLocal(merged);
      refreshGimpoEntries().then(() => {
        paintGimpoMap();
        renderGimpoCauseChart();
        document.getElementById("gimpo-entries-count").textContent = loadGimpoLocal().length;
        renderGimpoEntries();
        alert(`${merged.length - local.length}건의 새 자료를 불러왔습니다.`);
      });
    } catch (err) {
      alert("파일을 읽는 중 오류가 발생했습니다: " + err.message);
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

document.getElementById("gimpo-reset-local-btn").addEventListener("click", () => {
  const local = loadGimpoLocal();
  if (local.length === 0) {
    alert("이 브라우저에 직접 등록한 김포시 자료가 없습니다.");
    return;
  }
  const ok = confirm(
    `이 브라우저에 직접 등록한 김포시 자료 ${local.length}건을 모두 삭제할까요?\n(기본 제공 자료는 그대로 유지되며, 삭제 후에는 되돌릴 수 없습니다.)`
  );
  if (!ok) return;
  saveGimpoLocal([]);
  if (gimpoState.editingId) cancelGimpoEdit();
  refreshGimpoEntries().then(() => {
    paintGimpoMap();
    renderGimpoCauseChart();
    document.getElementById("gimpo-entries-count").textContent = loadGimpoLocal().length;
    renderGimpoEntries();
    alert("내가 등록한 김포시 자료를 모두 초기화했습니다.");
  });
});

// ---------- 유틸 ----------

function gimpoEscapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function gimpoEscapeAttr(str) {
  return gimpoEscapeHtml(str);
}

// ---------- 원인 유형별 등록 현황 차트 (지도1/지도2 공용 위젯 사용) ----------

const gimpoCauseChartWidget = createCauseChartWidget({
  getEntries: () => gimpoState.allEntries,
  storagePrefix: "ua_map2",
  canvasId: "gimpo-cause-chart",
  manualToggleId: "gimpo-cause-manual-toggle",
  manualInputsId: "gimpo-cause-manual-inputs",
});

function renderGimpoCauseChart() {
  gimpoCauseChartWidget.render();
}

// ---------- 초기화 ----------

async function initGimpo() {
  populateGimpoSelects();
  bindGimpoMapEvents();
  await refreshGimpoEntries();
  paintGimpoMap();
  renderGimpoCauseChart();
  renderGimpoBreadcrumb();
  renderGimpoEntries();
  document.getElementById("gimpo-entries-count").textContent = loadGimpoLocal().length;

  const dateField = document.getElementById("gimpo-field-date");
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
}

document.addEventListener("DOMContentLoaded", initGimpo);
