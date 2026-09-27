// functions/_middleware.js
// index.html(지도1)·gimpo.html(지도2)에 ?id=... 로 접속했을 때만
// og:title / og:description / og:url / <title> 을 해당 사례 내용으로 바꿔서 응답합니다.
//
// - 그 외 모든 요청(?id= 없는 일반 접속, /api/* 등)은 아무 처리 없이 그대로 통과시킵니다.
// - 자료 조회에 실패하거나 id에 해당하는 자료가 없으면, 원래 정적 페이지를 그대로 돌려줍니다
//   (미리보기가 기본 문구로 뜨는 것 외에는 사이트 동작에 영향이 없습니다).
// - 화면 자체의 동작(어떤 사례로 이동하는지 등)은 지금처럼 js/permalink.js + main.js/gimpo.js가
//   그대로 처리합니다. 이 파일은 메신저가 읽는 미리보기 태그만 바꿔치기합니다.

const SITE_TITLE = "어반애니멀리스트";

function tableForPath(pathname) {
  const p = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (p === "/" || p === "/index" || p === "/index.html") return "incidents";
  if (p === "/gimpo" || p === "/gimpo.html") return "gimpo_incidents";
  return null;
}

async function fetchEntry(env, table, id) {
  const row = await env.DB
    .prepare(`SELECT title, "desc" AS description FROM ${table} WHERE id = ?`)
    .bind(id)
    .first();
  return row && row.title ? row : null;
}

class MetaContentRewriter {
  constructor(content) {
    this.content = content;
  }
  element(el) {
    el.setAttribute("content", this.content);
  }
}

class TextRewriter {
  constructor(text) {
    this.text = text;
  }
  element(el) {
    el.setInnerContent(this.text);
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;

  if (request.method !== "GET") return next();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const table = id && tableForPath(url.pathname);
  if (!table) return next();

  let entry;
  try {
    entry = await fetchEntry(env, table, id);
  } catch (e) {
    entry = null;
  }
  if (!entry) return next();

  // 실제 브라우저가 쓰고 있는 경로(예: /gimpo)를 그대로 다시 요청해야
  // Cloudflare의 확장자 제거 리다이렉트에 걸리지 않고 실제 페이지 내용을 받아온다.
  // 이 블록에서 무슨 문제가 생기든(응답 실패, 알 수 없는 오류 등) 절대 페이지를
  // 깨뜨리지 않고 원래 페이지로 안전하게 넘어가도록 전체를 try/catch로 감싼다.
  try {
    const assetUrl = new URL(url.pathname, url.origin);
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (!assetResponse.ok) return next();

    const pageTitle = `${entry.title} | ${SITE_TITLE}`;
    const description = entry.description && entry.description.trim()
      ? entry.description.trim()
      : `${SITE_TITLE}에 등록된 도시 동물 피해 사례입니다.`;

    return new HTMLRewriter()
      .on('meta[property="og:title"]', new MetaContentRewriter(pageTitle))
      .on('meta[property="og:description"]', new MetaContentRewriter(description))
      .on('meta[property="og:url"]', new MetaContentRewriter(url.toString()))
      .on('meta[name="description"]', new MetaContentRewriter(description))
      .on("title", new TextRewriter(pageTitle))
      .transform(assetResponse);
  } catch (e) {
    return next();
  }
}
