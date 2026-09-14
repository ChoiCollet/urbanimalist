// ============================================================
// main.js
// 어반애니멀리스트 - 지도 상호작용 + 자료 등록/조회/수정/삭제 로직
// 자료는 Cloudflare Pages Functions + D1을 통해 서버에 저장됩니다(팀 공유).
// ============================================================

const API_BASE = "/api/incidents";
const PASSWORD_SESSION_KEY = "ua_team_password"; // sessionStorage: 탭을 닫으면 사라짐
const submapCache = {}; // provinceId -> svg 문자열 캐시

const state = {
  level: 1, // 1: 전국 지도, 2: 시도 내 시군구 목록, 3: 시군구(또는 시도) 자료 목록
  province: null, // 선택된 시도 id
  sigungu: null, // 선택된 시군구명 (문자열) 또는 null(해당 시도 전체)
  search: "",
  allEntries: [], // 서버(D1)에서 불러온 전체 자료
  editingId: null, // 현재 수정 중인 자료 id (없으면 null)
};

// ---------- 팀 비밀번호 ----------

function getSessionPassword() {
  return sessionStorage.getItem(PASSWORD_SESSION_KEY) || "";
}
function setSessionPassword(pw) {
  sessionStorage.setItem(PASSWORD_SESSION_KEY, pw);
}
function askPassword(promptMessage) {
  const cached = getSessionPassword();
  if (cached) return cached;
  const pw = prompt(promptMessage || "팀 비밀번호를 입력하세요.");
  if (pw) setSessionPassword(pw);
  return pw || "";
}

// ---------- 데이터 로드 (서버 API) ----------

