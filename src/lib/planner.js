// Day Planner helpers: planned classes (timetable entries) for a given day.
// Stored online in the "planned_classes" table so every device shows the same plan.

const pad = n => String(n).padStart(2, "0");

// Local calendar date as YYYY-MM-DD (not UTC, so "today" is right early in the morning in India)
export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return localDateStr(new Date(y, m - 1, d + n));
}
export function fmtDayLabel(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
// "14:30" -> "2:30 PM"
export function fmtTime12(t) {
  const [h, m] = (t || "00:00").split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}
export const toMinutes = t => { const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + m; };

export function plFromRow(r) {
  return {
    id: r.id, date: r.date, startTime: r.start_time, batchCode: r.batch_code,
    chapterId: r.chapter_id, chapterName: r.chapter_name || "",
    hours: Number(r.hours) || 1, room: r.room || "",
    status: r.status || "planned", logId: r.log_id || null,
  };
}
export function plToRow(teacherCode, p) {
  return {
    id: p.id, teacher_code: teacherCode, date: p.date, start_time: p.startTime,
    batch_code: p.batchCode, chapter_id: p.chapterId, chapter_name: p.chapterName || "",
    hours: p.hours, room: p.room || "", status: p.status || "planned", log_id: p.logId || null,
  };
}

// State of one class on its day:
//  done    – hours already logged          skipped – no class happened
//  now     – running right now             missed  – time passed, not logged yet
//  next    – the next class today          later   – another class still to come today
//  planned – a class on a future day (e.g. tomorrow)
export function classState(pc, today, now = new Date()) {
  if (pc.status === "logged") return "done";
  if (pc.status === "skipped") return "skipped";
  if (pc.date > today) return "planned";
  if (pc.date < today) return "missed";
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(pc.startTime);
  const end = start + Math.round(pc.hours * 60);
  if (nowMin >= end) return "missed";
  if (nowMin >= start) return "now";
  return "later";
}
