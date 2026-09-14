// ============================================================
// regions.js
// 대한민국 17개 시도 메타데이터
// 새로운 시도가 추가되거나 이름이 바뀌면 이 파일만 수정하면 됩니다.
// 원인 유형(카테고리)은 js/causes.js에서 관리합니다.
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

// 시군구 단위 실제 SVG 지도를 제공하는 시도 (요청: 서울/인천/경기만)
// 지도 데이터 출처: 통계청(KOSTAT) 2013 행정구역 경계 (southkorea/southkorea-maps, 단순화본)
// 인천 남구는 2018년 미추홀구로 개칭되어 이름만 반영했습니다. 최근 신설된 영종구·검단구·서해구·제물포구 등
// 세부 분구는 원본 경계 데이터에 아직 없어 이번 지도에는 반영되어 있지 않습니다.
const SUBMAP_PROVINCES = {
  seoul: "assets/maps/seoul.svg",
  incheon: "assets/maps/incheon.svg",
  gyeonggi: "assets/maps/gyeonggi.svg",
};

function provinceName(id) {
  if (id === NATIONWIDE_ID) return "전국(지역 특정 안 됨)";
  return PROVINCES[id] ? PROVINCES[id].name : id;
}
