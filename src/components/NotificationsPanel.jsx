import { useState } from "react";
import { X, Bell, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";

// Bottom-sheet list of in-app messages. Opening a message marks it as read.
export default function NotificationsPanel({notifications,readIds,onRead,onReadAll,onClose}) {
  const [openId,setOpenId]=useState(null);
  const unread=notifications.filter(n=>!readIds.includes(n.id)).length;
  const toggle=n=>{
    setOpenId(prev=>prev===n.id?null:n.id);
    if(!readIds.includes(n.id)) onRead(n.id);
  };
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:450,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#f8fafc",width:"100%",maxWidth:560,maxHeight:"85vh",borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",boxShadow:"0 -12px 40px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px 12px"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:17,fontWeight:900,color:"#0f172a"}}>
            <Bell size={18} color="#4338ca"/> Notifications
            {unread>0&&<span style={{fontSize:11,fontWeight:800,color:"#fff",background:"#ef4444",borderRadius:99,padding:"2px 8px"}}>{unread} new</span>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{width:34,height:34,borderRadius:"50%",border:"none",background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color="#475569"/></button>
        </div>
        {unread>0&&(
          <button onClick={onReadAll} style={{alignSelf:"flex-end",margin:"0 20px 8px",background:"none",border:"none",color:"#4338ca",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            <CheckCheck size={14}/> Mark all as read
          </button>
        )}
        <div style={{overflowY:"auto",padding:"0 16px 24px",display:"flex",flexDirection:"column",gap:10}}>
          {notifications.length===0&&<div style={{textAlign:"center",color:"#94a3b8",padding:"40px 0",fontSize:14}}>No messages yet</div>}
          {notifications.map(n=>{
            const isUnread=!readIds.includes(n.id);
            const open=openId===n.id;
            return(
              <div key={n.id} style={{background:"#fff",borderRadius:16,border:`1.5px solid ${isUnread?"#c7d2fe":"#e2e8f0"}`,boxShadow:isUnread?"0 4px 14px rgba(99,102,241,.12)":"none",overflow:"hidden"}}>
                <div onClick={()=>toggle(n)} style={{display:"flex",gap:10,padding:"14px 16px",cursor:"pointer",alignItems:"flex-start"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:isUnread?"#ef4444":"transparent",marginTop:6,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                      <div style={{fontSize:14,fontWeight:isUnread?900:700,color:"#0f172a"}}>{n.title}</div>
                      <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,whiteSpace:"nowrap"}}>{n.date}</div>
                    </div>
                    <div style={{fontSize:12.5,color:"#64748b",lineHeight:1.5,marginTop:3}}>{n.text}</div>
                  </div>
                  {n.items?.length>0&&(open?<ChevronUp size={18} color="#94a3b8"/>:<ChevronDown size={18} color="#94a3b8"/>)}
                </div>
                {open&&n.items?.length>0&&(
                  <div style={{padding:"0 16px 16px 35px",display:"flex",flexDirection:"column",gap:12}}>
                    {n.items.map((f,i)=>(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                        <div style={{width:28,height:28,borderRadius:9,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <f.Icon size={14} color="#6366f1"/>
                        </div>
                        <div>
                          <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{f.title}</div>
                          <div style={{fontSize:12.5,color:"#475569",lineHeight:1.5,marginTop:2}}>{f.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
