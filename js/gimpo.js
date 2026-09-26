// ============================================================
// gimpo.js
// 김포시 전용 지도(지도2) - 전국 지도(지도1)와 완전히 독립된 서버 자료(API) 사용
// 원인 유형 정의는 js/causes.js 공용 모듈을 그대로 사용합니다.
// ============================================================

const GIMPO_API_BASE = "/api/gimpo-incidents";
const GIMPO_PASSWORD_SESSION_KEY = "ua_team_password"; // 지도1과 같은 팀 비밀번호를 공유(세션 저장)

const gimpoState = {
  dong: null, // 선택된 읍면동명 (null이면 전체)
  search: "",
  allEntries: [],
  editingId: null,
};

// ---------- 팀 비밀번호 ----------

function gimpoGetSessionPassword() {
  return sessionStorage.getItem(GIMPO_PASSWORD_SESSION_KEY) || "";
}
function gimpoSetSessionPassword(pw) {
  sessionStorage.setItem(GIMPO_PASSWORD_SESSION_KEY, pw);
}
function gimpoAskPassword(promptMessage) {
  const cached = gimpoGetSessionPassword();
  if (cached) return cached;
  const pw = prompt(promptMessage || "팀 비밀번호를 입력하세요.");
  if (pw) gimpoSetSessionPassword(pw);
  return pw || "";
}

// ---------- 데이터 로드 (서버 API) ----------

