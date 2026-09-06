import { useState } from "react";
import { ClipboardList, Plus, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import { uid } from "../lib/helpers";

export default function ChapterMasterModal({chapter,onSave,onClose}) {
  const [topics,setTopics]=useState(chapter?.topics||[]);
  const [newTopic,setNewTopic]=useState("");
  const addTopic=()=>{if(!newTopic.trim())return;setTopics(prev=>[...prev,{id:uid(),name:newTopic.trim(),done:false}]);setNewTopic("");};
  const removeTopic=id=>setTopics(prev=>prev.filter(t=>t.id!==id));
  return(
    <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}><ClipboardList size={17}/> Topics · {chapter.name}</span>} onClose={onClose}>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>Topics you add here will appear in all batch pages for this chapter.</div>
      {topics.length===0&&<div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:14}}>No topics yet. Add below.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14,maxHeight:280,overflowY:"auto"}}>
        {topics.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:12,background:"#f8fafc",border:"1.5px solid #e2e8f0"}}>
            <span style={{fontSize:13,color:"#1e293b",fontWeight:600,flex:1}}>{i+1}. {t.name}</span>
            <button onClick={()=>removeTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:"#ef4444",opacity:.6,padding:0,flexShrink:0}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTopic()} placeholder="Add a topic..."
          style={{flex:1,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
        <button onClick={addTopic} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}><span style={{display:"flex",alignItems:"center",gap:5}}><Plus size={14}/> Add</span></button>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>onSave({...chapter,topics})} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}><span style={{display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={15}/> Save Topics</span></button>
      </div>
    </Modal>
  );
}
