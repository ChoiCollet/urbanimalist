// functions/_middleware.js
// index.html(지도1)·gimpo.html(지도2)에 ?id=... 로 접속했을 때만
// og:description / meta description / og:url 을 해당 사례 내용으로 바꿔서 응답합니다.
// (제목/og:title/<title>은 그대로 "김포시 동물 피해 지도 | 어반애니멀리스트" 같은
//  기본 문구를 유지하고, 설명 자리에만 그 사례의 기사 제목이 들어갑니다.)
//
// - 그 외 모든 요청(?id= 없는 일반 접속, /api/* 등)은 아무 처리 없이 그대로 통과시킵니다.
// - 자료 조회에 실패하거나 id에 해당하는 자료가 없으면, 원래 정적 페이지를 그대로 돌려줍니다
//   (미리보기가 기본 문구로 뜨는 것 외에는 사이트 동작에 영향이 없습니다).
// - 화면 자체의 동작(어떤 사례로 이동하는지 등)은 지금처럼 js/permalink.js + main.js/gimpo.js가
//   그대로 처리합니다. 이 파일은 메신저가 읽는 미리보기 태그만 바꿔치기합니다.

function tableForPath(pathname) {
  const p = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (p === "/" || p === "/index" || p === "/index.html") return "incidents";
  if (p === "/gimpo" || p === "/gimpo.html") return "gimpo_incidents";
  return null;
}

async function fetchEntry(env, table, id) {
  const row = await env.DB
    .prepare(`SELECT * FROM ${table} WHERE id = ?`)
    .bind(id)
    .first();
  return row && row.title ? row : null;
}

// 인스턴스 프로퍼티 이름을 "text"로 두면 안 된다 — HTMLRewriter의 핸들러 인터페이스가
// "text"를 텍스트 노드 콜백용으로 예약해서 쓰기 때문에, 문자열을 담은 this.text가 있으면
// "함수가 아니다"라는 타입 에러가 난다. 그래서 아래는 "content"라는 이름을 쓴다.
class MetaContentRewriter {
  constructor(content) {
    this.content = content;
  }
  element(el) {
    el.setAttribute("content", this.content);
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

    const description = entry.title;

    return new HTMLRewriter()
      .on('meta[property="og:description"]', new MetaContentRewriter(description))
      .on('meta[property="og:url"]', new MetaContentRewriter(url.toString()))
      .on('meta[name="description"]', new MetaContentRewriter(description))
      .transform(assetResponse);
  } catch (e) {
    return next();
  }
}
