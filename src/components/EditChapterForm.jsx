import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

// Isolated component to avoid re-render keyboard issues.
export default function EditChapterForm({chapter, onSave, onClose}) {
  const [name, setName] = useState(chapter.name);
  const [hours, setHours] = useState(String(chapter.totalHours));
  return (
    <>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Chapter Name</label>
        <input value={name} onChange={e=>setName(e.target.value)}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Allotted Hours</label>
        <input type="number" value={hours} onChange={e=>setHours(e.target.value)}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>{if(name&&hours)onSave({name,totalHours:parseFloat(hours)});}}
          style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}><span style={{display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={15}/> Save</span></button>
      </div>
    </>
  );
}
