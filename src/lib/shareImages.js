import { fmtHours, fmtDate, todayStr, collectBatchLogs, buildDateChapterRows, roundRect } from "./helpers";

// Generate a shareable PNG report card + native share / CSV fallback
// date-wise breakdown includes the Chapter column
export async function shareBatchImage(batchCode, color, chapters) {
  const total = chapters.reduce((s,c)=>s+c.totalHours,0);
  const done = chapters.reduce((s,c)=>s+c.completedHours,0);
  const remaining = Math.max(0, total-done);
  const pct = total>0 ? (done/total)*100 : 0;
  const logs = collectBatchLogs(chapters);
  const allRows = buildDateChapterRows(logs);
  const rows = allRows.slice(0,10);

  const W=760, headerH=280, rowH=42;
  const H = headerH + 70 + Math.max(1,rows.length)*rowH + 40;
  const canvas=document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,headerH);
  grad.addColorStop(0,color); grad.addColorStop(1,"#4338ca");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,headerH);

  ctx.fillStyle="#ffffff";
  ctx.font="900 38px Sora, sans-serif";
  ctx.fillText(`${batchCode} — Hours Report`,32,56);
  ctx.font="600 15px Sora, sans-serif";
  ctx.globalAlpha=.8;
  ctx.fillText(`Generated ${fmtDate(todayStr())} · LectureTrack`,32,84);
  ctx.globalAlpha=1;

  const stats=[["Allotted",fmtHours(total)],["Taken",fmtHours(done)],["Remaining",fmtHours(remaining)],["Progress",pct.toFixed(0)+"%"]];
  const boxW=(W-64-3*16)/4;
  stats.forEach((s,i)=>{
    const x=32+i*(boxW+16);
    ctx.fillStyle="rgba(255,255,255,.18)";
    roundRect(ctx,x,112,boxW,88,14); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.font="900 21px Sora, sans-serif";
    ctx.fillText(s[1],x+14,155);
    ctx.font="600 12px Sora, sans-serif";
    ctx.globalAlpha=.75;
    ctx.fillText(s[0],x+14,175);
    ctx.globalAlpha=1;
  });

  ctx.fillStyle="rgba(255,255,255,.25)";
  roundRect(ctx,32,222,W-64,10,5); ctx.fill();
  ctx.fillStyle="#fff";
  roundRect(ctx,32,222,Math.max(6,(W-64)*Math.min(pct,100)/100),10,5); ctx.fill();

  let y=headerH+36;
  ctx.fillStyle="#0f172a";
  ctx.font="800 18px Sora, sans-serif";
  ctx.fillText("Date-wise Breakdown",32,y);
  y+=28;
  ctx.font="700 12px Sora, sans-serif";
  ctx.fillStyle="#94a3b8";
  // 5 columns: Date, Chapter, Taken, Remaining, %
  const colWidths=[0.22,0.36,0.16,0.16,0.10].map(f=>(W-64)*f);
  const colX=[32];
  for(let i=0;i<colWidths.length-1;i++) colX.push(colX[i]+colWidths[i]);
  ["Date","Chapter","Taken","Remaining","%"].forEach((h,i)=>ctx.fillText(h,colX[i],y));
  y+=12;
  ctx.strokeStyle="#e2e8f0"; ctx.beginPath(); ctx.moveTo(32,y); ctx.lineTo(W-32,y); ctx.stroke();
  y+=26;

  if(rows.length===0){
    ctx.fillStyle="#94a3b8"; ctx.font="600 13px Sora, sans-serif";
    ctx.fillText("No hours logged yet",32,y);
  }
  const truncate=(str,max)=>{
    if(!str) return "";
    return str.length>max ? str.slice(0,max-1)+"…" : str;
  };
  rows.forEach(r=>{
    const rem=Math.max(0,total-r.cumulative);
    const p= total>0 ? ((r.cumulative/total)*100).toFixed(0)+"%" : "0%";
    ctx.fillStyle="#1e293b"; ctx.font="600 13px Sora, sans-serif";
    [fmtDate(r.date), truncate(r.chapterName,22), fmtHours(r.hours), fmtHours(rem), p].forEach((c,i)=>ctx.fillText(c,colX[i],y));
    y+=rowH-16;
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath(); ctx.moveTo(32,y-8); ctx.lineTo(W-32,y-8); ctx.stroke();
    y+=16;
  });

  return new Promise(resolve=>{
    canvas.toBlob(async blob=>{
      if(!blob){ resolve(); return; }
      const file=new File([blob],`${batchCode}_hours.png`,{type:"image/png"});
      try{
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:`${batchCode} Hours Report`,text:`Hours report for ${batchCode}`});
        } else {
          const a=document.createElement("a");
          a.href=URL.createObjectURL(blob); a.download=`${batchCode}_hours.png`; a.click();
        }
      }catch(e){ /* share cancelled by user — ignore */ }
      resolve();
    },"image/png");
  });
}

