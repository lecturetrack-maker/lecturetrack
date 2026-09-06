import { useState } from "react";
import { BookOpen, Plus, Search, Inbox, ChevronRight, Trash2 } from "lucide-react";

export default function ChaptersTab({masterChapters,onOpenMaster,onAddMaster,onDeleteMaster}) {
  const [search,setSearch]=useState("");
  const filtered=masterChapters.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a",display:"flex",alignItems:"center",gap:8}}><BookOpen size={19}/> Chapter Library</div>
        <button onClick={onAddMaster} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.35)",display:"flex",alignItems:"center",gap:6}}><Plus size={15}/> Add</button>
      </div>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,fontWeight:500}}>Add chapters and their topics here. Topics appear automatically in batch pages.</div>
      <div style={{position:"relative",marginBottom:12}}>
        <Search size={16} color="#94a3b8" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chapters..."
          style={{width:"100%",padding:"12px 16px 12px 40px",border:"2px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}><div style={{display:"flex",justifyContent:"center"}}><Inbox size={40} strokeWidth={1.5}/></div><div style={{fontWeight:700,marginTop:12,fontSize:16}}>No chapters yet</div></div>}
        {filtered.map(c=>{
          const topicCount=(c.topics||[]).length;
          return(
            <div key={c.id} onClick={()=>onOpenMaster(c)}
              style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",cursor:"pointer",border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:12,transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 14px rgba(99,102,241,.13)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.06)"}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>{topicCount>0?`${topicCount} topics`:"No topics yet — tap to add"}</div>
              </div>
              <div style={{background:"#eef2ff",color:"#6366f1",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,flexShrink:0,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                Edit Topics <ChevronRight size={12}/>
              </div>
              <button onClick={e=>{e.stopPropagation();onDeleteMaster(c.id);}} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Trash2 size={14}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
