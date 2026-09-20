// functions/api/gimpo-incidents/[id].js
// PUT    /api/gimpo-incidents/:id  -> 자료 수정 (본문에 password 필요)
// DELETE /api/gimpo-incidents/:id  -> 자료 삭제 (본문에 password 필요)

import { logAction } from "../../_utils/log.js";

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
  if (!body.title || !body.dong) {
    return json({ error: "제목과 읍·면·동은 필수입니다." }, 400);
  }

  const before = await env.DB.prepare(`SELECT * FROM gimpo_incidents WHERE id = ?`).bind(params.id).first();
  if (!before) {
    return json({ error: "해당 자료를 찾을 수 없습니다." }, 404);
  }

  const after = {
    id: params.id,
    dong: body.dong,
    cause: body.cause || "etc",
    title: body.title,
    desc: body.desc || "",
    source: body.source || "",
    source_url: body.sourceUrl || "",
    date: body.date || "",
  };

  await env.DB.prepare(
    `UPDATE gimpo_incidents SET dong=?, cause=?, title=?, desc=?, source=?, source_url=?, date=? WHERE id=?`
  )
    .bind(after.dong, after.cause, after.title, after.desc, after.source, after.source_url, after.date, params.id)
    .run();

  await logAction(env, { map: "map2", entityId: params.id, action: "update", before, after });

  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  let body = {};
  try {
    body = await request.json();
  } catch (e) {}

  if (!env.TEAM_PASSWORD || body.password !== env.TEAM_PASSWORD) {
    return json({ error: "팀 비밀번호가 올바르지 않습니다." }, 401);
  }

  const before = await env.DB.prepare(`SELECT * FROM gimpo_incidents WHERE id = ?`).bind(params.id).first();
  if (!before) {
    return json({ error: "해당 자료를 찾을 수 없습니다." }, 404);
  }

  await env.DB.prepare(`DELETE FROM gimpo_incidents WHERE id = ?`).bind(params.id).run();

  await logAction(env, { map: "map2", entityId: params.id, action: "delete", before, after: null });

  return json({ ok: true });
}
