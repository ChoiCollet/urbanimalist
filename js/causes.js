// ============================================================
// causes.js
// 원인 유형(카테고리) 정의 - 지도1(index.html)·지도2(gimpo.html)·
// 원인 유형 관리 페이지(causes.html)가 모두 이 파일 하나를 공유합니다.
//
// 저장 방식: 기본 6개 유형은 아래 DEFAULT_CAUSES에 고정되어 있고,
// 사용자가 이름/색을 바꾸면 "그 id에 대한 변경분(override)"만 localStorage에
// 따로 저장됩니다. 즉 A 유형을 수정해도 B 유형의 저장 데이터에는
// 전혀 손대지 않으므로, 건드리지 않은 유형은 항상 기본값 그대로 유지됩니다.
// 새로 추가한 유형은 별도 목록에 통째로 저장됩니다(기본 유형과 분리 보관).
// ============================================================

const DEFAULT_CAUSES = [
  { id: "roadkill", name: "로드킬 · 도로 사고", color: "#e2725b" },
  { id: "habitat", name: "서식지 파괴 · 단절", color: "#c98a3f" },
  { id: "collision", name: "유리창 · 구조물 충돌", color: "#7a8fae" },
  { id: "pollution", name: "환경오염 · 쓰레기 피해", color: "#6b8e5a" },
  { id: "conflict", name: "인간-동물 갈등 · 포획", color: "#9a6bae" },
  { id: "etc", name: "기타", color: "#8a8a8a" },
];

const CAUSE_OVERRIDES_KEY = "ua_cause_overrides_v1"; // { [id]: { name?, color?, removed? } }
const CAUSE_CUSTOM_KEY = "ua_cause_custom_v1"; // [{ id, name, color }]

function loadCauseOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CAUSE_OVERRIDES_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveCauseOverrides(obj) {
  localStorage.setItem(CAUSE_OVERRIDES_KEY, JSON.stringify(obj));
}
function loadCustomCauses() {
  try {
    return JSON.parse(localStorage.getItem(CAUSE_CUSTOM_KEY)) || [];
  } catch (e) {
    return [];
  }
}
function saveCustomCauses(list) {
  localStorage.setItem(CAUSE_CUSTOM_KEY, JSON.stringify(list));
}

// 현재 유효한 전체 원인 유형 목록 (기본 + 사용자 추가분, 삭제된 것 제외)
function getCauses() {
  const overrides = loadCauseOverrides();
  const applyOverride = (c) => {
    const o = overrides[c.id] || {};
    return { id: c.id, name: o.name || c.name, color: o.color || c.color, removed: !!o.removed };
  };
  const base = DEFAULT_CAUSES.map(applyOverride).filter((c) => !c.removed);
  const custom = loadCustomCauses().map(applyOverride).filter((c) => !c.removed);
  return [...base, ...custom];
}

// 삭제된 유형을 포함해 이름/색을 조회할 때 쓰는 함수 (기존 등록 자료가
// 이미 삭제된 유형을 참조하고 있을 수 있으므로 항상 조회 가능해야 함)
function getCauseById(id) {
  const overrides = loadCauseOverrides();
  const all = [...DEFAULT_CAUSES, ...loadCustomCauses()];
  const found = all.find((c) => c.id === id);
  if (!found) return null;
  const o = overrides[id] || {};
  return { id: found.id, name: o.name || found.name, color: o.color || found.color };
}

function causeName(id) {
  const c = getCauseById(id);
  return c ? c.name : "기타";
}
function causeColor(id) {
  const c = getCauseById(id);
  return c ? c.color : "#8a8a8a";
}

function isDefaultCause(id) {
  return DEFAULT_CAUSES.some((c) => c.id === id);
}

function generateCauseId() {
  return "custom-" + Date.now().toString(36);
}
