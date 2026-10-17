import { computeLogExtras, roundToMinute } from "./helpers";

// Parse "YYYY-MM-DD" as a LOCAL date (avoids timezone day-shifts)
export function parseYMD(s) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// One info record per batch: centre, category, teacher, year added (from earliest created_at)
export function batchInfoMap(chapters) {
  const map = {};
  chapters.forEach(c => {
    if (!c.batchCode) return;
    const b = map[c.batchCode] || (map[c.batchCode] = { batchCode: c.batchCode, centre: "", category: "", teacher: "", created: null, chapters: [] });
    if (!b.centre && c.batchCentre) b.centre = c.batchCentre;
    if (!b.category && c.batchCategory) b.category = c.batchCategory;
    if (!b.teacher && c.batchTeacher) b.teacher = c.batchTeacher;
    if (c.createdAt) {
      const t = new Date(c.createdAt);
      if (!isNaN(t) && (!b.created || t < b.created)) b.created = t;
    }
    b.chapters.push(c);
  });
  const nowYear = new Date().getFullYear();
  Object.values(map).forEach(b => { b.year = b.created ? b.created.getFullYear() : nowYear; });
  return map;
}

// Every logged class, flattened, with its batch/centre/chapter and "extra" portion
export function collectAllLogs(chapters) {
  const info = batchInfoMap(chapters);
  const out = [];
  chapters.forEach(c => {
    if (!c.batchCode) return;
    const inf = info[c.batchCode] || {};
    computeLogExtras(c.hourLogs || [], c.totalHours).forEach(l => {
      if (!l.date || !(l.hours > 0)) return;
      out.push({
        date: String(l.date).slice(0, 10), hours: l.hours, extra: l.extraAmount || 0,
        batchCode: c.batchCode, centre: inf.centre || "", chapterName: c.name,
      });
    });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.batchCode.localeCompare(b.batchCode));
}

export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTHS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export function startOfWeek(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - dow);
  return x;
}

const sum = arr => roundToMinute(arr.reduce((s, l) => s + l.hours, 0));

// mode: "year" (12 months) | "month" (weeks of the month) | "week" (7 days)
export function getSeries(logs, mode, anchor) {
  if (mode === "year") {
    const y = anchor.getFullYear();
    const bars = MONTHS_SHORT.map((label, i) => ({
      label, sub: "",
      hours: sum(logs.filter(l => { const d = parseYMD(l.date); return d.getFullYear() === y && d.getMonth() === i; })),
      full: `${MONTHS_LONG[i]} ${y}`,
    }));
    return { title: String(y), unit: "month", bars };
  }
  if (mode === "month") {
    const y = anchor.getFullYear(), m = anchor.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const n = Math.ceil(dim / 7);
    const bars = [];
    for (let w = 0; w < n; w++) {
      const from = w * 7 + 1, to = Math.min(dim, from + 6);
      bars.push({
        label: `W${w + 1}`, sub: `${from}–${to}`,
        hours: sum(logs.filter(l => { const d = parseYMD(l.date); return d.getFullYear() === y && d.getMonth() === m && d.getDate() >= from && d.getDate() <= to; })),
        full: `Week ${w + 1} (${from}–${to} ${MONTHS_SHORT[m]})`,
      });
    }
    return { title: `${MONTHS_LONG[m]} ${y}`, unit: "week", bars };
  }
  const start = startOfWeek(anchor);
  const bars = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = ymd(d);
    bars.push({
      label: DAYS_SHORT[i], sub: String(d.getDate()),
      hours: sum(logs.filter(l => l.date === key)),
      full: `${DAYS_SHORT[i]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const title = `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} – ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
  return { title, unit: "day", bars };
}

export function shiftAnchor(anchor, mode, dir) {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  if (mode === "year") return new Date(d.getFullYear() + dir, 0, 1);
  if (mode === "month") return new Date(d.getFullYear(), d.getMonth() + dir, 1);
  d.setDate(d.getDate() + 7 * dir);
  return d;
}
