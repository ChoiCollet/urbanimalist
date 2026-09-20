// functions/api/logs.js
// GET /api/logs -> 지도1·지도2 전체 활동 로그 조회 (한 곳에서 모아보기, 비밀번호 불필요 - 조회만이라 공개)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function safeParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM activity_log ORDER BY created_at DESC, id DESC LIMIT 500`
  ).all();

  const logs = results.map((row) => ({
    id: row.id,
    map: row.map,
    entityId: row.entity_id,
    action: row.action,
    before: safeParse(row.before_data),
    after: safeParse(row.after_data),
    rolledBack: !!row.rolled_back,
    createdAt: row.created_at,
  }));

  return json(logs);
}
