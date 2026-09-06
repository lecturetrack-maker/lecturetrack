import { MASTER } from "./constants";

export function uid() { return Math.random().toString(36).slice(2,9); }

export function fmtHours(h) {
  if (!h && h!==0) return "0h";
  const hrs=Math.floor(h), mins=Math.round((h-hrs)*60);
  if (mins===0) return `${hrs}h`;
  if (hrs===0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

export function parseHours(val) {
  if (!val) return 0;
  const str=String(val).trim();
  const hm=str.match(/^(\d+)h\s*(\d+)m$/i);
  if (hm) return parseFloat(hm[1])+parseFloat(hm[2])/60;
  const hOnly=str.match(/^(\d+\.?\d*)h$/i);
  if (hOnly) return parseFloat(hOnly[1]);
  const mOnly=str.match(/^(\d+)m$/i);
  if (mOnly) return parseFloat(mOnly[1])/60;
  const n=parseFloat(str);
  return isNaN(n)?0:n;
}

export function roundToMinute(h) { return Math.round(h*60)/60; }

// Converts a raw log-entry value to decimal hours depending on the chosen unit,
// so people can log "20" minutes or "1.5" hours and the app always stores/reports correct decimal hours.
export function toHoursFromInput(raw, unit) {
  if (unit === "minutes") {
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n / 60;
  }
  return parseHours(raw);
}

// "Extra" is always derived directly from Taken vs Allotted, so it can never
// disagree with Remaining or Progress % (see project notes on the export bug fix).
export function deriveExtraHours(completedHours, totalHours) {
  return Math.max(0, roundToMinute((completedHours||0) - (totalHours||0)));
}

// Recomputes, for every log entry, exactly how much of it was genuinely "beyond
// allotted" at that point in the chapter's running total — processed in chronological
// (date) order. Used for month/week "Extra" breakdowns so historical entries self-correct.
export function computeLogExtras(hourLogs, totalHours) {
  const withIdx = hourLogs.map((l,i)=>({...l,_idx:i}));
  withIdx.sort((a,b)=>{
    const d = new Date(a.date) - new Date(b.date);
    return d !== 0 ? d : a._idx - b._idx;
  });
  let cumulative = 0;
  withIdx.forEach(l=>{
    cumulative = roundToMinute(cumulative + l.hours);
    l.extraAmount = totalHours>0 ? roundToMinute(Math.max(0, Math.min(l.hours, cumulative - totalHours))) : 0;
  });
  withIdx.sort((a,b)=>a._idx-b._idx);
  return withIdx.map(({_idx,...rest})=>rest);
}

export function getStatus(completed,total) {
  if (!total) return "none";
  const p=(completed/total)*100;
  // Reaching or passing 100% (including any extra hours) reads as "Completed".
  if (p>=100) return "completed";
  if (p>=80) return "warning";
  return "ok";
}

export const STATUS = {
  ok:       {color:"#10b981",label:"On Track"},
  warning:  {color:"#f59e0b",label:"Near Limit"},
  completed:{color:"#10b981",label:"Completed"},
  none:     {color:"#94a3b8",label:"Not Started"},
};

export function todayStr() { return new Date().toISOString().split("T")[0]; }
export function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

export function buildCSV(chapters) {
  const rows=[["Batch","Chapter","Allotted","Taken","Extra","Remaining","Progress %"]];
  chapters.forEach(c=>{
    const rem=Math.max(0,c.totalHours-c.completedHours);
    const pct=c.totalHours>0?((c.completedHours/c.totalHours)*100).toFixed(1)+"%":"0%";
    rows.push([c.batchCode||"",c.name,fmtHours(c.totalHours),fmtHours(c.completedHours),fmtHours(deriveExtraHours(c.completedHours,c.totalHours)),fmtHours(rem),pct]);
  });
  return rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

// ── Date/Month/Week history helpers (for hour history + share) ──
export function monthKey(d) { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; }
export function monthLabel(key) { if(!key) return ""; const [y,m]=key.split("-"); return new Date(Number(y),Number(m)-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); }

export function collectBatchLogs(chapters) {
  const all=[];
  chapters.forEach(c=>{
    // Recompute this chapter's log extras in date order (each chapter has its own
    // allotment, so this must happen per-chapter before merging into the batch-wide list)
    const recomputed=computeLogExtras(c.hourLogs||[], c.totalHours);
    recomputed.forEach(l=>{ all.push({...l,chapterName:c.name}); });
  });
  return all.sort((a,b)=>new Date(a.date)-new Date(b.date));
}

export function groupByDate(logs) {
  const map={};
  logs.forEach(l=>{ map[l.date]=(map[l.date]||0)+l.hours; });
  return Object.entries(map).sort((a,b)=>new Date(b[0])-new Date(a[0]));
}

// Group logs by date AND chapter, with running cumulative total for the batch
export function buildDateChapterRows(logs) {
  const dateMap = {};
  logs.forEach(l=>{
    if(!dateMap[l.date]) dateMap[l.date]={total:0,byChapter:{}};
    dateMap[l.date].total += l.hours;
    dateMap[l.date].byChapter[l.chapterName] = (dateMap[l.date].byChapter[l.chapterName]||0) + l.hours;
  });
  const datesAsc = Object.keys(dateMap).sort((a,b)=>new Date(a)-new Date(b));
  let cumulative = 0;
  const cumByDate = {};
  datesAsc.forEach(d=>{ cumulative += dateMap[d].total; cumByDate[d] = roundToMinute(cumulative); });
  const datesDesc = [...datesAsc].reverse();
  const rows=[];
  datesDesc.forEach(d=>{
    const chapterEntries = Object.entries(dateMap[d].byChapter).sort((a,b)=>a[0].localeCompare(b[0]));
    chapterEntries.forEach(([chapterName,hrs])=>{
      rows.push({date:d, chapterName, hours:roundToMinute(hrs), cumulative:cumByDate[d]});
    });
  });
  return rows;
}

export function monthlyTotals(chapters, mKey) {
  let taken=0, extra=0;
  chapters.forEach(c=>{
    const recomputed = computeLogExtras(c.hourLogs||[], c.totalHours);
    recomputed.forEach(l=>{
      if(monthKey(l.date)===mKey){
        taken+=l.hours;
        extra+=l.extraAmount||0;
      }
    });
  });
  return {taken:roundToMinute(taken), extra:roundToMinute(extra)};
}

// CSV includes chapter name per row
export function buildBatchHistoryCSV(batchCode, chapters) {
  const total = chapters.reduce((s,c)=>s+c.totalHours,0);
  const logs = collectBatchLogs(chapters);
  const rows = buildDateChapterRows(logs);
  const out = [["Date","Chapter","Hours Taken","Allotted","Remaining","Progress %"]];
  rows.forEach(r=>{
    const remaining = Math.max(0, total - r.cumulative);
    const pct = total>0 ? ((r.cumulative/total)*100).toFixed(1)+"%" : "0%";
    out.push([fmtDate(r.date), r.chapterName, fmtHours(r.hours), fmtHours(total), fmtHours(remaining), pct]);
  });
  return out.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

// Single-chapter CSV export (reuses the same date-wise recompute logic as the
// batch report, so the numbers are guaranteed consistent between the two).
export function buildChapterCSV(chapter) {
  const total = chapter.totalHours;
  const logs = collectBatchLogs([chapter]);
  const rows = buildDateChapterRows(logs);
  const out = [["Date","Hours Taken","Allotted","Remaining","Progress %"]];
  rows.forEach(r=>{
    const remaining = Math.max(0, total - r.cumulative);
    const pct = total>0 ? ((r.cumulative/total)*100).toFixed(1)+"%" : "0%";
    out.push([fmtDate(r.date), fmtHours(r.hours), fmtHours(total), fmtHours(remaining), pct]);
  });
  return out.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

export function buildTravelCSV(entries){
  const rows=[["Date","From","To","Purpose","Notes"]];
  [...entries].sort((a,b)=>new Date(a.date)-new Date(b.date)).forEach(t=>{
    rows.push([fmtDate(t.date),t.from,t.to,t.purpose,t.notes||""]);
  });
  return rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

export function trFromRow(r){
  return { id:r.id, date:r.date, from:r.from_place||"", to:r.to_place||"", purpose:r.purpose||"", notes:r.notes||"" };
}
export function trToRow(teacherCode,t){
  return { id:t.id, teacher_code:teacherCode, date:t.date, from_place:t.from, to_place:t.to, purpose:t.purpose, notes:t.notes||"" };
}

export function toRow(teacherCode,c) {
  return {
    id:c.id, teacher_code:teacherCode,
    batch_code: c.batchCode || MASTER,
    name:c.name,
    total_hours:c.totalHours||0, completed_hours:c.completedHours||0,
    extra_hours:c.extraHours||0, topics:c.topics||[],
    notes:c.notes||"", last_completed_topic:c.lastCompletedTopic||null,
    hour_logs:c.hourLogs||[], batch_teacher:c.batchTeacher||null, batch_category:c.batchCategory||null, updated_at:new Date().toISOString()
  };
}

export function fromRow(r) {
  const batchCode = (!r.batch_code || r.batch_code === MASTER) ? null : r.batch_code;
  return {
    id:r.id, batchCode, name:r.name,
    totalHours:r.total_hours||0, completedHours:r.completed_hours||0,
    extraHours:r.extra_hours||0, topics:r.topics||[],
    notes:r.notes||"", lastCompletedTopic:r.last_completed_topic,
    hourLogs:r.hour_logs||[], batchTeacher:r.batch_teacher||null, batchCategory:r.batch_category||null
  };
}

// Darkens a hex color by a given percent — used to build a deep, professional header
// gradient from each batch's accent color instead of a bright flat gradient.
export function shadeColor(hex,percent){
  if(!hex||hex[0]!=="#") return hex;
  let r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  r=Math.round(r*(1-percent)); g=Math.round(g*(1-percent)); b=Math.round(b*(1-percent));
  const toHex=n=>Math.max(0,Math.min(255,n)).toString(16).padStart(2,"0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Canvas rounded-rectangle helper — used by the shareImages module
export function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
