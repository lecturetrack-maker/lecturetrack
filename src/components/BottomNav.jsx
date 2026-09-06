import { Home as HomeIcon, FolderKanban, BookOpen, User as UserIcon } from "lucide-react";

export default function BottomNav({active,onChange}) {
  const tabs=[
    {id:"home",Icon:HomeIcon,label:"Home"},
    {id:"batches",Icon:FolderKanban,label:"Batches"},
    {id:"chapters",Icon:BookOpen,label:"Chapters"},
    {id:"profile",Icon:UserIcon,label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #f1f5f9",display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(0,0,0,.08)"}}>
      {tabs.map(t=>{
        const isActive=active===t.id;
        const {Icon}=t;
        return(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:40,height:28,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:isActive?"#eef2ff":"transparent",transition:"background .2s"}}>
              <Icon size={20} strokeWidth={isActive?2.4:2} color={isActive?"#6366f1":"#94a3b8"} fill={isActive?"#6366f1":"none"} fillOpacity={isActive?0.12:0}/>
            </div>
            <div style={{fontSize:10,fontWeight:isActive?800:600,color:isActive?"#6366f1":"#94a3b8"}}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}
