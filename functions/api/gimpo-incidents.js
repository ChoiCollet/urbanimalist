// functions/api/gimpo-incidents.js
// GET  /api/gimpo-incidents  -> 전체 자료 목록 조회 (누구나 가능)
// POST /api/gimpo-incidents  -> 자료 등록 (본문에 password 필요)

function rowToEntry(row) {
  return {
    id: row.id,
    dong: row.dong || "",
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
  const { results } = await env.DB.prepare("SELECT * FROM gimpo_incidents ORDER BY date DESC, created_at DESC").all();
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
  if (!body.title || !body.dong) {
    return json({ error: "제목과 읍·면·동은 필수입니다." }, 400);
  }

  const id = "entry-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  await env.DB.prepare(
    `INSERT INTO gimpo_incidents (id, dong, cause, title, desc, source, source_url, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, body.dong, body.cause || "etc", body.title, body.desc || "", body.source || "", body.sourceUrl || "", body.date || "")
    .run();

  return json({ id }, 201);
}
