import { useState } from "react";
import { Plane, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import { TRAVEL_PURPOSES } from "../lib/constants";
import { uid, todayStr } from "../lib/helpers";

export default function TravelEntryModal({entry,onSave,onClose}) {
  const [date,setDate]=useState(entry?.date||todayStr());
  const [from,setFrom]=useState(entry?.from||"");
  const [to,setTo]=useState(entry?.to||"");
  const [purpose,setPurpose]=useState(entry?.purpose && TRAVEL_PURPOSES.includes(entry.purpose) ? entry.purpose : (entry?.purpose ? "Other" : "Foundation Class"));
  const [customPurpose,setCustomPurpose]=useState(entry?.purpose && !TRAVEL_PURPOSES.slice(0,-1).includes(entry.purpose) ? entry.purpose : "");
  const [notes,setNotes]=useState(entry?.notes||"");

  const handleSave=()=>{
    if(!from.trim()||!to.trim()) return;
    const finalPurpose = purpose==="Other" ? (customPurpose.trim()||"Other") : purpose;
    onSave({id:entry?.id||uid(), date, from:from.trim(), to:to.trim(), purpose:finalPurpose, notes:notes.trim()});
  };

  return(
    <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}><Plane size={17}/> {entry?"Edit Trip":"Add Trip"}</span>} onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Date</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>From</label>
          <input value={from} onChange={e=>setFrom(e.target.value)} placeholder="e.g. Pala"
            style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        </div>
        <div style={{flex:1}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>To</label>
          <input value={to} onChange={e=>setTo(e.target.value)} placeholder="e.g. Kottayam"
            style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Purpose</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {TRAVEL_PURPOSES.map(p=>(
            <button key={p} onClick={()=>setPurpose(p)} style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${purpose===p?"#6366f1":"#e2e8f0"}`,background:purpose===p?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:purpose===p?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12}}>
              {p}
            </button>
          ))}
        </div>
        {purpose==="Other"&&(
          <input value={customPurpose} onChange={e=>setCustomPurpose(e.target.value)} placeholder="Specify purpose"
            style={{width:"100%",marginTop:8,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        )}
      </div>
      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Notes (optional)</label>
        <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. by bus"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={handleSave} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={15}/> Save Trip</button>
      </div>
    </Modal>
  );
}
