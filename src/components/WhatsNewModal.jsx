import { Sparkles, MapPin, Pencil, BarChart3, FileSpreadsheet, Calculator, Smile } from "lucide-react";

// "What's New" announcement. Shown once per version (WHATS_NEW_ID in lib/constants.js);
// "Don't show again" hides it for good, "Got it" only closes it for this session.
const ITEMS=[
  {Icon:MapPin,title:"Batches grouped by centre & year",text:"Home now groups your batches by centre (branch), then by year. Older batches show under “No Centre” until you set one."},
  {Icon:Pencil,title:"Edit your batches",text:"Open a batch and tap Edit. Batch name, teacher, category, chapters and allotted hours are all filled in. You only need to choose the centre."},
  {Icon:BarChart3,title:"Weekly, monthly & yearly reports",text:"Profile → hours graphs: switch between days of the week, weeks of a month, and months of a year."},
  {Icon:FileSpreadsheet,title:"Excel report",text:"Profile → Download Excel Report: date-wise, monthly and yearly hours by batch and centre."},
  {Icon:Calculator,title:"Hours fixed",text:"Taken, extra and remaining hours are recalculated chapter by chapter. Totals above 24 hours (like 214:50) now show correctly."},
  {Icon:Smile,title:"Daily motivation",text:"A fresh quote and smile on your Home banner every day."},
];

export default function WhatsNewModal({onClose,onDontShowAgain}) {
  return(
    <div onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:24,width:"100%",maxWidth:400,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
        <div style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",padding:"24px 24px 20px",color:"#fff",textAlign:"center",flexShrink:0}}>
          <div style={{width:50,height:50,borderRadius:14,background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px"}}>
            <Sparkles size={26} color="#fff"/>
          </div>
          <div style={{fontSize:12,fontWeight:800,opacity:.8,letterSpacing:1,marginBottom:4}}>WHAT'S NEW</div>
          <div style={{fontSize:19,fontWeight:900}}>LectureTrack just got better</div>
        </div>
        <div style={{padding:"18px 22px 0",overflowY:"auto",flex:1}}>
          <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:14}}>
            {ITEMS.map((f,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <div style={{width:30,height:30,borderRadius:9,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <f.Icon size={15} color="#6366f1"/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:"#0f172a"}}>{f.title}</div>
                  <div style={{fontSize:12.5,color:"#475569",lineHeight:1.5,marginTop:2}}>{f.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:"12px 22px 20px",display:"flex",flexDirection:"column",gap:8,flexShrink:0,borderTop:"1px solid #f1f5f9"}}>
          <button onClick={onClose}
            style={{width:"100%",padding:13,background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 6px 20px rgba(99,102,241,.3)"}}>
            Got it
          </button>
          <button onClick={onDontShowAgain}
            style={{width:"100%",padding:11,background:"#f1f5f9",color:"#64748b",border:"none",borderRadius:14,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            Don't show this again
          </button>
        </div>
      </div>
    </div>
  );
}
