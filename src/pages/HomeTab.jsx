import { useState, useMemo } from "react";
import { Bell, User as UserIcon, FolderOpen, Plus, Clock, ClipboardList, Star, BarChart3, ChevronUp, ChevronRight, Inbox, PartyPopper, CheckCircle2 } from "lucide-react";
import SubjectIcon from "../components/SubjectIcon";
import SyncBadge from "../components/SyncBadge";
import PBar from "../components/PBar";
import { BATCH_COLORS, BATCH_CATEGORIES, CATEGORY_ICONS } from "../lib/constants";
import { fmtHours, todayStr, collectBatchLogs, monthKey, monthLabel, monthlyTotals } from "../lib/helpers";

// 3 color themes for the "This Month" hero card — App.jsx picks one at random
// each time the app is freshly opened (not on every tab switch) and passes it
// down as bannerTheme (0, 1, or 2).
const BANNER_THEMES=[
  {gradient:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6366f1 100%)",shadow:"rgba(79,70,229,.25)"},
  {gradient:"linear-gradient(135deg,#0d9488 0%,#059669 60%,#10b981 100%)",shadow:"rgba(5,150,105,.25)"},
  {gradient:"linear-gradient(135deg,#e11d48 0%,#f97316 60%,#f59e0b 100%)",shadow:"rgba(225,29,72,.25)"},
];

