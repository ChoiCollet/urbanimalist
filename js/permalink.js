// ============================================================
// permalink.js
// 개별 사례로 바로 연결되는 공유 링크(퍼머링크) 생성/복사 + 카드 하이라이트
// 지도1(main.js)·지도2(gimpo.js) 공용
// ============================================================

function buildEntryPermalink(id) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("id", id);
  return url.toString();
}

async function copyEntryPermalink(btn, id) {
  const url = buildEntryPermalink(id);
  try {
    await navigator.clipboard.writeText(url);
    const original = btn.textContent;
    btn.textContent = "복사됨!";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1500);
  } catch (e) {
    prompt("아래 링크를 복사해서 사용하세요.", url);
  }
}

function getPermalinkIdFromUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

function highlightEntryCard(id) {
  const el = document.getElementById(`entry-${id}`);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("entry-highlighted");
  setTimeout(() => el.classList.remove("entry-highlighted"), 2500);
  return true;
}

// ---------- 검색어 하이라이트 ----------
// rawText를 escapeFn으로 이스케이프하면서, query와 일치하는 구간만 <mark>로 감싼다.

function highlightText(rawText, query, escapeFn) {
  const text = String(rawText || "");
  const q = (query || "").trim();
  if (!q) return escapeFn(text);

  const lower = text.toLowerCase();
  const qLower = q.toLowerCase();
  let result = "";
  let i = 0;
  let idx = lower.indexOf(qLower, i);
  while (idx !== -1) {
    result += escapeFn(text.slice(i, idx));
    result += `<mark>${escapeFn(text.slice(idx, idx + q.length))}</mark>`;
    i = idx + q.length;
    idx = lower.indexOf(qLower, i);
  }
  result += escapeFn(text.slice(i));
  return result;
}

// ---------- 자료 불러오기 상태 표시 ----------

function setDataStatus(elId, msg, isError = false) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!msg) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = msg;
  el.classList.toggle("data-status-error", isError);
}
