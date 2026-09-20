-- ============================================================
-- schema.sql
-- 어반애니멀리스트 D1 스키마 + 기존 자료 마이그레이션
-- Cloudflare 대시보드의 D1 콘솔에서 이 파일 전체를 실행하면
-- 테이블 생성 + 지금까지 등록된 자료가 그대로 들어갑니다.
-- ============================================================

DROP TABLE IF EXISTS incidents;
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  sido TEXT NOT NULL,
  sigungu TEXT,
  cause TEXT,
  title TEXT NOT NULL,
  desc TEXT,
  source TEXT,
  source_url TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

DROP TABLE IF EXISTS gimpo_incidents;
CREATE TABLE gimpo_incidents (
  id TEXT PRIMARY KEY,
  dong TEXT NOT NULL,
  cause TEXT,
  title TEXT NOT NULL,
  desc TEXT,
  source TEXT,
  source_url TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_data TEXT,
  after_data TEXT,
  rolled_back INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-001', '["incheon"]', '연수구', 'etc', '송도서 출몰한 털 듬성듬성 빠진 동물 정체는 너구리…개선충 감염 추정', '개선충 감염', '서울신문', 'https://m.seoul.co.kr/news/society/2025/04/27/20250427500044', '2025-04-27');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-002', '["incheon"]', '강화군', 'conflict', '서식지 잃고 도심으로 밀려온 야생생물…인간과 갈등 60% 증가', '강화 너구리 발견(서식지 감소)
전국, 동물로 인한 농작물 피해(2015) > 부상•사망•폐사(2024)', '경향신문', 'https://www.khan.co.kr/article/202603191539001/amp', '2026-03-19');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-003', '["south-gyeongsang", "north-gyeongsang", "busan", "daegu", "ulsan"]', '', 'etc', '대형 산불 속 ''반려동물·가축'' 보호할 법적 장치 없어', '영남(경상남도, 경상북도, 부산광역시, 대구광역시, 울산광역시), 산불', '데이터솜', 'https://www.datasom.co.kr/news/articleViewAmp.html?idxno=204917', '2025-06-26');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-004', '["nationwide"]', '', 'roadkill', '인간 주위 맴도는 야생동물 〈1142호〉', '로드킬, 도시화에 따른 서식지 파괴', '명대신문', 'http://news.mju.ac.kr/news/articleView.html?idxno=13286', '2025-05-19');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-005', '["south-gyeongsang"]', '진주시', 'collision', '노랑턱멧새 14마리 떼죽음…진주 도심 ‘유리벽 충돌’ 대책 필요', '경남 진주, 유리창 충돌', '단디뉴스', 'http://www.dandinews.com/news/articleView.html?idxno=17387', '2026-08-24');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-006', '["seoul"]', '영등포구', 'habitat', '“여의도 불꽃축제, 람사르습지 ‘밤섬’ 생태계 훼손···조류에도 피해”', '서울 여의도, 불꽃놀이로 인한 생태계 파괴', '경향신문', 'https://n.news.naver.com/article/032/0003468582', '2026-09-05');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-007', '["seoul"]', '중구', 'habitat', '"윙윙"···사람에 꿀 뺏기고 기온 상승에 과로사하는 벌 [위기의 도심동물들]', '서울 중구, 기후변화로 인한 서식지 감소 및 생존 위협', '한국일보', 'https://n.news.naver.com/article/469/0000871057', '2025-06-18');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-008', '["gwangju"]', '', 'roadkill', '멸종위기 맹꽁이 18마리 광주 도심서 발견…"로드킬 위험"', '전남 광주, 멸종위기종 로드킬', '뉴스1', 'https://n.news.naver.com/article/421/0009004808', '2026-06-15');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-009', '["south-gyeongsang"]', '창원시', 'roadkill', '겨울잠 깬 두꺼비, 도심 곳곳에서 ''로드킬''', '경남 창원, 로드킬', 'KNN', 'https://news.knn.co.kr/news/article/169726', '2025-03-05');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-010', '["ulsan"]', '중구', 'roadkill', '황방산 두꺼비 어디로?…기후변화·로드킬 ‘이중고’', '울산 중구, 로드킬', 'KBS', 'https://n.news.naver.com/article/056/0012217560', '2026-07-14');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-011', '["gyeonggi"]', '용인시', 'roadkill', '용인 야생동물 구조 ''도 최다'', 처인구 국도변 로드킬 심각', '경기 용인, 로드킬', '오마이뉴스', 'https://n.news.naver.com/article/047/0002514723', '2026-05-07');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-012', '["nationwide"]', '', 'habitat', '6월_이달의 멸종위기종_담비', '한반도 및 국외, 위협 요인: 산림 훼손, 서식지 단절, 찻길사고 등', '국립생태원', 'https://www.nie.re.kr/nie/bbs/BMSR00085/view.do?boardId=695967833', '2026-06-02');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-013', '["gyeonggi"]', '화성시', 'roadkill', '교외 도로에서만 일어난다?…반복되는 도심 로드킬', '경기 동탄, 로드킬', 'MBN', 'https://n.news.naver.com/article/057/0001855246', '2024-11-21');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-014', '["gwangju"]', '', 'roadkill', '앗! 고양이 ...광주 도심 로드킬 피해 80% 집중', '전남 광주, 로드킬', '드림투데이', 'http://www.gjdream.com/news/articleView.html?idxno=604903', '2020-12-16');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-015', '["north-jeolla"]', '부안군', 'roadkill', '전북 하루 4.7건 꼴 로드킬 발생⋯운전자 안전 위협', '전북 부안군, 로드킬', '전북일보', 'https://www.jjan.kr/article/20220322580376', '2022-03-22');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-016', '["seoul", "gyeonggi"]', '', 'roadkill', '고양이 로드킬, 수도권에서만 하루 55마리가 당한다', '서울 경기, 로드킬', '한국일보', 'https://n.news.naver.com/article/469/0000657346', '2022-02-10');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-017', '["gyeonggi"]', '광명시', 'etc', '반려견은 물놀이장에 풍덩…유기견은 철창 안에서 헉헉', '경기도 광명시, 유기견 폭염 피해서 수영하는 모습 포착', '연합뉴스TV', 'https://n.news.naver.com/article/422/0000891258', '2026-08-01');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-018', '["south-jeolla"]', '장흥군', 'conflict', '‘슬픈 犬生’…생지옥 같은 동물보호소 곳곳에 있었다', '전남 광주 장흥군 및 무안군, 유기동물 방치 및 학대', '광주일보', 'http://m.kwangju.co.kr/article.php?aid=1788348600802964006', '2026-09-02');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-019', '["ulsan"]', '', 'collision', '울산서 10년간 새 2247마리, 건물 유리창에 충돌', '울산, 조류 전선 및 건물 충돌', '중앙일보', 'https://n.news.naver.com/article/025/0003443664', '2025-05-27');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-020', '["seoul"]', '광진구', 'collision', '유리창 충돌사 새들 연간 765만 마리…왜?', '서울시, 건축물에 ''조류 충돌 방지 테이프'' 설치 지원', '노컷뉴스', 'https://n.news.naver.com/article/079/0003997827', '2025-03-04');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-021', '["south-gyeongsang"]', '거제시', 'collision', '천연기념물 ''팔색조'' 유리창 충돌 폐사 속출', '천연기념물인 팔색조가 여름철 번식기를 맞아 남해안을 찾아왔다가 유리창에 충돌해 폐사하는 글래스 킬이 속출하고 있습니다.', 'KNN', 'https://news.knn.co.kr/news/article/173238', '2025-05-28');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-022', '["jeju"]', '제주시', 'collision', '3.9초에 한 마리씩 유리창에 ‘쿵’…천연기념물도 위협', '제주시 화북일동에서도 유리창에 부딪혀 뇌진탕으로 날지 못하는 팔색조(천연기념물 제204호)가 구조됐습니다.', 'KBS', 'https://n.news.naver.com/article/056/0011967455', '2025-06-10');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-023', '["nationwide"]', '', 'collision', '투명 유리창, 야생조류의 마지막 비행![에코피디아]', '우리나라에서만 매년 약 800만 마리, 하루 2만 마리의 새들이 유리창 충돌로 목숨을 잃고 있습니다.', '헤럴드경제', 'https://n.news.naver.com/article/016/0002528712', '2025-09-14');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-024', '["seoul"]', '영등포구', 'collision', '파란 하늘 반사된 유리창에…새들이 뛰어들어 죽었다', '유리창 충돌해 죽는 새 800만 마리, ‘눈 깜빡할 새의 죽음’에 대하여', '미디어오늘', 'https://n.news.naver.com/article/006/0000126969', '2024-11-14');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-025', '["jeju"]', '', 'collision', '한국서 12년 만에 처음…도심 건물과 충돌 피 흘리며 발견된 ''멸종위기'' 동물 정체', '이어 "매년 수만 마리의 새들이 유리창 충돌로 부상을 입거나 목숨을 잃고 있다"', '위키트리', 'https://www.wikitree.co.kr/articles/1056403', '2025-06-14');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-026', '["nationwide"]', '', 'collision', '유리창에 부닥쳐 죽는 새, 한 해 800만 마리', '월로 환산하면 65만 마리, 매일 2만 마리가 넘는 새가 인간 때문에 죽음을 맞고 있다.', '오마이뉴스', 'https://m.entertain.naver.com/home/article/047/0002439153', '2024-07-08');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-027', '["gwangju"]', '', 'conflict', '무허가 공기총으로 이웃 개 쏴 죽인 60대 남성, 집행유예 3년', '당시 밭에는 작물이 심어지지 않았는데, 김씨는 농작물 피해 우려를 살상 이유로 들었다.', '연합뉴스', 'https://n.news.naver.com/article/001/0016271332', '2026-08-26');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-028', '["nationwide"]', '캐나다, 토론토', 'collision', '토론토 연안 고층 빌딩 숲 "새들의 무덤"... 매년 수백만 마리 충돌', '광역 토론토 고층 빌딩 인공 불빛이 방향감각 상실 유도… 유리창 충돌 잔혹사 지속', '미주중앙일보', 'https://www.koreadaily.com/article/20260605062520254', '2026-06-05');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-029', '["nationwide"]', '', 'etc', '지난해 반려동물 관련 소비자 피해 10건 중 7건이 ‘분양 피해’', '지난해 반려동물 관련 소비자 피해 상담 10건 중 7건은 분양과 관련된 피해 사례인 것으로 나타났다.', '더퍼블릭', 'https://www.thepublic.kr/news/articleView.html?idxno=62117', '2021-09-16');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-030', '["gyeonggi"]', '성남시', 'roadkill', '''아차'' 하면 로드킬 "야생동물 조심하세요"…5~6월 34% 집중 [MBN 뉴스센터]', '이번 연휴에 자차로 여행하는 분들 많으실 텐데, 야생동물 ''로드킬'' 특히 주의하셔야 겠습니다.
날이 완연히 풀리는 이맘때쯤 야생동물도 활동이 왕성해지면서, 3건 중 1건은 5~6월에 발생한다고 합니다.', 'MBN News', 'https://youtu.be/085016Q_EWI?si=Of2Lr4KW6Tb0SZt1', '2026-05-02');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-031', '["north-chungcheong"]', '충청도', 'roadkill', '도로 위 비극 로드킬, 충청도서 최다 발생 이유 뭘까', '로드킬은 주로 충청도 지역에서 많이 발생한다. 국립생태원 로드킬정보시스템에 따르면 2020년 기준 충청권(충청도와 대전·세종 포함) 로드킬 발생 건수는 총 4850건으로 1370건인 강원도보다 3.5배 많다.', '국민일보', 'https://www.kmib.co.kr/article/view.asp?arcid=0924250234', '2022-06-18');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-032', '["south-gyeongsang"]', '함양군 휴천면', 'roadkill', '5년 새 6배 늘어난 야생동물 ''로드킬''…지난해 9만건 넘어', '김위상 "로드킬 증가, 교통안전에 위협…생태통로 늘려야"', '뉴스1', 'https://www.news1.kr/society/environment/5914515', '2025-09-18');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-033', '["incheon"]', '서구', 'habitat', '한반도 유일한 고양잇과 포식자 ''삵''이 위험하다 [위기의 도심동물들]', '경인아라뱃길 공사로 삵의 서식지가 단절', '한국일보', 'https://v.daum.net/v/20240516070009148', '2024-05-16');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-034', '["seoul"]', '강서구', 'habitat', '사라진 멸종위기종...금개구리 서식지 보전 요구_티브로드서울', '김포공항, 개발로 인한 멸종위기 금개구리 서식지 파괴 위기', 'B tv 뉴스', 'https://youtu.be/yp5dqIGY1Qo?si=UhgMCzOv575XQ_Fb', '2020-04-22');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-035', '["gyeonggi"]', '', 'conflict', '겨울철 야생동물 밀렵·밀거래 특별 단속', '경기도, 겨울철 불법 엽구·독극물 밀렵 행위로 인한 야생동물 피해 발생', '김포신문', 'https://www.igimpo.com/news/articleView.html?idxno=26256', '2011-12-17');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-036', '["south-chungcheong"]', '', 'conflict', '길고양이 포획해 잔혹 학대·살해 스트레스 풀려고 범행 30대 집유', '길고양이 학대 충남', '울산신문', 'https://www.bigkinds.or.kr/v2/news/newsDetailView.do?newsId=01501301.20260909214429001', '2026-09-09');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-037', '["south-jeolla"]', '장흥군', 'etc', '''사체 172구'' 장흥군 동물보호센터, 직무유기 혐의로 고발돼', '전남광주 동물보호 관리 미흡->다수의 동물 폐사', '연합뉴스', 'https://n.news.naver.com/article/001/0016296172', '2026-09-08');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-038', '["daejeon"]', '중구', 'roadkill', '폭염에 동물 야외 전시?... 오월드, 늑구 마케팅보다 중요한 것', '대전, 장기 폭염에 야외 전시', '오마이뉴스', 'https://n.news.naver.com/article/047/0002525334', '2026-08-12');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-039', '["south-chungcheong"]', '천안', 'conflict', '[반려동물] 반려견 맡기고 3년째 연락 두절…위탁동물 유기는 ''법 사각지대''', '충남 천안, 동물 유기', '연합뉴스', 'https://n.news.naver.com/article/001/0016298565', '2026-09-09');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-040', '["south-gyeongsang"]', '김해시 대성동', 'conflict', '"하루만" 빌더니 5층서 고양이 4마리 던진 20대…추가 학대 추정', '김해시 대성동, 고양이 학대', '머니투데이', 'https://n.news.naver.com/article/008/0005403867', '2026-08-24');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-041', '["gwangju"]', '동구 산수동', 'conflict', '생후 6개월 강아지, 길거리에서 20분 동안 학대⋯50대 견주 "훈육 차원"', '전라남도 광주시 동구 산수동, 동물 학대', '아이뉴스24', 'https://n.news.naver.com/article/031/0001050976', '2026-08-20');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-042', '["south-gyeongsang"]', '창원시', 'conflict', '“빙초산 맞은 길고양이?”…창원 상가 ‘학대 의혹’ 경찰 수사', '경남 창원, 동물 학대', '매일경제', 'https://n.news.naver.com/article/009/0005708331', '2026-07-16');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-043', '["gangwon"]', '춘천', 'conflict', '쓰레기 아파트에 반려견 52마리...동물 학대 60대 구속', '강원 춘천, 동물 학대', 'YTN', 'https://n.news.naver.com/article/052/0002379389', '2026-07-14');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-044', '["south-gyeongsang"]', '진주시', 'conflict', '진주 외곽 도로서 ‘개 목줄 매달고 질주’…동물학대 논란', '경남 진주, 동물 학대', '경남일보', 'https://www.gnnews.co.kr/news/articleView.html?idxno=639941', '2026-06-28');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-045', '["south-gyeongsang"]', '거제시', 'conflict', '반려견에 비비탄 수천 발 난사…‘동물학대’ 20대에 징역 2년 구형', '경남 거제, 동물 살해', '경기일보', 'https://n.news.naver.com/article/666/0000113844', '2026-07-03');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-046', '["gwangju"]', '서구 쌍촌동', 'conflict', '끊이지 않는 동물학대…드러난 건 ‘빙산의 일각’', '서구 쌍촌동, 동물학대', '남도일보', 'https://www.namdonews.com/news/articleView.html?idxno=913832', '2026-06-16');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-047', '["gyeonggi"]', '수원시', 'conflict', '집행유예 중 또 고양이 학대 사망…2심서 벌금형 감형', '수원시 장안구, 고양이 학대&사망', '연합뉴스', 'https://n.news.naver.com/article/001/0016235308', '2026-08-05');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-048', '["south-gyeongsang"]', '거제시', 'conflict', '"푸들 훈련 중 다리 사이 끼워 짓눌러"…애견유치원 원장 동물학대 벌금형', '경남 거제, 동물학대', 'MBN', 'https://n.news.naver.com/article/057/0001947654', '2026-05-05');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-049', '["gyeonggi"]', '용인시', 'conflict', '''늑구''가 일깨운 생명권…''훈육'' 빙자한 동물 학대에 법원 잇단 ''엄벌''', '경기 용인, 고양이 살해', 'TV조선', 'https://n.news.naver.com/article/448/0000606901', '2026-04-26');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-050', '["north-chungcheong"]', '단양군', 'conflict', '"동물 피부 뜯겨나간 채 방치"…''학대 논란'' 벌어진 동물 전시 시설', '충북 단양, 기니피그 학대?,방치', '뉴시스', 'https://n.news.naver.com/article/003/0013990639', '2026-06-06');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-051', '["north-gyeongsang"]', '구미시', 'conflict', '“아이들 보는데” 병아리 산 채 먹이로…구미 동물원 동물학대 논란', '경북 구미, 동물 학대', '헤럴드경제', 'https://n.news.naver.com/article/016/0002625792', '2026-04-07');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-052', '["north-chungcheong"]', '청주시', 'conflict', '“나무에 매달고 토치로…” 개 학대한 2명 입건', '청주, 개 학대', '경기일보', 'https://n.news.naver.com/article/666/0000112840', '2026-06-26');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-053', '["gyeonggi"]', '여주시', 'conflict', '“파양비 내고 반려견 맡겼는데…” 반려동물 죽이고 암매장 ‘가짜 보호소’ 일당 1심서 실형', '여주시 북내면, 학대&살해', '중부일보', 'https://www.joongboo.com/news/articleView.html?idxno=363729568', '2026-06-23');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-054', '["seoul"]', '마포구', 'conflict', '“앞다리 잃은 미어캣까지”…마포 미신고 동물카페 학대 의혹', '서울 마포구, 동물 방치', '매일경제', 'https://n.news.naver.com/article/009/0005653880', '2026-03-22');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-055', '["seoul"]', '영등포구', 'conflict', '줄에 매달린 사슴벌레 허공서 몸부림... 낚시 체험에 ''동물학대'' 논란', '서울 영등포구, 동물 학대', '인사이트', 'https://www.insight.co.kr/news/544062', '2026-02-23');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-056', '["gwangju"]', '광산구', 'conflict', '광주 아파트서 고양이 토막 사체···잔혹해지는 동물학대', '광주, 고양이 살해', '무등일보', 'https://www.mdilbo.com/detail/c3QycN/753108', '2026-02-12');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-057', '["north-gyeongsang"]', '포항시', 'conflict', '시츄 50마리 가두고 7일 굶겨…‘동물학대’ 40대 집유 감형', '경북 포항시, 방치 -> 폐사', '헤럴드경제', 'https://n.news.naver.com/article/016/0002628158', '2026-04-11');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-058', '["nationwide"]', '', 'conflict', '학대 영상 게시도 처벌 대상, 고양이 전기충격 영상 올린 30대 약식기소', '직접 학대 부인했지만 동물학대 콘텐츠 유통 혐의 적용', '비건뉴스', 'https://www.vegannews.co.kr/news/article.html?no=382586', '2026-05-10');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-059', '["north-jeolla"]', '군산시', 'conflict', '''학대 의혹'' 보호소...동물단체 ''긴급 구조''', '군산시, 동물학대', 'JTV 뉴스', 'https://jtv.co.kr/news/article.php?id=65797', '2026-02-03');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-060', '["north-jeolla"]', '군산시', 'conflict', '잘리고 불타고…멈추지 않는 동물학대 브레이크 없나', '전북 군산, 덫->발목절단,목숨 잃 ㅜ', '데일리굿뉴스', 'https://www.goodnews1.com/news/articleView.html?idxno=456203', '2026-01-31');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-061', '["south-chungcheong"]', '천안시', 'conflict', '“견주 책임 소홀” 인정했지만 처벌은 집행유예', '천안시 동남구 신부동 천안천, 동물학대', '아이뉴스24', 'https://n.news.naver.com/article/031/0001005560', '2026-02-12');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-062', '["gwangju"]', '서구 풍암동', 'conflict', '서구서 훼손된 고양이 사체 발견…동물 학대 가능성', '서구 풍암동, 고양이 폐사(동물학대 가능성)', '진일보', 'https://www.jnilbo.com/news/articleView.html?idxno=90000023961', '2026-02-20');
INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date) VALUES ('seed-063', '["seoul"]', '', 'conflict', '동물학대 수사선상 오르고도 ‘햄스터 괴롭히기’ 라방…“경찰 안 무섭다” 조롱도', '햄스터 등 작은 동물을 학대하는 과정을 담은 사진과 글을 온라인 커뮤니티에 올려 고발된 게시물 작성자가
경찰 추적 와중에도 동물 학대 행위를 이어간 정황이 포착됐다.', '한겨레', 'https://n.news.naver.com/article/028/0002788737', '2026-01-28');