async function refreshAllEntries() {
  try {
    const res = await fetch(API_BASE, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    state.allEntries = await res.json();
  } catch (e) {
    console.error("자료를 불러오지 못했습니다.", e);
    state.allEntries = [];
  }
}

// ---------- 집계 ----------

function countByProvince(provinceId) {
  return state.allEntries.filter((e) => e.sido && e.sido.includes(provinceId)).length;
}


function entriesForProvince(provinceId) {
  return state.allEntries.filter((e) => e.sido && e.sido.includes(provinceId));
}

function sigunguListForProvince(provinceId) {
  const map = new Map();
  entriesForProvince(provinceId).forEach((e) => {
    const key = e.sigungu && e.sigungu.trim() ? e.sigungu.trim() : "(시군구 미상)";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

function entriesForSigungu(provinceId, sigungu) {
  return entriesForProvince(provinceId).filter((e) => {
    const key = e.sigungu && e.sigungu.trim() ? e.sigungu.trim() : "(시군구 미상)";
    return key === sigungu;
  });
}

function countBySigunguName(provinceId, name) {
  return entriesForSigungu(provinceId, name).length;
}

// ---------- 색상 스케일 ----------

function colorScale(count) {
  if (count === 0) return "var(--map-empty)";
  if (count <= 2) return "var(--map-low)";
  if (count <= 5) return "var(--map-mid)";
  return "var(--map-high)";
}

function paintMap() {
  Object.keys(PROVINCES).forEach((id) => {
    const path = document.getElementById(id);
    if (!path) return;
    const count = countByProvince(id);
    path.style.fill = colorScale(count);
    path.setAttribute("data-count", count);
    let title = path.querySelector("title");
    if (!title) {
      title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      path.appendChild(title);
    }
    title.textContent = `${provinceName(id)} · 자료 ${count}건`;
  });
}

// ---------- 화면 전환 ----------

const breadcrumbEl = document.getElementById("breadcrumb");
const levelPanels = {
  1: document.getElementById("panel-level-1"),
  2: document.getElementById("panel-level-2"),
  3: document.getElementById("panel-level-3"),
};

function showLevel(n) {
  state.level = n;
  Object.entries(levelPanels).forEach(([k, el]) => {
    el.hidden = Number(k) !== n;
  });
  renderBreadcrumb();
}

function renderBreadcrumb() {
  const parts = [`<button class="crumb" data-goto="1">전국</button>`];
  if (state.province) {
    parts.push(`<span class="crumb-sep">›</span><button class="crumb" data-goto="2">${provinceName(state.province)}</button>`);
  }
  if (state.sigungu) {
    parts.push(`<span class="crumb-sep">›</span><span class="crumb crumb-current">${state.sigungu}</span>`);
  }
  breadcrumbEl.innerHTML = parts.join("");
  breadcrumbEl.querySelectorAll("button.crumb").forEach((btn) => {
    btn.addEventListener("click", () => {
      const goto = Number(btn.dataset.goto);
      if (goto === 1) goProvinceList();
      if (goto === 2) goProvince(state.province);
    });
  });
}

function goProvinceList() {
  state.province = null;
  state.sigungu = null;
  showNationalMap();
  paintMap();
  showLevel(1);
}

function goProvince(id) {
  state.province = id;
  state.sigungu = null;
  if (SUBMAP_PROVINCES[id]) {
    renderSubmap(id);
  } else {
    showNationalMap();
    paintMap();
  }
  renderLevel2();
  showLevel(2);
}

function goSigungu(name) {
  state.sigungu = name;
  renderLevel3();
  showLevel(3);
}

function goNationwide() {
  state.province = NATIONWIDE_ID;
  state.sigungu = null;
  showNationalMap();
  paintMap();
  renderLevel3();
  showLevel(3);
}

// ---------- 지도 박스 전환 (전국 지도 ⇄ 서울·인천·경기 서브맵) ----------

const nationalMapHolder = document.getElementById("national-map-holder");
const submapHolder = document.getElementById("submap-holder");
const submapNote = document.getElementById("submap-note");

function showNationalMap() {
  nationalMapHolder.hidden = false;
  submapHolder.hidden = true;
  submapNote.hidden = true;
}

function showSubmapBox() {
  nationalMapHolder.hidden = true;
  submapHolder.hidden = false;
  submapNote.hidden = false;
}

// ---------- 시군구 서브맵 (서울·인천·경기) ----------

async function loadSubmap(provinceId) {
  if (submapCache[provinceId]) return submapCache[provinceId];
  const url = SUBMAP_PROVINCES[provinceId];
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("submap fetch failed");
    const text = await res.text();
    submapCache[provinceId] = text;
    return text;
  } catch (e) {
    console.error("서브맵을 불러오지 못했습니다.", e);
    return null;
  }
}

async function renderSubmap(provinceId) {
  const svgText = await loadSubmap(provinceId);
  if (!svgText) {
    showNationalMap();
    return;
  }
  submapHolder.innerHTML = svgText;
  showSubmapBox();

  const svgEl = submapHolder.querySelector("svg");
  svgEl.querySelectorAll("path[data-name]").forEach((path) => {
    const name = path.getAttribute("data-name");
    const count = countBySigunguName(provinceId, name);
    path.style.fill = colorScale(count);
    path.style.cursor = "pointer";
    let title = path.querySelector("title");
    if (!title) {
      title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      path.appendChild(title);
    }
    title.textContent = `${name} · 자료 ${count}건`;
    path.addEventListener("click", () => goSigungu(name));
    path.addEventListener("mouseenter", () => path.classList.add("hovered"));
    path.addEventListener("mouseleave", () => path.classList.remove("hovered"));
  });
}

// ---------- 렌더링: 자료 카드 ----------

function entryCardHTML(entry) {
  const causeTag = `<span class="tag" style="--tag-color:${causeColor(entry.cause)}">${causeName(entry.cause)}</span>`;
  const region = entry.sido && entry.sido[0] === NATIONWIDE_ID
    ? "전국"
    : `${(entry.sido || []).map(provinceName).join(" · ")}${entry.sigungu ? " " + entry.sigungu : ""}`;
  const src = entry.sourceUrl
    ? `<a href="${escapeAttr(entry.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.source || "출처 보기")}</a>`
    : escapeHtml(entry.source || "출처 미기재");
  const actions = `<button class="entry-edit" data-id="${entry.id}" title="수정">수정</button>
       <button class="entry-del" data-id="${entry.id}" title="삭제">삭제</button>`;
  return `
    <article class="entry-card">
      <div class="entry-top">
        ${causeTag}
        <span class="entry-region">${escapeHtml(region)}</span>
        <span class="entry-actions">${actions}</span>
      </div>
      <h4>${escapeHtml(entry.title)}</h4>
      <p>${escapeHtml(entry.desc || "")}</p>
      <div class="entry-meta">
        <span>${escapeHtml(entry.date || "")}</span>
        <span>${src}</span>
      </div>
    </article>`;
}

function bindEntryActions(container) {
  container.querySelectorAll(".entry-del").forEach((btn) => {
    btn.addEventListener("click", () => deleteEntry(btn.dataset.id));
  });
  container.querySelectorAll(".entry-edit").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(btn.dataset.id));
  });
}

