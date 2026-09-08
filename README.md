# urbanimalist

도시 속 동물 피해 사례를 대한민국 지도(전국 → 시도 → 시군구) 위에서 조회·등록하는 정적 웹사이트입니다. GitHub Pages/Cloudflare Pages 등 정적 호스팅에 별도 빌드 과정 없이 그대로 배포할 수 있습니다.

## 폴더 구조

```
urbanimalist/
├─ index.html          # 메인 페이지 (지도 도구 + 자료 등록 + 소개 섹션들)
├─ about.html           # 소개 페이지
├─ contact.html         # 문의 페이지
├─ privacy.html         # 개인정보 처리방침 (애드센스 대비)
├─ css/style.css        # 전체 스타일
├─ js/regions.js        # 시도 메타데이터 · 원인 카테고리 정의
├─ js/main.js           # 지도 렌더링, 드릴다운, 등록/검색/내보내기 로직
├─ data/incidents.json  # 기본 제공 자료(전국 단위 검증된 통계)
├─ robots.txt
└─ sitemap.xml
```

## 지도 SVG 출처

- 전국(시도) 지도: `index.html`에 삽입된 대한민국 시도 SVG는 [VictorCazanave/svg-maps](https://github.com/VictorCazanave/svg-maps) 프로젝트의 `south-korea` 패키지(MIT License)를 사용했습니다.
- 시군구 서브맵(`assets/maps/seoul.svg`, `incheon.svg`, `gyeonggi.svg`): 통계청(KOSTAT) 2013년 행정구역 경계 데이터([southkorea/southkorea-maps](https://github.com/southkorea/southkorea-maps))를 가공해 직접 생성했습니다. 인천 남구는 미추홀구로 이름만 갱신했으며, 최근 신설된 영종구·검단구·서해구·제물포구 등 세부 분구는 원본 경계 데이터가 없어 반영되지 않았습니다. 서울·인천·경기 외 지역은 시군구 목록(칩) 방식으로만 제공됩니다.

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
