import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const SCHOOL_NAME = "Apex Global Academy";
const SCHOOL_MOTTO = "Learn · Lead · Succeed";
const SCHOOL_ADDRESS = "Barhim Mani Road, Katsina";

async function getLogoBase64(): Promise<string> {
  try {
    const asset = Asset.fromModule(require("../../assets/images/icon.png"));

    if (Platform.OS === "web") {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
    }

    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    if (!uri) return "";
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.warn("Logo load failed:", e);
    return "";
  }
}

function esc(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHTML(exam: any, logoSrc: string): string {
  const hasObj = (exam.objectives || []).length > 0;
  const hasEssay = (exam.essays || []).length > 0;
  const hasBlank = (exam.fillBlanks || []).length > 0;

  // ── Objectives ──
  const objRows = (exam.objectives || [])
    .map((o: any) => {
      const opts = (o.options || [])
        .map((opt: string, i: number) => {
          const letter = String.fromCharCode(65 + i);
          return `<span class="obj-opt"><b>${letter}.</b> ${esc(opt)}</span>`;
        })
        .join("");
      return `
        <div class="obj-q">
          <div class="obj-q-text">${o.number}. ${esc(o.text)}</div>
          <div class="obj-options">${opts}</div>
        </div>
      `;
    })
    .join("");

  // ── Essays ──
  const essayRows = (exam.essays || [])
    .map(
      (e: any) => `
      <div class="essay-q">
        <div class="essay-q-text">${e.number}. ${esc(e.text)} <span class="essay-marks">(${e.marks} marks)</span></div>
        <div class="answer-space"></div>
      </div>
    `,
    )
    .join("");

  // ── Fill blanks ──
  const blankRows = (exam.fillBlanks || [])
    .map(
      (fb: any) => `
      <div class="blank-q">${fb.number}. ${esc(fb.text)}</div>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page {
    size: A4;
    margin: 14mm 14mm 14mm 14mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, "Times New Roman", "Palatino Linotype", serif;
    color: #000;
    font-size: 10px;
    line-height: 1.4;
    background: #fff;
  }

  /* ═══ PAGE STRUCTURE ═══ */
  .page {
    page-break-after: always;
    padding-bottom: 4px;
  }
  .page:last-of-type { page-break-after: auto; }

  /* ═══ HEADER ═══ */
  .header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 6px;
  }
  .logo {
    width: 68px; height: 68px;
    object-fit: contain; flex-shrink: 0;
  }
  .logo-placeholder {
    width: 68px; height: 68px;
    border: 1px solid #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; color: #666; flex-shrink: 0;
  }
  .header-text { flex: 1; text-align: center; }
  .school-name {
    font-family: "Brush Script MT", "Lucida Handwriting", "Segoe Script", Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1.05;
    color: #000;
  }
  .motto {
    font-size: 9px;
    font-style: italic;
    letter-spacing: 2px;
    margin-top: 3px;
    text-transform: uppercase;
    color: #222;
  }
  .address {
    font-size: 8.5px;
    letter-spacing: 0.5px;
    margin-top: 2px;
    color: #333;
  }

  /* ═══ DOUBLE DIVIDER ═══ */
  .divider-double {
    border-top: 2px solid #000;
    border-bottom: 1px solid #000;
    height: 3px;
    margin: 5px 0 8px 0;
  }

  /* ═══ TITLE BLOCK ═══ */
  .exam-title {
    text-align: center;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .exam-subtitle {
    text-align: center;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .exam-subtitle-small {
    text-align: center;
    font-size: 9px;
    font-weight: 600;
    font-style: italic;
    letter-spacing: 1px;
    margin-bottom: 8px;
    color: #333;
  }

  /* ═══ INFO BAR ═══ */
  .info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.6px;
    padding: 4px 0 6px 0;
    text-transform: uppercase;
  }
  .info-bar > div { text-align: center; flex: 1; }
  .info-bar > div:first-child { text-align: left; }
  .info-bar > div:last-child { text-align: right; }

  /* ═══ SINGLE DIVIDER ═══ */
  .divider-line {
    border-top: 1.5px solid #000;
    margin-bottom: 10px;
  }

  /* ═══ INSTRUCTIONS ═══ */
  .instructions {
    font-style: italic;
    font-size: 9.5px;
    text-align: center;
    margin-bottom: 12px;
    color: #222;
    letter-spacing: 0.3px;
  }

  /* ═══ SECTION TITLE (no background) ═══ */
  .section-title {
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    padding-bottom: 3px;
    border-bottom: 1px solid #000;
    margin: 6px 0 10px 0;
  }

  /* ═══ OBJECTIVES — 2 COLUMNS, NO BORDERS ═══ */
  .objectives-grid {
    column-count: 2;
    column-gap: 16px;
    column-rule: 1px solid #ddd;
  }
  .obj-q {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 7px;
  }
  .obj-q-text {
    font-size: 9.5px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: 1px;
  }
  .obj-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0 4px;
  }
  .obj-opt {
    font-size: 8.5px;
    font-weight: 400;
    flex: 0 0 calc(50% - 4px);
    line-height: 1.35;
    padding: 0.5px 0;
  }
  .obj-opt b { font-weight: 700; }

  /* ═══ ESSAYS ═══ */
  .essay-q {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 16px;
  }
  .essay-q-text {
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 4px;
  }
  .essay-marks {
    font-size: 9px;
    font-style: italic;
    font-weight: 400;
    color: #444;
  }
  .answer-space {
    height: 60px;
    border-bottom: 1px dotted #999;
    margin-top: 2px;
  }

  /* ═══ FILL IN BLANK ═══ */
  .blank-q {
    font-size: 11px;
    line-height: 1.8;
    margin-bottom: 8px;
    font-weight: 400;
  }

  /* ═══ FOOTER ═══ */
  .footer {
    text-align: center;
    font-size: 8px;
    font-style: italic;
    color: #666;
    letter-spacing: 0.4px;
    margin-top: 14px;
    padding-top: 6px;
    border-top: 1px solid #ccc;
  }
  .page-num {
    text-align: center;
    font-size: 8px;
    color: #999;
    margin-top: 4px;
    letter-spacing: 0.5px;
  }

  /* ═══ SMALL HEADER FOR PAGE 2 ═══ */
  .header-sm { text-align: center; padding-bottom: 4px; }
  .school-name-sm {
    font-family: "Brush Script MT", "Lucida Handwriting", Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .motto-sm {
    font-size: 8px;
    font-style: italic;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #333;
    margin-top: 1px;
  }
  .exam-title-sm {
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 4px;
  }
</style>
</head>
<body>

  <!-- ════════════ PAGE 1 ════════════ -->
  <div class="page">
    <div class="header">
      ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : `<div class="logo-placeholder">LOGO</div>`}
      <div class="header-text">
        <div class="school-name">${SCHOOL_NAME}</div>
        <div class="motto">${SCHOOL_MOTTO}</div>
        <div class="address">${SCHOOL_ADDRESS}</div>
      </div>
      <div style="width: 68px;"></div>
    </div>

    <div class="divider-double"></div>

    <div class="exam-title">${esc(exam.term).toUpperCase()} TERM EXAMINATION</div>
    <div class="exam-subtitle">Examination Paper</div>
    <div class="exam-subtitle-small">${esc(exam.session)} Academic Session</div>

    <div class="info-bar">
      <div>Class: ${esc(exam.class)}</div>
      <div>Subject: ${esc(exam.subject)}</div>
      <div>Duration: ${esc(exam.duration)}</div>
      <div>Total: ${exam.totalMarks} Marks</div>
    </div>

    <div class="divider-line"></div>

    ${exam.instructions ? `<div class="instructions">${esc(exam.instructions)}</div>` : ""}

    ${
      hasObj
        ? `
        <div class="section-title">Section A — Objective Questions (${exam.objectives.length})</div>
        <div class="objectives-grid">
          ${objRows}
        </div>
      `
        : ""
    }

    <div class="page-num">Page 1 of ${hasEssay || hasBlank ? "2" : "1"}</div>
  </div>

  <!-- ════════════ PAGE 2 ════════════ -->
  ${
    hasEssay || hasBlank
      ? `
    <div class="page">
      <div class="header-sm">
        <div class="school-name-sm">${SCHOOL_NAME}</div>
        <div class="motto-sm">${SCHOOL_MOTTO}</div>
      </div>

      <div class="divider-double"></div>

      <div class="exam-title-sm">${esc(exam.term).toUpperCase()} Term Examination — ${esc(exam.subject)}</div>

      <div class="divider-line" style="margin-top: 8px;"></div>

      ${
        hasEssay
          ? `
          <div class="section-title">Section B — Essay Questions (${exam.essays.length})</div>
          ${essayRows}
        `
          : ""
      }

      ${
        hasBlank
          ? `
          <div class="section-title" style="margin-top: 14px;">Section C — Fill in the Blank (${exam.fillBlanks.length})</div>
          ${blankRows}
        `
          : ""
      }

      <div class="footer">
        ${SCHOOL_NAME} · ${SCHOOL_ADDRESS} · Good luck!
      </div>
      <div class="page-num">Page 2 of 2</div>
    </div>
  `
      : ""
  }

</body>
</html>
  `;
}

export async function generateAndShareExamPDF(exam: any) {
  const logoSrc = await getLogoBase64();
  const html = buildHTML(exam, logoSrc);

  if (Platform.OS === "web") {
    const w = (window as any).open("", "_blank");
    if (!w) throw new Error("Popup blocked. Allow popups for this site.");
    w.document.write(html);
    w.document.close();
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        console.warn("Print failed:", e);
      }
    }, 600);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Save or Share Exam Paper",
      UTI: "com.adobe.pdf",
    });
  } else {
    await Print.printAsync({ html });
  }
}