// ---------- 레벨 2: 시도 내 시군구 ----------

function renderLevel2() {
  const wrap = levelPanels[2];
  const heading = wrap.querySelector(".panel-heading");
  heading.textContent = `${provinceName(state.province)} · 총 ${countByProvince(state.province)}건`;

  const list = sigunguListForProvince(state.province);
  const grid = wrap.querySelector(".sigungu-grid");
  if (list.length === 0) {
    grid.innerHTML = `<p class="empty-msg">아직 등록된 자료가 없습니다. 아래 '자료 등록'에서 첫 사례를 추가해 보세요.</p>`;
  } else {
    grid.innerHTML = list
      .map(
        ([name, count]) =>
          `<button class="sigungu-chip" data-name="${escapeAttr(name)}">${escapeHtml(name)} <span>${count}</span></button>`
      )
      .join("");
    grid.querySelectorAll(".sigungu-chip").forEach((btn) => {
      btn.addEventListener("click", () => goSigungu(btn.dataset.name));
    });
  }

  const allBtn = wrap.querySelector(".view-all-btn");
  allBtn.onclick = () => {
    state.sigungu = null;
    renderLevel3(true);
    showLevel(3);
  };
}

// ---------- 레벨 3: 자료 목록 ----------

function renderLevel3(showAllInProvince = false) {
  const wrap = levelPanels[3];
  const heading = wrap.querySelector(".panel-heading");
  let entries;
  if (state.province === NATIONWIDE_ID) {
    entries = state.allEntries.filter((e) => e.sido && e.sido.includes(NATIONWIDE_ID));
    heading.textContent = `전국 공통 자료 · ${entries.length}건`;
  } else if (showAllInProvince || !state.sigungu) {
    entries = entriesForProvince(state.province);
    heading.textContent = `${provinceName(state.province)} 전체 · ${entries.length}건`;
  } else {
    entries = entriesForSigungu(state.province, state.sigungu);
    heading.textContent = `${provinceName(state.province)} ${state.sigungu} · ${entries.length}건`;
  }

  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    entries = entries.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q) ||
        (e.source || "").toLowerCase().includes(q)
    );
  }

  const list = wrap.querySelector(".entry-list");
  list.innerHTML = entries.length
    ? entries.map(entryCardHTML).join("")
    : `<p class="empty-msg">조건에 맞는 자료가 없습니다.</p>`;
  bindEntryActions(list);
}

// ---------- 검색 ----------

const searchInput = document.getElementById("global-search");
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  if (state.level === 3) renderLevel3(!state.sigungu);
});

// ---------- 자료 등록 / 수정 폼 ----------

const form = document.getElementById("entry-form");
const provinceSelect = document.getElementById("field-sido");
const causeSelect = document.getElementById("field-cause");
const submitBtn = document.getElementById("form-submit-btn");
const cancelEditBtn = document.getElementById("form-cancel-btn");

function populateSelects() {
  provinceSelect.innerHTML =
    `<option value="">시도 선택</option>` +
    Object.entries(PROVINCES).map(([id, p]) => `<option value="${id}">${p.name}</option>`).join("") +
    `<option value="${NATIONWIDE_ID}">전국(지역 특정 안 됨)</option>`;
  causeSelect.innerHTML = getCauses().map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
}

function fillForm(entry) {
  form.sido.value = entry.sido[0];
  form.sigungu.value = entry.sigungu || "";
  form.cause.value = entry.cause || "etc";
  form.title.value = entry.title || "";
  form.desc.value = entry.desc || "";
  form.source.value = entry.source || "";
  form.sourceUrl.value = entry.sourceUrl || "";
  form.date.value = entry.date || "";
}

