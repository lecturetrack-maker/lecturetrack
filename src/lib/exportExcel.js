import XLSX from "xlsx-js-style";
import { roundToMinute, deriveExtraHours } from "./helpers";
import { collectAllLogs, batchInfoMap, parseYMD, MONTHS_LONG } from "./analytics";

const NAVY = "312E81", INDIGO = "4338CA", SOFT = "EEF2FF", LINE = "E2E8F0", GREY = "64748B";
const border = { top:{style:"thin",color:{rgb:LINE}}, bottom:{style:"thin",color:{rgb:LINE}}, left:{style:"thin",color:{rgb:LINE}}, right:{style:"thin",color:{rgb:LINE}} };
const FONT = "Calibri";

const S = {
  title: { font:{name:FONT,sz:18,bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:NAVY}}, alignment:{vertical:"center"} },
  sub:   { font:{name:FONT,sz:11,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:NAVY}}, alignment:{vertical:"center"} },
  section:{ font:{name:FONT,sz:13,bold:true,color:{rgb:NAVY}} },
  head:  { font:{name:FONT,sz:11,bold:true,color:{rgb:"FFFFFF"}}, fill:{fgColor:{rgb:INDIGO}}, alignment:{horizontal:"center",vertical:"center",wrapText:true}, border },
  cell:  { font:{name:FONT,sz:11}, alignment:{vertical:"center"}, border },
  cellC: { font:{name:FONT,sz:11}, alignment:{horizontal:"center",vertical:"center"}, border },
  sum:   { font:{name:FONT,sz:11,bold:true,color:{rgb:NAVY}}, fill:{fgColor:{rgb:SOFT}}, alignment:{vertical:"center"}, border },
  sumC:  { font:{name:FONT,sz:11,bold:true,color:{rgb:NAVY}}, fill:{fgColor:{rgb:SOFT}}, alignment:{horizontal:"center",vertical:"center"}, border },
  statL: { font:{name:FONT,sz:10,color:{rgb:GREY}}, fill:{fgColor:{rgb:SOFT}}, alignment:{horizontal:"center"}, border },
  statV: { font:{name:FONT,sz:15,bold:true,color:{rgb:INDIGO}}, fill:{fgColor:{rgb:SOFT}}, alignment:{horizontal:"center",vertical:"center"}, border },
};

const txt = (v, s = S.cell) => ({ v: v == null ? "" : String(v), t: "s", s });
const num = (v, s = S.cellC, z = "0") => ({ v, t: "n", s, z });
const dur = (h, s = S.cellC) => ({ v: roundToMinute(h) / 24, t: "n", s, z: "[h]:mm" });
const pct = (v, s = S.cellC) => ({ v, t: "n", s, z: "0%" });
const serial = ds => { const d = parseYMD(ds); return (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000; };
const dateCell = ds => ({ v: serial(ds), t: "n", s: S.cellC, z: "dd-mmm-yyyy" });
const blank = (s = S.sum) => ({ v: "", t: "s", s });

function makeSheet(rows, widths, extra = {}) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = widths.map(w => ({ wch: w }));
  Object.assign(ws, extra);
  return ws;
}

function banner(title, subtitle, cols) {
  const fillRow = first => [first, ...Array(cols - 1).fill(null)].map(c => c || blank(first.s));
  return { rows: [fillRow(txt(title, S.title)), fillRow(txt(subtitle, S.sub)), []], merges: [{s:{r:0,c:0},e:{r:0,c:cols-1}},{s:{r:1,c:0},e:{r:1,c:cols-1}}], heights: [{hpt:30},{hpt:20}] };
}

