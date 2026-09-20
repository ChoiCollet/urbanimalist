-- ============================================================
-- schema_add_log.sql
-- 기존 D1 데이터베이스에 활동 로그 테이블만 추가합니다.
-- D1 콘솔에서 이 파일 내용만 붙여넣고 실행하세요.
-- (schema.sql을 다시 실행하지 마세요 - 기존 자료가 초기화됩니다)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  map TEXT NOT NULL,              -- 'map1'(전국 지도) 또는 'map2'(김포시 지도)
  entity_id TEXT NOT NULL,        -- incidents.id 또는 gimpo_incidents.id
  action TEXT NOT NULL,           -- 'create' | 'update' | 'delete' | 'rollback'
  before_data TEXT,               -- 변경 전 자료 스냅샷(JSON), 없으면 NULL
  after_data TEXT,                -- 변경 후 자료 스냅샷(JSON), 없으면 NULL
  rolled_back INTEGER DEFAULT 0,  -- 이 로그가 이미 롤백되었는지 여부
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