function startEdit(id) {
  const entry = state.allEntries.find((e) => e.id === id);
  if (!entry) return;
  state.editingId = id;
  fillForm(entry);
  submitBtn.textContent = "수정 완료";
  cancelEditBtn.hidden = false;
  document.getElementById("register").scrollIntoView({ behavior: "smooth", block: "start" });
}

function cancelEdit() {
  state.editingId = null;
  form.reset();
  submitBtn.textContent = "자료 등록";
  cancelEditBtn.hidden = true;
  const dateField = document.getElementById("field-date");
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
}

cancelEditBtn.addEventListener("click", cancelEdit);

async function afterMutation(statusMsg) {
  await refreshAllEntries();
  paintMap();
  renderCauseChart();
  if (state.level === 2) renderLevel2();
  if (state.level === 3) renderLevel3(!state.sigungu);
  if (statusMsg) {
    const statusEl = document.getElementById("form-status");
    statusEl.textContent = statusMsg;
    setTimeout(() => (statusEl.textContent = ""), 4000);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const sido = fd.get("sido");
  const title = (fd.get("title") || "").trim();
  if (!sido || !title) {
    alert("시도와 제목은 필수 입력 항목입니다.");
    return;
  }

  const password = askPassword("자료를 등록/수정하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  const payload = {
    password,
    sido: [sido],
    sigungu: (fd.get("sigungu") || "").trim(),
    cause: fd.get("cause"),
    title,
    desc: (fd.get("desc") || "").trim(),
    source: (fd.get("source") || "").trim(),
    sourceUrl: (fd.get("sourceUrl") || "").trim(),
    date: fd.get("date") || "",
  };

  const isEdit = !!state.editingId;
  const url = isEdit ? `${API_BASE}/${encodeURIComponent(state.editingId)}` : API_BASE;
  const method = isEdit ? "PUT" : "POST";

  submitBtn.disabled = true;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      setSessionPassword("");
      return;
    }
    if (!res.ok) throw new Error("요청 실패");

    cancelEdit();
    await afterMutation(isEdit ? "수정되었습니다." : "등록되었습니다. 서버에 저장되어 팀원 모두에게 바로 반영됩니다.");
  } catch (err) {
    alert("저장 중 오류가 발생했습니다: " + err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

async function deleteEntry(id) {
  if (!confirm("이 자료를 삭제할까요? (팀원 모두에게 반영되며 되돌릴 수 없습니다)")) return;
  const password = askPassword("자료를 삭제하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      setSessionPassword("");
      return;
    }
    if (!res.ok) throw new Error("요청 실패");
    if (state.editingId === id) cancelEdit();
    await afterMutation();
  } catch (err) {
    alert("삭제 중 오류가 발생했습니다: " + err.message);
  }
}

// ---------- 전체 자료 백업 다운로드 ----------

document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state.allEntries, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `urbanimalist-data-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- 유틸 ----------

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// ---------- 전국 지도 클릭 바인딩 ----------

function bindMapEvents() {
  Object.keys(PROVINCES).forEach((id) => {
    const path = document.getElementById(id);
    if (!path) return;
    path.style.cursor = "pointer";
    path.addEventListener("click", () => goProvince(id));
    path.addEventListener("mouseenter", () => path.classList.add("hovered"));
    path.addEventListener("mouseleave", () => path.classList.remove("hovered"));
  });
}

// ---------- 원인 유형별 등록 현황 차트 (지도1/지도2 공용 위젯 사용) ----------

const causeChartWidget = createCauseChartWidget({
  getEntries: () => state.allEntries,
  storagePrefix: "ua_map1",
  canvasId: "cause-chart",
  manualToggleId: "cause-manual-toggle",
  manualInputsId: "cause-manual-inputs",
});

function renderCauseChart() {
  causeChartWidget.render();
}

// ---------- 초기화 ----------

async function init() {
  populateSelects();
  bindMapEvents();
  document.getElementById("nationwide-btn").addEventListener("click", goNationwide);
  await refreshAllEntries();
  paintMap();
  renderCauseChart();
  showLevel(1);

  const dateField = document.getElementById("field-date");
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
}

document.addEventListener("DOMContentLoaded", init);
