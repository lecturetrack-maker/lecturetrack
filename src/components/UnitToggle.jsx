import { Clock, Hourglass } from "lucide-react";

// Compact, segmented-control-style toggle for choosing Hours vs Minutes when logging
// time — smaller and more "switch-like" than a full-width button pair.
export default function UnitToggle({unit,onChange,activeColor="#6366f1",trackBg="#f1f5f9",activeBg="#fff"}) {
  return(
    <div style={{display:"inline-flex",background:trackBg,borderRadius:99,padding:3,gap:2,flexShrink:0}}>
      {["hours","minutes"].map(u=>(
        <button key={u} onClick={()=>onChange(u)} type="button"
          style={{
            display:"flex",alignItems:"center",gap:4,
            padding:"5px 10px",borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",
            background:unit===u?activeBg:"transparent",
            color:unit===u?activeColor:"#94a3b8",
            fontWeight:700,fontSize:11,
            boxShadow:unit===u?"0 1px 4px rgba(0,0,0,.15)":"none",
            transition:"all .15s"
          }}>
          {u==="hours"?<Clock size={11}/>:<Hourglass size={11}/>}
          {u==="hours"?"Hrs":"Min"}
        </button>
      ))}
    </div>
  );
}
