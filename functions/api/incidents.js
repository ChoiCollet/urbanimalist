// functions/api/incidents.js
// GET  /api/incidents        -> 전체 자료 목록 조회 (누구나 가능, 비밀번호 불필요)
// POST /api/incidents        -> 자료 등록 (본문에 password 필요)

import { logAction } from "../_utils/log.js";

function rowToEntry(row) {
  let sido = [];
  try {
    sido = JSON.parse(row.sido || "[]");
  } catch (e) {
    sido = [];
  }
  return {
    id: row.id,
    sido,
    sigungu: row.sigungu || "",
    cause: row.cause || "etc",
    title: row.title,
    desc: row.desc || "",
    source: row.source || "",
    sourceUrl: row.source_url || "",
    date: row.date || "",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM incidents ORDER BY date DESC, created_at DESC").all();
  return json(results.map(rowToEntry));
}

export async function onRequestPost({ request, env }) {
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

  const id = "entry-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const row = {
    id,
    sido: JSON.stringify(body.sido || []),
    sigungu: body.sigungu || "",
    cause: body.cause || "etc",
    title: body.title,
    desc: body.desc || "",
    source: body.source || "",
    source_url: body.sourceUrl || "",
    date: body.date || "",
  };
  await env.DB.prepare(
    `INSERT INTO incidents (id, sido, sigungu, cause, title, desc, source, source_url, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(row.id, row.sido, row.sigungu, row.cause, row.title, row.desc, row.source, row.source_url, row.date)
    .run();

  await logAction(env, { map: "map1", entityId: id, action: "create", before: null, after: row });

  return json({ id }, 201);
}