export async function shareTravelImage(entries, monthLbl, teacherName){
  const sorted=[...entries].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const W=720, headerH=170, rowH=42;
  const H=headerH+66+Math.max(1,sorted.length)*rowH+36;
  const canvas=document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,headerH);
  grad.addColorStop(0,"#6366f1"); grad.addColorStop(1,"#4338ca");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,headerH);

  ctx.fillStyle="#ffffff";
  ctx.font="900 28px Sora, sans-serif";
  ctx.fillText("Travel Details",32,48);
  ctx.font="700 14px Sora, sans-serif";
  ctx.globalAlpha=.85;
  ctx.fillText(`${teacherName||""} · ${monthLbl}`,32,72);
  ctx.font="600 12px Sora, sans-serif";
  ctx.globalAlpha=.7;
  ctx.fillText(`${sorted.length} trip${sorted.length===1?"":"s"} · Generated ${fmtDate(todayStr())}`,32,94);
  ctx.globalAlpha=1;

  let y=headerH+34;
  ctx.fillStyle="#0f172a";
  ctx.font="800 16px Sora, sans-serif";
  ctx.fillText("Trip Log",32,y);
  y+=26;
  ctx.font="700 11px Sora, sans-serif";
  ctx.fillStyle="#94a3b8";
  const colWidths=[0.18,0.30,0.30,0.22].map(f=>(W-64)*f);
  const colX=[32];
  for(let i=0;i<colWidths.length-1;i++) colX.push(colX[i]+colWidths[i]);
  ["Date","From","To","Purpose"].forEach((h,i)=>ctx.fillText(h,colX[i],y));
  y+=12;
  ctx.strokeStyle="#e2e8f0"; ctx.beginPath(); ctx.moveTo(32,y); ctx.lineTo(W-32,y); ctx.stroke();
  y+=26;

  const truncate=(s,max)=>!s?"":(s.length>max?s.slice(0,max-1)+"…":s);
  if(sorted.length===0){
    ctx.fillStyle="#94a3b8"; ctx.font="600 13px Sora, sans-serif";
    ctx.fillText("No trips logged",32,y);
  }
  sorted.forEach(t=>{
    ctx.fillStyle="#1e293b"; ctx.font="600 13px Sora, sans-serif";
    [fmtDate(t.date),truncate(t.from,20),truncate(t.to,20),truncate(t.purpose,16)].forEach((c,i)=>ctx.fillText(c,colX[i],y));
    y+=rowH-16;
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath(); ctx.moveTo(32,y-8); ctx.lineTo(W-32,y-8); ctx.stroke();
    y+=16;
  });

  return new Promise(resolve=>{
    canvas.toBlob(async blob=>{
      if(!blob){ resolve(); return; }
      const file=new File([blob],`Travel_${monthLbl.replace(/\s+/g,"_")}.png`,{type:"image/png"});
      try{
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:"Travel Details",text:`Travel details for ${monthLbl}`});
        } else {
          const a=document.createElement("a");
          a.href=URL.createObjectURL(blob); a.download=`Travel_${monthLbl.replace(/\s+/g,"_")}.png`; a.click();
        }
      }catch(e){ /* share cancelled by user — ignore */ }
      resolve();
    },"image/png");
  });
}

