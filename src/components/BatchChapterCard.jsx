import { useState } from "react";
import { Pencil, Trash2, ChevronUp, ChevronDown, ChevronRight, ClipboardList, CheckCircle2, BookOpen } from "lucide-react";
import PBar from "./PBar";
import { fmtHours, deriveExtraHours, getStatus, STATUS } from "../lib/helpers";

// "Tap to open" is a colored banner, separated visually from the stats/topics above it.
export default function BatchChapterCard({chapter,cp,color,topics,onOpen,onEdit,onDelete}) {
  const [showAllTopics,setShowAllTopics]=useState(false);
  const SHOW_LIMIT=3;
  const visibleTopics=showAllTopics?topics:topics.slice(0,SHOW_LIMIT);
  const status=getStatus(chapter.completedHours,chapter.totalHours);

  return(
    <div style={{background:"#fff",borderRadius:18,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${color}22`,overflow:"visible"}}>
      {/* Header row */}
      <div style={{padding:"16px 16px 0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",flex:1}}>{chapter.name}</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={onEdit} style={{background:"#eef2ff",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Pencil size={14} color="#6366f1"/></button>
            <button onClick={onDelete} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={14} color="#ef4444"/></button>
          </div>
        </div>
        {/* Stats */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours)},{l:"Taken",v:fmtHours(chapter.completedHours),col:"#10b981"},{l:"Extra",v:fmtHours(deriveExtraHours(chapter.completedHours,chapter.totalHours)),col:"#f59e0b"},{l:"Left",v:fmtHours(Math.max(0,chapter.totalHours-chapter.completedHours)),col:"#ef4444"}].map(s=>(
            <div key={s.l} style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:800,color:s.col||"#0f172a"}}>{s.v}</div>
              <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={cp} color={color} bg="#f1f5f9" height={5}/>
        <div style={{fontSize:11,color:"#94a3b8",marginTop:4,marginBottom:10}}>
          {cp.toFixed(0)}% complete · <span style={{color:STATUS[status].color,fontWeight:700}}>{STATUS[status].label}</span>
        </div>
        {/* Topics from master */}
        {topics.length>0&&(
          <div style={{borderTop:"1px solid #f1f5f9",paddingTop:10,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:6,display:"flex",alignItems:"center",gap:5}}><ClipboardList size={12}/> Topics</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {visibleTopics.map((t,i)=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:8,background:t.done?"#f0fdf4":"#f8fafc",border:`1px solid ${t.done?"#bbf7d0":"#e2e8f0"}`}}>
                  <span style={{fontSize:11,color:t.done?"#94a3b8":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:600,flex:1}}>{i+1}. {t.name}</span>
                  {t.done&&<CheckCircle2 size={12} color="#10b981"/>}
                </div>
              ))}
            </div>
            {topics.length>SHOW_LIMIT&&(
              <button onClick={()=>setShowAllTopics(!showAllTopics)}
                style={{marginTop:6,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6366f1",fontWeight:700,padding:"4px 0",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                {showAllTopics?<ChevronUp size={13}/>:<ChevronDown size={13}/>} {showAllTopics?"Show less":`Show ${topics.length-SHOW_LIMIT} more topics`}
              </button>
            )}
          </div>
        )}
      </div>
      {/* Separated, larger "Open Chapter" button — its own rounded card with margin so it stands out */}
      <div style={{padding:"4px 14px 14px"}}>
        <div onClick={onOpen}
          style={{background:`linear-gradient(135deg,${color},${color}dd)`,padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",borderRadius:14,boxShadow:`0 6px 18px ${color}55`}}>
          <span style={{color:"#fff",fontSize:15,fontWeight:800,display:"flex",alignItems:"center",gap:8}}><BookOpen size={18}/> Open Chapter</span>
          <span style={{color:"rgba(255,255,255,.9)",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>Log hours, topics & notes <ChevronRight size={16}/></span>
        </div>
      </div>
    </div>
  );
}
