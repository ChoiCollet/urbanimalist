// ============================================================
// log.js
// 활동 로그 페이지 - 조회는 공용, 되돌리기/로그삭제는 지도별로 독립 동작
// ============================================================

const LOG_PASSWORD_SESSION_KEY = "ua_team_password"; // main.js/gimpo.js와 동일한 키 재사용

let allLogs = [];
let currentMapFilter = "all";
let selectedDate = null; // "YYYY-MM-DD" (브라우저 로컬 기준)
let calYear, calMonth; // 캘린더에 현재 표시 중인 연/월 (month: 0-11)

function logAskPassword(promptMessage) {
  const cached = sessionStorage.getItem(LOG_PASSWORD_SESSION_KEY) || "";
  if (cached) return cached;
  const pw = prompt(promptMessage || "팀 비밀번호를 입력하세요.");
  if (pw) sessionStorage.setItem(LOG_PASSWORD_SESSION_KEY, pw);
  return pw || "";
}

function logEscapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ---------- 시간대 변환 유틸 ----------
// created_at은 서버에 "YYYY-MM-DD HH:MM:SS" UTC로 저장됨. 화면 표시/캘린더 분류는
// 브라우저 로컬 시간(사실상 한국 시간) 기준으로 하고, 삭제 요청 시에는 다시 UTC로 변환해 보냄.

function toDate(sqliteUtc) {
  const d = new Date(sqliteUtc.replace(" ", "T") + "Z");
  return isNaN(d.getTime()) ? null : d;
}

function getLocalDateKey(sqliteUtc) {
  const d = toDate(sqliteUtc);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toSqliteUtc(dateObj) {
  return dateObj.toISOString().slice(0, 19).replace("T", " ");
}

function formatTime(iso) {
  const d = toDate(iso);
  if (!d) return iso;
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ---------- 자료 표시 ----------

function describeSnapshot(map, snap) {
  if (!snap) return { title: "(삭제된 자료)", region: "" };
  const title = snap.title || "(제목 없음)";
  let region = "";
  if (map === "map1") {
    let sido = [];
    try {
      sido = JSON.parse(snap.sido || "[]");
    } catch (e) {}
    region = sido.map((id) => (typeof provinceName === "function" ? provinceName(id) : id)).join(" · ");
    if (snap.sigungu) region += (region ? " " : "") + snap.sigungu;
  } else {
    region = "김포시 " + (snap.dong || "");
  }
  return { title, region };
}

const ACTION_LABELS = {
  create: { label: "등록", cls: "log-action-create" },
  update: { label: "수정", cls: "log-action-update" },
  delete: { label: "삭제", cls: "log-action-delete" },
  rollback: { label: "되돌리기 기록", cls: "log-action-rollback" },
};

// ---------- 로그 카드 ----------

function logCardHTML(log) {
  const mapLabel = log.map === "map1" ? "전국 지도" : "김포시 지도";
  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, cls: "" };
  const snap = log.after || log.before;
  const { title, region } = describeSnapshot(log.map, snap);

  const canRollback = !log.rolledBack && log.action !== "rollback";
  const rollbackBtn = canRollback
    ? `<button class="log-rollback-btn" data-id="${log.id}">되돌리기</button>`
    : log.rolledBack
    ? `<span class="log-rolled-tag">되돌려짐</span>`
    : "";

  return `
    <div class="log-row">
      <div class="log-row-top">
        <span class="log-time">${formatTime(log.createdAt)}</span>
        <span class="log-map-badge">${mapLabel}</span>
        <span class="log-action-badge ${actionInfo.cls}">${actionInfo.label}</span>
        ${rollbackBtn}
        <button class="log-del-btn" data-id="${log.id}" title="이 로그 기록만 삭제">기록 삭제</button>
      </div>
      <div class="log-row-title">${logEscapeHtml(title)}${region ? ` <span class="log-row-region">· ${logEscapeHtml(region)}</span>` : ""}</div>
    </div>`;
}

function getFilteredLogs() {
  let list = currentMapFilter === "all" ? allLogs : allLogs.filter((l) => l.map === currentMapFilter);
  if (selectedDate) list = list.filter((l) => getLocalDateKey(l.createdAt) === selectedDate);
  return list;
}

function renderLogs() {
  const list = document.getElementById("log-list");
  const filtered = getFilteredLogs();
  list.innerHTML = filtered.length
    ? filtered.map(logCardHTML).join("")
    : `<p class="empty-msg">기록이 없습니다.</p>`;

  list.querySelectorAll(".log-rollback-btn").forEach((btn) => {
    btn.addEventListener("click", () => rollbackLog(btn.dataset.id));
  });
  list.querySelectorAll(".log-del-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteOneLog(btn.dataset.id));
  });
}

