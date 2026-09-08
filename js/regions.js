// ============================================================
// regions.js
// 대한민국 17개 시도 메타데이터 + 원인 카테고리 정의
// 새로운 시도가 추가되거나 이름이 바뀌면 이 파일만 수정하면 됩니다.
// ============================================================

// SVG path id -> 한글 표기
const PROVINCES = {
  seoul:               { name: "서울특별시" },
  incheon:              { name: "인천광역시" },
  gyeonggi:             { name: "경기도" },
  gangwon:              { name: "강원특별자치도" },
  "north-chungcheong":  { name: "충청북도" },
  "south-chungcheong":  { name: "충청남도" },
  daejeon:              { name: "대전광역시" },
  sejong:               { name: "세종특별자치시" },
  "north-jeolla":       { name: "전북특별자치도" },
  "south-jeolla":       { name: "전라남도" },
  gwangju:              { name: "광주광역시" },
  "north-gyeongsang":   { name: "경상북도" },
  "south-gyeongsang":   { name: "경상남도" },
  daegu:                { name: "대구광역시" },
  busan:                { name: "부산광역시" },
  ulsan:                { name: "울산광역시" },
  jeju:                 { name: "제주특별자치도" },
};

// 전국 단위(특정 시도로 한정되지 않는) 자료를 담는 가상 지역 id
const NATIONWIDE_ID = "nationwide";

// 원인 카테고리 (자료 등록 시 선택, 지도 색상 필터에도 사용)
const CAUSES = [
  { id: "roadkill",   name: "로드킬 · 도로 사고", color: "#e2725b" },
  { id: "habitat",    name: "서식지 파괴 · 단절", color: "#c98a3f" },
  { id: "collision",  name: "유리창 · 구조물 충돌", color: "#7a8fae" },
  { id: "pollution",  name: "환경오염 · 쓰레기 피해", color: "#6b8e5a" },
  { id: "conflict",   name: "인간-동물 갈등 · 포획", color: "#9a6bae" },
  { id: "etc",        name: "기타", color: "#8a8a8a" },
];

function causeName(id) {
  const c = CAUSES.find((c) => c.id === id);
  return c ? c.name : "기타";
}

function causeColor(id) {
  const c = CAUSES.find((c) => c.id === id);
  return c ? c.color : "#8a8a8a";
}

function provinceName(id) {
  if (id === NATIONWIDE_ID) return "전국(지역 특정 안 됨)";
  return PROVINCES[id] ? PROVINCES[id].name : id;
}
