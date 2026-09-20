// functions/api/logs/[id].js
// DELETE /api/logs/:id -> 로그 항목 한 건 삭제 (기록만 지움, 실제 자료는 건드리지 않음. password 필요)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestDelete({ request, env, params }) {
  let body = {};
  try {
    body = await request.json();
  } catch (e) {}

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }

  await env.DB.prepare(`DELETE FROM activity_log WHERE id = ?`).bind(params.id).run();
  return json({ ok: true });
}