async function refreshGimpoEntries() {
  try {
    const res = await fetch(GIMPO_API_BASE, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    gimpoState.allEntries = await res.json();
  } catch (e) {
    console.error("김포시 자료를 불러오지 못했습니다.", e);
    gimpoState.allEntries = [];
  }
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
  if (gimpoState.search.trim()) {
    gimpoBreadcrumbEl.innerHTML = `<button class="crumb" data-clear-search>김포시 전체</button><span class="crumb-sep">›</span><span class="crumb crumb-current">검색 결과</span>`;
    gimpoBreadcrumbEl.querySelector("[data-clear-search]").addEventListener("click", () => {
      document.getElementById("gimpo-search").value = "";
      gimpoState.search = "";
      renderGimpoBreadcrumb();
      renderGimpoEntries();
    });
    return;
  }
  const parts = [`<button class="crumb" data-all>김포시 전체</button>`];
  if (gimpoState.dong) {
    parts.push(`<span class="crumb-sep">›</span><span class="crumb crumb-current">${gimpoState.dong}</span>`);
  }
  gimpoBreadcrumbEl.innerHTML = parts.join("");
  gimpoBreadcrumbEl.querySelector("[data-all]").addEventListener("click", () => selectDong(null));
}

function selectDong(name) {
  if (gimpoState.search) {
    gimpoState.search = "";
    const input = document.getElementById("gimpo-search");
    if (input) input.value = "";
  }
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
  const actions = `<button class="entry-share" data-id="${entry.id}" title="이 사례 공유 링크 복사">🔗 링크</button><button class="entry-edit" data-id="${entry.id}">수정</button><button class="entry-del" data-id="${entry.id}">삭제</button>`;
  return `
    <article class="entry-card" id="entry-${entry.id}">
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
  container.querySelectorAll(".entry-share").forEach((btn) => {
    btn.addEventListener("click", () => copyEntryPermalink(btn, btn.dataset.id));
  });
}

// ---------- 공유 링크(?id=)로 들어왔을 때 해당 사례로 이동 ----------

function openGimpoEntryFromUrl() {
  const id = getPermalinkIdFromUrl();
  if (!id) return false;
  const entry = gimpoState.allEntries.find((e) => String(e.id) === String(id));
  if (!entry) return false;
  selectDong(entry.dong || null);
  requestAnimationFrame(() => highlightEntryCard(entry.id));
  return true;
}

function renderGimpoEntries() {
  const heading = document.getElementById("gimpo-panel-heading");
  const query = gimpoState.search.trim();
  let entries = query ? gimpoState.allEntries.slice() : gimpoEntriesForDong(gimpoState.dong);

  if (query) {
    const q = query.toLowerCase();
    entries = entries.filter(
      (e) =>
        (e.title || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q) ||
        (e.source || "").toLowerCase().includes(q)
    );
    heading.textContent = `"${query}" 검색 결과 · 전체 동 중 ${entries.length}건`;
  } else {
    const label = gimpoState.dong ? `김포시 ${gimpoState.dong}` : "김포시 전체";
    heading.textContent = `${label} · ${entries.length}건`;
  }

  const list = document.getElementById("gimpo-entry-list");
  list.innerHTML = entries.length
    ? entries.map(gimpoEntryCardHTML).join("")
    : `<p class="empty-msg">조건에 맞는 자료가 없습니다.</p>`;
  bindGimpoEntryActions(list);
}

// ---------- 검색 (선택한 동 상관없이 전체 자료 대상 통합 검색) ----------

document.getElementById("gimpo-search").addEventListener("input", (e) => {
  gimpoState.search = e.target.value;
  renderGimpoBreadcrumb();
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
  const entry = gimpoState.allEntries.find((e) => e.id === id);
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

async function afterGimpoMutation(statusMsg) {
  await refreshGimpoEntries();
  paintGimpoMap();
  renderGimpoCauseChart();
  renderGimpoEntries();
  if (statusMsg) {
    const statusEl = document.getElementById("gimpo-form-status");
    statusEl.textContent = statusMsg;
    setTimeout(() => (statusEl.textContent = ""), 4000);
  }
}

gimpoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(gimpoForm);
  const dong = fd.get("dong");
  const title = (fd.get("title") || "").trim();
  if (!dong || !title) {
    alert("읍·면·동과 제목은 필수 입력 항목입니다.");
    return;
  }

  const password = gimpoAskPassword("자료를 등록/수정하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  const payload = {
    password,
    dong,
    cause: fd.get("cause"),
    title,
    desc: (fd.get("desc") || "").trim(),
    source: (fd.get("source") || "").trim(),
    sourceUrl: (fd.get("sourceUrl") || "").trim(),
    date: fd.get("date") || "",
  };

  const isEdit = !!gimpoState.editingId;
  const url = isEdit ? `${GIMPO_API_BASE}/${encodeURIComponent(gimpoState.editingId)}` : GIMPO_API_BASE;
  const method = isEdit ? "PUT" : "POST";

  gimpoSubmitBtn.disabled = true;
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      gimpoSetSessionPassword("");
      return;
    }
    if (!res.ok) throw new Error("요청 실패");

    cancelGimpoEdit();
    await afterGimpoMutation(isEdit ? "수정되었습니다." : "등록되었습니다. 서버에 저장되어 팀원 모두에게 바로 반영됩니다.");
  } catch (err) {
    alert("저장 중 오류가 발생했습니다: " + err.message);
  } finally {
    gimpoSubmitBtn.disabled = false;
  }
});

async function deleteGimpoEntry(id) {
  if (!confirm("이 자료를 삭제할까요? (팀원 모두에게 반영되며 되돌릴 수 없습니다)")) return;
  const password = gimpoAskPassword("자료를 삭제하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  try {
    const res = await fetch(`${GIMPO_API_BASE}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      gimpoSetSessionPassword("");
      return;
    }
    if (!res.ok) throw new Error("요청 실패");
    if (gimpoState.editingId === id) cancelGimpoEdit();
    await afterGimpoMutation();
  } catch (err) {
    alert("삭제 중 오류가 발생했습니다: " + err.message);
  }
}

// ---------- 전체 자료 백업 다운로드 ----------

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
  if (!openGimpoEntryFromUrl()) {
    renderGimpoBreadcrumb();
    renderGimpoEntries();
  }

  document.getElementById("gimpo-map-export-btn").addEventListener("click", () => {
    const label = gimpoState.dong ? gimpoState.dong : "전체";
    const today = new Date().toISOString().slice(0, 10);
    exportSvgAsPng(document.getElementById("gimpo-map"), `urbanimalist-지도2-김포시-${label}-${today}.png`);
  });

  const dateField = document.getElementById("gimpo-field-date");
  if (dateField) dateField.value = new Date().toISOString().slice(0, 10);
}

document.addEventListener("DOMContentLoaded", initGimpo);
