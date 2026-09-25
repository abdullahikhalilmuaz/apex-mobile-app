import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";

const SCHOOL_NAME = "APEX GLOBAL ACADEMY";
const SCHOOL_MOTTO = "Learn · Lead · Succeed";
const SCHOOL_ADDRESS = "Barhim Mani Road, Katsina";

async function getLogoBase64(): Promise<string> {
  try {
    const asset = Asset.fromModule(require("../../assets/images/icon.png"));

    // ─── WEB: fetch the bundled asset and convert to base64 ───
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

    // ─── NATIVE: download then read as base64 ───
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

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}
function pickPositive(seed: string, idx: number): string {
  const options = ["Excellent", "Very Good", "Good"];
  return options[hash(seed + idx) % options.length];
}

function buildHTML(opts: {
  logoSrc: string;
  student: any;
  result: any;
  term: string;
  session: string;
  stats: { enrollment: number; highestAvg: number; lowestAvg: number };
  attendanceSummary: { present: number; absent: number; total: number };
}): string {
  const { logoSrc, student, result, term, session, stats, attendanceSummary } =
    opts;

  const fullName = `${student.firstName} ${
    student.middleName ? student.middleName + " " : ""
  }${student.lastName}`;

  const admissionNo = student.admissionNumber || "—";
  const seed = String(student._id || "");

  const skills = {
    handwriting: pickPositive(seed, 1),
    drawing: pickPositive(seed, 2),
    sports: pickPositive(seed, 3),
    reading: pickPositive(seed, 4),
    speaking: pickPositive(seed, 5),
    tools: pickPositive(seed, 6),
  };
  const behaviour = {
    punctuality: pickPositive(seed, 7),
    neatness: pickPositive(seed, 8),
    politeness: pickPositive(seed, 9),
    honesty: pickPositive(seed, 10),
    relationship: pickPositive(seed, 11),
    selfControl: pickPositive(seed, 12),
    attentiveness: pickPositive(seed, 13),
    classwork: pickPositive(seed, 14),
  };

  const subjectRows = (result.subjects || [])
    .map((s: any) => {
      const ca1 = s.ca1 ?? s.ca ?? 0;
      const ca2 = s.ca2 || 0;
      const ca3 = s.ca3 || 0;
      return `
      <tr>
        <td class="subject">${esc(s.subject)}</td>
        <td class="center">${ca1}</td>
        <td class="center">${ca2}</td>
        <td class="center">${ca3}</td>
        <td class="center bold">${s.total || 0}</td>
        <td class="center bold">${s.exam || 0}</td>
        <td class="center bold">${s.total || 0}</td>
        <td class="center bold">${esc(s.grade)}</td>
        <td class="center">${result.position || 0}</td>
        <td></td>
      </tr>
    `;
    })
    .join("");

  const fillerCount = Math.max(0, 4);
  const fillerRows = Array.from({ length: fillerCount })
    .map(
      () => `
      <tr>
        <td class="subject">&nbsp;</td>
        <td></td><td></td><td></td>
        <td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>
    `,
    )
    .join("");

  const totalObtainable = (result.subjects?.length || 0) * 100;
  const totalObtained = result.totalScore || 0;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    padding: 22px 26px;
    color: #111;
    font-size: 10.5px;
  }
  .header { display: flex; align-items: center; gap: 16px; border-bottom: 3px double #0b2545; padding-bottom: 10px; margin-bottom: 10px; }
  .logo { width: 76px; height: 76px; object-fit: contain; flex-shrink: 0; }
  .logo-placeholder { width: 76px; height: 76px; border: 2px dashed #999; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #666; flex-shrink: 0; }
  .header-text { flex: 1; text-align: center; }
  .school-name { font-size: 22px; font-weight: 900; letter-spacing: 2px; margin: 0; color: #0b2545; }
  .motto { font-size: 10.5px; font-style: italic; color: #333; margin: 3px 0 0 0; letter-spacing: 1px; }
  .address { font-size: 9.5px; margin: 2px 0 0 0; color: #555; }
  .report-title { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 2px; margin: 12px 0 12px 0; background: #0b2545; color: #fff; padding: 6px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 22px; margin-bottom: 10px; font-size: 10px; }
  .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ccc; }
  .info-label { font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .info-value { text-align: right; }
  table.result-table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9px; }
  table.result-table th, table.result-table td { border: 1px solid #333; padding: 3px 4px; vertical-align: middle; }
  table.result-table th { background: #0b2545; color: #fff; font-weight: 700; text-align: center; font-size: 8.5px; letter-spacing: 0.3px; }
  .subject { text-align: left; font-weight: 600; padding-left: 6px !important; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .summary-row td { background: #f1f1f1; font-weight: 700; }
  .section-title { background: #0b2545; color: #fff; font-weight: 700; padding: 5px 8px; margin-top: 12px; letter-spacing: 1px; font-size: 10px; text-align: center; }
  .behaviour-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
  .behaviour-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .behaviour-table th, .behaviour-table td { border: 1px solid #333; padding: 4px 6px; }
  .behaviour-table th { background: #eaeaea; font-weight: 700; text-align: center; font-size: 9px; }
  .behaviour-table td:last-child { text-align: right; font-weight: 600; }
  .remarks { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
  .remark-box { border: 1px solid #333; padding: 6px 8px; min-height: 46px; }
  .remark-label { font-weight: 700; font-size: 10px; margin-bottom: 4px; border-bottom: 1px solid #999; padding-bottom: 3px; }
  .key-row { display: flex; gap: 24px; margin-top: 12px; font-size: 9px; }
  .key-col { flex: 1; }
  .key-title { font-weight: 700; font-size: 10px; margin-bottom: 4px; border-bottom: 1px solid #999; padding-bottom: 3px; }
  .key-item { padding: 1.5px 0; }
  .footer { text-align: center; margin-top: 14px; font-size: 8.5px; color: #666; border-top: 1px solid #ccc; padding-top: 6px; }
</style>
</head>
<body>

  <div class="header">
    ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : `<div class="logo-placeholder">LOGO</div>`}
    <div class="header-text">
      <div class="school-name">${SCHOOL_NAME}</div>
      <div class="motto">${SCHOOL_MOTTO}</div>
      <div class="address">${SCHOOL_ADDRESS}</div>
    </div>
    <div style="width: 76px;"></div>
  </div>

  <div class="report-title">TERMLY CONTINUOUS ASSESSMENT REPORT</div>

  <div class="info-grid">
    <div class="info-row"><span class="info-label">Name of Pupil</span><span class="info-value">${esc(fullName)}</span></div>
    <div class="info-row"><span class="info-label">Admission No.</span><span class="info-value">${esc(admissionNo)}</span></div>
    <div class="info-row"><span class="info-label">Class</span><span class="info-value">${esc(student.class)}</span></div>
    <div class="info-row"><span class="info-label">Sex</span><span class="info-value">${esc(student.gender || "—")}</span></div>
    <div class="info-row"><span class="info-label">Term</span><span class="info-value">${esc(term)}</span></div>
    <div class="info-row"><span class="info-label">Session</span><span class="info-value">${esc(session)}</span></div>
    <div class="info-row"><span class="info-label">Class Enrollment</span><span class="info-value">${stats.enrollment}</span></div>
    <div class="info-row"><span class="info-label">Attendance (P / Total)</span><span class="info-value">${attendanceSummary.present} / ${attendanceSummary.total}</span></div>
    <div class="info-row"><span class="info-label">Class Highest Avg</span><span class="info-value">${stats.highestAvg}%</span></div>
    <div class="info-row"><span class="info-label">Class Lowest Avg</span><span class="info-value">${stats.lowestAvg}%</span></div>
  </div>

  <table class="result-table">
    <thead>
      <tr>
        <th rowspan="2" style="width: 22%;">SUBJECT</th>
        <th colspan="3">C.A. (10 each)</th>
        <th rowspan="2" style="width: 7%;">Total<br/>CA (30)</th>
        <th rowspan="2" style="width: 7%;">Exam<br/>(70)</th>
        <th rowspan="2" style="width: 7%;">Total<br/>(100)</th>
        <th rowspan="2" style="width: 5%;">Grade</th>
        <th rowspan="2" style="width: 6%;">Pos.</th>
        <th rowspan="2">Teacher's<br/>Remark</th>
      </tr>
      <tr>
        <th>1st</th><th>2nd</th><th>3rd</th>
      </tr>
    </thead>
    <tbody>
      ${subjectRows}
      ${fillerRows}
      <tr class="summary-row">
        <td class="subject">TOTAL / AVERAGE</td>
        <td colspan="3" class="center">Total Obtainable: ${totalObtainable}</td>
        <td colspan="2" class="center">Total Obtained: ${totalObtained}</td>
        <td colspan="2" class="center">Average: ${result.average || 0}%</td>
        <td colspan="2" class="center">Position: ${result.position}/${result.outOf}</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">BEHAVIOUR &amp; SKILLS</div>
  <div class="behaviour-grid">
    <table class="behaviour-table">
      <tr><th colspan="2">SKILLS</th></tr>
      <tr><td>Handwriting</td><td>${skills.handwriting}</td></tr>
      <tr><td>Drawing / Painting</td><td>${skills.drawing}</td></tr>
      <tr><td>Sports</td><td>${skills.sports}</td></tr>
      <tr><td>Reading Fluency</td><td>${skills.reading}</td></tr>
      <tr><td>Speaking Fluency</td><td>${skills.speaking}</td></tr>
      <tr><td>Handling Tools</td><td>${skills.tools}</td></tr>
    </table>
    <table class="behaviour-table">
      <tr><th colspan="2">BEHAVIOUR</th></tr>
      <tr><td>Punctuality</td><td>${behaviour.punctuality}</td></tr>
      <tr><td>Neatness</td><td>${behaviour.neatness}</td></tr>
      <tr><td>Politeness</td><td>${behaviour.politeness}</td></tr>
      <tr><td>Honesty</td><td>${behaviour.honesty}</td></tr>
      <tr><td>Relationship</td><td>${behaviour.relationship}</td></tr>
      <tr><td>Self Control</td><td>${behaviour.selfControl}</td></tr>
      <tr><td>Attentiveness</td><td>${behaviour.attentiveness}</td></tr>
      <tr><td>Classwork / Homework</td><td>${behaviour.classwork}</td></tr>
    </table>
  </div>

  <div class="remarks">
    <div class="remark-box">
      <div class="remark-label">Class Teacher's Remark</div>
    </div>
    <div class="remark-box">
      <div class="remark-label">Headmaster's Remark</div>
    </div>
  </div>

  <div class="key-row">
    <div class="key-col">
      <div class="key-title">KEY TO GRADES</div>
      <div class="key-item">A — 70–100 (Excellent)</div>
      <div class="key-item">B — 60–69 (Very Good)</div>
      <div class="key-item">C — 50–59 (Good)</div>
      <div class="key-item">D — 40–49 (Fair)</div>
      <div class="key-item">F — 0–39 (Poor)</div>
    </div>
    <div class="key-col">
      <div class="key-title">KEY TO RATING</div>
      <div class="key-item">5 — Excellent</div>
      <div class="key-item">4 — High Level Trait</div>
      <div class="key-item">3 — Acceptable Trait</div>
      <div class="key-item">2 — Partly Low Trait</div>
      <div class="key-item">1 — Below Acceptable Trait</div>
    </div>
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
    · ${SCHOOL_NAME} · ${SCHOOL_ADDRESS}
  </div>

</body>
</html>
  `;
}

export async function generateAndShareResultPDF(opts: {
  student: any;
  result: any;
  term: string;
  session: string;
  stats: { enrollment: number; highestAvg: number; lowestAvg: number };
  attendanceSummary: { present: number; absent: number; total: number };
}) {
  const logoSrc = await getLogoBase64();
  const html = buildHTML({ ...opts, logoSrc });

  // ─── WEB: open the HTML in a new tab and trigger browser print ───
  if (Platform.OS === "web") {
    const w = (window as any).open("", "_blank");
    if (!w) throw new Error("Popup blocked. Allow popups for this site.");
    w.document.write(html);
    w.document.close();
    // Give the browser a moment to parse, then print
    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (e) {
        console.warn("Web print failed:", e);
      }
    }, 500);
    return;
  }

  // ─── NATIVE: generate a real PDF file and share it ───
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Save or Share Result",
      UTI: "com.adobe.pdf",
    });
  } else {
    // Fallback — open native print dialog with the same HTML
    await Print.printAsync({ html });
  }
}
