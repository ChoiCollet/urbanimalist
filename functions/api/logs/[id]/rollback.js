// functions/api/logs/[id]/rollback.js
// POST /api/logs/:id/rollback -> 해당 로그 항목의 동작을 되돌림 (본문에 password 필요)
// map 필드(map1/map2)에 따라 incidents 또는 gimpo_incidents 테이블에만 영향을 줍니다.

import { logAction } from "../../../_utils/log.js";

const TABLES = {
  map1: {
    table: "incidents",
    cols: ["id", "sido", "sigungu", "cause", "title", "desc", "source", "source_url", "date"],
  },
  map2: {
    table: "gimpo_incidents",
    cols: ["id", "dong", "cause", "title", "desc", "source", "source_url", "date"],
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env, params }) {
  let body = {};
  try {
    body = await request.json();
  } catch (e) {}

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }

  const log = await env.DB.prepare(`SELECT * FROM activity_log WHERE id = ?`).bind(params.id).first();
  if (!log) return json({ error: "로그를 찾을 수 없습니다." }, 404);
  if (log.rolled_back) return json({ error: "이미 롤백된 항목입니다." }, 400);

  const cfg = TABLES[log.map];
  if (!cfg) return json({ error: "알 수 없는 지도 구분입니다." }, 400);

  const before = log.before_data ? JSON.parse(log.before_data) : null;
  const after = log.after_data ? JSON.parse(log.after_data) : null;
  const entityId = log.entity_id;

  let rollbackBefore = null;
  let rollbackAfter = null;

  if (log.action === "create") {
    // 등록을 취소 -> 해당 자료를 삭제
    rollbackBefore = await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).bind(entityId).first();
    await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).bind(entityId).run();
    rollbackAfter = null;
  } else if (log.action === "update") {
    // 수정을 취소 -> 수정 전 값으로 되돌림
    if (!before) return json({ error: "되돌릴 이전 값이 없습니다." }, 400);
    rollbackBefore = await env.DB.prepare(`SELECT * FROM ${cfg.table} WHERE id = ?`).bind(entityId).first();
    const setClause = cfg.cols.filter((c) => c !== "id").map((c) => `${c}=?`).join(", ");
    const values = cfg.cols.filter((c) => c !== "id").map((c) => before[c]);
    await env.DB.prepare(`UPDATE ${cfg.table} SET ${setClause} WHERE id=?`).bind(...values, entityId).run();
    rollbackAfter = before;
  } else if (log.action === "delete") {
    // 삭제를 취소 -> 삭제 전 값으로 다시 등록
    if (!before) return json({ error: "되돌릴 이전 값이 없습니다." }, 400);
    const colList = cfg.cols.join(", ");
    const placeholders = cfg.cols.map(() => "?").join(", ");
    const values = cfg.cols.map((c) => before[c]);
    await env.DB.prepare(`INSERT OR REPLACE INTO ${cfg.table} (${colList}) VALUES (${placeholders})`)
      .bind(...values)
      .run();
    rollbackBefore = null;
    rollbackAfter = before;
  } else if (log.action === "rollback") {
    return json({ error: "롤백 동작 자체는 다시 롤백할 수 없습니다." }, 400);
  } else {
    return json({ error: "알 수 없는 동작입니다." }, 400);
  }

  await env.DB.prepare(`UPDATE activity_log SET rolled_back = 1 WHERE id = ?`).bind(params.id).run();

  await logAction(env, {
    map: log.map,
    entityId,
    action: "rollback",
    before: rollbackBefore,
    after: rollbackAfter,
  });

  return json({ ok: true });
}
