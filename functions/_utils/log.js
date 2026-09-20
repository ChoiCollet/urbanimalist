// functions/_utils/log.js
// 자료 추가/수정/삭제 로그 기록 공용 함수. 파일명이 _로 시작하는 폴더는
// Cloudflare Pages Functions가 라우트로 취급하지 않으므로 공용 모듈로 안전하게 import 가능.

export async function logAction(env, { map, entityId, action, before, after }) {
  await env.DB.prepare(
    `INSERT INTO activity_log (map, entity_id, action, before_data, after_data, rolled_back)
     VALUES (?, ?, ?, ?, ?, 0)`
  )
    .bind(map, entityId, action, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null)
    .run();
}
