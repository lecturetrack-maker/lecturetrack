import { FolderOpen, Plus, Inbox, Trash2, CheckCircle2, ChevronRight } from "lucide-react";
import PBar from "../components/PBar";
import { BATCH_COLORS } from "../lib/constants";
import { fmtHours } from "../lib/helpers";

// Shows a "Completed" tag on batches that have been marked completed
export default function BatchesTab({chapters,onOpenBatch,onDeleteBatch,onAddBatch,completedBatches=[]}) {
  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))].sort();
  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a",display:"flex",alignItems:"center",gap:8}}><FolderOpen size={19}/> Batches</div>
        <button onClick={onAddBatch} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.35)",display:"flex",alignItems:"center",gap:6}}><Plus size={15}/> Add Batch</button>
      </div>
      {batches.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}><div style={{display:"flex",justifyContent:"center"}}><Inbox size={40} strokeWidth={1.5}/></div><div style={{fontWeight:700,marginTop:12,fontSize:16}}>No batches yet</div><div style={{fontSize:13,marginTop:4}}>Tap + Add Batch to get started</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {batches.map((b,i)=>{
          const bc=BATCH_COLORS[i%BATCH_COLORS.length];
          const chs=chapters.filter(c=>c.batchCode===b);
          const done=chs.reduce((s,c)=>s+c.completedHours,0);
          const total=chs.reduce((s,c)=>s+c.totalHours,0);
          const p=total>0?(done/total)*100:0;
          const isCompleted=completedBatches.includes(b);
          return(
            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:`linear-gradient(135deg,${bc},${bc}cc)`,borderRadius:20,padding:22,color:"#fff",cursor:"pointer",boxShadow:`0 6px 24px ${bc}44`,transition:"transform .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1px"}}>{b}</div>
                  {isCompleted&&<span style={{fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:99,background:"rgba(255,255,255,.3)",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}><CheckCircle2 size={11}/> Completed</span>}
                </div>
                <button onClick={e=>{e.stopPropagation();onDeleteBatch(b);}} style={{background:"rgba(239,68,68,.3)",border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12,display:"flex",alignItems:"center",gap:5}}><Trash2 size={13}/> Delete</button>
              </div>
              <div style={{fontSize:13,opacity:.8,marginBottom:14}}>{chs.length} chapters</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                {[{l:"Allotted",v:fmtHours(total)},{l:"Done",v:fmtHours(done)},{l:"Left",v:fmtHours(Math.max(0,total-done))}].map(s=>(
                  <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.18)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800}}>{s.v}</div>
                    <div style={{fontSize:9,opacity:.8,fontWeight:600,marginTop:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <PBar pct={p}/>
              <div style={{fontSize:12,opacity:.8,marginTop:5,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{p.toFixed(0)}% · Tap to manage <ChevronRight size={13}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
