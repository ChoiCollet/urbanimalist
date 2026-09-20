// ============================================================
// log.js
// 활동 로그 페이지 - 조회는 공용, 되돌리기는 지도별로 독립 동작
// ============================================================

const LOG_PASSWORD_SESSION_KEY = "ua_team_password"; // main.js/gimpo.js와 동일한 키 재사용

let allLogs = [];
let currentFilter = "all";

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

function formatTime(iso) {
  // D1 datetime('now')는 UTC 기준 "YYYY-MM-DD HH:MM:SS" 형태
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

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
      </div>
      <div class="log-row-title">${logEscapeHtml(title)}${region ? ` <span class="log-row-region">· ${logEscapeHtml(region)}</span>` : ""}</div>
    </div>`;
}

function renderLogs() {
  const list = document.getElementById("log-list");
  const filtered = currentFilter === "all" ? allLogs : allLogs.filter((l) => l.map === currentFilter);
  list.innerHTML = filtered.length
    ? filtered.map(logCardHTML).join("")
    : `<p class="empty-msg">기록이 없습니다.</p>`;

  list.querySelectorAll(".log-rollback-btn").forEach((btn) => {
    btn.addEventListener("click", () => rollbackLog(btn.dataset.id));
  });
}

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

async function loadLogs() {
  try {
    const res = await fetch("/api/logs", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    allLogs = await res.json();
  } catch (e) {
    allLogs = [];
    console.error("로그를 불러오지 못했습니다.", e);
  }
  renderLogs();
}

document.querySelectorAll(".log-filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.map;
    document.querySelectorAll(".log-filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderLogs();
  });
});

document.addEventListener("DOMContentLoaded", loadLogs);
