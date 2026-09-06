// Quick-pick chips (e.g. 0.5h / 1h / 1.5h ...) so most log entries can be a single
// tap instead of typing a number — the manual input alongside this still works for anything custom.
const PRESET_HOURS=[0.5,1,1.5,2,2.5,3];
const PRESET_MINUTES=[10,15,20,30,45,60];

export default function PresetChips({unit,onPick,color}) {
  const opts=unit==="minutes"?PRESET_MINUTES:PRESET_HOURS;
  return(
    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:10,paddingBottom:2}}>
      {opts.map(v=>(
        <button key={v} type="button" onClick={()=>onPick(v)}
          style={{flexShrink:0,padding:"7px 13px",borderRadius:10,border:`1.5px solid ${color}33`,background:`${color}0f`,color,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
          {unit==="minutes"?`${v}m`:`${v}h`}
        </button>
      ))}
    </div>
  );
}
