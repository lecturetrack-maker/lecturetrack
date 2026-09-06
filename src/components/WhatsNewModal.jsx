import { useState } from "react";
import { Plane, Calendar, BarChart3, MessageCircle } from "lucide-react";

export default function WhatsNewModal({onClose,onDontShowAgain}) {
  const [dontShow,setDontShow]=useState(false);
  return(
    <div onClick={()=>{ if(dontShow) onDontShowAgain(); else onClose(); }}
      style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:400,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
        <div style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",padding:"28px 24px 24px",color:"#fff",textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}}>
            <Plane size={28} color="#fff"/>
          </div>
          <div style={{fontSize:12,fontWeight:800,opacity:.8,letterSpacing:1,marginBottom:4}}>WHAT'S NEW</div>
          <div style={{fontSize:20,fontWeight:900}}>Travel Details is here</div>
        </div>
        <div style={{padding:"22px 24px"}}>
          <p style={{margin:"0 0 16px",fontSize:14,color:"#475569",lineHeight:1.6}}>
            You can now log your travel to and from class — so your travel allowance can be worked out easily.
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {[
              {Icon:Calendar,text:"Log date, from/to places, and purpose (Foundation Class, Repeaters, etc.)"},
              {Icon:BarChart3,text:"Filter your trips by month"},
              {Icon:MessageCircle,text:"Share as a WhatsApp image or download as CSV"},
            ].map((f,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:28,height:28,borderRadius:9,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                  <f.Icon size={14} color="#6366f1"/>
                </div>
                <div style={{fontSize:13,color:"#334155",lineHeight:1.5,paddingTop:4}}>{f.text}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Find it under <strong style={{color:"#475569"}}>Profile → Travel Details</strong>.</div>
          <label style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,cursor:"pointer"}}>
            <input type="checkbox" checked={dontShow} onChange={e=>setDontShow(e.target.checked)} style={{width:16,height:16,accentColor:"#6366f1",cursor:"pointer"}}/>
            <span style={{fontSize:13,color:"#64748b",fontWeight:600}}>Don't show this again</span>
          </label>
          <button onClick={()=>{ if(dontShow) onDontShowAgain(); else onClose(); }}
            style={{width:"100%",padding:14,background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 6px 20px rgba(99,102,241,.3)"}}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
