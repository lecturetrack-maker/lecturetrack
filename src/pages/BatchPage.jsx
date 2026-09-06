import { useState } from "react";
import { ArrowLeft, Share2, Download, Clock, CheckCircle2, Hourglass, Trash2 } from "lucide-react";
import CircularProgress from "../components/CircularProgress";
import BatchHistorySection from "../components/BatchHistorySection";
import BatchChapterCard from "../components/BatchChapterCard";
import { fmtHours, getStatus, STATUS, shadeColor, buildBatchHistoryCSV, todayStr } from "../lib/helpers";
import { shareBatchImage } from "../lib/shareImages";

// Accepts `completed` + `onToggleCompleted` and renders a "Mark Completed" button
// beside "Delete This Entire Batch" — both buttons are equal size (flex:1 in a row)
export default function BatchPage({batchCode,color,chapters,masterChapters,onBack,onDeleteChapter,onEditChapter,onOpenChapter,onDeleteBatch,completed,onToggleCompleted}) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const remaining=Math.max(0,total-done);
  const pct=total>0?(done/total)*100:0;
  const status=getStatus(done,total);
  const [sharing,setSharing]=useState(false);
  // Deep, professional header gradient built from the batch's accent color
  const headerFrom=shadeColor(color,0.72);
  const headerTo=shadeColor(color,0.82);
  // Teacher name entered when the batch was created (same for every chapter in it)
  const teacherName=chapters.find(c=>c.batchTeacher)?.batchTeacher;
  // Batch category selected at creation
  const batchCategory=chapters.find(c=>c.batchCategory)?.batchCategory;

  const downloadCSV=()=>{
    const csv=buildBatchHistoryCSV(batchCode,chapters);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`${batchCode}_HoursReport_${todayStr()}.csv`;
    a.click();
  };

  const shareImage=async()=>{
    setSharing(true);
    try{ await shareBatchImage(batchCode,color,chapters); }
    finally{ setSharing(false); }
  };

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(160deg,${headerFrom},${headerTo})`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:6}}><ArrowLeft size={15}/> Back</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={shareImage} disabled={sharing} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:sharing?"default":"pointer",fontFamily:"inherit",fontSize:13,opacity:sharing?.7:1,display:"flex",alignItems:"center",gap:6}}><Share2 size={14}/> {sharing?"…":"Share"}</button>
            <button onClick={downloadCSV} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:6}}><Download size={14}/> CSV</button>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontSize:42,fontWeight:900,letterSpacing:"-1px"}}>{batchCode}</div>
              {completed&&<span style={{fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,background:"rgba(255,255,255,.22)",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}><CheckCircle2 size={12}/> Completed</span>}
              {batchCategory&&<span style={{fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,background:"rgba(255,255,255,.22)",whiteSpace:"nowrap"}}>{batchCategory}</span>}
            </div>
            <div style={{fontSize:13,opacity:.75,marginTop:4}}>{chapters.length} chapter{chapters.length===1?"":"s"}{teacherName?` · Teacher: ${teacherName}`:""}</div>
          </div>
          <CircularProgress pct={pct} size={104} strokeWidth={9} progressColor="#34d399" label={`${pct.toFixed(0)}%`} sublabel="Overall Progress"/>
        </div>
        <div style={{display:"flex",gap:10,margin:"20px 0 14px"}}>
          {[{l:"Allotted",v:fmtHours(total),Icon:Clock},{l:"Completed",v:fmtHours(done),Icon:CheckCircle2},{l:"Remaining",v:fmtHours(remaining),Icon:Hourglass}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.12)",borderRadius:14,padding:"12px 4px",textAlign:"center"}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:6}}><s.Icon size={15} color="rgba(255,255,255,.85)"/></div>
              <div style={{fontSize:16,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:10,opacity:.75,fontWeight:600,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:12,opacity:.85,marginTop:4,fontWeight:600}}>{pct.toFixed(0)}% complete · <span style={{color:status==="completed"?"#6ee7b7":status==="warning"?"#fde68a":"#e2e8f0"}}>{STATUS[status].label}</span></div>
      </div>
      <div style={{padding:"20px 16px 80px"}}>
        <BatchHistorySection batchCode={batchCode} color={color} chapters={chapters}/>
        {chapters.map(c=>{
          const cp=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
          const topics=c.topics||[];
          return(
            <BatchChapterCard key={c.id} chapter={c} cp={cp} color={color} topics={topics}
              onOpen={()=>onOpenChapter(c.id)} onEdit={()=>onEditChapter(c)} onDelete={()=>onDeleteChapter(c.id)}/>
          );
        })}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onToggleCompleted}
            style={{flex:1,padding:"14px",background:completed?"#f1f5f9":"#fff",color:completed?"#475569":"#10b981",border:`2px solid ${completed?"#e2e8f0":"#bbf7d0"}`,borderRadius:16,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:completed?"none":"0 2px 8px rgba(16,185,129,.1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,textAlign:"center"}}>
            {completed?<Clock size={17}/>:<CheckCircle2 size={17}/>}
            {completed?"Mark as Running":"Chapter Completed"}
          </button>
          <button onClick={onDeleteBatch}
            style={{flex:1,padding:"14px",background:"#fff",color:"#ef4444",border:"2px solid #fecaca",borderRadius:16,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(239,68,68,.1)",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Trash2 size={17}/> Delete This Entire Batch
          </button>
        </div>
      </div>
    </div>
  );
}