function groupBatchRows(logs, periodOf, periodLabel) {
  // period -> batchCode|centre -> {classes, hours, extra}
  const periods = new Map();
  logs.forEach(l => {
    const p = periodOf(l);
    if (!periods.has(p)) periods.set(p, new Map());
    const k = `${l.batchCode}||${l.centre}`;
    const m = periods.get(p);
    const a = m.get(k) || { batch: l.batchCode, centre: l.centre, classes: 0, hours: 0, extra: 0 };
    a.classes += 1; a.hours += l.hours; a.extra += l.extra;
    m.set(k, a);
  });
  return [...periods.keys()].sort().map(p => ({ label: periodLabel(p), items: [...periods.get(p).values()].sort((a, b) => a.batch.localeCompare(b.batch)) }));
}

function periodSheet(title, firstHead, groups, generated, teacherLine) {
  const heads = [firstHead, "Batch", "Centre", "Classes", "Hours Taken", "Extra Hours"];
  const b = banner(title, `${teacherLine}  •  Generated ${generated}`, heads.length);
  const rows = [...b.rows, heads.map(h => txt(h, S.head))];
  let gc = 0, gh = 0, ge = 0;
  groups.forEach(g => {
    let c = 0, h = 0, e = 0;
    g.items.forEach((it, i) => {
      rows.push([txt(i === 0 ? g.label : "", S.cell), txt(it.batch), txt(it.centre || "—"), num(it.classes), dur(it.hours), dur(it.extra)]);
      c += it.classes; h += it.hours; e += it.extra;
    });
    rows.push([txt(`${g.label} total`, S.sum), blank(), blank(), num(c, S.sumC), dur(h, S.sumC), dur(e, S.sumC)]);
    gc += c; gh += h; ge += e;
  });
  if (!groups.length) rows.push([txt("No classes logged yet")]);
  else rows.push([txt("GRAND TOTAL", S.head), blank(S.head), blank(S.head), num(gc, S.head), dur(gh, S.head), dur(ge, S.head)]);
  return makeSheet(rows, [22, 16, 22, 10, 14, 14], { "!merges": b.merges, "!rows": b.heights });
}

