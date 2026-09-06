import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Share2, Download, Clock, CheckCircle2, Hourglass, Star,
  AlertTriangle, Calendar, FileText, ClipboardList, Pencil, Trash2,
  ChevronDown, ChevronUp, MapPin, X, Cloud, Plus,
} from "lucide-react";
import Modal from "../components/Modal";
import SyncBadge from "../components/SyncBadge";
import PBar from "../components/PBar";
import Sec from "../components/Sec";
import UnitToggle from "../components/UnitToggle";
import PresetChips from "../components/PresetChips";
import {
  fmtHours, fmtDate, todayStr, parseHours, roundToMinute, toHoursFromInput,
  deriveExtraHours, getStatus, STATUS, shadeColor, uid, buildChapterCSV,
} from "../lib/helpers";
import { shareChapterImage } from "../lib/shareImages";

export default function DetailPage({chapter,color,onUpdate,onBack,syncStatus}) {
  // Local state that doesn't trigger parent re-renders (keeps the on-screen keyboard open)
  const [logH,setLogH]=useState("");
  const [logUnit,setLogUnit]=useState("hours"); // "hours" or "minutes"
  const [extraH,setExtraH]=useState("");
  const [extraUnit,setExtraUnit]=useState("hours"); // "hours" or "minutes"
  const [logDate,setLogDate]=useState(todayStr());
  const [logNote,setLogNote]=useState("");
  const [newTopic,setNewTopic]=useState("");
  const [notes,setNotes]=useState(chapter.notes||"");
  const [showLogs,setShowLogs]=useState(false);
  const [editLog,setEditLog]=useState(null);
  const [sharing,setSharing]=useState(false);
  const ntRef=useRef(null);

  // Keep local notes in sync if chapter changes from outside
  const prevNotesRef=useRef(chapter.notes||"");
  useEffect(()=>{
    if(chapter.notes!==prevNotesRef.current){
      setNotes(chapter.notes||"");
      prevNotesRef.current=chapter.notes||"";
    }
  },[chapter.id]);

  const pct=chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining=Math.max(0,chapter.totalHours-chapter.completedHours);
  const status=getStatus(chapter.completedHours,chapter.totalHours);
  const logs=chapter.hourLogs||[];

  // Auto-detect extra hours — if adding logH hours would exceed allotted, auto-flag as extra
  const logHoursVal = toHoursFromInput(logH, logUnit);
  const wouldExceed = logHoursVal > 0 && (chapter.completedHours + logHoursVal) > chapter.totalHours;
  const autoExtraAmount = wouldExceed
    ? roundToMinute(Math.min(logHoursVal, (chapter.completedHours + logHoursVal) - chapter.totalHours))
    : 0;

  const logHours=useCallback(()=>{
    // Converts from whichever unit (hours or minutes) the person picked, always stores decimal hours
    const h=roundToMinute(toHoursFromInput(logH,logUnit));
    if(!h||h<=0) return;
    // Auto-detect extra portion (informational per-entry tag only — the chapter's
    // overall "Extra" total is always derived fresh from completedHours vs totalHours,
    // so this no longer needs to be kept in sync with a separate running counter)
    const currentCompleted = chapter.completedHours;
    const newCompleted = roundToMinute(currentCompleted + h);
    const extraPortion = chapter.totalHours > 0
      ? roundToMinute(Math.max(0, newCompleted - chapter.totalHours))
      : 0;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote,type:extraPortion>0?"extra":"regular",extraAmount:extraPortion,extraNote:extraPortion>0?`(includes ${fmtHours(extraPortion)} extra)`:""};
    onUpdate({...chapter,completedHours:newCompleted,hourLogs:[...logs,newLog]});
    setLogH("");setLogNote("");
  },[logH,logUnit,logDate,logNote,chapter,logs,onUpdate]);

  const logExtra=useCallback(()=>{
    const h=roundToMinute(toHoursFromInput(extraH,extraUnit));
    if(!h||h<=0) return;
    // Tag this entry with its true "beyond allotted" portion (same math as the
    // regular log path) instead of always counting 100% of it as extra.
    const newCompleted = roundToMinute(chapter.completedHours + h);
    const extraPortion = chapter.totalHours > 0
      ? roundToMinute(Math.max(0, Math.min(h, newCompleted - chapter.totalHours)))
      : h;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote||"Extra",type:"extra",extraAmount:extraPortion};
    onUpdate({...chapter,completedHours:newCompleted,hourLogs:[...logs,newLog]});
    setExtraH("");setLogNote("");
  },[extraH,extraUnit,logDate,logNote,chapter,logs,onUpdate]);

  const deleteLog=useCallback(logId=>{
    const log=logs.find(l=>l.id===logId);
    if(!log||!window.confirm(`Remove ${fmtHours(log.hours)} on ${fmtDate(log.date)}?`)) return;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours-log.hours)),hourLogs:logs.filter(l=>l.id!==logId)});
  },[logs,chapter,onUpdate]);

  const saveEditLog=useCallback(()=>{
    if(!editLog) return;
    const old=logs.find(l=>l.id===editLog.id);
    if(!old) return;
    const newH=roundToMinute(parseHours(editLog.hours));
    const diff=newH-old.hours;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours+diff)),hourLogs:logs.map(l=>l.id===editLog.id?{...l,hours:newH,date:editLog.date,note:editLog.note}:l)});
    setEditLog(null);
  },[editLog,logs,chapter,onUpdate]);

  const toggleTopic=useCallback(id=>onUpdate({...chapter,topics:(chapter.topics||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}),[chapter,onUpdate]);
  const markLast=useCallback(id=>onUpdate({...chapter,lastCompletedTopic:chapter.lastCompletedTopic===id?null:id}),[chapter,onUpdate]);
  const deleteTopic=useCallback(id=>onUpdate({...chapter,topics:(chapter.topics||[]).filter(t=>t.id!==id)}),[chapter,onUpdate]);

  const addTopic=useCallback(()=>{
    if(!newTopic.trim())return;
    onUpdate({...chapter,topics:[...(chapter.topics||[]),{id:uid(),name:newTopic.trim(),done:false}]});
    setNewTopic("");
  },[newTopic,chapter,onUpdate]);

  const handleNotes=useCallback(v=>{
    setNotes(v);
    clearTimeout(ntRef.current);
    ntRef.current=setTimeout(()=>onUpdate({...chapter,notes:v}),800);
  },[chapter,onUpdate]);

  const shareChapter=async()=>{
    setSharing(true);
    try{ await shareChapterImage(chapter,color); }
    finally{ setSharing(false); }
  };
  const downloadChapterCSV=()=>{
    const csv=buildChapterCSV(chapter);
    const a=document.createElement("a");
    const safeName=chapter.name.replace(/[^a-z0-9]+/gi,"_");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`${safeName}_HoursReport_${todayStr()}.csv`;
    a.click();
  };

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(160deg,${shadeColor(color,0.72)},${shadeColor(color,0.82)})`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8,flexWrap:"wrap"}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:6}}><ArrowLeft size={15}/> Back</button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={shareChapter} disabled={sharing} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 12px",color:"#fff",fontWeight:700,cursor:sharing?"default":"pointer",fontFamily:"inherit",fontSize:12,opacity:sharing?.7:1,display:"flex",alignItems:"center",gap:5}}><Share2 size={13}/> {sharing?"…":"Share"}</button>
            <button onClick={downloadChapterCSV} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 12px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12,display:"flex",alignItems:"center",gap:5}}><Download size={13}/> CSV</button>
            <SyncBadge status={syncStatus}/>
          </div>
        </div>
        <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1px"}}>{chapter.batchCode}</div>
        <div style={{fontSize:20,fontWeight:700,marginTop:4,marginBottom:18,lineHeight:1.3}}>{chapter.name}</div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours),Icon:Clock},{l:"Taken",v:fmtHours(chapter.completedHours),Icon:CheckCircle2},{l:"Extra",v:fmtHours(deriveExtraHours(chapter.completedHours,chapter.totalHours)),Icon:Star},{l:"Left",v:fmtHours(remaining),Icon:Hourglass}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.14)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:4}}><s.Icon size={13} color="rgba(255,255,255,.8)"/></div>
              <div style={{fontSize:14,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:9,opacity:.8,fontWeight:600,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct} color="#34d399" bg="rgba(255,255,255,.18)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,opacity:.9,fontWeight:600}}>
          <span>{pct.toFixed(0)}% complete</span><span>{STATUS[status].label}</span>
        </div>
        {chapter.completedHours>chapter.totalHours&&<div style={{marginTop:10,background:"rgba(239,68,68,.3)",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7}}><AlertTriangle size={15}/> {fmtHours(chapter.completedHours-chapter.totalHours)} beyond allotted</div>}
      </div>

      <div style={{padding:"20px 16px 80px",maxWidth:560,margin:"0 auto"}}>
        <Sec title={<span style={{display:"flex",alignItems:"center",gap:8}}><Calendar size={16}/> Log Class Hours</span>}>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <label style={{fontSize:13,fontWeight:700,color:"#475569"}}>Log Time</label>
              <UnitToggle unit={logUnit} onChange={setLogUnit} activeColor={color}/>
            </div>
            <PresetChips unit={logUnit} color={color} onPick={v=>setLogH(String(v))}/>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={logUnit==="minutes"?1:0.0833} value={logH}
                  onChange={e=>setLogH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logHours()}
                  placeholder={logUnit==="minutes"?"e.g. 20":"e.g. 1.5"}
                  style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                {logH&&<div style={{fontSize:11,color:color,marginTop:3,fontWeight:700}}>= {fmtHours(toHoursFromInput(logH,logUnit))}</div>}
              </div>
              <button onClick={logHours} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:15,boxShadow:`0 4px 14px ${color}44`,flexShrink:0,display:"flex",alignItems:"center",gap:6}}><Plus size={16}/> Log</button>
            </div>

            {wouldExceed&&logHoursVal>0&&(
              <div style={{background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                <AlertTriangle size={18} color="#ea580c"/>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#c2410c"}}>This will exceed allotted hours!</div>
                  <div style={{fontSize:11,color:"#ea580c",marginTop:2}}>{fmtHours(autoExtraAmount)} will be auto-marked as extra hours</div>
                </div>
              </div>
            )}

            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}><Calendar size={12}/> Date</label>
                <input type="date" value={logDate}
                  onChange={e=>setLogDate(e.target.value)}
                  style={{width:"100%",padding:"10px 8px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}><FileText size={12}/> Period</label>
                <input type="text" value={logNote}
                  onChange={e=>setLogNote(e.target.value)}
                  placeholder="e.g. Period 3"
                  style={{width:"100%",padding:"10px 8px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
              </div>
            </div>
          </div>

          {/* Extra Hours section */}
          <div style={{background:"linear-gradient(135deg,#fffbeb,#fef9c3)",border:"2px solid #fde68a",borderRadius:14,padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13,fontWeight:800,color:"#92400e",display:"flex",alignItems:"center",gap:6}}><Star size={14}/> Extra Hours (Beyond Allotted)</div>
              <UnitToggle unit={extraUnit} onChange={setExtraUnit} activeColor="#92400e" trackBg="#fde68a55" activeBg="#fffef5"/>
            </div>
            <PresetChips unit={extraUnit} color="#92400e" onPick={v=>setExtraH(String(v))}/>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={extraUnit==="minutes"?1:0.0833} value={extraH}
                  onChange={e=>setExtraH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logExtra()}
                  placeholder={extraUnit==="minutes"?"e.g. 15":"e.g. 0.5"}
                  style={{width:"100%",padding:"11px 14px",border:"2px solid #fde68a",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fffef5",boxSizing:"border-box"}}/>
                {extraH&&<div style={{fontSize:11,color:"#92400e",marginTop:3,fontWeight:700}}>= {fmtHours(toHoursFromInput(extraH,extraUnit))}</div>}
              </div>
              <button onClick={logExtra} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(245,158,11,.3)",flexShrink:0,display:"flex",alignItems:"center",gap:5}}><Plus size={15}/> Add</button>
            </div>
          </div>
        </Sec>

        {logs.length>0&&(
          <Sec title={<span style={{display:"flex",alignItems:"center",gap:8}}><Clock size={16}/> Hour Logs ({logs.length} entries)</span>}>
            <button onClick={()=>setShowLogs(!showLogs)} style={{background:"#eef2ff",color:"#6366f1",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:showLogs?12:0,display:"flex",alignItems:"center",gap:6}}>
              {showLogs?<ChevronUp size={14}/>:<ChevronDown size={14}/>} {showLogs?"Hide Logs":"Show All Logs"}
            </button>
            {showLogs&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                {[...logs].reverse().map(log=>(
                  <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,background:log.type==="extra"?"linear-gradient(135deg,#fffbeb,#fef9c3)":"#f8fafc",border:`2px solid ${log.type==="extra"?"#fde68a":"#e2e8f0"}`}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:log.type==="extra"?"#92400e":color,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        {fmtHours(log.hours)}
                        <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:12}}>{log.type==="extra"?<Star size={12}/>:<Clock size={12}/>}{log.type==="extra"?"Extra":"Regular"}</span>
                        {log.extraNote?<span style={{fontSize:11,fontWeight:600,color:"#f97316"}}>{log.extraNote}</span>:null}
                      </div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:2,display:"flex",alignItems:"center",gap:5}}><Calendar size={11}/> {fmtDate(log.date)}{log.note?" · "+log.note:""}</div>
                    </div>
                    <button onClick={()=>setEditLog({...log,hours:String(log.hours)})} style={{background:"#eef2ff",border:"none",borderRadius:9,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Pencil size={13} color="#6366f1"/></button>
                    <button onClick={()=>deleteLog(log.id)} style={{background:"#fee2e2",border:"none",borderRadius:9,width:30,height:30,cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </Sec>
        )}

        {editLog&&(
          <Modal title="Edit Log Entry" onClose={()=>setEditLog(null)}>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Hours</label>
              <input type="number" value={editLog.hours} onChange={e=>setEditLog({...editLog,hours:e.target.value})} step={0.0833} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
              {editLog.hours&&<div style={{fontSize:12,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(editLog.hours))}</div>}
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Date</label>
              <input type="date" value={editLog.date} onChange={e=>setEditLog({...editLog,date:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Note / Period</label>
              <input type="text" value={editLog.note} onChange={e=>setEditLog({...editLog,note:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditLog(null)} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={saveEditLog} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save Changes</button>
            </div>
          </Modal>
        )}

        <Sec title={<span style={{display:"flex",alignItems:"center",gap:8}}><ClipboardList size={16}/> Topics</span>}>
          {(chapter.topics||[]).length===0&&<div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:14}}>No topics yet.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {(chapter.topics||[]).map((t,i)=>{
              const isLast=chapter.lastCompletedTopic===t.id;
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,background:isLast?"#eef2ff":t.done?"#f0fdf4":"#fff",border:`2px solid ${isLast?"#c7d2fe":t.done?"#bbf7d0":"#e2e8f0"}`}}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTopic(t.id)} style={{width:18,height:18,accentColor:color,cursor:"pointer",flexShrink:0}}/>
                  <span style={{flex:1,fontSize:14,color:t.done?"#64748b":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:t.done?500:600}}>{i+1}. {t.name}</span>
                  {isLast&&<span style={{background:color,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:99,flexShrink:0}}>Last Done</span>}
                  <button onClick={()=>markLast(t.id)} style={{background:"none",border:"none",cursor:"pointer",opacity:.5,padding:0,flexShrink:0,display:"flex"}}><MapPin size={16} color={isLast?color:"#64748b"}/></button>
                  <button onClick={()=>deleteTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",opacity:.6,padding:0,flexShrink:0,display:"flex"}}><X size={16}/></button>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addTopic();}}
              placeholder="Add a topic..."
              style={{flex:1,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
            <button onClick={addTopic} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"0 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14,display:"flex",alignItems:"center",gap:5}}><Plus size={15}/> Add</button>
          </div>
        </Sec>

        <Sec title={<span style={{display:"flex",alignItems:"center",gap:8}}><FileText size={16}/> Notes</span>}>
          <textarea value={notes} onChange={e=>handleNotes(e.target.value)} placeholder="Notes, derivations, student doubts..."
            style={{width:"100%",minHeight:120,padding:"14px",border:"2px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none",background:"#fff",lineHeight:1.8,boxSizing:"border-box"}}/>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:4,display:"flex",alignItems:"center",gap:5}}><Cloud size={12}/> Auto-saved to cloud</div>
        </Sec>
      </div>
    </div>
  );
}
