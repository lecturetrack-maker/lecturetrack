import { GraduationCap } from "lucide-react";

export default function SplashScreen() {
  return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#6366f1 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <style>{`
        @keyframes popIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes slideUp{0%{transform:translateY(30px);opacity:0}100%{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .splash-icon{animation:popIn .6s cubic-bezier(.175,.885,.32,1.275) forwards}
        .splash-title{animation:slideUp .5s ease .3s both}
        .splash-sub{animation:slideUp .5s ease .5s both}
        .splash-dot{animation:pulse 1.2s ease .8s infinite}
      `}</style>
      <div className="splash-icon" style={{width:96,height:96,borderRadius:26,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
        <GraduationCap size={52} color="#fff" strokeWidth={1.8}/>
      </div>
      <div className="splash-title" style={{fontSize:36,fontWeight:900,color:"#fff",letterSpacing:"-1px",marginBottom:6}}>LectureTrack</div>
      <div className="splash-sub" style={{fontSize:15,color:"rgba(255,255,255,.7)",fontWeight:600,marginBottom:40}}>Track every hour. Teach with clarity.</div>
      <div className="splash-dot" style={{width:8,height:8,background:"rgba(255,255,255,.6)",borderRadius:"50%"}}/>
    </div>
  );
}
