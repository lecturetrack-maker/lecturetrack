import { useState, useMemo } from "react";
import { Bell, User as UserIcon, FolderOpen, Plus, Clock, Star, BarChart3, ChevronUp, ChevronRight, Inbox, PartyPopper, CheckCircle2, AlertTriangle, MapPin } from "lucide-react";
import SubjectIcon from "../components/SubjectIcon";
import SyncBadge from "../components/SyncBadge";
import PBar from "../components/PBar";
import { BATCH_COLORS } from "../lib/constants";
import { fmtHours, todayStr, collectBatchLogs, monthKey, monthLabel, monthlyTotals, dailyTotals, batchTotals } from "../lib/helpers";
import { batchInfoMap } from "../lib/analytics";
import { getDailyMotivation } from "../lib/dailyMotivation";
import { NOTIFICATIONS, loadReadIds, saveReadIds } from "../lib/notifications";
import NotificationsPanel from "../components/NotificationsPanel";

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
  // Overall progress counts only hours that fall inside the allotment (extra hours never inflate it)
  const pctAllTime=batchTotals(batchChapters).pct;
  const motivation=getDailyMotivation(bannerTheme);

  // Bell notifications: unread count shown as a small red badge
  const [notifOpen,setNotifOpen]=useState(false);
  const [readIds,setReadIds]=useState(()=>loadReadIds(profile.code));
  const unreadCount=NOTIFICATIONS.filter(n=>!readIds.includes(n.id)).length;
  const markRead=id=>setReadIds(prev=>{ if(prev.includes(id)) return prev; const next=[...prev,id]; saveReadIds(profile.code,next); return next; });
  const markAllRead=()=>setReadIds(()=>{ const next=NOTIFICATIONS.map(n=>n.id); saveReadIds(profile.code,next); return next; });
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning":hr<17?"Good Afternoon":"Good Evening";
  const wave=hr<12?"☀️":hr<17?"🌤️":"🌙";
  const allBatches=[...new Set(batchChapters.map(c=>c.batchCode))].sort();
  // Only show currently running (not completed) batches on the front page
  const batches=allBatches.filter(b=>!completedBatches.includes(b));

  // Group the running batches by CENTRE (branch), then by YEAR the batch was added (newest first).
  // Batches with no centre fall under "No Centre".
  const [expandedCats,setExpandedCats]=useState({});
  const info=useMemo(()=>batchInfoMap(batchChapters),[batchChapters]);
  const categorized=useMemo(()=>{
    const map={};
    batches.forEach(b=>{
      const centre=info[b]?.centre||"No Centre";
      const year=info[b]?.year||new Date().getFullYear();
      if(!map[centre]) map[centre]={};
      if(!map[centre][year]) map[centre][year]=[];
      map[centre][year].push(b);
    });
    return Object.keys(map)
      .sort((a,b)=>a==="No Centre"?1:b==="No Centre"?-1:a.localeCompare(b))
      .map(centre=>({
        centre,
        count:Object.values(map[centre]).reduce((s,arr)=>s+arr.length,0),
        years:Object.keys(map[centre]).map(Number).sort((a,b)=>b-a).map(y=>({year:y,batches:map[centre][y]})),
      }));
  },[batches,info]);
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

  // "Hours Taken"/"Extra Hours" can show Today (default), Yesterday, or a picked month.
  // Allotted (Total) and Overall Progress stay all-time regardless — they describe
  // the whole scope of work, not a time window.
  const [hoursPeriod,setHoursPeriod]=useState("today"); // "today" | "yesterday" | "month"
  const yesterdayStr=useMemo(()=>{
    const d=new Date();
    d.setDate(d.getDate()-1);
    return d.toISOString().split("T")[0];
  },[]);
  const {periodTaken,periodExtra,periodLabel}=useMemo(()=>{
    if(hoursPeriod==="yesterday"){
      const {taken,extra}=dailyTotals(batchChapters,yesterdayStr);
      return {periodTaken:taken,periodExtra:extra,periodLabel:"Yesterday"};
    }
    if(hoursPeriod==="month"){
      return {periodTaken:monthTaken,periodExtra:monthExtra,periodLabel:monthLabel(selMonth)};
    }
    const {taken,extra}=dailyTotals(batchChapters,todayStr());
    return {periodTaken:taken,periodExtra:extra,periodLabel:"Today"};
  },[hoursPeriod,batchChapters,yesterdayStr,monthTaken,monthExtra,selMonth]);

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
            <button onClick={()=>setNotifOpen(true)} aria-label="Notifications" style={{position:"relative",width:38,height:38,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",border:"1.5px solid #e2e8f0",flexShrink:0,cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <Bell size={17} color="#4338ca" strokeWidth={2}/>
              {unreadCount>0&&<span style={{position:"absolute",top:-4,right:-4,minWidth:17,height:17,padding:"0 4px",borderRadius:99,background:"#ef4444",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #f8fafc",boxSizing:"content-box",lineHeight:1}}>{unreadCount>9?"9+":unreadCount}</span>}
            </button>
            <button onClick={onGoProfile} style={{width:38,height:38,borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"2px solid #e0e7ff",flexShrink:0,cursor:"pointer",padding:0}}>
              {profile.photo?<img src={profile.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<UserIcon size={17} color="#6366f1"/>}
            </button>
          </div>
        </div>
      </div>

      <div style={{margin:"0 16px 20px",background:BANNER_THEMES[bannerTheme]?.gradient||BANNER_THEMES[0].gradient,borderRadius:24,padding:"22px 20px",color:"#fff",boxShadow:`0 10px 30px ${BANNER_THEMES[bannerTheme]?.shadow||BANNER_THEMES[0].shadow}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{fontSize:12,opacity:.7,fontWeight:600}}>Overview</div>
            <div style={{fontSize:19,fontWeight:900}}>{periodLabel}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <div style={{display:"flex",background:"rgba(255,255,255,.15)",borderRadius:99,padding:3,gap:2}}>
              {[{key:"today",label:"Today"},{key:"yesterday",label:"Yesterday"}].map(opt=>(
                <button key={opt.key} onClick={()=>setHoursPeriod(opt.key)}
                  style={{background:hoursPeriod===opt.key?"#fff":"transparent",color:hoursPeriod===opt.key?"#4338ca":"#fff",border:"none",borderRadius:99,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                  {opt.label}
                </button>
              ))}
            </div>
            <select value={selMonth} onChange={e=>{setSelMonth(e.target.value);setHoursPeriod("month");}}
              style={{background:hoursPeriod==="month"?"rgba(255,255,255,.35)":"rgba(255,255,255,.2)",color:"#fff",border:"none",borderRadius:99,padding:"7px 14px",fontWeight:700,fontSize:12,fontFamily:"inherit",outline:"none"}}>
              {availableMonths.map(m=><option key={m} value={m} style={{color:"#0f172a"}}>{monthLabel(m)}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"12px 14px"}}>
            <div style={{marginBottom:4}}><Clock size={17} color="#fff" strokeWidth={2.2}/></div>
            <div style={{fontSize:17,fontWeight:900}}>{fmtHours(periodTaken)}</div>
            <div style={{fontSize:10,opacity:.75,fontWeight:600,marginTop:2}}>Hours Taken</div>
          </div>
          {/* Daily motivation: quote + emoji change every day, tile has its own colour, with a soft shine + twinkle animation */}
          <style>{`
            @keyframes ltShine{0%{transform:translateX(-130%) skewX(-20deg)}55%,100%{transform:translateX(330%) skewX(-20deg)}}
            @keyframes ltTwinkle{0%,100%{opacity:.15;transform:scale(.6) rotate(0deg)}50%{opacity:1;transform:scale(1.15) rotate(25deg)}}
            @keyframes ltPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}
            @media (prefers-reduced-motion: reduce){.lt-anim{animation:none!important}}
          `}</style>
          <div style={{position:"relative",overflow:"hidden",background:motivation.background,borderRadius:16,padding:"12px 14px",display:"flex",flexDirection:"column",justifyContent:"center",boxShadow:"0 4px 14px rgba(0,0,0,.18)"}}>
            <div className="lt-anim" style={{position:"absolute",top:0,bottom:0,left:0,width:"40%",background:"linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent)",animation:"ltShine 3.8s ease-in-out infinite",pointerEvents:"none"}}/>
            {[{top:6,right:10,size:11,delay:"0s"},{top:"48%",right:"14%",size:8,delay:"1.1s"},{bottom:8,left:"46%",size:9,delay:"2s"}].map((sp,i)=>(
              <span key={i} className="lt-anim" style={{position:"absolute",top:sp.top,bottom:sp.bottom,left:sp.left,right:sp.right,fontSize:sp.size,color:"#fff",animation:`ltTwinkle 2.4s ease-in-out ${sp.delay} infinite`,pointerEvents:"none"}}>✦</span>
            ))}
            <div className="lt-anim" style={{fontSize:20,lineHeight:1,marginBottom:6,display:"inline-block",transformOrigin:"left center",animation:"ltPulse 2.6s ease-in-out infinite",position:"relative"}}>{motivation.emoji}</div>
            <div style={{fontSize:11.5,fontWeight:800,lineHeight:1.35,position:"relative"}}>{motivation.quote}</div>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"12px 14px"}}>
            <div style={{marginBottom:4}}><Star size={17} color="#fff" strokeWidth={2.2}/></div>
            <div style={{fontSize:17,fontWeight:900}}>{fmtHours(periodExtra)}</div>
            <div style={{fontSize:10,opacity:.75,fontWeight:600,marginTop:2}}>Extra Hours</div>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"12px 14px"}}>
            <div style={{marginBottom:4}}><BarChart3 size={17} color="#fff" strokeWidth={2.2}/></div>
            <div style={{fontSize:17,fontWeight:900}}>{pctAllTime.toFixed(0)}%</div>
            <div style={{fontSize:10,opacity:.75,fontWeight:600,marginTop:2}}>Overall Progress</div>
          </div>
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
              {categorized.map(({centre:cat,count,years})=>{
                const open=!!expandedCats[cat];
                const CatIcon=cat==="No Centre"?FolderOpen:MapPin;
                return(
                  <div key={cat} style={{background:"#fff",borderRadius:16,boxShadow:"0 1px 8px rgba(0,0,0,.06)",overflow:"hidden"}}>
                    <div onClick={()=>toggleCat(cat)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:34,height:34,borderRadius:10,background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <CatIcon size={16} color="#6366f1"/>
                        </div>
                        <div>
                          <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{cat}</div>
                          <div style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{count} batch{count===1?"":"es"}{cat==="No Centre"?" · open a batch › Edit to set its centre":""}</div>
                        </div>
                      </div>
                      {open?<ChevronUp size={22} color="#64748b" strokeWidth={3}/>:<ChevronRight size={22} color="#64748b" strokeWidth={3}/>}
                    </div>
                    {open&&(
                      <div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:8}}>
                        {years.map(({year,batches:yearBatches})=>(
                          <div key={year} style={{display:"flex",flexDirection:"column",gap:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                              <span style={{fontSize:12,fontWeight:900,color:"#4338ca",background:"#eef2ff",borderRadius:99,padding:"3px 12px"}}>{year}</span>
                              <div style={{flex:1,height:1,background:"#e2e8f0"}}/>
                            </div>
                        {yearBatches.map(b=>{
                          const bc=BATCH_COLORS[allBatches.indexOf(b)%BATCH_COLORS.length];
                          const chs=batchChapters.filter(c=>c.batchCode===b);
                          const done=chs.reduce((s,c)=>s+c.completedHours,0);
                          const total=chs.reduce((s,c)=>s+c.totalHours,0);
                          const p=total>0?(done/total)*100:0;
                          // Chapter name(s) for this batch — shown in place of a bare
                          // chapter count so teachers can see at a glance what a batch covers.
                          const chapterNamesLabel=chs.map(c=>c.name).filter(Boolean).join(", ")||`${chs.length} chapter${chs.length===1?"":"s"}`;
                          // "Completed" now requires BOTH the allotted hours being fully
                          // used up AND every topic across the batch's chapters checked off.
                          // Hitting 100% of the allotted hours while topics remain unchecked
                          // is a distinct state — the hours ran out, not the chapter.
                          const hoursComplete=p>=100;
                          const allTopicsDone=chs.every(c=>(c.topics||[]).length===0||c.topics.every(t=>t.done));
                          const completed=hoursComplete&&allTopicsDone;
                          const topicsPending=hoursComplete&&!allTopicsDone;
                          return(
                            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",cursor:"pointer",borderLeft:`4px solid ${bc}`,display:"flex",alignItems:"center",gap:12}}>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,gap:8}}>
                                  <div style={{fontSize:17,fontWeight:900,color:bc}}>{b}</div>
                                  <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,background:completed?"#fef3c7":topicsPending?"#fee2e2":"#eef2ff",color:completed?"#b45309":topicsPending?"#b91c1c":"#4338ca",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>
                                    {completed?<CheckCircle2 size={11}/>:topicsPending?<AlertTriangle size={11}/>:<Clock size={11}/>}
                                    {completed?"Completed":topicsPending?"Topics Pending":"In Progress"}
                                  </span>
                                </div>
                                <div title={chapterNamesLabel} style={{fontSize:11,color:"#94a3b8",marginBottom:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{chapterNamesLabel}</div>
                                <PBar pct={p} color={bc} bg="#e2e8f0" height={5}/>
                                <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{p.toFixed(0)}% Progress</div>
                              </div>
                              <ChevronRight size={22} color="#64748b" strokeWidth={3}/>
                            </div>
                          );
                        })}
                          </div>
                        ))}
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
      {notifOpen&&<NotificationsPanel notifications={NOTIFICATIONS} readIds={readIds} onRead={markRead} onReadAll={markAllRead} onClose={()=>setNotifOpen(false)}/>}
    </div>
  );
}