// ---------- 되돌리기 (자료 자체를 되돌림) ----------

async function rollbackLog(id) {
  const log = allLogs.find((l) => String(l.id) === String(id));
  if (!log) return;
  const { title } = describeSnapshot(log.map, log.after || log.before);
  const ok = confirm(`'${title}' 항목의 ${ACTION_LABELS[log.action]?.label || log.action} 동작을 되돌릴까요?`);
  if (!ok) return;

  const password = logAskPassword("되돌리려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  try {
    const res = await fetch(`/api/logs/${encodeURIComponent(id)}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      sessionStorage.removeItem(LOG_PASSWORD_SESSION_KEY);
      return;
    }
    if (!res.ok) {
      alert(data.error || "되돌리기에 실패했습니다.");
      return;
    }
    alert("되돌렸습니다.");
    await loadLogs();
  } catch (err) {
    alert("되돌리기 중 오류가 발생했습니다: " + err.message);
  }
}

// ---------- 로그 기록 삭제 (자료는 그대로, 기록만 삭제) ----------

async function deleteOneLog(id) {
  const ok = confirm("이 로그 기록 한 건을 삭제할까요?\n(실제 등록된 자료에는 영향을 주지 않습니다)");
  if (!ok) return;
  const password = logAskPassword("로그를 삭제하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  try {
    const res = await fetch(`/api/logs/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      sessionStorage.removeItem(LOG_PASSWORD_SESSION_KEY);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "삭제에 실패했습니다.");
      return;
    }
    await loadLogs();
  } catch (err) {
    alert("삭제 중 오류가 발생했습니다: " + err.message);
  }
}

