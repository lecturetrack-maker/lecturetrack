import { Cloud, CloudUpload, CloudOff } from "lucide-react";

export default function SyncBadge({status}) {
  const cfg={
    saving:{bg:"#eef2ff",color:"#6366f1",text:"Saving...",Icon:CloudUpload},
    saved:{bg:"#dcfce7",color:"#16a34a",text:"Saved",Icon:Cloud},
    error:{bg:"#fee2e2",color:"#dc2626",text:"Failed",Icon:CloudOff},
  }[status];
  if(!cfg) return null;
  const {Icon}=cfg;
  return (
    <div style={{background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}>
      <Icon size={13} strokeWidth={2.4}/>{cfg.text}
    </div>
  );
}