// Single-chapter shareable PNG report card, mirroring shareBatchImage's layout.
export async function shareChapterImage(chapter, color) {
  const total = chapter.totalHours;
  const done = chapter.completedHours;
  const remaining = Math.max(0, total-done);
  const pct = total>0 ? (done/total)*100 : 0;
  const logs = collectBatchLogs([chapter]);
  const allRows = buildDateChapterRows(logs);
  const rows = allRows.slice(0,10);

  const W=720, headerH=250, rowH=40;
  const H = headerH + 66 + Math.max(1,rows.length)*rowH + 36;
  const canvas=document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,headerH);
  grad.addColorStop(0,color); grad.addColorStop(1,"#4338ca");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,headerH);

  ctx.fillStyle="#ffffff";
  ctx.font="900 30px Sora, sans-serif";
  ctx.fillText(chapter.name,32,50);
  ctx.font="700 15px Sora, sans-serif";
  ctx.globalAlpha=.85;
  ctx.fillText(`${chapter.batchCode||""} · Hours Report`,32,76);
  ctx.font="600 13px Sora, sans-serif";
  ctx.globalAlpha=.7;
  ctx.fillText(`Generated ${fmtDate(todayStr())} · LectureTrack`,32,98);
  ctx.globalAlpha=1;

  const stats=[["Allotted",fmtHours(total)],["Taken",fmtHours(done)],["Remaining",fmtHours(remaining)],["Progress",pct.toFixed(0)+"%"]];
  const boxW=(W-64-3*16)/4;
  stats.forEach((s,i)=>{
    const x=32+i*(boxW+16);
    ctx.fillStyle="rgba(255,255,255,.18)";
    roundRect(ctx,x,116,boxW,78,14); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.font="900 19px Sora, sans-serif";
    ctx.fillText(s[1],x+14,153);
    ctx.font="600 11px Sora, sans-serif";
    ctx.globalAlpha=.75;
    ctx.fillText(s[0],x+14,171);
    ctx.globalAlpha=1;
  });

  ctx.fillStyle="rgba(255,255,255,.25)";
  roundRect(ctx,32,206,W-64,10,5); ctx.fill();
  ctx.fillStyle="#fff";
  roundRect(ctx,32,206,Math.max(6,(W-64)*Math.min(pct,100)/100),10,5); ctx.fill();

  let y=headerH+34;
  ctx.fillStyle="#0f172a";
  ctx.font="800 17px Sora, sans-serif";
  ctx.fillText("Date-wise Breakdown",32,y);
  y+=26;
  ctx.font="700 12px Sora, sans-serif";
  ctx.fillStyle="#94a3b8";
  const colWidths=[0.28,0.24,0.24,0.24].map(f=>(W-64)*f);
  const colX=[32];
  for(let i=0;i<colWidths.length-1;i++) colX.push(colX[i]+colWidths[i]);
  ["Date","Taken","Remaining","%"].forEach((h,i)=>ctx.fillText(h,colX[i],y));
  y+=12;
  ctx.strokeStyle="#e2e8f0"; ctx.beginPath(); ctx.moveTo(32,y); ctx.lineTo(W-32,y); ctx.stroke();
  y+=24;

  if(rows.length===0){
    ctx.fillStyle="#94a3b8"; ctx.font="600 13px Sora, sans-serif";
    ctx.fillText("No hours logged yet",32,y);
  }
  rows.forEach(r=>{
    const rem=Math.max(0,total-r.cumulative);
    const p= total>0 ? ((r.cumulative/total)*100).toFixed(0)+"%" : "0%";
    ctx.fillStyle="#1e293b"; ctx.font="600 13px Sora, sans-serif";
    [fmtDate(r.date), fmtHours(r.hours), fmtHours(rem), p].forEach((c,i)=>ctx.fillText(c,colX[i],y));
    y+=rowH-14;
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath(); ctx.moveTo(32,y-7); ctx.lineTo(W-32,y-7); ctx.stroke();
    y+=14;
  });

  return new Promise(resolve=>{
    canvas.toBlob(async blob=>{
      if(!blob){ resolve(); return; }
      const safeName=chapter.name.replace(/[^a-z0-9]+/gi,"_");
      const file=new File([blob],`${safeName}_hours.png`,{type:"image/png"});
      try{
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:`${chapter.name} Hours Report`,text:`Hours report for ${chapter.name}`});
        } else {
          const a=document.createElement("a");
          a.href=URL.createObjectURL(blob); a.download=`${safeName}_hours.png`; a.click();
        }
      }catch(e){ /* share cancelled by user — ignore */ }
      resolve();
    },"image/png");
  });
}