export function buildReportWorkbook(profile, chapters, now = new Date()) {
  const info = batchInfoMap(chapters);
  const logs = collectAllLogs(chapters);
  const generated = now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const teacherLine = `${profile?.name || "Teacher"}${profile?.subject ? " • " + profile.subject : ""}${profile?.code ? " • " + profile.code : ""}`;

  const allotted = chapters.reduce((s, c) => s + (c.totalHours || 0), 0);
  const taken = chapters.reduce((s, c) => s + (c.completedHours || 0), 0);
  const extra = chapters.reduce((s, c) => s + deriveExtraHours(c.completedHours, c.totalHours), 0);
  const remaining = Math.max(0, allotted - taken);

  // ── Sheet 1: Summary ──
  const sb = banner("LectureTrack — Teaching Hours Report", `${teacherLine}  •  Generated ${generated}`, 9);
  const sRows = [...sb.rows];
  sRows.push(["Allotted", "Taken", "Extra", "Remaining", "Progress"].map(l => txt(l, S.statL)).concat(Array(4).fill(null).map(() => ({ v: "", t: "s" }))));
  sRows.push([dur(allotted, S.statV), dur(taken, S.statV), dur(extra, S.statV), dur(remaining, S.statV), pct(allotted > 0 ? taken / allotted : 0, S.statV)]);
  sRows.push([]);
  sRows.push([txt("Batch Summary", S.section)]);
  sRows.push(["Year", "Centre", "Batch", "Category", "Allotted", "Taken", "Extra", "Remaining", "Progress"].map(h => txt(h, S.head)));
  Object.values(info).sort((a, b) => b.year - a.year || a.batchCode.localeCompare(b.batchCode)).forEach(b => {
    const al = b.chapters.reduce((s, c) => s + (c.totalHours || 0), 0);
    const tk = b.chapters.reduce((s, c) => s + (c.completedHours || 0), 0);
    const ex = b.chapters.reduce((s, c) => s + deriveExtraHours(c.completedHours, c.totalHours), 0);
    sRows.push([num(b.year), txt(b.centre || "—"), txt(b.batchCode), txt(b.category || "—"), dur(al), dur(tk), dur(ex), dur(Math.max(0, al - tk)), pct(al > 0 ? tk / al : 0)]);
  });
  const ws1 = makeSheet(sRows, [10, 22, 14, 18, 12, 12, 12, 12, 12], { "!merges": sb.merges, "!rows": sb.heights });

  // ── Sheet 2: Date-wise log ──
  const db = banner("Date-wise Class Log", `${teacherLine}  •  Generated ${generated}`, 7);
  const dRows = [...db.rows, ["Date", "Day", "Batch", "Centre", "Chapter", "Hours Taken", "Extra Hours"].map(h => txt(h, S.head))];
  const headerRow = dRows.length;
  logs.forEach(l => {
    const d = parseYMD(l.date);
    dRows.push([dateCell(l.date), txt(d.toLocaleDateString("en-IN", { weekday: "short" }), S.cellC), txt(l.batchCode), txt(l.centre || "—"), txt(l.chapterName), dur(l.hours), dur(l.extra)]);
  });
  const totH = logs.reduce((s, l) => s + l.hours, 0), totE = logs.reduce((s, l) => s + l.extra, 0);
  if (!logs.length) dRows.push([txt("No classes logged yet")]);
  else dRows.push([txt("TOTAL", S.head), blank(S.head), blank(S.head), blank(S.head), blank(S.head), dur(totH, S.head), dur(totE, S.head)]);
  const ws2 = makeSheet(dRows, [14, 8, 14, 22, 28, 14, 14], { "!merges": db.merges, "!rows": db.heights });
  if (logs.length) ws2["!autofilter"] = { ref: `A${headerRow}:G${headerRow + logs.length}` };

  // ── Sheets 3 & 4: Monthly / Yearly ──
  const monthly = groupBatchRows(logs, l => l.date.slice(0, 7), p => { const [y, m] = p.split("-"); return `${MONTHS_LONG[Number(m) - 1]} ${y}`; });
  const yearly = groupBatchRows(logs, l => l.date.slice(0, 4), p => p);
  const ws3 = periodSheet("Monthly Report", "Month", monthly, generated, teacherLine);
  const ws4 = periodSheet("Yearly Report", "Year", yearly, generated, teacherLine);

  // ── Sheet 5: Chapter report ──
  const cb = banner("Chapter-wise Report", `${teacherLine}  •  Generated ${generated}`, 9);
  const cRows = [...cb.rows, ["Year", "Centre", "Batch", "Chapter", "Allotted", "Taken", "Extra", "Remaining", "Progress"].map(h => txt(h, S.head))];
  chapters.filter(c => c.batchCode).slice().sort((a, b) => (info[b.batchCode]?.year || 0) - (info[a.batchCode]?.year || 0) || a.batchCode.localeCompare(b.batchCode) || a.name.localeCompare(b.name)).forEach(c => {
    const bi = info[c.batchCode] || {};
    cRows.push([num(bi.year || ""), txt(bi.centre || "—"), txt(c.batchCode), txt(c.name), dur(c.totalHours), dur(c.completedHours), dur(deriveExtraHours(c.completedHours, c.totalHours)), dur(Math.max(0, c.totalHours - c.completedHours)), pct(c.totalHours > 0 ? c.completedHours / c.totalHours : 0)]);
  });
  const ws5 = makeSheet(cRows, [10, 22, 14, 30, 12, 12, 12, 12, 12], { "!merges": cb.merges, "!rows": cb.heights });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");
  XLSX.utils.book_append_sheet(wb, ws2, "Date-wise Log");
  XLSX.utils.book_append_sheet(wb, ws3, "Monthly");
  XLSX.utils.book_append_sheet(wb, ws4, "Yearly");
  XLSX.utils.book_append_sheet(wb, ws5, "Chapters");
  return wb;
}

export function downloadExcelReport(profile, chapters) {
  const wb = buildReportWorkbook(profile, chapters);
  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `LectureTrack_${profile?.code || "report"}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`;
  a.click();
}
