export default function PBar({pct,color="#fff",bg="rgba(255,255,255,.25)",height=8,overflowColor="#ef4444"}) {
  // When pct exceeds 100 (hours logged beyond a chapter's allotted total — i.e. "extra"
  // hours), the bar's total scale stretches to include that overflow and renders it as a
  // second, differently-colored segment. This lets a teacher tell "hours done" apart from
  // "hours done AND extra hours were needed beyond what was allotted" at a glance.
  // For pct<=100 this renders byte-for-byte the same as before (single segment, no overflow).
  const base=Math.min(pct,100);
  const overflow=Math.max(0,pct-100);
  const scale=(base+overflow)||100; // avoid divide-by-zero when pct is 0
  return(
    <div style={{background:bg,borderRadius:99,height,overflow:"hidden",display:"flex"}}>
      <div style={{width:`${(base/scale)*100}%`,height:"100%",background:color,transition:"width .7s ease"}}/>
      {overflow>0&&<div style={{width:`${(overflow/scale)*100}%`,height:"100%",background:overflowColor,transition:"width .7s ease"}}/>}
    </div>
  );
}
