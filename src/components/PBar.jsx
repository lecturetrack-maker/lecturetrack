export default function PBar({pct,color="#fff",bg="rgba(255,255,255,.25)",height=8,overflowColor="#ef4444"}) {
  // When pct exceeds 100 (hours logged beyond a chapter's allotted total — i.e. "extra"
  // hours), the bar's total scale stretches to include that overflow and renders it as a
  // second, differently-colored segment. This lets a teacher tell "hours done" apart from
  // "hours done AND extra hours were needed beyond what was allotted" at a glance.
  // For pct<=100 this renders the same as a plain single-segment bar (scale stays 100).
  const safePct=Number.isFinite(pct)?pct:0;
  const base=Math.min(safePct,100);
  const overflow=Math.max(0,safePct-100);
  const scale=Math.max(safePct,100); // 100 when pct<=100, otherwise pct itself
  return(
    <div style={{background:bg,borderRadius:99,height,overflow:"hidden",display:"flex"}}>
      <div style={{width:`${(base/scale)*100}%`,height:"100%",background:color,transition:"width .7s ease"}}/>
      {overflow>0&&<div style={{width:`${(overflow/scale)*100}%`,height:"100%",background:overflowColor,transition:"width .7s ease"}}/>}
    </div>
  );
}