async function deleteLogsInRange(fromDate, toDate_, confirmMsg) {
  const ok = confirm(confirmMsg);
  if (!ok) return;
  const password = logAskPassword("로그를 삭제하려면 팀 비밀번호를 입력하세요.");
  if (!password) return;

  const from = toSqliteUtc(fromDate);
  const to = toSqliteUtc(toDate_);

  try {
    const res = await fetch(`/api/logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.status === 401) {
      alert("팀 비밀번호가 올바르지 않습니다.");
      sessionStorage.removeItem(LOG_PASSWORD_SESSION_KEY);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || "삭제에 실패했습니다.");
      return;
    }
    alert(`${data.deleted ?? ""}건 삭제되었습니다.`.trim());
    selectedDate = null;
    document.getElementById("log-date-panel").hidden = true;
    await loadLogs();
  } catch (err) {
    alert("삭제 중 오류가 발생했습니다: " + err.message);
  }
}

// ---------- 캘린더 ----------

function activeDateSet() {
  return new Set(allLogs.map((l) => getLocalDateKey(l.createdAt)));
}

function initCalendarMonth() {
  const base = allLogs.length ? toDate(allLogs[0].createdAt) : new Date();
  calYear = base.getFullYear();
  calMonth = base.getMonth();
}

function renderCalendar() {
  const grid = document.getElementById("log-calendar-grid");
  const title = document.getElementById("log-cal-title");
  title.textContent = `${calYear}년 ${calMonth + 1}월`;

  const active = activeDateSet();
  const firstDay = new Date(calYear, calMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  let html = weekdayLabels.map((w) => `<div class="log-cal-weekday">${w}</div>`).join("");

  for (let i = 0; i < startWeekday; i++) {
    html += `<div class="log-cal-cell empty"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isActive = active.has(key);
    const isSelected = key === selectedDate;
    const cls = ["log-cal-cell"];
    if (isActive) cls.push("has-activity");
    if (isSelected) cls.push("selected");
    html += `<button type="button" class="${cls.join(" ")}" data-date="${key}" ${isActive ? "" : "disabled"}>${d}</button>`;
  }

  grid.innerHTML = html;
  grid.querySelectorAll(".log-cal-cell.has-activity").forEach((btn) => {
    btn.addEventListener("click", () => selectDate(btn.dataset.date));
  });
}

function selectDate(dateKey) {
  selectedDate = dateKey;
  renderCalendar();
  showDatePanel();
  renderLogs();
}

function showDatePanel() {
  const panel = document.getElementById("log-date-panel");
  if (!selectedDate) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  document.getElementById("log-date-label").textContent = `${selectedDate} (${getFilteredLogs().length}건)`;
  document.getElementById("log-range-form").hidden = true;
}

document.getElementById("log-calendar-toggle").addEventListener("click", () => {
  const box = document.getElementById("log-calendar-box");
  box.hidden = !box.hidden;
});

document.getElementById("log-cal-prev").addEventListener("click", () => {
  calMonth--;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
});
document.getElementById("log-cal-next").addEventListener("click", () => {
  calMonth++;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCalendar();
});

document.getElementById("log-date-clear").addEventListener("click", () => {
  selectedDate = null;
  document.getElementById("log-date-panel").hidden = true;
  renderCalendar();
  renderLogs();
});

document.getElementById("log-delete-date-btn").addEventListener("click", () => {
  if (!selectedDate) return;
  const [y, m, d] = selectedDate.split("-").map(Number);
  const from = new Date(y, m - 1, d, 0, 0, 0);
  const to = new Date(y, m - 1, d + 1, 0, 0, 0);
  const count = getFilteredLogs().length;
  deleteLogsInRange(from, to, `${selectedDate}의 로그 기록 ${count}건을 전부 삭제할까요?\n(실제 등록된 자료에는 영향을 주지 않습니다)`);
});

document.getElementById("log-range-toggle").addEventListener("click", () => {
  const form = document.getElementById("log-range-form");
  form.hidden = !form.hidden;
});

document.getElementById("log-range-delete-btn").addEventListener("click", () => {
  if (!selectedDate) return;
  const fromVal = document.getElementById("log-range-from").value;
  const toVal = document.getElementById("log-range-to").value;
  if (!fromVal || !toVal) {
    alert("시작 시간과 끝 시간을 모두 입력해 주세요.");
    return;
  }
  const [y, m, d] = selectedDate.split("-").map(Number);
  const [fh, fm] = fromVal.split(":").map(Number);
  const [th, tm] = toVal.split(":").map(Number);
  const from = new Date(y, m - 1, d, fh, fm, 0);
  const to = new Date(y, m - 1, d, th, tm, 0);
  if (to <= from) {
    alert("끝 시간이 시작 시간보다 뒤여야 합니다.");
    return;
  }
  deleteLogsInRange(from, to, `${selectedDate} ${fromVal}~${toVal}의 로그 기록을 삭제할까요?\n(실제 등록된 자료에는 영향을 주지 않습니다)`);
});

// ---------- 지도 필터 ----------

document.querySelectorAll(".log-filter-btn[data-map]").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMapFilter = btn.dataset.map;
    document.querySelectorAll(".log-filter-btn[data-map]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderLogs();
    if (selectedDate) showDatePanel();
  });
});

// ---------- 초기화 ----------

async function loadLogs() {
  try {
    const res = await fetch("/api/logs", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    allLogs = await res.json();
  } catch (e) {
    allLogs = [];
    console.error("로그를 불러오지 못했습니다.", e);
  }
  initCalendarMonth();
  renderCalendar();
  renderLogs();
}

document.addEventListener("DOMContentLoaded", loadLogs);
