// ============================================================
// causes-admin.js
// 원인 유형 관리 페이지 로직
// ============================================================

async function fetchJsonSafe(url) {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function computeUsageCounts() {
  const [map1Entries, map2Entries] = await Promise.all([
    fetchJsonSafe("/api/incidents"),
    fetchJsonSafe("/api/gimpo-incidents"),
  ]);

  const counts = {}; // id -> { map1, map2 }
  const add = (list, key) => {
    list.forEach((e) => {
      if (!e.cause) return;
      if (!counts[e.cause]) counts[e.cause] = { map1: 0, map2: 0 };
      counts[e.cause][key]++;
    });
  };
  add(map1Entries, "map1");
  add(map2Entries, "map2");
  return counts;
}

function escapeHtmlAdmin(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function saveOneOverride(id, patch) {
  const overrides = loadCauseOverrides();
  overrides[id] = { ...(overrides[id] || {}), ...patch };
  saveCauseOverrides(overrides);
}

async function renderCausesTable() {
  const usage = await computeUsageCounts();
  const causes = getCauses();
  const wrap = document.getElementById("causes-table");

  wrap.innerHTML = causes
    .map((c) => {
      const u = usage[c.id] || { map1: 0, map2: 0 };
      const total = u.map1 + u.map2;
      const canDelete = total === 0;
      const defaultTag = isDefaultCause(c.id) ? `<span class="tag-basic">기본</span>` : `<span class="tag-basic tag-custom">추가</span>`;
      return `
      <div class="cause-row" data-id="${c.id}">
        <input type="color" class="cause-color-input" value="${c.color}" data-id="${c.id}" />
        <input type="text" class="cause-name-input" value="${escapeHtmlAdmin(c.name)}" data-id="${c.id}" />
        ${defaultTag}
        <span class="cause-usage">지도1 ${u.map1}건 · 지도2 ${u.map2}건</span>
        <button class="cause-save-btn" data-id="${c.id}">저장</button>
        <button class="cause-del-btn" data-id="${c.id}" ${canDelete ? "" : "disabled title=\"사용 중인 자료가 있어 삭제할 수 없습니다\""}>삭제</button>
      </div>`;
    })
    .join("");

  wrap.querySelectorAll(".cause-save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const row = wrap.querySelector(`.cause-row[data-id="${id}"]`);
      const name = row.querySelector(".cause-name-input").value.trim();
      const color = row.querySelector(".cause-color-input").value;
      if (!name) {
        alert("이름을 입력해 주세요.");
        return;
      }
      saveOneOverride(id, { name, color });
      alert("저장되었습니다. 이 유형만 변경되고 다른 유형은 그대로입니다.");
      renderCausesTable();
    });
  });

  wrap.querySelectorAll(".cause-del-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const c = getCauses().find((x) => x.id === id);
      const ok = confirm(`'${c ? c.name : id}' 유형을 새 자료 등록 목록에서 제외할까요?\n(이미 등록된 자료에는 계속 정상 표시됩니다.)`);
      if (!ok) return;
      saveOneOverride(id, { removed: true });
      renderCausesTable();
    });
  });
}

document.getElementById("add-cause-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const nameInput = document.getElementById("new-cause-name");
  const colorInput = document.getElementById("new-cause-color");
  const name = nameInput.value.trim();
  if (!name) return;
  const custom = loadCustomCauses();
  custom.push({ id: generateCauseId(), name, color: colorInput.value });
  saveCustomCauses(custom);
  nameInput.value = "";
  renderCausesTable();
});

document.getElementById("reset-all-btn").addEventListener("click", () => {
  const ok = confirm("모든 수정·추가 내역을 지우고 기본 6개 유형으로 되돌릴까요?\n(이미 등록된 자료의 원인 태그는 그대로 유지됩니다.)");
  if (!ok) return;
  localStorage.removeItem(CAUSE_OVERRIDES_KEY);
  localStorage.removeItem(CAUSE_CUSTOM_KEY);
  renderCausesTable();
});

document.addEventListener("DOMContentLoaded", renderCausesTable);
