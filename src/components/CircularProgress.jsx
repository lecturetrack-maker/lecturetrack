export default function CircularProgress({pct,size=112,strokeWidth=10,trackColor="rgba(255,255,255,.18)",progressColor="#34d399",label,sublabel}) {
  const r=(size-strokeWidth)/2;
  const c=2*Math.PI*r;
  const offset=c-(Math.min(pct,100)/100)*c;
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={progressColor} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{transition:"stroke-dashoffset .7s ease"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:size*0.24,fontWeight:900,color:"#fff",lineHeight:1}}>{label}</div>
        {sublabel&&<div style={{fontSize:size*0.085,fontWeight:600,color:"rgba(255,255,255,.75)",marginTop:4,textAlign:"center"}}>{sublabel}</div>}
      </div>
    </div>
  );
}
