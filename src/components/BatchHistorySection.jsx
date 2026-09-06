import { useState, useMemo } from "react";
import { Calendar, ChevronUp, ChevronDown } from "lucide-react";
import { collectBatchLogs, monthKey, monthLabel, todayStr, fmtHours, fmtDate } from "../lib/helpers";

export default function BatchHistorySection({batchCode,color,chapters}) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const remaining=Math.max(0,total-done);
  const allLogs=useMemo(()=>collectBatchLogs(chapters),[chapters]);
  const availableMonths=useMemo(()=>{
    const set=new Set(allLogs.map(l=>monthKey(l.date)));
    set.add(monthKey(todayStr()));
    return [...set].sort().reverse();
  },[allLogs]);
  const [selMonth,setSelMonth]=useState(availableMonths[0]);
  const [expandedWeek,setExpandedWeek]=useState(null);

  const monthLogs=useMemo(()=>allLogs.filter(l=>monthKey(l.date)===selMonth),[allLogs,selMonth]);
  const monthTaken=monthLogs.reduce((s,l)=>s+l.hours,0);
  const monthExtra=monthLogs.reduce((s,l)=>s+(l.extraAmount||0),0);

  const weeks=useMemo(()=>{
    const map={};
    monthLogs.forEach(l=>{
      const dt=new Date(l.date);
      const day=dt.getDay();
      const start=new Date(dt); start.setDate(dt.getDate()-day);
      const key=start.toISOString().split("T")[0];
      if(!map[key]) map[key]={total:0,dates:{}};
      map[key].total+=l.hours;
      map[key].dates[l.date]=(map[key].dates[l.date]||0)+l.hours;
    });
    return Object.entries(map).sort((a,b)=>new Date(b[0])-new Date(a[0]));
  },[monthLogs]);

  if(allLogs.length===0) return null;

  return(
    <div style={{background:"#fff",borderRadius:20,padding:18,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:7}}><Calendar size={16}/> Hours History</div>
        <select value={selMonth} onChange={e=>setSelMonth(e.target.value)}
          style={{background:"#f1f5f9",border:"none",borderRadius:99,padding:"6px 12px",fontWeight:700,fontSize:12,fontFamily:"inherit",outline:"none",color:"#475569"}}>
          {availableMonths.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[{l:"Taken",v:fmtHours(monthTaken),c:"#10b981"},{l:"Extra",v:fmtHours(monthExtra),c:"#f59e0b"},{l:"Remaining",v:fmtHours(remaining),c:"#ef4444"}].map(s=>(
          <div key={s.l} style={{background:`${s.c}0f`,borderRadius:12,padding:"10px 6px",textAlign:"center",border:`1.5px solid ${s.c}22`}}>
            <div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div>
            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.l}</div>
          </div>
        ))}
      </div>
      {weeks.length===0&&<div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:13}}>No hours logged in {monthLabel(selMonth)}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {weeks.map(([weekStart,data])=>{
          const open=expandedWeek===weekStart;
          const dates=Object.entries(data.dates).sort((a,b)=>new Date(b[0])-new Date(a[0]));
          return(
            <div key={weekStart} style={{border:"1.5px solid #f1f5f9",borderRadius:12,overflow:"hidden"}}>
              <div onClick={()=>setExpandedWeek(open?null:weekStart)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",cursor:"pointer",background:"#f8fafc"}}>
                <span style={{fontSize:12,fontWeight:700,color:"#475569"}}>Week of {fmtDate(weekStart)}</span>
                <span style={{fontSize:12,fontWeight:800,color,display:"flex",alignItems:"center",gap:4}}>{fmtHours(data.total)} {open?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</span>
              </div>
              {open&&(
                <div style={{padding:"6px 12px 10px"}}>
                  {dates.map(([date,hrs])=>(
                    <div key={date} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",fontSize:12,color:"#64748b",borderBottom:"1px solid #f8fafc"}}>
                      <span>{fmtDate(date)}</span>
                      <span style={{fontWeight:700,color:"#0f172a"}}>{fmtHours(hrs)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
