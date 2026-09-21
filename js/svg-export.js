// ============================================================
// svg-export.js
// 현재 화면에 보이는 지도 SVG를 PNG 이미지로 저장 (지도1·지도2 공용)
// CSS(외부 스타일시트)로 적용된 테두리색 등은 이미지에 그대로 안 남기 때문에
// 내보내기 전에 필요한 스타일을 SVG 사본에 직접 값으로 넣어준 뒤 변환합니다.
// ============================================================

async function exportSvgAsPng(svgEl, filename, options = {}) {
  const { background = "#f3f1ea", scale = 3, strokeColor = "#ffffff", strokeWidth = 1.4 } = options;

  if (!svgEl) {
    alert("내보낼 지도를 찾을 수 없습니다.");
    return;
  }

  const clone = svgEl.cloneNode(true);
  const originalPaths = svgEl.querySelectorAll("path");
  const clonedPaths = clone.querySelectorAll("path");
  clonedPaths.forEach((p, i) => {
    const orig = originalPaths[i];
    // fill이 var(--map-...) 같은 CSS 변수로 지정된 경우, 복제된 SVG는 독립된 이미지로
    // 렌더링되어 원본 문서의 CSS 변수를 참조할 수 없다. 그래서 현재 화면에 실제로
    // 계산되어 있는 색(getComputedStyle)을 읽어서 고정값으로 못박아준다.
    if (orig) {
      const resolvedFill = getComputedStyle(orig).fill;
      if (resolvedFill) p.style.fill = resolvedFill;
    }
    p.classList.remove("hovered", "selected");
    p.style.stroke = strokeColor;
    p.style.strokeWidth = String(strokeWidth);
  });

  let vbW = 0;
  let vbH = 0;
  const viewBox = clone.getAttribute("viewBox");
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    vbW = parts[2];
    vbH = parts[3];
  }
  if (!vbW || !vbH) {
    vbW = svgEl.clientWidth || 640;
    vbH = svgEl.clientHeight || 640;
  }

  clone.setAttribute("width", vbW);
  clone.setAttribute("height", vbH);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bgRect.setAttribute("x", "0");
  bgRect.setAttribute("y", "0");
  bgRect.setAttribute("width", String(vbW));
  bgRect.setAttribute("height", String(vbH));
  bgRect.setAttribute("fill", background);
  clone.insertBefore(bgRect, clone.firstChild);

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(vbW * scale);
    canvas.height = Math.round(vbH * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("이미지 생성에 실패했습니다.");
        return;
      }
      const a = document.createElement("a");
      const dlUrl = URL.createObjectURL(blob);
      a.href = dlUrl;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(dlUrl), 3000);
    }, "image/png");
  } catch (e) {
    alert("이미지 저장 중 오류가 발생했습니다: " + e.message);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