// Batches are grouped by category into collapsible sections; accepts completedBatches
// so the batch list on the front page only shows running batches.
export default function HomeTab({chapters,profile,onOpenChapter,onOpenBatch,syncStatus,onGoProfile,completedBatches=[],onAddBatch,bannerTheme=0}) {
  const batchChapters=chapters.filter(c=>c.batchCode);
  const totalAllotted=batchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalDoneAllTime=batchChapters.reduce((s,c)=>s+c.completedHours,0);
  const pctAllTime=totalAllotted>0?(totalDoneAllTime/totalAllotted)*100:0;
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning":hr<17?"Good Afternoon":"Good Evening";
  const wave=hr<12?"☀️":hr<17?"🌤️":"🌙";
  const allBatches=[...new Set(batchChapters.map(c=>c.batchCode))].sort();
  // Only show currently running (not completed) batches on the front page
  const batches=allBatches.filter(b=>!completedBatches.includes(b));

  // Group the running batches by category (falls back to "Others" for batches
  // created before categories existed, or that never got one)
  const [expandedCats,setExpandedCats]=useState({});
  const categorized=useMemo(()=>{
    const map={};
    batches.forEach(b=>{
      const chs=batchChapters.filter(c=>c.batchCode===b);
      const cat=chs.find(c=>c.batchCategory)?.batchCategory || "Others";
      if(!map[cat]) map[cat]=[];
      map[cat].push(b);
    });
    // Keep a stable, sensible order: known categories first (in BATCH_CATEGORIES order), then anything else
    const ordered=[];
    BATCH_CATEGORIES.forEach(cat=>{ if(map[cat]) ordered.push([cat,map[cat]]); });
    Object.keys(map).forEach(cat=>{ if(!BATCH_CATEGORIES.includes(cat)) ordered.push([cat,map[cat]]); });
    return ordered;
  },[batches,batchChapters]);
  const toggleCat=cat=>setExpandedCats(prev=>({...prev,[cat]:!prev[cat]}));

  // Monthly hours-taken view — data already existed per chapter (hourLogs), just aggregated here
  const allLogs=useMemo(()=>collectBatchLogs(batchChapters),[batchChapters]);
  const availableMonths=useMemo(()=>{
    const set=new Set(allLogs.map(l=>monthKey(l.date)));
    set.add(monthKey(todayStr()));
    return [...set].sort().reverse();
  },[allLogs]);
  const [selMonth,setSelMonth]=useState(monthKey(todayStr()));
  const {taken:monthTaken,extra:monthExtra}=useMemo(()=>monthlyTotals(batchChapters,selMonth),[batchChapters,selMonth]);

  return(
    <div style={{padding:"0 0 20px"}}>
      <div style={{padding:"20px 16px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:19,fontWeight:900,color:"#0f172a"}}>{gw}, {profile.code} {wave}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>{profile.name} · <SubjectIcon subject={profile.subject} size={13} color="#94a3b8"/> {profile.subject||"Teacher"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {syncStatus&&<SyncBadge status={syncStatus}/>}
            <button style={{width:38,height:38,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",border:"1.5px solid #e2e8f0",flexShrink:0,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <Bell size={17} color="#4338ca" strokeWidth={2}/>
            </button>
            <button onClick={onGoProfile} style={{width:38,height:38,borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"2px solid #e0e7ff",flexShrink:0,cursor:"pointer",padding:0}}>
              {profile.photo?<img src={profile.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<UserIcon size={17} color="#6366f1"/>}
            </button>
          </div>
        </div>
      </div>

      <div style={{margin:"0 16px 20px",background:BANNER_THEMES[bannerTheme]?.gradient||BANNER_THEMES[0].gradient,borderRadius:24,padding:"22px 20px",color:"#fff",boxShadow:`0 10px 30px ${BANNER_THEMES[bannerTheme]?.shadow||BANNER_THEMES[0].shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:12,opacity:.7,fontWeight:600}}>Overview</div>
            <div style={{fontSize:19,fontWeight:900}}>This Month</div>
          </div>
          <select value={selMonth} onChange={e=>setSelMonth(e.target.value)}
            style={{background:"rgba(255,255,255,.2)",color:"#fff",border:"none",borderRadius:99,padding:"7px 14px",fontWeight:700,fontSize:12,fontFamily:"inherit",outline:"none"}}>
            {availableMonths.map(m=><option key={m} value={m} style={{color:"#0f172a"}}>{monthLabel(m)}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {label:"Hours Taken",val:fmtHours(monthTaken),Icon:Clock},
            {label:"Allotted (Total)",val:fmtHours(totalAllotted),Icon:ClipboardList},
            {label:"Extra Hours",val:fmtHours(monthExtra),Icon:Star},
            {label:"Overall Progress",val:pctAllTime.toFixed(0)+"%",Icon:BarChart3},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"12px 14px"}}>
              <div style={{marginBottom:4}}><s.Icon size={17} color="#fff" strokeWidth={2.2}/></div>
              <div style={{fontSize:17,fontWeight:900}}>{s.val}</div>
              <div style={{fontSize:10,opacity:.75,fontWeight:600,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <PBar pct={pctAllTime}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,opacity:.8,fontWeight:600}}>
          <span>{batchChapters.length} chapters · {batches.length} batches</span>
          <span>{pctAllTime.toFixed(0)}% completed</span>
        </div>
      </div>

      <div style={{padding:"0 16px"}}>
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",display:"flex",alignItems:"center",gap:6}}><FolderOpen size={15} color="#0f172a"/> Your Batches</div>
            <button onClick={onAddBatch} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"9px 16px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:12,boxShadow:"0 4px 12px rgba(99,102,241,.3)",display:"flex",alignItems:"center",gap:6}}><Plus size={14} strokeWidth={2.8}/> New Batch</button>
          </div>

          {categorized.length>0&&(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {categorized.map(([cat,catBatches])=>{
                const open=!!expandedCats[cat];
                const CatIcon=CATEGORY_ICONS[cat]||FolderOpen;
                return(
                  <div key={cat} style={{background:"#fff",borderRadius:16,boxShadow:"0 1px 8px rgba(0,0,0,.06)",overflow:"hidden"}}>
                    <div onClick={()=>toggleCat(cat)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,borderRadius:10,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <CatIcon size={16} color="#6366f1"/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{cat}</div>
                          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{catBatches.length} batch{catBatches.length===1?"":"es"}</div>
                        </div>
                      </div>
                      {open?<ChevronUp size={22} color="#64748b" strokeWidth={3}/>:<ChevronRight size={22} color="#64748b" strokeWidth={3}/>}
                    </div>
                    {open&&(
                      <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
                        {catBatches.map(b=>{
                          const bc=BATCH_COLORS[allBatches.indexOf(b)%BATCH_COLORS.length];
                          const chs=batchChapters.filter(c=>c.batchCode===b);
                          const done=chs.reduce((s,c)=>s+c.completedHours,0);
                          const total=chs.reduce((s,c)=>s+c.totalHours,0);
                          const p=total>0?(done/total)*100:0;
                          const completed=p>=100;
                          return(
                            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",cursor:"pointer",borderLeft:`4px solid ${bc}`,display:"flex",alignItems:"center",gap:12}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,gap:8}}>
                                  <div style={{fontSize:17,fontWeight:900,color:bc}}>{b}</div>
                                  <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,background:completed?"#fef3c7":"#eef2ff",color:completed?"#b45309":"#4338ca",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>{completed?<CheckCircle2 size={11}/>:<Clock size={11}/>}{completed?"Completed":"In Progress"}</span>
                                </div>
                                <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>{chs.length} chapters</div>
                                <div style={{background:"#e2e8f0",borderRadius:99,height:5}}>
                                  <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:bc,borderRadius:99}}/>
                                </div>
                                <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{p.toFixed(0)}% Progress</div>
                              </div>
                              <ChevronRight size={22} color="#64748b" strokeWidth={3}/>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {batchChapters.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
            <div style={{marginBottom:16,display:"flex",justifyContent:"center"}}><Inbox size={48} strokeWidth={1.5}/></div>
            <div style={{fontWeight:800,fontSize:18,color:"#475569",marginBottom:8}}>No batches yet</div>
            <div style={{fontSize:14}}>Tap "New Batch" above to add your first one</div>
          </div>
        )}

        {batchChapters.length>0&&batches.length===0&&(
          <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
            <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}><PartyPopper size={42} strokeWidth={1.5}/></div>
            <div style={{fontWeight:800,fontSize:16,color:"#475569",marginBottom:6}}>All batches completed!</div>
            <div style={{fontSize:13}}>Check the Batches tab to view or reopen them</div>
          </div>
        )}
      </div>
    </div>
  );
}
