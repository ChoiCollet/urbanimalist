// functions/api/logs.js
// GET    /api/logs                    -> 지도1·지도2 전체 활동 로그 조회 (비밀번호 불필요)
// DELETE /api/logs?from=..&to=..      -> 지정 기간(UTC, "YYYY-MM-DD HH:MM:SS")의 로그 기록만 삭제
//                                         (실제 자료는 건드리지 않음, 본문에 password 필요)

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
    `SELECT * FROM activity_log ORDER BY created_at DESC, id DESC LIMIT 1000`
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

export async function onRequestDelete({ request, env }) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let body = {};
  try {
    body = await request.json();
  } catch (e) {}

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }
  if (!from || !to) {
    return json({ error: "삭제할 기간(from, to)이 필요합니다." }, 400);
  }

  const result = await env.DB.prepare(`DELETE FROM activity_log WHERE created_at >= ? AND created_at < ?`)
    .bind(from, to)
    .run();

  return json({ ok: true, deleted: result.meta ? result.meta.changes : null });
}

