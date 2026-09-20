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
├─ js/causes.js         # 원인 유형 정의 + 안전한 override 저장 (지도1·지도2·관리페이지 공용)
├─ js/cause-chart.js    # 원인 유형별 등록 현황 차트 위젯 (지도1·지도2가 동일 구현 공유)
├─ js/causes-admin.js   # 원인 유형 관리 페이지(causes.html) 로직
├─ causes.html          # 원인 유형 관리 페이지 (이름/색 수정, 추가, 삭제)
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

## 원인 유형별 차트

index.html(전국 지도 옆)과 gimpo.html(지도 옆, 지도1과 동일한 위치/크기)에 원인 유형별 등록 현황을 막대그래프로 보여줍니다(Chart.js + chartjs-plugin-datalabels로 막대 끝에 숫자 표시). `js/cause-chart.js`의 `createCauseChartWidget()` 하나를 지도1·지도2가 그대로 공유하므로 둘의 디자인·동작이 항상 동일합니다.

- **기본(자동) 모드**: 그 페이지의 등록 자료(JSON + 로컬 등록분)에서 원인별 건수를 자동 집계합니다.
- **수동 입력 모드**: 차트 위 "숫자 직접 입력" 체크박스를 켜면 자동 집계 대신 직접 입력한 숫자가 표시됩니다. JSON 자료 없이 그래프 기능만 쓰고 싶을 때 사용합니다. 지도1/지도2가 각각 다른 localStorage 키(`ua_map1_cause_manual_*` / `ua_map2_cause_manual_*`)를 쓰므로 서로 섞이지 않습니다.

## 원인 유형 관리 (causes.html)

지도1·지도2가 공통으로 쓰는 원인 유형(기본 6개: 로드킬·서식지파괴·충돌·환경오염·갈등포획·기타)을 이름/색 수정, 추가, 삭제할 수 있는 페이지입니다. 검색엔진에는 노출되지 않도록 `noindex` 처리되어 있습니다.

- 수정 내역은 유형 id별로 개별 저장(`js/causes.js`의 override 방식)되므로, **한 유형을 고쳐도 건드리지 않은 다른 유형은 절대 영향받지 않습니다.**
- "삭제"는 완전 삭제가 아니라 새 자료 등록 목록에서만 제외하는 것이며, 이미 그 유형으로 등록된 자료는 계속 정상적으로 표시됩니다. 사용 중(지도1 또는 지도2에 1건이라도 등록됨)인 유형은 삭제 버튼이 비활성화됩니다.
- 이 페이지의 변경사항은 브라우저별(localStorage)로 저장됩니다. 모든 방문자에게 공통 반영하려면 `js/causes.js`의 `DEFAULT_CAUSES` 배열 자체를 수정해야 합니다.

## 서버 자료 저장 (Cloudflare D1 + Pages Functions)

2026-09-14 업데이트부터 자료 등록은 더 이상 브라우저 localStorage/JSON 내보내기 방식이 아니라, **Cloudflare D1(무료 SQL DB)에 저장되는 실제 서버 API**를 통해 이루어집니다. 팀원 전체가 같은 데이터를 실시간으로 보고, 팀 공유 비밀번호로만 등록·수정·삭제할 수 있습니다.

`data/incidents.json`, `data/gimpo_incidents.json`은 더 이상 사이트에서 직접 불러오지 않습니다(마이그레이션 시점 백업용으로만 보관).

### 처음 한 번만 해야 하는 설정 (Cloudflare 대시보드)

1. **D1 데이터베이스 생성**
   Cloudflare 대시보드 → Workers & Pages → D1 SQL Database → Create Database. 이름은 자유롭게(예: `urbanimalist-db`).

2. **스키마 + 기존 자료 업로드**
   방금 만든 D1 데이터베이스 → Console 탭 → 저장소 루트의 `schema.sql` 파일 내용을 전부 복사해서 붙여넣고 실행. (테이블 생성 + 기존 63건이 한 번에 들어갑니다.)

3. **Pages 프로젝트에 D1 바인딩 연결**
   Workers & Pages → `urbanimalist` 프로젝트 → Settings → Functions → D1 database bindings → Add binding.
   - Variable name: **`DB`** (반드시 이 이름이어야 함 - functions 코드에서 `env.DB`로 참조)
   - D1 database: 1번에서 만든 데이터베이스 선택

4. **팀 비밀번호 환경 변수 등록**
   같은 프로젝트 → Settings → Environment variables → Add variable.
   - Variable name: **`TEAM_PASSWORD`**
   - Value: 팀이 쓸 비밀번호 (예: `urbanimalist2026`)
   - "Encrypt" 체크(비밀 값으로 저장) 권장
   - Production과 Preview 환경 둘 다에 추가

5. 저장 후 **재배포**(Retry deployment 또는 새 커밋 푸시) 한 번 해야 바인딩이 적용됩니다.

### API 엔드포인트

| 메서드 | 경로 | 설명 | 비밀번호 |
|---|---|---|---|
| GET | `/api/incidents` | 전국 지도 자료 전체 조회 | 불필요 |
| POST | `/api/incidents` | 전국 지도 자료 등록 | 필요 |
| PUT | `/api/incidents/:id` | 전국 지도 자료 수정 | 필요 |
| DELETE | `/api/incidents/:id` | 전국 지도 자료 삭제 | 필요 |
| GET/POST/PUT/DELETE | `/api/gimpo-incidents`, `/api/gimpo-incidents/:id` | 김포시 지도용, 위와 동일 구조 | 위와 동일 |

프론트엔드(`js/main.js`, `js/gimpo.js`)는 자료 등록·수정·삭제 시 팀 비밀번호를 물어보고(브라우저 탭 세션에만 임시 저장), 위 API로 요청을 보냅니다.

## 활동 로그 & 롤백 (log.html)

자료 추가·수정·삭제가 있을 때마다 서버(D1의 `activity_log` 테이블)에 자동으로 기록됩니다. 로그인 기능이 없으므로 **누가** 했는지는 남기지 않고, **언제 · 어느 지도 · 어떤 자료 · 어떤 동작**(등록/수정/삭제)이었는지만 기록합니다. 수정/삭제 시점의 자료 내용을 스냅샷으로 함께 저장하므로, 특정 시점으로 되돌리기(롤백)가 가능합니다.

- `log.html`에서 지도1·지도2 로그를 한 화면에서 모아볼 수 있고, 지도별 필터도 있습니다.
- "되돌리기" 버튼은 그 로그 한 건의 동작만 반대로 되돌립니다(등록→삭제, 삭제→재등록, 수정→이전 값 복원). 되돌리기도 팀 비밀번호가 필요하며, 되돌린 동작 자체도 새 로그로 남습니다(투명성 유지).
- 되돌리기는 그 로그가 속한 지도(map1/map2)의 테이블에만 영향을 줍니다 — 지도1 로그를 되돌려도 지도2 자료는 전혀 건드리지 않습니다.
- 이미 되돌린 로그는 다시 되돌릴 수 없도록 막아뒀습니다(중복 롤백 방지).

### 기존 D1 데이터베이스에 로그 테이블 추가하기

이미 `schema.sql`을 실행해서 운영 중이라면, `schema.sql`을 다시 실행하지 말고 **`schema_add_log.sql`만** D1 콘솔에서 실행하세요. 기존 `incidents`/`gimpo_incidents` 자료는 그대로 두고 `activity_log` 테이블만 추가합니다.
