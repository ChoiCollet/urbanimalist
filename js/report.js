// ============================================================
// report.js
// 캠페인 요약 리포트 - 지도1·지도2 자료를 자동 집계해
// 카드뉴스 제작에 바로 쓸 숫자·문구·대표 사례를 뽑아준다.
// ============================================================

function repEscapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

async function fetchJsonSafeR(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch (e) {
    console.error("불러오기 실패:", url, e);
    return [];
  }
}

function regionLabelMap1(entry) {
  if (entry.sido && entry.sido[0] === NATIONWIDE_ID) return "전국";
  const names = (entry.sido || []).map(provinceName);
  return names.join(" · ") + (entry.sigungu ? " " + entry.sigungu : "");
}

// ---------- 집계 ----------

function computeCauseRanking(map1, map2) {
  const counts = {};
  getCauses().forEach((c) => (counts[c.id] = 0));
  [...map1, ...map2].forEach((e) => {
    if (counts[e.cause] !== undefined) counts[e.cause]++;
  });
  const total = map1.length + map2.length;
  return getCauses()
    .map((c) => ({ id: c.id, name: c.name, color: c.color, count: counts[c.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .map((c) => ({ ...c, pct: total ? Math.round((c.count / total) * 1000) / 10 : 0 }));
}

function computeTopRegionsMap1(map1) {
  const counts = {};
  map1.forEach((e) => {
    (e.sido || []).forEach((id) => {
      if (id === NATIONWIDE_ID) return;
      const name = provinceName(id);
      counts[name] = (counts[name] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function computeTopRegionsMap2(map2) {
  const counts = {};
  map2.forEach((e) => {
    const name = e.dong || "(미상)";
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function pickRepresentativeCases(map1, map2) {
  const all = [
    ...map1.map((e) => ({ ...e, __map: "map1" })),
    ...map2.map((e) => ({ ...e, __map: "map2" })),
  ];
  const byCause = {};
  all.forEach((e) => {
    if (!e.desc || !e.source) return; // 설명·출처 갖춰진 것만 후보로
    if (!byCause[e.cause]) byCause[e.cause] = [];
    byCause[e.cause].push(e);
  });
  const picks = [];
  getCauses().forEach((c) => {
    const list = byCause[c.id];
    if (!list || !list.length) return;
    list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    picks.push(list[0]);
  });
  return picks;
}

// ---------- 렌더링 ----------

function renderStatTiles(map1, map2, causeRanking) {
  const total = map1.length + map2.length;
  const top = causeRanking[0];
  const wrap = document.getElementById("stat-tiles");
  wrap.innerHTML = `
    <div class="stat-tile">
      <span class="stat-num">${total}</span>
      <span class="stat-label">전체 등록 건수</span>
    </div>
    <div class="stat-tile">
      <span class="stat-num">${map1.length}</span>
      <span class="stat-label">전국 지도(지도1)</span>
    </div>
    <div class="stat-tile">
      <span class="stat-num">${map2.length}</span>
      <span class="stat-label">김포시 지도(지도2)</span>
    </div>
    <div class="stat-tile">
      <span class="stat-num">${top ? top.name : "-"}</span>
      <span class="stat-label">가장 많은 원인 유형${top ? ` (${top.pct}%)` : ""}</span>
    </div>`;
}

function renderCauseRanking(causeRanking) {
  const wrap = document.getElementById("cause-rank-list");
  wrap.innerHTML = causeRanking
    .map(
      (c, i) => `
    <div class="rank-item">
      <span class="rank-num">${i + 1}</span>
      <span class="rank-color" style="background:${c.color}"></span>
      <span class="rank-name">${repEscapeHtml(c.name)}</span>
      <span class="rank-bar-track"><span class="rank-bar-fill" style="width:${c.pct}%;background:${c.color}"></span></span>
      <span class="rank-count">${c.count}건 · ${c.pct}%</span>
    </div>`
    )
    .join("");
}

function renderRegionTop(elId, list) {
  const wrap = document.getElementById(elId);
  wrap.innerHTML = list.length
    ? list
        .map(
          (r, i) => `
    <div class="rank-item">
      <span class="rank-num">${i + 1}</span>
      <span class="rank-name">${repEscapeHtml(r.name)}</span>
      <span class="rank-count">${r.count}건</span>
    </div>`
        )
        .join("")
    : `<p class="empty-msg">자료가 없습니다.</p>`;
}

function representativeCardHTML(entry) {
  const mapLabel = entry.__map === "map1" ? regionLabelMap1(entry) : "김포시 " + (entry.dong || "");
  const causeTag = `<span class="tag" style="--tag-color:${causeColor(entry.cause)}">${causeName(entry.cause)}</span>`;
  const src = entry.sourceUrl
    ? `<a href="${repEscapeHtml(entry.sourceUrl)}" target="_blank" rel="noopener noreferrer">${repEscapeHtml(entry.source || "출처 보기")}</a>`
    : repEscapeHtml(entry.source || "");
  return `
    <article class="entry-card">
      <div class="entry-top">
        ${causeTag}
        <span class="entry-region">${repEscapeHtml(mapLabel)}</span>
      </div>
      <h4>${repEscapeHtml(entry.title)}</h4>
      <p>${repEscapeHtml(entry.desc || "")}</p>
      <div class="entry-meta">
        <span>${repEscapeHtml(entry.date || "")}</span>
        <span>${src}</span>
      </div>
    </article>`;
}

function renderRepresentativeCases(picks) {
  const wrap = document.getElementById("representative-cases");
  wrap.innerHTML = picks.length
    ? picks.map(representativeCardHTML).join("")
    : `<p class="empty-msg">설명·출처가 모두 채워진 사례가 아직 없습니다.</p>`;
}

function renderQuoteSuggestions(map1, map2, causeRanking, topMap1, topMap2, picks) {
  const total = map1.length + map2.length;
  const top = causeRanking[0];
  const quotes = [];

  if (total > 0) {
    quotes.push(`지금까지 기록된 도시 동물 피해 사례, 벌써 ${total}건`);
  }
  if (top && top.count > 0) {
    quotes.push(`가장 큰 원인은 '${top.name}' — 전체의 ${top.pct}%`);
  }
  if (topMap1[0]) {
    quotes.push(`전국에서 가장 많은 사례가 기록된 곳, ${topMap1[0].name} (${topMap1[0].count}건)`);
  }
  if (topMap2[0]) {
    quotes.push(`김포시 안에서는 ${topMap2[0].name}에서 가장 많은 사례가 기록됐습니다`);
  }
  if (picks[0]) {
    quotes.push(`"${picks[0].title}" — 우리 주변에서 실제로 있었던 일입니다`);
  }

  const wrap = document.getElementById("quote-suggestions");
  wrap.innerHTML = quotes.length
    ? quotes
        .map(
          (q, i) => `
    <div class="quote-item">
      <p>${repEscapeHtml(q)}</p>
      <button type="button" class="quote-copy-btn" data-text="${repEscapeHtml(q)}">복사</button>
    </div>`
        )
        .join("")
    : `<p class="empty-msg">등록된 자료가 더 쌓이면 문구가 만들어집니다.</p>`;

  wrap.querySelectorAll(".quote-copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.text);
        btn.textContent = "복사됨!";
        setTimeout(() => (btn.textContent = "복사"), 1500);
      } catch (e) {
        alert("복사에 실패했습니다. 직접 선택해서 복사해 주세요.");
      }
    });
  });
}

// ---------- 초기화 ----------

document.getElementById("report-print-btn").addEventListener("click", () => window.print());

async function initReport() {
  const [map1, map2] = await Promise.all([fetchJsonSafeR("/api/incidents"), fetchJsonSafeR("/api/gimpo-incidents")]);

  const causeRanking = computeCauseRanking(map1, map2);
  const topMap1 = computeTopRegionsMap1(map1);
  const topMap2 = computeTopRegionsMap2(map2);
  const picks = pickRepresentativeCases(map1, map2);

  renderStatTiles(map1, map2, causeRanking);
  renderCauseRanking(causeRanking);
  renderRegionTop("region-top-map1", topMap1);
  renderRegionTop("region-top-map2", topMap2);
  renderRepresentativeCases(picks);
  renderQuoteSuggestions(map1, map2, causeRanking, topMap1, topMap2, picks);

  document.getElementById("report-updated").textContent =
    "생성 시각: " + new Date().toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

document.addEventListener("DOMContentLoaded", initReport);
