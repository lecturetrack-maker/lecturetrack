import { PartyPopper, Trophy, Lightbulb } from "lucide-react";
import { MOTIVATIONAL_QUOTES } from "../lib/constants";
import { fmtHours } from "../lib/helpers";
import SubjectIcon from "./SubjectIcon";

export default function CongratsScreen({profile,totalHours,onClose}) {
  const quote=MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)];
  return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#6366f1,#4338ca)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",overflowY:"auto"}}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}} .bounce{animation:bounce 1s ease infinite}`}</style>
      <div className="bounce" style={{marginBottom:10}}><PartyPopper size={64} color="#fde68a" strokeWidth={1.6}/></div>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:8}}>Congratulations!</div>
      <div style={{fontSize:18,fontWeight:700,color:"rgba(255,255,255,.9)",marginBottom:4}}>{profile.code}</div>
      {profile.subject&&<div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><SubjectIcon subject={profile.subject} size={14} color="rgba(255,255,255,.7)"/> {profile.subject} Teacher</div>}
      <div style={{fontSize:15,color:"rgba(255,255,255,.7)",marginBottom:28,display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap"}}>You've completed <strong style={{color:"#fde68a"}}>{fmtHours(totalHours)}</strong> of lectures! <Trophy size={16} color="#fde68a"/></div>
      <div style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"22px 26px",maxWidth:340,marginBottom:30,backdropFilter:"blur(10px)"}}>
        <div style={{marginBottom:12}}><Lightbulb size={30} color="#fde68a" strokeWidth={1.8}/></div>
        <div style={{fontSize:15,color:"#fff",fontWeight:600,lineHeight:1.8}}>{quote}</div>
      </div>
      <button onClick={onClose} style={{background:"#fff",color:"#6366f1",border:"none",borderRadius:16,padding:"14px 44px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
        Continue Teaching →
      </button>
    </div>
  );
}
