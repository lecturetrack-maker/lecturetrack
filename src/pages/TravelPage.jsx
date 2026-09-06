import { useState, useMemo } from "react";
import { ArrowLeft, Plane, MessageCircle, Download, Plus, Navigation, Calendar, Pencil, Trash2, ArrowRight } from "lucide-react";
import TravelEntryModal from "../components/TravelEntryModal";
import { buildTravelCSV } from "../lib/helpers";
import { shareTravelImage } from "../lib/shareImages";
import { monthKey, monthLabel, todayStr, fmtDate } from "../lib/helpers";

export default function TravelPage({travelLogs,profile,onBack,onAdd,onEdit,onDelete}) {
  const [addOpen,setAddOpen]=useState(false);
  const [editEntry,setEditEntry]=useState(null);
  const [sharing,setSharing]=useState(false);

  const availableMonths=useMemo(()=>{
    const set=new Set(travelLogs.map(t=>monthKey(t.date)));
    set.add(monthKey(todayStr()));
    return [...set].sort().reverse();
  },[travelLogs]);
  const [selMonth,setSelMonth]=useState(monthKey(todayStr()));
  const monthEntries=useMemo(()=>travelLogs.filter(t=>monthKey(t.date)===selMonth).sort((a,b)=>new Date(b.date)-new Date(a.date)),[travelLogs,selMonth]);

  const downloadCSV=()=>{
    const csv=buildTravelCSV(monthEntries);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`Travel_${profile.code}_${monthLabel(selMonth).replace(/\s+/g,"_")}.csv`;
    a.click();
  };

  const shareWhatsApp=async()=>{
    setSharing(true);
    try{ await shareTravelImage(monthEntries, monthLabel(selMonth), profile.name); }
    finally{ setSharing(false); }
  };

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:"linear-gradient(160deg,#3730a3,#1e1b4b)",padding:"24px 20px 28px",color:"#fff",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.14)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:6}}><ArrowLeft size={15}/> Back</button>
          <div style={{fontSize:19,fontWeight:900,display:"flex",alignItems:"center",gap:8}}><Plane size={19}/> Travel Details</div>
          <div style={{width:70}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <select value={selMonth} onChange={e=>setSelMonth(e.target.value)}
            style={{background:"rgba(255,255,255,.16)",color:"#fff",border:"none",borderRadius:99,padding:"9px 16px",fontWeight:700,fontSize:13,fontFamily:"inherit",outline:"none"}}>
            {availableMonths.map(m=><option key={m} value={m} style={{color:"#0f172a"}}>{monthLabel(m)}</option>)}
          </select>
          <div style={{fontSize:13,fontWeight:700,opacity:.85}}>{monthEntries.length} trip{monthEntries.length===1?"":"s"}</div>
        </div>
      </div>

      <div style={{padding:"20px 16px 90px"}}>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          <button onClick={shareWhatsApp} disabled={sharing} style={{flex:1,padding:"13px",background:"#fff",color:"#16a34a",border:"2px solid #bbf7d0",borderRadius:14,fontWeight:800,cursor:sharing?"default":"pointer",fontFamily:"inherit",fontSize:13,opacity:sharing?.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <MessageCircle size={16}/> {sharing?"…":"Share to WhatsApp"}
          </button>
          <button onClick={downloadCSV} style={{flex:1,padding:"13px",background:"#fff",color:"#6366f1",border:"2px solid #e0e7ff",borderRadius:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
            <Download size={16}/> CSV
          </button>
        </div>

        <button onClick={()=>setAddOpen(true)} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.3)",display:"flex",alignItems:"center",justifyContent:"center",gap:7,marginBottom:18}}>
          <Plus size={16}/> Add Trip
        </button>

        {monthEntries.length===0&&(
          <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><Navigation size={40} strokeWidth={1.5}/></div>
            <div style={{fontWeight:800,fontSize:16,color:"#475569",marginBottom:6}}>No trips logged in {monthLabel(selMonth)}</div>
            <div style={{fontSize:13}}>Tap "Add Trip" to log your first one</div>
          </div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {monthEntries.map(t=>(
            <div key={t.id} style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:8}}>
                <div style={{fontSize:12,color:"#94a3b8",fontWeight:600,display:"flex",alignItems:"center",gap:5}}><Calendar size={12}/> {fmtDate(t.date)}</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setEditEntry(t)} style={{background:"#eef2ff",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Pencil size={13} color="#6366f1"/></button>
                  <button onClick={()=>onDelete(t.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={13} color="#ef4444"/></button>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8,fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:8}}>
                <span>{t.from}</span><ArrowRight size={15} color="#94a3b8"/><span>{t.to}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <span style={{fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,background:"#eef2ff",color:"#4338ca"}}>{t.purpose}</span>
                {t.notes&&<span style={{fontSize:12,color:"#94a3b8"}}>{t.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {addOpen&&<TravelEntryModal onSave={e=>{onAdd(e);setAddOpen(false);}} onClose={()=>setAddOpen(false)}/>}
      {editEntry&&<TravelEntryModal entry={editEntry} onSave={e=>{onEdit(e);setEditEntry(null);}} onClose={()=>setEditEntry(null)}/>}
    </div>
  );
}
