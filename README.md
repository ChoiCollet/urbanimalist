# urbanimalist

도시 속 동물 피해 사례를 대한민국 지도(전국 → 시도 → 시군구) 위에서 조회·등록하는 정적 웹사이트입니다. GitHub Pages/Cloudflare Pages 등 정적 호스팅에 별도 빌드 과정 없이 그대로 배포할 수 있습니다.

## 폴더 구조

```
urbanimalist/
├─ index.html          # 지도1: 전국(시도) 지도
├─ gimpo.html           # 지도2: 김포시 읍·면·동 전용 지도 (지도1과 완전히 독립)
├─ stats.html           # 전국 야생동물 구조·치료 통계 (2020~2025, 연도별 추이)
├─ about.html           # 소개 페이지
├─ contact.html         # 문의 페이지
├─ privacy.html         # 개인정보 처리방침 (애드센스 대비)
├─ css/style.css        # 전체 스타일 (지도1·지도2 공용)
├─ js/regions.js        # [지도1] 시도 메타데이터 · 원인 카테고리
├─ js/main.js           # [지도1] 지도 렌더링, 드릴다운, 등록/검색/내보내기
├─ js/gimpo.js          # [지도2] 김포시 지도 전용 로직 (완전 독립 상태/저장소)
├─ js/stats.js          # 구조 통계 페이지 로직 (Chart.js 라인 차트 + 지역별 지도)
├─ data/incidents.json  # [지도1] 기본 제공 자료
├─ data/gimpo_incidents.json  # [지도2] 기본 제공 자료 (김포시 전용)
├─ data/wildlife_stats.json  # 연도별 구조·치료 통계 원자료 (기후에너지환경부 공표자료 가공)
├─ assets/maps/seoul.svg, incheon.svg, gyeonggi.svg  # [지도1] 서브맵
├─ assets/maps/gimpo.svg  # [지도2] 김포시 읍면동 지도
├─ robots.txt
└─ sitemap.xml
```

## 지도1 vs 지도2

| | 지도1 (index.html) | 지도2 (gimpo.html) |
|---|---|---|
| 범위 | 전국 → 시도 → 시군구 | 김포시 → 읍·면·동 |
| 저장 키(localStorage) | `ua_local_entries_v1` | `ua_gimpo_local_entries_v1` |
| 기본 데이터 | `data/incidents.json` | `data/gimpo_incidents.json` |
| 등록 폼 | index.html `#register` | gimpo.html `#gimpo-register` |

두 지도는 저장 공간(localStorage 키, JSON 파일)이 완전히 분리되어 있어 서로 데이터가 섞이지 않습니다. 어느 지도에 등록할지는 페이지 자체로 구분됩니다 (index.html에서 등록 = 지도1, gimpo.html에서 등록 = 지도2).

## 지도 SVG 출처

- 전국(시도) 지도: `index.html`에 삽입된 대한민국 시도 SVG는 [VictorCazanave/svg-maps](https://github.com/VictorCazanave/svg-maps) 프로젝트의 `south-korea` 패키지(MIT License)를 사용했습니다.
- 시군구 서브맵(`assets/maps/seoul.svg`, `incheon.svg`, `gyeonggi.svg`): 통계청(KOSTAT) 2013년 행정구역 경계 데이터([southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps), `skorea_municipalities_geo_simple.json`)를 가공해 직접 생성했습니다. 인천 남구는 미추홀구로 이름만 갱신했으며, 최근 신설된 영종구·검단구·서해구·제물포구 등 세부 분구는 원본 경계 데이터가 없어 반영되지 않았습니다. 경기도의 수원시·성남시·안양시·안산시·고양시·용인시·부천시는 구 경계를 하나로 병합해 시 단위로만 표시합니다. 서울·인천·경기 외 지역은 시군구 목록(칩) 방식으로만 제공됩니다.
- 김포시 읍면동 지도(`assets/maps/gimpo.svg`): [raqoon886/Local_HangJeongDong](https://github.com/raqoon886/Local_HangJeongDong)의 최신 행정동 경계 데이터를 가공했습니다. 3읍(통진읍·고촌읍·양촌읍), 3면(대곶면·월곶면·하성면), 7개 동(걸포동·사우동·풍무동·장기동·구래동·운양동·마산동) 총 13개 지역으로 구성됩니다. 행정동 명칭인 김포본동(구 김포1동)·장기본동은 김포골드라인 역 이름에 맞춰 각각 걸포동·장기동으로 표시합니다.

## 자료 추가 방법

### 방법 1. 사이트에서 직접 등록 (팀원 누구나 가능)
사이트의 '자료 등록' 폼을 사용하면 해당 브라우저의 localStorage에 저장됩니다. 등록 후 'JSON 내보내기' 버튼으로 파일을 받아 팀원에게 공유하세요.

### 방법 2. 기본 데이터셋에 직접 추가 (저장소 관리자용, 모두에게 공통 반영됨)
`data/incidents.json` 파일에 아래 형식으로 항목을 추가하고 커밋/푸시하면, 사이트를 방문하는 모든 사람에게 공통으로 보입니다.

```json
{
  "id": "seed-005",
  "sido": ["gyeonggi"],
  "sigungu": "김포시",
  "cause": "roadkill",
  "title": "제목",
  "desc": "상세 설명",
  "source": "출처명",
  "sourceUrl": "https://...",
  "date": "2026-09-01"
}
```

- `sido`: `js/regions.js`에 정의된 id 배열 (예: `gyeonggi`, `seoul`). 특정 지역이 아니면 `["nationwide"]`.
- `cause`: `roadkill` / `habitat` / `collision` / `pollution` / `conflict` / `etc` 중 하나.

## 배포

Cloudflare Pages 기준: Build command 없음(비워둠), Build output directory는 `/`(저장소 루트).
