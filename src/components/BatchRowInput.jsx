import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { BookOpen, ClipboardList } from "lucide-react";
import { CHAPTER_DB, ALL_CHAPTERS } from "../lib/constants";
import { fmtHours } from "../lib/helpers";

// Isolated input state to prevent keyboard close: each row uses local state + stable
// callbacks so typing in one row never re-renders (and remounts) the others.
export default function BatchRowInput({rowId, initialName, initialHours, onNameChange, onHoursChange, onRemove, showRemove, subject, masterChapters, index}) {
  const [name, setName] = useState(initialName);
  const [hours, setHours] = useState(initialHours);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const acRef = useRef();

  useEffect(()=>{
    const h=e=>{if(acRef.current&&!acRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const handleNameInput = useCallback((v) => {
    setName(v);
    onNameChange(rowId, v);
    if(v.length<1){setSuggestions([]);setOpen(false);return;}
    const pool=subject&&subject!=="Multiple Subjects"&&CHAPTER_DB[subject]?CHAPTER_DB[subject]:ALL_CHAPTERS;
    const filtered=pool.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,7);
    setSuggestions(filtered);
    setOpen(filtered.length>0);
  }, [rowId, onNameChange, subject]);

  const handleHoursInput = useCallback((v) => {
    setHours(v);
    onHoursChange(rowId, v);
  }, [rowId, onHoursChange]);

  const selectSuggestion = useCallback((s) => {
    setName(s);
    onNameChange(rowId, s);
    setOpen(false);
  }, [rowId, onNameChange]);

  // Show topics from master chapter when name matches
  const master = useMemo(() =>
    masterChapters.find(mc=>mc.name.toLowerCase()===name.toLowerCase()),
    [masterChapters, name]
  );
  const topics = master?.topics || [];

  return (
    <div ref={acRef} style={{background:"#f8fafc",borderRadius:14,padding:"12px 14px",border:"1.5px solid #e2e8f0",position:"relative"}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,position:"relative"}}>
          <input
            value={name}
            onChange={e=>handleNameInput(e.target.value)}
            placeholder={`Chapter ${index+1} name...`}
            style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}
          />
          {open&&suggestions.length>0&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,.13)",zIndex:250,maxHeight:200,overflowY:"auto",marginTop:3,border:"1.5px solid #e2e8f0"}}>
              {suggestions.map((s,si)=>(
                <div key={si} onMouseDown={()=>selectSuggestion(s)}
                  style={{padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1e293b",borderBottom:"1px solid #f1f5f9"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f4ff"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{display:"flex",alignItems:"center",gap:6}}><BookOpen size={13}/> {s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {showRemove&&(
          <button onClick={()=>onRemove(rowId)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#ef4444",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>×</button>
        )}
      </div>
      <div>
        <input
          type="number"
          value={hours}
          onChange={e=>handleHoursInput(e.target.value)}
          placeholder="Allotted hours (e.g. 1.5 = 1h 30m)"
          min={0}
          step={0.5}
          style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}
        />
        {hours&&parseFloat(hours)>0&&<div style={{fontSize:11,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseFloat(hours))}</div>}
      </div>
      {/* Topics from master chapter library */}
      {topics.length>0&&(
        <div style={{marginTop:8,padding:"8px 10px",background:"#eef2ff",borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:4,display:"flex",alignItems:"center",gap:5}}><ClipboardList size={12}/> {topics.length} topics will be imported from chapter library</div>
          <div style={{fontSize:11,color:"#475569"}}>{topics.slice(0,3).map(t=>t.name).join(" · ")}{topics.length>3?` · +${topics.length-3} more`:""}</div>
        </div>
      )}
      {name.trim()&&topics.length===0&&(
        <div style={{marginTop:8,padding:"7px 10px",background:"#fef9c3",borderRadius:8}}>
          <div style={{fontSize:11,color:"#92400e",fontWeight:600}}>💡 Add topics to this chapter in the Chapters tab first to auto-import them</div>
        </div>
      )}
    </div>
  );
}
