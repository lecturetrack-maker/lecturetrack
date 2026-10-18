import { useState, useEffect, useMemo } from "react";
import { CalendarClock, Plus, Check, Pencil, Trash2, Copy, MapPin, Clock, SkipForward, RotateCcw, AlertTriangle } from "lucide-react";
import Modal from "./Modal";
import { fmtHours, uid } from "../lib/helpers";
import { localDateStr, addDays, fmtDayLabel, fmtTime12, toMinutes, classState } from "../lib/planner";

const inputStyle={width:"100%",padding:"11px 13px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"};
const labelStyle={display:"block",fontSize:12,fontWeight:700,color:"#475569",marginBottom:5};
const HOUR_CHIPS=[0.5,1,1.5,2,3];

function ClassFormModal({initial,date,chapters,runningBatches,recent,onSave,onClose}) {
  const editing=!!initial;
  const nowHr=new Date().getHours();
  const [batch,setBatch]=useState(initial?.batchCode||runningBatches[0]||"");
  const chaptersOfBatch=useMemo(()=>chapters.filter(c=>c.batchCode===batch),[chapters,batch]);
  const [chapterId,setChapterId]=useState(initial?.chapterId||"");
  const [time,setTime]=useState(initial?.startTime||`${String(date===localDateStr()?Math.min(nowHr+1,22):9).padStart(2,"0")}:00`);
  const [hours,setHours]=useState(initial?String(initial.hours):"1");
  const [room,setRoom]=useState(initial?.room||"");
  // keep the chapter valid when the batch changes
  useEffect(()=>{
    if(!chaptersOfBatch.some(c=>c.id===chapterId)) setChapterId(chaptersOfBatch[0]?.id||"");
  },[batch]); // eslint-disable-line react-hooks/exhaustive-deps
  const applyRecent=r=>{ setBatch(r.batchCode); setTimeout(()=>setChapterId(r.chapterId),0); setHours(String(r.hours)); setRoom(r.room||""); };
  const h=parseFloat(hours);
  const canSave=batch&&chapterId&&time&&h>0;
  const save=()=>{
    if(!canSave) return;
    const ch=chapters.find(c=>c.id===chapterId);
    onSave({id:initial?.id||uid(),date:initial?.date||date,startTime:time,batchCode:batch,chapterId,chapterName:ch?.name||"",hours:h,room:room.trim(),status:initial?.status||"planned",logId:initial?.logId||null});
  };
  return(
    <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}><CalendarClock size={17}/> {editing?"Edit class":"Add class"} · {fmtDayLabel(initial?.date||date)}</span>} onClose={onClose}>
      {!editing&&recent.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={labelStyle}>Quick add (recent)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {recent.map(r=>(
              <button key={r.key} onClick={()=>applyRecent(r)} style={{padding:"6px 11px",borderRadius:99,border:"1.5px solid #c7d2fe",background:"#eef2ff",color:"#4338ca",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{r.batchCode} · {r.chapterName}{r.room?` · ${r.room}`:""}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{marginBottom:12}}>
        <label style={labelStyle}>Batch</label>
        <select value={batch} onChange={e=>setBatch(e.target.value)} style={inputStyle}>
          {runningBatches.length===0&&<option value="">No running batches</option>}
          {runningBatches.map(b=><option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      <div style={{marginBottom:12}}>
        <label style={labelStyle}>Chapter</label>
        <select value={chapterId} onChange={e=>setChapterId(e.target.value)} style={inputStyle}>
          {chaptersOfBatch.length===0&&<option value="">No chapters in this batch</option>}
          {chaptersOfBatch.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:10,marginBottom:12}}>
        <div style={{flex:1}}>
          <label style={labelStyle}>Start time</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={inputStyle}/>
        </div>
        <div style={{flex:1}}>
          <label style={labelStyle}>Room (optional)</label>
          <input value={room} onChange={e=>setRoom(e.target.value)} placeholder="e.g. 204" style={inputStyle}/>
        </div>
      </div>
      <div style={{marginBottom:18}}>
        <label style={labelStyle}>Hours</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
          {HOUR_CHIPS.map(v=>{
            const on=parseFloat(hours)===v;
            return <button key={v} onClick={()=>setHours(String(v))} style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${on?"#6366f1":"#e2e8f0"}`,background:on?"#eef2ff":"#f8fafc",color:on?"#4338ca":"#64748b",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{v}h</button>;
          })}
          <input type="number" min={0} step={0.25} value={hours} onChange={e=>setHours(e.target.value)} style={{...inputStyle,width:84,padding:"8px 10px"}} aria-label="Custom hours"/>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={save} disabled={!canSave} style={{background:canSave?"linear-gradient(135deg,#6366f1,#4338ca)":"#cbd5e1",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:800,cursor:canSave?"pointer":"not-allowed",fontFamily:"inherit"}}>{editing?"Save":"Add class"}</button>
      </div>
    </Modal>
  );
}

const STYLE={
  now:{bg:"linear-gradient(135deg,#eef2ff,#e0e7ff)",border:"#6366f1",badge:"NOW",badgeBg:"#6366f1",dot:"#6366f1"},
  next:{bg:"#fff",border:"#a5b4fc",badge:"UP NEXT",badgeBg:"#818cf8",dot:"#818cf8"},
  later:{bg:"#fff",border:"#e2e8f0",badge:"",badgeBg:"",dot:"#cbd5e1"},
  planned:{bg:"#fff",border:"#e2e8f0",badge:"PLANNED",badgeBg:"#94a3b8",dot:"#cbd5e1"},
  missed:{bg:"#fffbeb",border:"#fcd34d",badge:"NOT LOGGED",badgeBg:"#f59e0b",dot:"#f59e0b"},
  done:{bg:"#f0fdf4",border:"#86efac",badge:"LOGGED",badgeBg:"#10b981",dot:"#10b981"},
  skipped:{bg:"#f8fafc",border:"#e2e8f0",badge:"NO CLASS",badgeBg:"#94a3b8",dot:"#e2e8f0"},
};

export default function DayPlanner({chapters,completedBatches=[],plannedClasses=[],loadError,onAdd,onUpdate,onDelete,onCopy,onLog,onUndo}) {
  const [offset,setOffset]=useState(0);
  const [form,setForm]=useState(null); // null | {initial?}
  const [now,setNow]=useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),30000); return()=>clearInterval(t); },[]);

  const today=localDateStr(now);
  const date=addDays(today,offset);
  const runningBatches=useMemo(()=>[...new Set(chapters.map(c=>c.batchCode))].filter(b=>!completedBatches.includes(b)).sort(),[chapters,completedBatches]);

  const dayClasses=useMemo(()=>plannedClasses.filter(p=>p.date===date).sort((a,b)=>toMinutes(a.startTime)-toMinutes(b.startTime)),[plannedClasses,date]);
  // Mark only the first upcoming class today as "UP NEXT"
  const states=useMemo(()=>{
    let nextTaken=false;
    return dayClasses.map(p=>{
      let s=classState(p,today,now);
      if(s==="later"&&!nextTaken){ s="next"; nextTaken=true; }
      return s;
    });
  },[dayClasses,today,now]);

  const doneCount=dayClasses.filter(p=>p.status==="logged").length;
  const missedCount=states.filter(s=>s==="missed").length;
  const recent=useMemo(()=>{
    const seen=new Set(); const out=[];
    [...plannedClasses].sort((a,b)=>b.date.localeCompare(a.date)).forEach(p=>{
      const ch=chapters.find(c=>c.id===p.chapterId);
      const key=`${p.batchCode}|${p.chapterId}|${p.hours}|${p.room}`;
      if(!ch||completedBatches.includes(p.batchCode)||seen.has(key)||out.length>=4) return;
      seen.add(key); out.push({key,batchCode:p.batchCode,chapterId:p.chapterId,chapterName:p.chapterName||ch.name,hours:p.hours,room:p.room});
    });
    return out;
  },[plannedClasses,chapters,completedBatches]);

  const copyPrevious=()=>{
    const prevDates=[...new Set(plannedClasses.filter(p=>p.date<date).map(p=>p.date))].sort();
    const last=prevDates[prevDates.length-1];
    if(!last){ window.alert("No earlier classes to copy yet."); return; }
    const src=plannedClasses.filter(p=>p.date===last&&chapters.some(c=>c.id===p.chapterId));
    if(src.length===0){ window.alert("Those classes' chapters no longer exist."); return; }
    if(!window.confirm(`Copy ${src.length} class${src.length===1?"":"es"} from ${fmtDayLabel(last)} to ${fmtDayLabel(date)}?`)) return;
    onCopy(src.map(p=>({...p,id:uid(),date,status:"planned",logId:null})));
  };

  const iconBtn={background:"#f1f5f9",border:"none",borderRadius:9,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0};

  return(
    <div style={{padding:"0 16px",marginBottom:18}}>
      <div style={{background:"#fff",borderRadius:22,padding:"16px 14px 14px",boxShadow:"0 4px 18px rgba(15,23,42,.07)",border:"1.5px solid #eef2ff"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
            <div style={{width:34,height:34,borderRadius:11,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><CalendarClock size={18} color="#fff"/></div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:15,fontWeight:900,color:"#0f172a"}}>Plan your day</div>
              <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>
                {dayClasses.length===0?"No classes added":`${dayClasses.length} class${dayClasses.length===1?"":"es"}${offset===0?` · ${doneCount} logged`:""}`}
                {missedCount>0&&<span style={{color:"#d97706"}}> · {missedCount} to log</span>}
              </div>
            </div>
          </div>
          <div style={{display:"flex",background:"#f1f5f9",borderRadius:12,padding:3,flexShrink:0}}>
            {[{o:0,l:"Today"},{o:1,l:"Tomorrow"}].map(t=>(
              <button key={t.o} onClick={()=>setOffset(t.o)} style={{border:"none",borderRadius:10,padding:"6px 11px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",background:offset===t.o?"#fff":"transparent",color:offset===t.o?"#4338ca":"#64748b",boxShadow:offset===t.o?"0 1px 4px rgba(0,0,0,.08)":"none"}}>{t.l}</button>
            ))}
          </div>
        </div>

        {loadError&&(
          <div style={{background:"#fef2f2",border:"1.5px solid #fecaca",color:"#b91c1c",borderRadius:12,padding:"10px 12px",fontSize:12,fontWeight:600,marginBottom:10,display:"flex",gap:8}}>
            <AlertTriangle size={15} style={{flexShrink:0,marginTop:1}}/> The planner needs a one-time database setup. Ask the app admin to create the planned_classes table.
          </div>
        )}

        {dayClasses.length===0&&!loadError&&(
          <div style={{textAlign:"center",padding:"14px 8px 6px",color:"#64748b",fontSize:13}}>
            {offset===0?"Add today's classes to log hours with one tap.":"Add tomorrow's classes so they're ready in the morning."}
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {dayClasses.map((p,i)=>{
            const st=states[i]; const S=STYLE[st]; const isToday=offset===0;
            const dim=st==="skipped";
            return(
              <div key={p.id} style={{display:"flex",gap:10,alignItems:"stretch"}}>
                <div style={{width:54,flexShrink:0,textAlign:"right",paddingTop:12}}>
                  <div style={{fontSize:12,fontWeight:800,color:dim?"#94a3b8":"#0f172a",lineHeight:1.1}}>{fmtTime12(p.startTime).replace(" ","\u00A0")}</div>
                </div>
                <div style={{width:10,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:15}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:S.dot,boxShadow:st==="now"?"0 0 0 4px rgba(99,102,241,.25)":"none",flexShrink:0}}/>
                  {i<dayClasses.length-1&&<div style={{flex:1,width:2,background:"#e2e8f0",marginTop:4}}/>}
                </div>
                <div style={{flex:1,minWidth:0,background:S.bg,border:`1.5px solid ${S.border}`,borderRadius:14,padding:"10px 12px",opacity:dim?.7:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#0f172a",textDecoration:dim?"line-through":"none"}}>{p.batchCode}</div>
                      <div style={{fontSize:12.5,color:"#475569",fontWeight:600,marginTop:1,wordBreak:"break-word"}}>{p.chapterName}</div>
                    </div>
                    {S.badge&&<span style={{fontSize:9.5,fontWeight:900,letterSpacing:.4,color:"#fff",background:S.badgeBg,borderRadius:99,padding:"3px 8px",whiteSpace:"nowrap",flexShrink:0}}>{S.badge}</span>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:7}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#4338ca",background:"#eef2ff",borderRadius:99,padding:"3px 9px",display:"flex",alignItems:"center",gap:4}}><Clock size={11}/> {fmtHours(p.hours)}</span>
                    {p.room&&<span style={{fontSize:11,fontWeight:700,color:"#0f766e",background:"#ccfbf1",borderRadius:99,padding:"3px 9px",display:"flex",alignItems:"center",gap:4}}><MapPin size={11}/> Room {p.room}</span>}
                  </div>

                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:9,flexWrap:"wrap"}}>
                    {isToday&&(st==="now"||st==="missed"||st==="next"||st==="later")&&(
                      <button onClick={()=>onLog(p)} style={{flex:1,minWidth:110,border:"none",borderRadius:11,padding:"9px 12px",fontWeight:900,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:st==="now"?"linear-gradient(135deg,#6366f1,#4338ca)":st==="missed"?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#94a3b8,#64748b)",boxShadow:st==="now"?"0 4px 14px rgba(99,102,241,.35)":"none"}}>
                        <Check size={15}/> Log {fmtHours(p.hours)}
                      </button>
                    )}
                    {isToday&&st==="missed"&&(
                      <button onClick={()=>onUpdate({...p,status:"skipped"})} style={{...iconBtn,width:"auto",padding:"0 10px",gap:5,fontSize:12,fontWeight:800,color:"#64748b",height:36,borderRadius:11}}><SkipForward size={13}/> Skip</button>
                    )}
                    {st==="done"&&(
                      <button onClick={()=>{ if(window.confirm("Remove the hours logged for this class?")) onUndo(p); }} style={{...iconBtn,width:"auto",padding:"0 10px",gap:5,fontSize:12,fontWeight:800,color:"#15803d",background:"#dcfce7",height:32}}><RotateCcw size={13}/> Undo</button>
                    )}
                    {st==="skipped"&&(
                      <button onClick={()=>onUpdate({...p,status:"planned"})} style={{...iconBtn,width:"auto",padding:"0 10px",gap:5,fontSize:12,fontWeight:800,color:"#475569",height:32}}><RotateCcw size={13}/> Restore</button>
                    )}
                    <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                      {st!=="done"&&<button aria-label="Edit class" onClick={()=>setForm({initial:p})} style={iconBtn}><Pencil size={13} color="#6366f1"/></button>}
                      <button aria-label="Delete class" onClick={()=>{ if(window.confirm(st==="done"?"Delete this class? The logged hours stay in your records.":"Delete this class?")) onDelete(p.id); }} style={{...iconBtn,background:"#fef2f2"}}><Trash2 size={13} color="#ef4444"/></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={()=>setForm({})} disabled={runningBatches.length===0} style={{flex:1,border:"2px dashed #c7d2fe",background:"#eef2ff",color:"#4338ca",borderRadius:13,padding:"11px",fontWeight:800,fontSize:13.5,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={15}/> Add class</button>
          <button onClick={copyPrevious} style={{border:"2px solid #e2e8f0",background:"#f8fafc",color:"#475569",borderRadius:13,padding:"11px 13px",fontWeight:800,fontSize:12.5,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><Copy size={14}/> Copy last day</button>
        </div>
        {runningBatches.length===0&&<div style={{fontSize:11.5,color:"#94a3b8",marginTop:8,textAlign:"center"}}>Create a batch first to plan classes.</div>}
      </div>

      {form&&(
        <ClassFormModal initial={form.initial} date={date} chapters={chapters} runningBatches={runningBatches} recent={recent}
          onClose={()=>setForm(null)}
          onSave={pc=>{ form.initial?onUpdate(pc):onAdd(pc); setForm(null); }}/>
      )}
    </div>
  );
}
