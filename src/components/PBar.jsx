export default function PBar({pct,color="#fff",bg="rgba(255,255,255,.25)",height=8}) {
  return(
    <div style={{background:bg,borderRadius:99,height,overflow:"hidden"}}>
      <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .7s ease"}}/>
    </div>
  );
}
