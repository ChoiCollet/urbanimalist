-- ============================================================
-- schema_add_log.sql
-- 기존 D1 데이터베이스에 활동 로그 테이블만 추가합니다.
-- D1 콘솔에서 이 파일 내용만 붙여넣고 실행하세요.
-- (schema.sql을 다시 실행하지 마세요 - 기존 자료가 초기화됩니다)
-- ============================================================

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