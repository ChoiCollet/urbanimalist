// functions/api/incidents/[id].js
// PUT    /api/incidents/:id  -> 자료 수정 (본문에 password 필요)
// DELETE /api/incidents/:id  -> 자료 삭제 (본문에 password 필요)

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPut({ request, env, params }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "잘못된 요청입니다." }, 400);
  }

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }
  if (!body.title || !body.sido) {
    return json({ error: "제목과 시도는 필수입니다." }, 400);
  }

  await env.DB.prepare(
    `UPDATE incidents SET sido=?, sigungu=?, cause=?, title=?, desc=?, source=?, source_url=?, date=? WHERE id=?`
  )
    .bind(
      JSON.stringify(body.sido || []),
      body.sigungu || "",
      body.cause || "etc",
      body.title,
      body.desc || "",
      body.source || "",
      body.sourceUrl || "",
      body.date || "",
      params.id
    )
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // 본문이 없을 수도 있음
  }

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }

  await env.DB.prepare(`DELETE FROM incidents WHERE id = ?`).bind(params.id).run();
  return json({ ok: true });
}
