import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Home as HomeIcon, FolderKanban, BookOpen, User as UserIcon, Bell } from "lucide-react";

const supabase = createClient(
  "https://ddfmkfkvvadzlihiulnj.supabase.co",
  "sb_publishable_CX_sPadRs8lkJZ2pHyQuZw_vHA_D4P6"
);

// ── Chapter Database ──────────────────────────────────────────────
const CHAPTER_DB = {
  Physics: ["Physical World & Measurement","Kinematics","Laws of Motion","Work, Energy & Power","Motion of System of Particles","Gravitation","Properties of Bulk Matter","Thermodynamics","Behaviour of Perfect Gas & Kinetic Theory","Oscillations","Waves","Electrostatics","Current Electricity","Magnetic Effects of Current","Magnetism & Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature of Radiation","Atoms","Nuclei","Electronic Devices","Communication Systems","Units & Dimensions","Motion in a Straight Line","Motion in a Plane","Circular Motion","Rotational Motion","Fluid Mechanics","Thermal Properties of Matter","Electric Charges & Fields","Electric Potential & Capacitance","Moving Charges & Magnetism","Semiconductor Electronics"],
  Chemistry: ["Some Basic Concepts of Chemistry","Structure of Atom","Classification of Elements","Chemical Bonding","States of Matter","Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","s-Block Elements","p-Block Elements","Organic Chemistry – Basic Principles","Hydrocarbons","Environmental Chemistry","Solid State","Solutions","Electrochemistry","Chemical Kinetics","Surface Chemistry","General Principles of Isolation","d & f Block Elements","Coordination Compounds","Haloalkanes & Haloarenes","Alcohols, Phenols & Ethers","Aldehydes, Ketones & Carboxylic Acids","Amines","Biomolecules","Polymers","Chemistry in Everyday Life","Mole Concept","Stoichiometry","Periodic Table","Ionic Equilibrium","Atomic Structure","Nuclear Chemistry"],
  Biology: ["The Living World","Biological Classification","Plant Kingdom","Animal Kingdom","Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals","Cell: The Unit of Life","Biomolecules","Cell Cycle & Cell Division","Transport in Plants","Mineral Nutrition","Photosynthesis","Respiration in Plants","Plant Growth & Development","Digestion & Absorption","Breathing & Exchange of Gases","Body Fluids & Circulation","Excretory Products","Locomotion & Movement","Neural Control & Coordination","Chemical Coordination","Reproduction in Organisms","Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Principles of Inheritance","Molecular Basis of Inheritance","Evolution","Human Health & Disease","Strategies for Enhancement","Microbes in Human Welfare","Biotechnology: Principles","Biotechnology Applications","Organisms & Populations","Ecosystem","Biodiversity","Environmental Issues"],
  Mathematics: ["Sets","Relations & Functions","Trigonometric Functions","Principle of Mathematical Induction","Complex Numbers","Linear Inequalities","Permutations & Combinations","Binomial Theorem","Sequences & Series","Straight Lines","Conic Sections","3D Geometry – Introduction","Limits & Derivatives","Mathematical Reasoning","Statistics","Probability","Inverse Trigonometric Functions","Matrices","Determinants","Continuity & Differentiability","Application of Derivatives","Integrals","Application of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Bayes Theorem","Relations & Functions (XII)","Calculus","Coordinate Geometry","Algebra","Number Theory","Trigonometry"],
};
const ALL_CHAPTERS = [...new Set(Object.values(CHAPTER_DB).flat())].sort();

// ── Helpers ───────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2,9); }

function fmtHours(h) {
  if (!h && h!==0) return "0h";
  const hrs=Math.floor(h), mins=Math.round((h-hrs)*60);
  if (mins===0) return `${hrs}h`;
  if (hrs===0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

function parseHours(val) {
  if (!val) return 0;
  const str=String(val).trim();
  const hm=str.match(/^(\d+)h\s*(\d+)m$/i);
  if (hm) return parseFloat(hm[1])+parseFloat(hm[2])/60;
  const hOnly=str.match(/^(\d+\.?\d*)h$/i);
  if (hOnly) return parseFloat(hOnly[1]);
  const mOnly=str.match(/^(\d+)m$/i);
  if (mOnly) return parseFloat(mOnly[1])/60;
  const n=parseFloat(str);
  return isNaN(n)?0:n;
}

function roundToMinute(h) { return Math.round(h*60)/60; }

function getStatus(completed,total) {
  if (!total) return "none";
  const p=(completed/total)*100;
  if (p>100) return "exceeded";
  if (p>=80) return "warning";
  return "ok";
}

const STATUS = {
  ok:      {color:"#10b981",label:"On Track"},
  warning: {color:"#f59e0b",label:"Near Limit"},
  exceeded:{color:"#ef4444",label:"Exceeded"},
  none:    {color:"#94a3b8",label:"Not Started"},
};

const BATCH_COLORS=["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4"];

const MOTIVATIONAL_QUOTES=[
  "100 hours of dedication — you are a true legend! 🌟",
  "Every hour you teach lights up a student's future! 💡",
  "Great teachers don't just teach subjects — they build dreams! 🚀",
  "100 hours down — countless lives changed forever! 🔥",
  "Your dedication inspires more than you will ever know! 💪",
  "The best investment in a student's future is a teacher like you! 🏆",
  "Toppers always remember their favourite teacher! 👑",
  "You didn't just teach — you transformed futures! 🌈",
  "100 hours of passion, patience and purpose! Incredible! 🎯",
  "Behind every successful student is a dedicated teacher like you! ❤️",
];

const SUBJECT_EMOJI={"Physics":"⚡","Chemistry":"🧪","Biology":"🧬","Mathematics":"📐","Multiple Subjects":"📚"};

function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

function buildCSV(chapters) {
  const rows=[["Batch","Chapter","Allotted","Taken","Extra","Remaining","Progress %"]];
  chapters.forEach(c=>{
    const rem=Math.max(0,c.totalHours-c.completedHours);
    const pct=c.totalHours>0?((c.completedHours/c.totalHours)*100).toFixed(1)+"%":"0%";
    rows.push([c.batchCode||"",c.name,fmtHours(c.totalHours),fmtHours(c.completedHours),fmtHours(c.extraHours||0),fmtHours(rem),pct]);
  });
  return rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

// ── NEW: Date/Month/Week history helpers (for hour history + share) ──
function monthKey(d) { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`; }
function monthLabel(key) { if(!key) return ""; const [y,m]=key.split("-"); return new Date(Number(y),Number(m)-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); }

function collectBatchLogs(chapters) {
  const all=[];
  chapters.forEach(c=>{ (c.hourLogs||[]).forEach(l=>{ all.push({...l,chapterName:c.name}); }); });
  return all.sort((a,b)=>new Date(a.date)-new Date(b.date));
}

function groupByDate(logs) {
  const map={};
  logs.forEach(l=>{ map[l.date]=(map[l.date]||0)+l.hours; });
  return Object.entries(map).sort((a,b)=>new Date(b[0])-new Date(a[0]));
}

// ── NEW: Group logs by date AND chapter, with running cumulative total for the batch ──
function buildDateChapterRows(logs) {
  const dateMap = {};
  logs.forEach(l=>{
    if(!dateMap[l.date]) dateMap[l.date]={total:0,byChapter:{}};
    dateMap[l.date].total += l.hours;
    dateMap[l.date].byChapter[l.chapterName] = (dateMap[l.date].byChapter[l.chapterName]||0) + l.hours;
  });
  const datesAsc = Object.keys(dateMap).sort((a,b)=>new Date(a)-new Date(b));
  let cumulative = 0;
  const cumByDate = {};
  datesAsc.forEach(d=>{ cumulative += dateMap[d].total; cumByDate[d] = roundToMinute(cumulative); });
  const datesDesc = [...datesAsc].reverse();
  const rows=[];
  datesDesc.forEach(d=>{
    const chapterEntries = Object.entries(dateMap[d].byChapter).sort((a,b)=>a[0].localeCompare(b[0]));
    chapterEntries.forEach(([chapterName,hrs])=>{
      rows.push({date:d, chapterName, hours:roundToMinute(hrs), cumulative:cumByDate[d]});
    });
  });
  return rows;
}

function monthlyTotals(chapters, mKey) {
  let taken=0, extra=0;
  chapters.forEach(c=>{
    (c.hourLogs||[]).forEach(l=>{
      if(monthKey(l.date)===mKey){
        taken+=l.hours;
        extra+= l.extraAmount!=null ? l.extraAmount : (l.type==="extra"?l.hours:0);
      }
    });
  });
  return {taken:roundToMinute(taken), extra:roundToMinute(extra)};
}

// ── UPDATED: CSV now includes chapter name per row ──
function buildBatchHistoryCSV(batchCode, chapters) {
  const total = chapters.reduce((s,c)=>s+c.totalHours,0);
  const logs = collectBatchLogs(chapters);
  const rows = buildDateChapterRows(logs);
  const out = [["Date","Chapter","Hours Taken","Allotted","Remaining","Progress %"]];
  rows.forEach(r=>{
    const remaining = Math.max(0, total - r.cumulative);
    const pct = total>0 ? ((r.cumulative/total)*100).toFixed(1)+"%" : "0%";
    out.push([fmtDate(r.date), r.chapterName, fmtHours(r.hours), fmtHours(total), fmtHours(remaining), pct]);
  });
  return out.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

// ── NEW: Generate a shareable PNG report card + native share / CSV fallback ──
// UPDATED: date-wise breakdown now includes the Chapter column
async function shareBatchImage(batchCode, color, chapters) {
  const total = chapters.reduce((s,c)=>s+c.totalHours,0);
  const done = chapters.reduce((s,c)=>s+c.completedHours,0);
  const remaining = Math.max(0, total-done);
  const pct = total>0 ? (done/total)*100 : 0;
  const logs = collectBatchLogs(chapters);
  const allRows = buildDateChapterRows(logs);
  const rows = allRows.slice(0,10);

  const W=760, headerH=280, rowH=42;
  const H = headerH + 70 + Math.max(1,rows.length)*rowH + 40;
  const canvas=document.createElement("canvas");
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d");

  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,headerH);
  grad.addColorStop(0,color); grad.addColorStop(1,"#4338ca");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,headerH);

  ctx.fillStyle="#ffffff";
  ctx.font="900 38px Sora, sans-serif";
  ctx.fillText(`${batchCode} — Hours Report`,32,56);
  ctx.font="600 15px Sora, sans-serif";
  ctx.globalAlpha=.8;
  ctx.fillText(`Generated ${fmtDate(todayStr())} · LectureTrack`,32,84);
  ctx.globalAlpha=1;

  const stats=[["Allotted",fmtHours(total)],["Taken",fmtHours(done)],["Remaining",fmtHours(remaining)],["Progress",pct.toFixed(0)+"%"]];
  const boxW=(W-64-3*16)/4;
  stats.forEach((s,i)=>{
    const x=32+i*(boxW+16);
    ctx.fillStyle="rgba(255,255,255,.18)";
    roundRect(ctx,x,112,boxW,88,14); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.font="900 21px Sora, sans-serif";
    ctx.fillText(s[1],x+14,155);
    ctx.font="600 12px Sora, sans-serif";
    ctx.globalAlpha=.75;
    ctx.fillText(s[0],x+14,175);
    ctx.globalAlpha=1;
  });

  ctx.fillStyle="rgba(255,255,255,.25)";
  roundRect(ctx,32,222,W-64,10,5); ctx.fill();
  ctx.fillStyle="#fff";
  roundRect(ctx,32,222,Math.max(6,(W-64)*Math.min(pct,100)/100),10,5); ctx.fill();

  let y=headerH+36;
  ctx.fillStyle="#0f172a";
  ctx.font="800 18px Sora, sans-serif";
  ctx.fillText("Date-wise Breakdown",32,y);
  y+=28;
  ctx.font="700 12px Sora, sans-serif";
  ctx.fillStyle="#94a3b8";
  // 5 columns: Date, Chapter, Taken, Remaining, %
  const colWidths=[0.22,0.36,0.16,0.16,0.10].map(f=>(W-64)*f);
  const colX=[32];
  for(let i=0;i<colWidths.length-1;i++) colX.push(colX[i]+colWidths[i]);
  ["Date","Chapter","Taken","Remaining","%"].forEach((h,i)=>ctx.fillText(h,colX[i],y));
  y+=12;
  ctx.strokeStyle="#e2e8f0"; ctx.beginPath(); ctx.moveTo(32,y); ctx.lineTo(W-32,y); ctx.stroke();
  y+=26;

  if(rows.length===0){
    ctx.fillStyle="#94a3b8"; ctx.font="600 13px Sora, sans-serif";
    ctx.fillText("No hours logged yet",32,y);
  }
  const truncate=(str,max)=>{
    if(!str) return "";
    return str.length>max ? str.slice(0,max-1)+"…" : str;
  };
  rows.forEach(r=>{
    const rem=Math.max(0,total-r.cumulative);
    const p= total>0 ? ((r.cumulative/total)*100).toFixed(0)+"%" : "0%";
    ctx.fillStyle="#1e293b"; ctx.font="600 13px Sora, sans-serif";
    [fmtDate(r.date), truncate(r.chapterName,22), fmtHours(r.hours), fmtHours(rem), p].forEach((c,i)=>ctx.fillText(c,colX[i],y));
    y+=rowH-16;
    ctx.strokeStyle="#f1f5f9"; ctx.beginPath(); ctx.moveTo(32,y-8); ctx.lineTo(W-32,y-8); ctx.stroke();
    y+=16;
  });

  return new Promise(resolve=>{
    canvas.toBlob(async blob=>{
      if(!blob){ resolve(); return; }
      const file=new File([blob],`${batchCode}_hours.png`,{type:"image/png"});
      try{
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:`${batchCode} Hours Report`,text:`Hours report for ${batchCode}`});
        } else {
          const a=document.createElement("a");
          a.href=URL.createObjectURL(blob); a.download=`${batchCode}_hours.png`; a.click();
        }
      }catch(e){ /* share cancelled by user — ignore */ }
      resolve();
    },"image/png");
  });
}

const MASTER = "__MASTER__";

function toRow(teacherCode,c) {
  return {
    id:c.id, teacher_code:teacherCode,
    batch_code: c.batchCode || MASTER,
    name:c.name,
    total_hours:c.totalHours||0, completed_hours:c.completedHours||0,
    extra_hours:c.extraHours||0, topics:c.topics||[],
    notes:c.notes||"", last_completed_topic:c.lastCompletedTopic||null,
    hour_logs:c.hourLogs||[], updated_at:new Date().toISOString()
  };
}

function fromRow(r) {
  const batchCode = (!r.batch_code || r.batch_code === MASTER) ? null : r.batch_code;
  return {
    id:r.id, batchCode, name:r.name,
    totalHours:r.total_hours||0, completedHours:r.completed_hours||0,
    extraHours:r.extra_hours||0, topics:r.topics||[],
    notes:r.notes||"", lastCompletedTopic:r.last_completed_topic,
    hourLogs:r.hour_logs||[]
  };
}

// ── Splash Screen ─────────────────────────────────────────────────
function SplashScreen() {
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
      <div className="splash-icon" style={{fontSize:80,marginBottom:16}}>👨‍🏫</div>
      <div className="splash-title" style={{fontSize:36,fontWeight:900,color:"#fff",letterSpacing:"-1px",marginBottom:6}}>LectureTrack</div>
      <div className="splash-sub" style={{fontSize:15,color:"rgba(255,255,255,.7)",fontWeight:600,marginBottom:40}}>Track every hour. Teach with clarity.</div>
      <div className="splash-dot" style={{width:8,height:8,background:"rgba(255,255,255,.6)",borderRadius:"50%"}}/>
    </div>
  );
}

// ── Congrats Screen ───────────────────────────────────────────────
function CongratsScreen({profile,totalHours,onClose}) {
  const quote=MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)];
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  const emoji=SUBJECT_EMOJI[profile.subject]||"📖";
  return (
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#6366f1,#4338ca)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",overflowY:"auto"}}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}} .bounce{animation:bounce 1s ease infinite}`}</style>
      <div className="bounce" style={{fontSize:80,marginBottom:10}}>🎉</div>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",marginBottom:8}}>Congratulations!</div>
      <div style={{fontSize:18,fontWeight:700,color:"rgba(255,255,255,.9)",marginBottom:4}}>{profile.code} {sal}</div>
      {profile.subject&&<div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:8}}>{emoji} {profile.subject} Teacher</div>}
      <div style={{fontSize:15,color:"rgba(255,255,255,.7)",marginBottom:28}}>You've completed <strong style={{color:"#fde68a"}}>{fmtHours(totalHours)}</strong> of lectures! 🏆</div>
      <div style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"22px 26px",maxWidth:340,marginBottom:30,backdropFilter:"blur(10px)"}}>
        <div style={{fontSize:36,marginBottom:12}}>💡</div>
        <div style={{fontSize:15,color:"#fff",fontWeight:600,lineHeight:1.8}}>{quote}</div>
      </div>
      <button onClick={onClose} style={{background:"#fff",color:"#6366f1",border:"none",borderRadius:16,padding:"14px 44px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
        Continue Teaching →
      </button>
    </div>
  );
}

// ── Chapter Autocomplete ──────────────────────────────────────────
function ChapterAutocomplete({value,onChange,subject}) {
  const [open,setOpen]=useState(false);
  const [suggestions,setSuggestions]=useState([]);
  const ref=useRef();
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",handler);
    return()=>document.removeEventListener("mousedown",handler);
  },[]);
  const handleInput=v=>{
    onChange(v);
    if(v.length<1){setSuggestions([]);setOpen(false);return;}
    const pool=subject&&subject!=="Multiple Subjects"&&CHAPTER_DB[subject]?CHAPTER_DB[subject]:ALL_CHAPTERS;
    const filtered=pool.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,7);
    setSuggestions(filtered);
    setOpen(filtered.length>0);
  };
  return(
    <div ref={ref} style={{position:"relative",marginBottom:14}}>
      <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Chapter Name</label>
      <input value={value} onChange={e=>handleInput(e.target.value)} placeholder="Type to search chapters..."
        onFocus={()=>value&&suggestions.length>0&&setOpen(true)}
        style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,.15)",zIndex:200,maxHeight:240,overflowY:"auto",marginTop:4,border:"1.5px solid #e2e8f0"}}>
          {suggestions.map((s,i)=>(
            <div key={i} onMouseDown={()=>{onChange(s);setOpen(false);}}
              style={{padding:"11px 16px",cursor:"pointer",fontSize:14,fontWeight:600,color:"#1e293b",borderBottom:"1px solid #f1f5f9"}}
              onMouseEnter={e=>e.currentTarget.style.background="#f0f4ff"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              📖 {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────
function Onboarding({onDone}) {
  const [mode,setMode]=useState("login");
  const [name,setName]=useState("");
  const [code,setCode]=useState("");
  const [pin,setPin]=useState("");
  const [confirmPin,setConfirmPin]=useState("");
  const [gender,setGender]=useState("male");
  const [subject,setSubject]=useState("Physics");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning ☀️":hr<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const sal=gender==="male"?"Sir":"Ma'am";
  const handleLogin=async()=>{
    if(!code.trim()||!pin.trim()){setError("Enter code and PIN");return;}
    setLoading(true);setError("");
    try{
      const{data,error:err}=await supabase.from("teachers").select("*").eq("code",code.trim().toUpperCase()).single();
      if(err||!data){setError("❌ Code not found. Register first.");setLoading(false);return;}
      if(data.pin!==pin.trim()){setError("❌ Wrong PIN. Try again.");setLoading(false);return;}
      const profile={code:data.code,name:data.name,gender:data.gender,pin:data.pin,subject:data.subject||"Physics",photo:data.photo||null};
      localStorage.setItem("lt_session",JSON.stringify(profile));
      onDone(profile);
    }catch{setError("❌ Connection failed. Check internet.");}
    setLoading(false);
  };
  const handleRegister=async()=>{
    if(!name.trim()||!code.trim()||!pin.trim()){setError("Fill all fields");return;}
    if(pin.length<4){setError("PIN must be at least 4 digits");return;}
    if(pin!==confirmPin){setError("PINs do not match");return;}
    setLoading(true);setError("");
    try{
      const{data:existing}=await supabase.from("teachers").select("code").eq("code",code.trim().toUpperCase()).single();
      if(existing){setError("❌ Code taken. Choose another.");setLoading(false);return;}
      const profile={code:code.trim().toUpperCase(),name:name.trim(),gender,pin:pin.trim(),subject,photo:null};
      const{error:err}=await supabase.from("teachers").insert(profile);
      if(err){setError("❌ Registration failed: "+err.message);setLoading(false);return;}
      localStorage.setItem("lt_session",JSON.stringify(profile));
      onDone(profile);
    }catch(e){setError("❌ Error: "+e.message);}
    setLoading(false);
  };
  const SUBJECT_OPTIONS=[{label:"⚡ Physics",value:"Physics"},{label:"🧪 Chemistry",value:"Chemistry"},{label:"🧬 Biology",value:"Biology"},{label:"📐 Mathematics",value:"Mathematics"},{label:"📚 Multiple",value:"Multiple Subjects"}];
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp .4s ease forwards}`}</style>
      <div className="fade-up" style={{background:"#fff",borderRadius:28,padding:32,width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(0,0,0,.25)"}}>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#6366f1,#4338ca)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,margin:"0 auto 12px"}}>👨‍🏫</div>
          <h2 style={{margin:"0 0 4px",fontSize:26,fontWeight:900,color:"#0f172a",letterSpacing:"-0.5px"}}>LectureTrack</h2>
          <p style={{margin:0,color:"#94a3b8",fontSize:13,fontWeight:500}}>Track every hour. Teach with clarity.</p>
        </div>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:14,padding:4,marginBottom:22,gap:4}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:11,border:"none",cursor:"pointer",background:mode===m?"#fff":"transparent",fontWeight:800,fontSize:14,color:mode===m?"#6366f1":"#64748b",fontFamily:"inherit",boxShadow:mode===m?"0 2px 10px rgba(99,102,241,.15)":"none",transition:"all .2s"}}>
              {m==="login"?"🔑 Login":"📝 Register"}
            </button>
          ))}
        </div>
        {mode==="register"&&(<>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. P M Krishna" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:6}}>Gender</label>
            <div style={{display:"flex",gap:10}}>
              {["male","female"].map(g=>(
                <button key={g} onClick={()=>setGender(g)} style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${gender===g?"#6366f1":"#e2e8f0"}`,background:gender===g?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:gender===g?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:13}}>
                  {g==="male"?"👨 Male":"👩 Female"}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Subject You Teach</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {SUBJECT_OPTIONS.map(s=>(
                <button key={s.value} onClick={()=>setSubject(s.value)} style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${subject===s.value?"#6366f1":"#e2e8f0"}`,background:subject===s.value?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:subject===s.value?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>)}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Unique Code</label>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. PMK" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>PIN (4–6 digits)</label>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter PIN" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        </div>
        {mode==="register"&&(
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Confirm PIN</label>
            <input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Re-enter PIN" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
          </div>
        )}
        {mode==="register"&&name&&code&&(
          <div style={{background:"linear-gradient(135deg,#eef2ff,#e0e7ff)",borderRadius:14,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#4f46e5",fontWeight:700}}>
            {gw}, {code} {sal}! 👋
          </div>
        )}
        {error&&<div style={{background:"#fee2e2",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#dc2626",fontWeight:600}}>{error}</div>}
        <button onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}
          style={{width:"100%",padding:14,background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",opacity:loading?.7:1,boxShadow:"0 6px 20px rgba(99,102,241,.4)"}}>
          {loading?"Please wait...":mode==="login"?"Login →":"Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────
function Modal({title,onClose,children}) {
  useEffect(()=>{
    const h=e=>e.key==="Escape"&&onClose?.();
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[onClose]);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:26,width:"100%",maxWidth:440,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.25)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:800,color:"#0f172a"}}>{title}</h3>
          {onClose&&<button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:99,width:34,height:34,cursor:"pointer",fontSize:20,color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── SyncBadge ─────────────────────────────────────────────────────
function SyncBadge({status}) {
  const cfg={saving:{bg:"#eef2ff",color:"#6366f1",text:"⏳ Saving..."},saved:{bg:"#dcfce7",color:"#16a34a",text:"☁️ Saved"},error:{bg:"#fee2e2",color:"#dc2626",text:"❌ Failed"}}[status];
  if(!cfg) return null;
  return <div style={{background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99}}>{cfg.text}</div>;
}

function PBar({pct,color="#fff",bg="rgba(255,255,255,.25)",height=8}) {
  return(
    <div style={{background:bg,borderRadius:99,height,overflow:"hidden"}}>
      <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .7s ease"}}/>
    </div>
  );
}

// ── FIX #6: BatchFormModal — isolated input state to prevent keyboard close ──
// Each row uses a local ref-based approach + controlled state with stable callbacks
function BatchRowInput({rowId, initialName, initialHours, onNameChange, onHoursChange, onRemove, showRemove, subject, masterChapters, index}) {
  const [name, setName] = useState(initialName);
  const [hours, setHours] = useState(initialHours);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const acRef = useRef();

  useEffect(()=>{
    const h=e=>{if(acRef.current&&!acRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const handleNameInput = useCallback((v) => {
    setName(v);
    onNameChange(rowId, v);
    if(v.length<1){setSuggestions([]);setOpen(false);return;}
    const pool=subject&&subject!=="Multiple Subjects"&&CHAPTER_DB[subject]?CHAPTER_DB[subject]:ALL_CHAPTERS;
    const filtered=pool.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,7);
    setSuggestions(filtered);
    setOpen(filtered.length>0);
  }, [rowId, onNameChange, subject]);

  const handleHoursInput = useCallback((v) => {
    setHours(v);
    onHoursChange(rowId, v);
  }, [rowId, onHoursChange]);

  const selectSuggestion = useCallback((s) => {
    setName(s);
    onNameChange(rowId, s);
    setOpen(false);
  }, [rowId, onNameChange]);

  // FIX #1 & #5: Show topics from master chapter when name matches
  const master = useMemo(() =>
    masterChapters.find(mc=>mc.name.toLowerCase()===name.toLowerCase()),
    [masterChapters, name]
  );
  const topics = master?.topics || [];

  return (
    <div ref={acRef} style={{background:"#f8fafc",borderRadius:14,padding:"12px 14px",border:"1.5px solid #e2e8f0",position:"relative"}}>
      <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,position:"relative"}}>
          <input
            value={name}
            onChange={e=>handleNameInput(e.target.value)}
            placeholder={`Chapter ${index+1} name...`}
            style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}
          />
          {open&&suggestions.length>0&&(
            <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,.13)",zIndex:250,maxHeight:200,overflowY:"auto",marginTop:3,border:"1.5px solid #e2e8f0"}}>
              {suggestions.map((s,si)=>(
                <div key={si} onMouseDown={()=>selectSuggestion(s)}
                  style={{padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1e293b",borderBottom:"1px solid #f1f5f9"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#f0f4ff"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  📖 {s}
                </div>
              ))}
            </div>
          )}
        </div>
        {showRemove&&(
          <button onClick={()=>onRemove(rowId)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#ef4444",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>×</button>
        )}
      </div>
      <div>
        <input
          type="number"
          value={hours}
          onChange={e=>handleHoursInput(e.target.value)}
          placeholder="Allotted hours (e.g. 1.5 = 1h 30m)"
          min={0}
          step={0.5}
          style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}
        />
        {hours&&parseFloat(hours)>0&&<div style={{fontSize:11,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseFloat(hours))}</div>}
      </div>
      {/* FIX #1 & #5: Show topics from master chapter library */}
      {topics.length>0&&(
        <div style={{marginTop:8,padding:"8px 10px",background:"#eef2ff",borderRadius:8}}>
          <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:4}}>📋 {topics.length} topics will be imported from chapter library</div>
          <div style={{fontSize:11,color:"#475569"}}>{topics.slice(0,3).map(t=>t.name).join(" · ")}{topics.length>3?` · +${topics.length-3} more`:""}</div>
        </div>
      )}
      {name.trim()&&topics.length===0&&(
        <div style={{marginTop:8,padding:"7px 10px",background:"#fef9c3",borderRadius:8}}>
          <div style={{fontSize:11,color:"#92400e",fontWeight:600}}>💡 Add topics to this chapter in the Chapters tab first to auto-import them</div>
        </div>
      )}
    </div>
  );
}

// ── Batch Form Modal ──────────────────────────────────────────────
function BatchFormModal({onSave,onClose,subject,masterChapters}) {
  const [batchCode,setBatchCode]=useState("");
  const [rows,setRows]=useState([{id:uid(),name:"",hours:""}]);
  // FIX #6: use refs to track current row data without re-rendering the inputs
  const rowDataRef = useRef({});

  // Initialize ref data
  useEffect(() => {
    rows.forEach(r => {
      if(!rowDataRef.current[r.id]) rowDataRef.current[r.id] = {name:"",hours:""};
    });
  }, []);

  const addRow = () => {
    const newId = uid();
    rowDataRef.current[newId] = {name:"",hours:""};
    setRows(prev=>[...prev,{id:newId,name:"",hours:""}]);
  };

  const removeRow = (id) => {
    delete rowDataRef.current[id];
    setRows(prev=>prev.filter(r=>r.id!==id));
  };

  const onNameChange = useCallback((id, val) => {
    if(!rowDataRef.current[id]) rowDataRef.current[id]={name:"",hours:""};
    rowDataRef.current[id].name = val;
  }, []);

  const onHoursChange = useCallback((id, val) => {
    if(!rowDataRef.current[id]) rowDataRef.current[id]={name:"",hours:""};
    rowDataRef.current[id].hours = val;
  }, []);

  const handleSave = () => {
    if(!batchCode.trim()) return;
    const validRows = rows
      .map(r => rowDataRef.current[r.id] || {name:"",hours:""})
      .filter(r => r.name.trim() && parseFloat(r.hours)>0);
    if(validRows.length===0) return;
    onSave({batchCode:batchCode.trim().toUpperCase(), rows:validRows});
  };

  return(
    <Modal title="🗂️ Add Batch" onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Batch Code / Name</label>
        <input value={batchCode} onChange={e=>setBatchCode(e.target.value.toUpperCase())} placeholder="e.g. X1, 11A, RISE"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Chapters in this batch:</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
        {rows.map((row,i)=>(
          <BatchRowInput
            key={row.id}
            rowId={row.id}
            initialName={row.name}
            initialHours={row.hours}
            onNameChange={onNameChange}
            onHoursChange={onHoursChange}
            onRemove={removeRow}
            showRemove={rows.length>1}
            subject={subject}
            masterChapters={masterChapters}
            index={i}
          />
        ))}
      </div>
      <button onClick={addRow} style={{width:"100%",padding:"10px",background:"#eef2ff",color:"#6366f1",border:"2px dashed #c7d2fe",borderRadius:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14,marginBottom:16}}>
        + Add Another Chapter
      </button>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={handleSave} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>Create Batch ✓</button>
      </div>
    </Modal>
  );
}

// ── Chapter Master Modal ──────────────────────────────────────────
function ChapterMasterModal({chapter,onSave,onClose}) {
  const [topics,setTopics]=useState(chapter?.topics||[]);
  const [newTopic,setNewTopic]=useState("");
  const addTopic=()=>{if(!newTopic.trim())return;setTopics(prev=>[...prev,{id:uid(),name:newTopic.trim(),done:false}]);setNewTopic("");};
  const removeTopic=id=>setTopics(prev=>prev.filter(t=>t.id!==id));
  return(
    <Modal title={`📋 Topics · ${chapter.name}`} onClose={onClose}>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>Topics you add here will appear in all batch pages for this chapter.</div>
      {topics.length===0&&<div style={{textAlign:"center",padding:"20px",color:"#94a3b8",fontSize:14}}>No topics yet. Add below.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14,maxHeight:280,overflowY:"auto"}}>
        {topics.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:12,background:"#f8fafc",border:"1.5px solid #e2e8f0"}}>
            <span style={{fontSize:13,color:"#1e293b",fontWeight:600,flex:1}}>{i+1}. {t.name}</span>
            <button onClick={()=>removeTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:"#ef4444",opacity:.6,padding:0,flexShrink:0}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTopic()} placeholder="Add a topic..."
          style={{flex:1,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
        <button onClick={addTopic} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+ Add</button>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>onSave({...chapter,topics})} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>Save Topics ✓</button>
      </div>
    </Modal>
  );
}

// ── Add Chapter Master Modal ──────────────────────────────────────
function AddChapterMasterModal({onSave,onClose,subject}) {
  const [name,setName]=useState("");
  const [topics,setTopics]=useState([]);
  const [newTopic,setNewTopic]=useState("");
  const addTopic=()=>{if(!newTopic.trim())return;setTopics(prev=>[...prev,{id:uid(),name:newTopic.trim(),done:false}]);setNewTopic("");};
  const removeTopic=id=>setTopics(prev=>prev.filter(t=>t.id!==id));
  return(
    <Modal title="📚 Add Chapter" onClose={onClose}>
      <ChapterAutocomplete value={name} onChange={setName} subject={subject}/>
      <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>📋 Topics (optional)</div>
      {topics.length===0&&<div style={{fontSize:12,color:"#94a3b8",marginBottom:10}}>Add topics — they will appear in batch pages for this chapter.</div>}
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10,maxHeight:220,overflowY:"auto"}}>
        {topics.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:11,background:"#f8fafc",border:"1.5px solid #e2e8f0"}}>
            <span style={{fontSize:13,color:"#1e293b",fontWeight:600,flex:1}}>{i+1}. {t.name}</span>
            <button onClick={()=>removeTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:"#ef4444",opacity:.6,padding:0}}>×</button>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTopic()} placeholder="Add a topic..."
          style={{flex:1,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
        <button onClick={addTopic} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+ Add</button>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>{if(name.trim())onSave({name:name.trim(),topics})}} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>Save ✓</button>
      </div>
    </Modal>
  );
}

// ── Home Tab ──────────────────────────────────────────────────────
// UPDATED: accepts completedBatches so the batch list on the front page only shows running batches
function HomeTab({chapters,profile,onOpenChapter,onOpenBatch,syncStatus,onGoProfile,completedBatches=[]}) {
  const batchChapters=chapters.filter(c=>c.batchCode);
  const totalAllotted=batchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalDoneAllTime=batchChapters.reduce((s,c)=>s+c.completedHours,0);
  const pctAllTime=totalAllotted>0?(totalDoneAllTime/totalAllotted)*100:0;
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning":hr<17?"Good Afternoon":"Good Evening";
  const wave=hr<12?"☀️":hr<17?"🌤️":"🌙";
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  const emoji=SUBJECT_EMOJI[profile.subject]||"📖";
  const allBatches=[...new Set(batchChapters.map(c=>c.batchCode))].sort();
  // Only show currently running (not completed) batches on the front page
  const batches=allBatches.filter(b=>!completedBatches.includes(b));

  // NEW: monthly hours-taken view — data already existed per chapter (hourLogs), just aggregated here
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
            <div style={{fontSize:19,fontWeight:900,color:"#0f172a"}}>{gw}, {profile.code} {sal} {wave}</div>
            <div style={{fontSize:12,color:"#94a3b8",marginTop:2,fontWeight:600}}>{profile.name} · {emoji} {profile.subject||"Teacher"}</div>
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

      <div style={{margin:"0 16px 20px",background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6366f1 100%)",borderRadius:24,padding:"22px 20px",color:"#fff",boxShadow:"0 10px 30px rgba(79,70,229,.25)"}}>
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
            {label:"Hours Taken",val:fmtHours(monthTaken),icon:"⏱️"},
            {label:"Allotted (Total)",val:fmtHours(totalAllotted),icon:"📋"},
            {label:"Extra Hours",val:fmtHours(monthExtra),icon:"⭐"},
            {label:"Overall Progress",val:pctAllTime.toFixed(0)+"%",icon:"📈"},
          ].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,.15)",borderRadius:16,padding:"12px 14px"}}>
              <div style={{fontSize:16,marginBottom:4}}>{s.icon}</div>
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
        {batches.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>🗂️ Your Batches</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {batches.map((b,i)=>{
                const bc=BATCH_COLORS[allBatches.indexOf(b)%BATCH_COLORS.length];
                const chs=batchChapters.filter(c=>c.batchCode===b);
                const done=chs.reduce((s,c)=>s+c.completedHours,0);
                const total=chs.reduce((s,c)=>s+c.totalHours,0);
                const p=total>0?(done/total)*100:0;
                const completed=p>=100;
                return(
                  <div key={b} onClick={()=>onOpenBatch(b)} style={{background:"#fff",borderRadius:16,padding:"14px 16px",cursor:"pointer",borderLeft:`4px solid ${bc}`,boxShadow:"0 1px 8px rgba(0,0,0,.06)",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4,gap:8}}>
                        <div style={{fontSize:17,fontWeight:900,color:bc}}>{b}</div>
                        <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:99,background:completed?"#fef3c7":"#eef2ff",color:completed?"#b45309":"#4338ca",whiteSpace:"nowrap"}}>{completed?"✓ Completed":"⏱ In Progress"}</span>
                      </div>
                      <div style={{fontSize:11,color:"#94a3b8",marginBottom:6}}>{chs.length} chapters</div>
                      <div style={{background:"#f1f5f9",borderRadius:99,height:5}}>
                        <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:bc,borderRadius:99}}/>
                      </div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{p.toFixed(0)}% Progress</div>
                    </div>
                    <span style={{color:"#cbd5e1",fontSize:18}}>›</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {batchChapters.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
            <div style={{fontSize:56,marginBottom:16}}>📭</div>
            <div style={{fontWeight:800,fontSize:18,color:"#475569",marginBottom:8}}>No batches yet</div>
            <div style={{fontSize:14}}>Go to Batches tab to add your first batch</div>
          </div>
        )}

        {batchChapters.length>0&&batches.length===0&&(
          <div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}>
            <div style={{fontSize:48,marginBottom:14}}>🎉</div>
            <div style={{fontWeight:800,fontSize:16,color:"#475569",marginBottom:6}}>All batches completed!</div>
            <div style={{fontSize:13}}>Check the Batches tab to view or reopen them</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chapters Tab ──────────────────────────────────────────────────
function ChaptersTab({masterChapters,onOpenMaster,onAddMaster,onDeleteMaster}) {
  const [search,setSearch]=useState("");
  const filtered=masterChapters.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a"}}>📚 Chapter Library</div>
        <button onClick={onAddMaster} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.35)"}}>+ Add</button>
      </div>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:12,fontWeight:500}}>Add chapters and their topics here. Topics appear automatically in batch pages.</div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search chapters..."
        style={{width:"100%",padding:"12px 16px",border:"2px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",marginBottom:12,boxSizing:"border-box"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}><div style={{fontSize:44}}>📭</div><div style={{fontWeight:700,marginTop:12,fontSize:16}}>No chapters yet</div></div>}
        {filtered.map(c=>{
          const topicCount=(c.topics||[]).length;
          return(
            <div key={c.id} onClick={()=>onOpenMaster(c)}
              style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",cursor:"pointer",border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:12,transition:"box-shadow .15s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 3px 14px rgba(99,102,241,.13)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.06)"}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                <div style={{fontSize:12,color:"#94a3b8",marginTop:3}}>{topicCount>0?`${topicCount} topics`:"No topics yet — tap to add"}</div>
              </div>
              <div style={{background:"#eef2ff",color:"#6366f1",fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,flexShrink:0,whiteSpace:"nowrap"}}>
                Edit Topics →
              </div>
              <button onClick={e=>{e.stopPropagation();onDeleteMaster(c.id);}} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:13,color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🗑️</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Batches Tab ───────────────────────────────────────────────────
// UPDATED: shows a "Completed" tag on batches that have been marked completed
function BatchesTab({chapters,onOpenBatch,onDeleteBatch,onAddBatch,completedBatches=[]}) {
  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))].sort();
  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a"}}>🗂️ Batches</div>
        <button onClick={onAddBatch} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.35)"}}>+ Add Batch</button>
      </div>
      {batches.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}><div style={{fontSize:44}}>📭</div><div style={{fontWeight:700,marginTop:12,fontSize:16}}>No batches yet</div><div style={{fontSize:13,marginTop:4}}>Tap + Add Batch to get started</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {batches.map((b,i)=>{
          const bc=BATCH_COLORS[i%BATCH_COLORS.length];
          const chs=chapters.filter(c=>c.batchCode===b);
          const done=chs.reduce((s,c)=>s+c.completedHours,0);
          const total=chs.reduce((s,c)=>s+c.totalHours,0);
          const p=total>0?(done/total)*100:0;
          const isCompleted=completedBatches.includes(b);
          return(
            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:`linear-gradient(135deg,${bc},${bc}cc)`,borderRadius:20,padding:22,color:"#fff",cursor:"pointer",boxShadow:`0 6px 24px ${bc}44`,transition:"transform .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1px"}}>{b}</div>
                  {isCompleted&&<span style={{fontSize:10,fontWeight:800,padding:"4px 10px",borderRadius:99,background:"rgba(255,255,255,.3)",whiteSpace:"nowrap"}}>✅ Completed</span>}
                </div>
                <button onClick={e=>{e.stopPropagation();onDeleteBatch(b);}} style={{background:"rgba(239,68,68,.3)",border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>🗑️ Delete</button>
              </div>
              <div style={{fontSize:13,opacity:.8,marginBottom:14}}>{chs.length} chapters</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                {[{l:"Allotted",v:fmtHours(total)},{l:"Done",v:fmtHours(done)},{l:"Left",v:fmtHours(Math.max(0,total-done))}].map(s=>(
                  <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.18)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
                    <div style={{fontSize:14,fontWeight:800}}>{s.v}</div>
                    <div style={{fontSize:9,opacity:.8,fontWeight:600,marginTop:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <PBar pct={p}/>
              <div style={{fontSize:12,opacity:.8,marginTop:5,fontWeight:600}}>{p.toFixed(0)}% · Tap to manage →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────
function ProfileTab({profile,chapters,onLogout,onUpdateProfile}) {
  const fileRef=useRef();
  const batchChapters=chapters.filter(c=>c.batchCode);
  const totalDone=batchChapters.reduce((s,c)=>s+c.completedHours,0);
  const totalAllotted=batchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalExtra=batchChapters.reduce((s,c)=>s+(c.extraHours||0),0);
  const batches=[...new Set(batchChapters.map(c=>c.batchCode))];
  const emoji=SUBJECT_EMOJI[profile.subject]||"📖";

  const handlePhotoUpload=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const photoData=ev.target.result;
      const updated={...profile,photo:photoData};
      supabase.from("teachers").update({photo:photoData}).eq("code",profile.code);
      try{localStorage.setItem("lt_session",JSON.stringify(updated));}catch(e){}
      onUpdateProfile(updated);
    };
    reader.readAsDataURL(file);
  };

  const downloadCSV=()=>{
    const csv=buildCSV(batchChapters);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`LectureTrack_${profile.code}_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;
    a.click();
  };

  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{background:"linear-gradient(135deg,#4f46e5,#7c3aed)",borderRadius:24,padding:"28px 24px",color:"#fff",marginBottom:20,textAlign:"center",position:"relative",overflow:"hidden"}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
          <div style={{width:90,height:90,borderRadius:"50%",border:"4px solid rgba(255,255,255,.4)",overflow:"hidden",margin:"0 auto",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
            {profile.photo?<img src={profile.photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{profile.gender==="female"?"👩":"👨"}</span>}
          </div>
          <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,background:"#fff",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)",fontSize:14}}>📷</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
        <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>{profile.name}</div>
        <div style={{fontSize:14,opacity:.8,marginBottom:4}}>{emoji} {profile.subject||"Teacher"}</div>
        <div style={{fontSize:13,opacity:.6,background:"rgba(255,255,255,.15)",borderRadius:99,padding:"4px 16px",display:"inline-block"}}>{profile.code}</div>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>📊 Your Stats</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{label:"Hours Taken",val:fmtHours(totalDone),color:"#6366f1",icon:"⏱️"},{label:"Allotted",val:fmtHours(totalAllotted),color:"#10b981",icon:"📋"},{label:"Extra Hours",val:fmtHours(totalExtra),color:"#f59e0b",icon:"⭐"},{label:"Batches",val:batches.length,color:"#ef4444",icon:"🗂️"},{label:"Chapters",val:batchChapters.length,color:"#8b5cf6",icon:"📚"},{label:"Progress",val:(totalAllotted>0?(totalDone/totalAllotted)*100:0).toFixed(0)+"%",color:"#14b8a6",icon:"📈"}].map(s=>(
            <div key={s.label} style={{background:`${s.color}0f`,borderRadius:14,padding:"14px 16px",border:`1.5px solid ${s.color}22`}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>⚡ Quick Actions</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={downloadCSV} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>
            <span style={{fontSize:22}}>📊</span>
            <div style={{textAlign:"left"}}><div>Download CSV Report</div><div style={{fontSize:11,opacity:.75,fontWeight:500}}>Full chapter report for all batches</div></div>
          </button>
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#fff",color:"#ef4444",border:"2px solid #fee2e2",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14}}>
            <span style={{fontSize:22}}>🔒</span>
            <div style={{textAlign:"left"}}><div>Logout</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Sign out of your account</div></div>
          </button>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"#cbd5e1",paddingBottom:10}}>LectureTrack v13 · Made with ❤️ for teachers</div>
    </div>
  );
}

// ── Batch Page ────────────────────────────────────────────────────
// UPDATED: accepts `completed` + `onToggleCompleted` and renders a "Mark Completed" button
// beside "Delete This Entire Batch" — both buttons are equal size (flex:1 in a row)
function BatchPage({batchCode,color,chapters,masterChapters,onBack,onDeleteChapter,onEditChapter,onOpenChapter,onDeleteBatch,completed,onToggleCompleted}) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct=total>0?(done/total)*100:0;
  const [sharing,setSharing]=useState(false);

  const downloadCSV=()=>{
    const csv=buildBatchHistoryCSV(batchCode,chapters);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`${batchCode}_HoursReport_${todayStr()}.csv`;
    a.click();
  };

  const shareImage=async()=>{
    setSharing(true);
    try{ await shareBatchImage(batchCode,color,chapters); }
    finally{ setSharing(false); }
  };

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>← Back</button>
          <div style={{display:"flex",gap:8}}>
            <button onClick={shareImage} disabled={sharing} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:12,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:sharing?"default":"pointer",fontFamily:"inherit",fontSize:13,opacity:sharing?.7:1}}>{sharing?"…":"📤 Share"}</button>
            <button onClick={downloadCSV} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:12,padding:"8px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>⬇️ CSV</button>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:42,fontWeight:900,letterSpacing:"-1px"}}>{batchCode}</div>
          {completed&&<span style={{fontSize:11,fontWeight:800,padding:"5px 12px",borderRadius:99,background:"rgba(255,255,255,.28)",whiteSpace:"nowrap"}}>✅ Completed</span>}
        </div>
        <div style={{fontSize:13,opacity:.8,marginTop:4,marginBottom:16}}>{chapters.length} chapters</div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          {[{l:"Allotted",v:fmtHours(total)},{l:"Completed",v:fmtHours(done)},{l:"Remaining",v:fmtHours(Math.max(0,total-done))}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:9,opacity:.8,fontWeight:600,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct}/>
        <div style={{fontSize:12,opacity:.8,marginTop:5,fontWeight:600}}>{pct.toFixed(0)}% overall progress</div>
      </div>
      <div style={{padding:"20px 16px 80px"}}>
        <BatchHistorySection batchCode={batchCode} color={color} chapters={chapters}/>
        {chapters.map(c=>{
          const cp=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
          const topics=c.topics||[];
          return(
            <BatchChapterCard key={c.id} chapter={c} cp={cp} color={color} topics={topics}
              onOpen={()=>onOpenChapter(c.id)} onEdit={()=>onEditChapter(c)} onDelete={()=>onDeleteChapter(c.id)}/>
          );
        })}
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button onClick={onToggleCompleted}
            style={{flex:1,padding:"14px",background:completed?"#f1f5f9":"#fff",color:completed?"#475569":"#10b981",border:`2px solid ${completed?"#e2e8f0":"#bbf7d0"}`,borderRadius:16,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:completed?"none":"0 2px 8px rgba(16,185,129,.1)"}}>
            {completed?"↩️ Mark as Running":"✅ Chapter Completed"}
          </button>
          <button onClick={onDeleteBatch}
            style={{flex:1,padding:"14px",background:"#fff",color:"#ef4444",border:"2px solid #fecaca",borderRadius:16,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(239,68,68,.1)"}}>
            🗑️ Delete This Entire Batch
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NEW: Monthly/weekly/date-wise hours breakdown for a batch ──────
function BatchHistorySection({batchCode,color,chapters}) {
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
  const monthExtra=monthLogs.reduce((s,l)=>s+(l.extraAmount!=null?l.extraAmount:(l.type==="extra"?l.hours:0)),0);

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
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>📅 Hours History</div>
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
                <span style={{fontSize:12,fontWeight:800,color}}>{fmtHours(data.total)} {open?"▲":"▼"}</span>
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

// ── Batch Chapter Card — FIX #2: "Tap to open" as colored banner ─
function BatchChapterCard({chapter,cp,color,topics,onOpen,onEdit,onDelete}) {
  const [showAllTopics,setShowAllTopics]=useState(false);
  const SHOW_LIMIT=3;
  const visibleTopics=showAllTopics?topics:topics.slice(0,SHOW_LIMIT);
  const status=getStatus(chapter.completedHours,chapter.totalHours);

  return(
    <div style={{background:"#fff",borderRadius:18,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${color}22`,overflow:"hidden"}}>
      {/* Header row */}
      <div style={{padding:"16px 16px 0 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",flex:1}}>{chapter.name}</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={onEdit} style={{background:"#eef2ff",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
            <button onClick={onDelete} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
          </div>
        </div>
        {/* Stats */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours)},{l:"Taken",v:fmtHours(chapter.completedHours),col:"#10b981"},{l:"Extra",v:fmtHours(chapter.extraHours||0),col:"#f59e0b"},{l:"Left",v:fmtHours(Math.max(0,chapter.totalHours-chapter.completedHours)),col:"#ef4444"}].map(s=>(
            <div key={s.l} style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:800,color:s.col||"#0f172a"}}>{s.v}</div>
              <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={cp} color={color} bg="#f1f5f9" height={5}/>
        <div style={{fontSize:11,color:"#94a3b8",marginTop:4,marginBottom:10}}>
          {cp.toFixed(0)}% complete · <span style={{color:STATUS[status].color,fontWeight:700}}>{STATUS[status].label}</span>
        </div>
        {/* FIX #1 & #5: Topics from master */}
        {topics.length>0&&(
          <div style={{borderTop:"1px solid #f1f5f9",paddingTop:10,marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#475569",marginBottom:6}}>📋 Topics</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {visibleTopics.map((t,i)=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:8,background:t.done?"#f0fdf4":"#f8fafc",border:`1px solid ${t.done?"#bbf7d0":"#e2e8f0"}`}}>
                  <span style={{fontSize:11,color:t.done?"#94a3b8":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:600,flex:1}}>{i+1}. {t.name}</span>
                  {t.done&&<span style={{fontSize:9,color:"#10b981",fontWeight:700}}>✓</span>}
                </div>
              ))}
            </div>
            {topics.length>SHOW_LIMIT&&(
              <button onClick={()=>setShowAllTopics(!showAllTopics)}
                style={{marginTop:6,background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#6366f1",fontWeight:700,padding:"4px 0",fontFamily:"inherit"}}>
                {showAllTopics?`▲ Show less`:`▼ Show ${topics.length-SHOW_LIMIT} more topics`}
              </button>
            )}
          </div>
        )}
      </div>
      {/* FIX #2: "Tap to open" as a proper colored banner at the bottom */}
      <div onClick={onOpen}
        style={{background:`linear-gradient(135deg,${color},${color}dd)`,padding:"11px 18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:0}}>
        <span style={{color:"#fff",fontSize:13,fontWeight:700}}>📖 Open Chapter</span>
        <span style={{color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:600}}>Log hours, topics & notes →</span>
      </div>
    </div>
  );
}

// ── Detail Page — FIX #3 (date/period layout) + FIX #4 (auto extra) + FIX #6 (keyboard) ──
function DetailPage({chapter,color,onUpdate,onBack,syncStatus}) {
  // FIX #6: use uncontrolled-style local state that doesn't trigger parent re-renders
  const [logH,setLogH]=useState("");
  const [extraH,setExtraH]=useState("");
  const [logDate,setLogDate]=useState(todayStr());
  const [logNote,setLogNote]=useState("");
  const [newTopic,setNewTopic]=useState("");
  const [notes,setNotes]=useState(chapter.notes||"");
  const [showLogs,setShowLogs]=useState(false);
  const [editLog,setEditLog]=useState(null);
  const ntRef=useRef(null);

  // Keep local notes in sync if chapter changes from outside
  const prevNotesRef=useRef(chapter.notes||"");
  useEffect(()=>{
    if(chapter.notes!==prevNotesRef.current){
      setNotes(chapter.notes||"");
      prevNotesRef.current=chapter.notes||"";
    }
  },[chapter.id]);

  const pct=chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining=Math.max(0,chapter.totalHours-chapter.completedHours);
  const status=getStatus(chapter.completedHours,chapter.totalHours);
  const logs=chapter.hourLogs||[];

  // FIX #4: Auto-detect extra hours — if adding logH hours would exceed allotted, auto-flag as extra
  const logHoursVal = parseHours(logH);
  const wouldExceed = logHoursVal > 0 && (chapter.completedHours + logHoursVal) > chapter.totalHours;
  const autoExtraAmount = wouldExceed
    ? roundToMinute(Math.min(logHoursVal, (chapter.completedHours + logHoursVal) - chapter.totalHours))
    : 0;

  // FIX #6: Use useCallback so functions don't change identity on every render
  const logHours=useCallback(()=>{
    const h=roundToMinute(parseHours(logH));
    if(!h||h<=0) return;
    // FIX #4: auto-detect extra portion
    const currentCompleted = chapter.completedHours;
    const newCompleted = roundToMinute(currentCompleted + h);
    const extraPortion = chapter.totalHours > 0
      ? roundToMinute(Math.max(0, newCompleted - chapter.totalHours))
      : 0;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote,type:extraPortion>0?"extra":"regular",extraAmount:extraPortion,extraNote:extraPortion>0?`(includes ${fmtHours(extraPortion)} extra)`:""};
    const updatedChapter = {
      ...chapter,
      completedHours: newCompleted,
      extraHours: extraPortion > 0 ? roundToMinute((chapter.extraHours||0) + extraPortion) : chapter.extraHours,
      hourLogs:[...logs,newLog]
    };
    onUpdate(updatedChapter);
    setLogH("");setLogNote("");
  },[logH,logDate,logNote,chapter,logs,onUpdate]);

  const logExtra=useCallback(()=>{
    const h=roundToMinute(parseHours(extraH));
    if(!h||h<=0) return;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote||"Extra",type:"extra",extraAmount:h};
    onUpdate({...chapter,completedHours:roundToMinute(chapter.completedHours+h),extraHours:roundToMinute((chapter.extraHours||0)+h),hourLogs:[...logs,newLog]});
    setExtraH("");setLogNote("");
  },[extraH,logDate,logNote,chapter,logs,onUpdate]);

  const deleteLog=useCallback(logId=>{
    const log=logs.find(l=>l.id===logId);
    if(!log||!window.confirm(`Remove ${fmtHours(log.hours)} on ${fmtDate(log.date)}?`)) return;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours-log.hours)),extraHours:roundToMinute(Math.max(0,(chapter.extraHours||0)-(log.extraAmount!=null?log.extraAmount:(log.type==="extra"?log.hours:0)))),hourLogs:logs.filter(l=>l.id!==logId)});
  },[logs,chapter,onUpdate]);

  const saveEditLog=useCallback(()=>{
    if(!editLog) return;
    const old=logs.find(l=>l.id===editLog.id);
    if(!old) return;
    const newH=roundToMinute(parseHours(editLog.hours));
    const diff=newH-old.hours;
    const oldExtra=old.extraAmount!=null?old.extraAmount:(old.type==="extra"?old.hours:0);
    const newExtra=old.hours>0?roundToMinute(oldExtra*(newH/old.hours)):0;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours+diff)),extraHours:roundToMinute(Math.max(0,(chapter.extraHours||0)+(newExtra-oldExtra))),hourLogs:logs.map(l=>l.id===editLog.id?{...l,hours:newH,date:editLog.date,note:editLog.note,extraAmount:newExtra,type:newExtra>0?"extra":"regular"}:l)});
    setEditLog(null);
  },[editLog,logs,chapter,onUpdate]);

  const toggleTopic=useCallback(id=>onUpdate({...chapter,topics:(chapter.topics||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}),[chapter,onUpdate]);
  const markLast=useCallback(id=>onUpdate({...chapter,lastCompletedTopic:chapter.lastCompletedTopic===id?null:id}),[chapter,onUpdate]);
  const deleteTopic=useCallback(id=>onUpdate({...chapter,topics:(chapter.topics||[]).filter(t=>t.id!==id)}),[chapter,onUpdate]);

  // FIX #6: addTopic uses local state only, not triggering re-render of other inputs
  const addTopic=useCallback(()=>{
    if(!newTopic.trim())return;
    onUpdate({...chapter,topics:[...(chapter.topics||[]),{id:uid(),name:newTopic.trim(),done:false}]});
    setNewTopic("");
  },[newTopic,chapter,onUpdate]);

  const handleNotes=useCallback(v=>{
    setNotes(v);
    clearTimeout(ntRef.current);
    ntRef.current=setTimeout(()=>onUpdate({...chapter,notes:v}),800);
  },[chapter,onUpdate]);

  const Sec=({title,children})=>(
    <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>{title}</div>
      {children}
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>← Back</button>
          <SyncBadge status={syncStatus}/>
        </div>
        <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1px"}}>{chapter.batchCode}</div>
        <div style={{fontSize:20,fontWeight:700,marginTop:4,marginBottom:18,lineHeight:1.3}}>{chapter.name}</div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours)},{l:"Taken",v:fmtHours(chapter.completedHours)},{l:"Extra",v:fmtHours(chapter.extraHours||0)},{l:"Left",v:fmtHours(remaining)}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:9,opacity:.8,fontWeight:600,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,opacity:.9,fontWeight:600}}>
          <span>{pct.toFixed(0)}% complete</span><span>{STATUS[status].label}</span>
        </div>
        {status==="exceeded"&&<div style={{marginTop:10,background:"rgba(239,68,68,.3)",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700}}>⚠️ Exceeded by {fmtHours(chapter.completedHours-chapter.totalHours)}</div>}
      </div>

      <div style={{padding:"20px 16px 80px",maxWidth:560,margin:"0 auto"}}>
        <Sec title="📅 Log Class Hours">
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Hours (decimal · e.g. 1.25 = 1h 15m)</label>
            {/* Hours input + Log button */}
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={logH}
                  onChange={e=>setLogH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logHours()}
                  placeholder="e.g. 1.5"
                  style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                {logH&&<div style={{fontSize:11,color:color,marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(logH))}</div>}
              </div>
              <button onClick={logHours} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"0 22px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:15,boxShadow:`0 4px 14px ${color}44`,flexShrink:0}}>+ Log</button>
            </div>

            {/* FIX #4: Show auto-extra warning */}
            {wouldExceed&&logHoursVal>0&&(
              <div style={{background:"linear-gradient(135deg,#fff7ed,#ffedd5)",border:"2px solid #fed7aa",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:18}}>⚠️</span>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:"#c2410c"}}>This will exceed allotted hours!</div>
                  <div style={{fontSize:11,color:"#ea580c",marginTop:2}}>{fmtHours(autoExtraAmount)} will be auto-marked as extra hours</div>
                </div>
              </div>
            )}

            {/* FIX #3: Date and Period/Note on separate rows — no overlap */}
            <div style={{marginBottom:6}}>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}>📅 Date</label>
              <input type="date" value={logDate}
                onChange={e=>setLogDate(e.target.value)}
                style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}>📝 Period / Note</label>
              <input type="text" value={logNote}
                onChange={e=>setLogNote(e.target.value)}
                placeholder="e.g. Period 3"
                style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
            </div>
          </div>

          {/* Extra Hours section */}
          <div style={{background:"linear-gradient(135deg,#fffbeb,#fef9c3)",border:"2px solid #fde68a",borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#92400e",marginBottom:10}}>⭐ Extra Hours (Beyond Allotted)</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={extraH}
                  onChange={e=>setExtraH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logExtra()}
                  placeholder="e.g. 0.5"
                  style={{width:"100%",padding:"11px 14px",border:"2px solid #fde68a",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fffef5",boxSizing:"border-box"}}/>
                {extraH&&<div style={{fontSize:11,color:"#92400e",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(extraH))}</div>}
              </div>
              <button onClick={logExtra} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(245,158,11,.3)",flexShrink:0}}>+ Add</button>
            </div>
          </div>
        </Sec>

        {logs.length>0&&(
          <Sec title={`🕐 Hour Logs (${logs.length} entries)`}>
            <button onClick={()=>setShowLogs(!showLogs)} style={{background:"#eef2ff",color:"#6366f1",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:showLogs?12:0}}>
              {showLogs?"Hide Logs ▲":"Show All Logs ▼"}
            </button>
            {showLogs&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                {[...logs].reverse().map(log=>(
                  <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,background:log.type==="extra"?"linear-gradient(135deg,#fffbeb,#fef9c3)":"#f8fafc",border:`2px solid ${log.type==="extra"?"#fde68a":"#e2e8f0"}`}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:log.type==="extra"?"#92400e":color}}>{fmtHours(log.hours)} {log.type==="extra"?"⭐ Extra":"🕐 Regular"}{log.extraNote?<span style={{fontSize:11,fontWeight:600,color:"#f97316",marginLeft:6}}>{log.extraNote}</span>:null}</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:2}}>📅 {fmtDate(log.date)}{log.note?" · "+log.note:""}</div>
                    </div>
                    <button onClick={()=>setEditLog({...log,hours:String(log.hours)})} style={{background:"#eef2ff",border:"none",borderRadius:9,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                    <button onClick={()=>deleteLog(log.id)} style={{background:"#fee2e2",border:"none",borderRadius:9,width:30,height:30,cursor:"pointer",fontSize:13,color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </Sec>
        )}

        {editLog&&(
          <Modal title="✏️ Edit Log Entry" onClose={()=>setEditLog(null)}>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Hours</label>
              <input type="number" value={editLog.hours} onChange={e=>setEditLog({...editLog,hours:e.target.value})} step={0.0833} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
              {editLog.hours&&<div style={{fontSize:12,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(editLog.hours))}</div>}
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Date</label>
              <input type="date" value={editLog.date} onChange={e=>setEditLog({...editLog,date:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Note / Period</label>
              <input type="text" value={editLog.note} onChange={e=>setEditLog({...editLog,note:e.target.value})} style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditLog(null)} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={saveEditLog} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save Changes</button>
            </div>
          </Modal>
        )}

        <Sec title="📋 Topics">
          {(chapter.topics||[]).length===0&&<div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:14}}>No topics yet.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {(chapter.topics||[]).map((t,i)=>{
              const isLast=chapter.lastCompletedTopic===t.id;
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,background:isLast?"#eef2ff":t.done?"#f0fdf4":"#fff",border:`2px solid ${isLast?"#c7d2fe":t.done?"#bbf7d0":"#e2e8f0"}`}}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTopic(t.id)} style={{width:18,height:18,accentColor:color,cursor:"pointer",flexShrink:0}}/>
                  <span style={{flex:1,fontSize:14,color:t.done?"#64748b":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:t.done?500:600}}>{i+1}. {t.name}</span>
                  {isLast&&<span style={{background:color,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:99,flexShrink:0}}>Last Done</span>}
                  <button onClick={()=>markLast(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,opacity:.5,padding:0,flexShrink:0}}>📍</button>
                  <button onClick={()=>deleteTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:17,color:"#ef4444",opacity:.5,padding:0,flexShrink:0}}>×</button>
                </div>
              );
            })}
          </div>
          {/* FIX #6: topic input is isolated */}
          <div style={{display:"flex",gap:8}}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")addTopic();}}
              placeholder="Add a topic..."
              style={{flex:1,padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
            <button onClick={addTopic} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+ Add</button>
          </div>
        </Sec>

        <Sec title="📝 Notes">
          <textarea value={notes} onChange={e=>handleNotes(e.target.value)} placeholder="Notes, derivations, student doubts..."
            style={{width:"100%",minHeight:120,padding:"14px",border:"2px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none",background:"#fff",lineHeight:1.8,boxSizing:"border-box"}}/>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>☁️ Auto-saved to cloud</div>
        </Sec>
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────
function BottomNav({active,onChange}) {
  const tabs=[
    {id:"home",Icon:HomeIcon,label:"Home"},
    {id:"batches",Icon:FolderKanban,label:"Batches"},
    {id:"chapters",Icon:BookOpen,label:"Chapters"},
    {id:"profile",Icon:UserIcon,label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #f1f5f9",display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(0,0,0,.08)"}}>
      {tabs.map(t=>{
        const isActive=active===t.id;
        const {Icon}=t;
        return(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:40,height:28,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:isActive?"#eef2ff":"transparent",transition:"background .2s"}}>
              <Icon size={20} strokeWidth={isActive?2.4:2} color={isActive?"#6366f1":"#94a3b8"} fill={isActive?"#6366f1":"none"} fillOpacity={isActive?0.12:0}/>
            </div>
            <div style={{fontSize:10,fontWeight:isActive?800:600,color:isActive?"#6366f1":"#94a3b8"}}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [splashDone,setSplashDone]=useState(false);
  const [profile,setProfile]=useState(()=>{try{const s=localStorage.getItem("lt_session");return s?JSON.parse(s):null;}catch{return null;}});
  const [chapters,setChapters]=useState([]);
  const [loading,setLoading]=useState(false);
  const [syncStatus,setSyncStatus]=useState(null);
  const [tab,setTab]=useState("home");
  const [addBatchOpen,setAddBatchOpen]=useState(false);
  const [addMasterOpen,setAddMasterOpen]=useState(false);
  const [editMaster,setEditMaster]=useState(null);
  const [editChapter,setEditChapter]=useState(null);
  const [detailId,setDetailId]=useState(null);
  const [batchView,setBatchView]=useState(null);
  const congratsShown=useRef(false);
  const [showCongrats,setShowCongrats]=useState(false);
  // NEW: tracks which batch codes have been marked "Completed" so they can be hidden from the Home tab
  const [completedBatches,setCompletedBatches]=useState([]);

  useEffect(()=>{const t=setTimeout(()=>setSplashDone(true),2200);return()=>clearTimeout(t);},[]);

  // NEW: load the completed-batches list for this teacher from localStorage
  useEffect(()=>{
    if(!profile){setCompletedBatches([]);return;}
    try{
      const stored=localStorage.getItem(`lt_completed_${profile.code}`);
      setCompletedBatches(stored?JSON.parse(stored):[]);
    }catch{setCompletedBatches([]);}
  },[profile?.code]);

  // NEW: toggle a batch's completed status and persist it
  const toggleBatchCompleted=useCallback((batchCode)=>{
    setCompletedBatches(prev=>{
      const isCompleted=prev.includes(batchCode);
      const next=isCompleted?prev.filter(b=>b!==batchCode):[...prev,batchCode];
      try{if(profile) localStorage.setItem(`lt_completed_${profile.code}`,JSON.stringify(next));}catch{}
      return next;
    });
  },[profile]);

  useEffect(()=>{
    if(!profile) return;
    setLoading(true);
    supabase.from("teachers").select("photo").eq("code",profile.code).single()
      .then(({data})=>{
        if(data?.photo && data.photo!==profile.photo){
          const updated={...profile,photo:data.photo};
          setProfile(updated);
          try{localStorage.setItem("lt_session",JSON.stringify(updated));}catch{}
        }
      });
    supabase.from("chapters").select("*").eq("teacher_code",profile.code).order("created_at")
      .then(({data,error})=>{
        if(!error&&data){
          const chs=data.map(fromRow);
          setChapters(chs);
          if(!congratsShown.current){
            const td=chs.filter(c=>c.batchCode).reduce((s,c)=>s+c.completedHours,0);
            if(td>=100){setShowCongrats(true);congratsShown.current=true;}
          }
        }
        setLoading(false);
      });
  },[profile?.code]);

  // NEW: live sync — listen for changes made from OTHER devices/tabs (needs Realtime
  // enabled on the "chapters" and "teachers" tables in Supabase → Database → Replication)
  useEffect(()=>{
    if(!profile) return;
    const channel=supabase.channel(`teacher-sync-${profile.code}`)
      .on('postgres_changes',
        {event:'*',schema:'public',table:'chapters',filter:`teacher_code=eq.${profile.code}`},
        payload=>{
          if(payload.eventType==='DELETE'){
            setChapters(prev=>prev.filter(c=>c.id!==payload.old.id));
          } else {
            const incoming=fromRow(payload.new);
            setChapters(prev=>{
              const exists=prev.some(c=>c.id===incoming.id);
              return exists ? prev.map(c=>c.id===incoming.id?incoming:c) : [...prev,incoming];
            });
          }
        })
      .on('postgres_changes',
        {event:'UPDATE',schema:'public',table:'teachers',filter:`code=eq.${profile.code}`},
        payload=>{
          setProfile(prev=>{
            if(!prev) return prev;
            const next={...prev,photo:payload.new.photo??prev.photo,name:payload.new.name??prev.name,gender:payload.new.gender??prev.gender,subject:payload.new.subject??prev.subject};
            if(next.photo===prev.photo && next.name===prev.name && next.gender===prev.gender && next.subject===prev.subject) return prev;
            try{localStorage.setItem("lt_session",JSON.stringify(next));}catch{}
            return next;
          });
        })
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[profile?.code]);

  // NEW: fallback for when Realtime isn't enabled on the Supabase project — re-pull the
  // latest data whenever the app/tab regains focus, so switching back to it shows updates
  useEffect(()=>{
    if(!profile) return;
    const refetch=()=>{
      if(document.visibilityState && document.visibilityState!=='visible') return;
      supabase.from("chapters").select("*").eq("teacher_code",profile.code).order("created_at")
        .then(({data,error})=>{ if(!error&&data) setChapters(data.map(fromRow)); });
      supabase.from("teachers").select("photo,name,gender,subject").eq("code",profile.code).single()
        .then(({data})=>{
          if(!data) return;
          setProfile(prev=>{
            if(!prev) return prev;
            const next={...prev,photo:data.photo??prev.photo,name:data.name??prev.name,gender:data.gender??prev.gender,subject:data.subject??prev.subject};
            if(next.photo===prev.photo && next.name===prev.name && next.gender===prev.gender && next.subject===prev.subject) return prev;
            try{localStorage.setItem("lt_session",JSON.stringify(next));}catch{}
            return next;
          });
        });
    };
    document.addEventListener("visibilitychange",refetch);
    window.addEventListener("focus",refetch);
    return ()=>{
      document.removeEventListener("visibilitychange",refetch);
      window.removeEventListener("focus",refetch);
    };
  },[profile?.code]);

  const syncChapter=useCallback(async chapter=>{
    if(!profile) return;
    setSyncStatus("saving");
    const{error}=await supabase.from("chapters").upsert(toRow(profile.code,chapter),{onConflict:"id"});
    setSyncStatus(error?"error":"saved");
    setTimeout(()=>setSyncStatus(null),2500);
  },[profile]);

  const updateChapter=useCallback(updated=>{
    setChapters(prev=>{
      const next=prev.map(c=>c.id===updated.id?updated:c);
      if(!congratsShown.current){
        const td=next.filter(c=>c.batchCode).reduce((s,c)=>s+c.completedHours,0);
        if(td>=100){setShowCongrats(true);congratsShown.current=true;}
      }
      return next;
    });
    syncChapter(updated);
  },[syncChapter]);

  const masterChapters=useMemo(()=>chapters.filter(c=>!c.batchCode),[chapters]);
  const batchChapters=useMemo(()=>chapters.filter(c=>c.batchCode),[chapters]);

  const addMasterChapter=async({name,topics})=>{
    const exists=masterChapters.find(mc=>mc.name.toLowerCase()===name.toLowerCase());
    if(exists){alert("A chapter with this name already exists in your library.");return;}
    const chapter={id:uid(),name,batchCode:null,totalHours:0,completedHours:0,extraHours:0,topics,notes:"",lastCompletedTopic:null,hourLogs:[]};
    setChapters(prev=>[...prev,chapter]);
    setSyncStatus("saving");
    const{error}=await supabase.from("chapters").insert(toRow(profile.code,chapter));
    setSyncStatus(error?"error":"saved");
    setTimeout(()=>setSyncStatus(null),2500);
    setAddMasterOpen(false);
  };

  const saveMasterTopics=async(updated)=>{
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    // Sync topics to all batch chapters with same name
    const batchCopies=chapters.filter(c=>c.batchCode&&c.name.toLowerCase()===updated.name.toLowerCase());
    for(const bc of batchCopies){
      const merged={...bc,topics:updated.topics.map(t=>({...t,done:bc.topics.find(bt=>bt.name===t.name)?.done||false}))};
      setChapters(prev=>prev.map(c=>c.id===merged.id?merged:c));
      await supabase.from("chapters").upsert(toRow(profile.code,merged),{onConflict:"id"});
    }
    await supabase.from("chapters").upsert(toRow(profile.code,updated),{onConflict:"id"});
    setEditMaster(null);
  };

  const deleteMasterChapter=async(id)=>{
    if(!window.confirm("Remove this chapter from the library?")) return;
    setChapters(prev=>prev.filter(c=>c.id!==id));
    await supabase.from("chapters").delete().eq("id",id);
  };

  // FIX #1 & #5: addBatch copies topics from master chapters
  const addBatch=async({batchCode,rows})=>{
    const newChapters=[];
    for(const row of rows){
      const master=masterChapters.find(mc=>mc.name.toLowerCase()===row.name.trim().toLowerCase());
      // Copy topics from master, resetting done state
      const topics=master?master.topics.map(t=>({...t,id:uid(),done:false})):[];
      const nc={id:uid(),name:row.name.trim(),batchCode,totalHours:parseFloat(row.hours),completedHours:0,extraHours:0,topics,notes:"",lastCompletedTopic:null,hourLogs:[]};
      newChapters.push(nc);
    }
    setChapters(prev=>[...prev,...newChapters]);
    setSyncStatus("saving");
    for(const nc of newChapters) await supabase.from("chapters").insert(toRow(profile.code,nc));
    setSyncStatus("saved");
    setTimeout(()=>setSyncStatus(null),2500);
    setAddBatchOpen(false);
  };

  const deleteChapter=async(id)=>{
    if(!window.confirm("Delete this chapter?")) return;
    setChapters(prev=>prev.filter(c=>c.id!==id));
    await supabase.from("chapters").delete().eq("id",id);
  };

  const deleteBatch=async batchCode=>{
    if(!window.confirm(`Delete ALL chapters in "${batchCode}"? This cannot be undone.`)) return;
    const toDelete=chapters.filter(c=>c.batchCode===batchCode);
    setChapters(prev=>prev.filter(c=>c.batchCode!==batchCode));
    for(const c of toDelete) await supabase.from("chapters").delete().eq("id",c.id);
    // NEW: also clean up the completed-batches list if this batch was marked completed
    setCompletedBatches(prev=>{
      const next=prev.filter(b=>b!==batchCode);
      try{if(profile) localStorage.setItem(`lt_completed_${profile.code}`,JSON.stringify(next));}catch{}
      return next;
    });
    setBatchView(null);
  };

  const editBatchChapterSave=async data=>{
    const updated={...editChapter,...data};
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    await supabase.from("chapters").upsert(toRow(profile.code,updated),{onConflict:"id"});
    setEditChapter(null);
  };

  const logout=()=>{localStorage.removeItem("lt_session");window.location.reload();};

  const batches=useMemo(()=>[...new Set(batchChapters.map(c=>c.batchCode))].sort(),[batchChapters]);
  const getBatchColor=useCallback(b=>BATCH_COLORS[batches.indexOf(b)%BATCH_COLORS.length],[batches]);

  const STYLE=`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;} body{margin:0;font-family:'Sora',sans-serif;background:#f8fafc;overscroll-behavior:none;}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#dde;border-radius:99px;}
    input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}
    html{touch-action:pan-x pan-y;} *{touch-action:inherit;}
    input,textarea,select{touch-action:manipulation;}
  `;

  if(!splashDone) return <><style>{STYLE}</style><SplashScreen/></>;
  if(!profile) return <><style>{STYLE}</style><Onboarding onDone={p=>setProfile(p)}/></>;
  if(showCongrats){
    const td=batchChapters.reduce((s,c)=>s+c.completedHours,0);
    return <><style>{STYLE}</style><CongratsScreen profile={profile} totalHours={td} onClose={()=>setShowCongrats(false)}/></>;
  }

  const detailChapter=chapters.find(c=>c.id===detailId);
  if(detailChapter) return(
    <><style>{STYLE}</style>
    <DetailPage chapter={detailChapter} color={getBatchColor(detailChapter.batchCode)||"#6366f1"} onUpdate={updateChapter} onBack={()=>setDetailId(null)} syncStatus={syncStatus}/>
    </>
  );

  if(batchView){
    const bChs=batchChapters.filter(c=>c.batchCode===batchView);
    return(
      <><style>{STYLE}</style>
      <BatchPage batchCode={batchView} color={getBatchColor(batchView)} chapters={bChs} masterChapters={masterChapters}
        onBack={()=>setBatchView(null)} onDeleteChapter={deleteChapter}
        onEditChapter={c=>setEditChapter(c)} onOpenChapter={id=>setDetailId(id)}
        onDeleteBatch={()=>deleteBatch(batchView)}
        completed={completedBatches.includes(batchView)}
        onToggleCompleted={()=>toggleBatchCompleted(batchView)}/>
      {editChapter&&(
        <Modal title="✏️ Edit Chapter" onClose={()=>setEditChapter(null)}>
          <EditChapterForm chapter={editChapter} onSave={editBatchChapterSave} onClose={()=>setEditChapter(null)}/>
        </Modal>
      )}
      </>
    );
  }

  return(
    <><style>{STYLE}</style>
    <div style={{maxWidth:560,margin:"0 auto",paddingBottom:72,minHeight:"100vh"}}>
      {loading?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}>
          <div style={{fontSize:44,marginBottom:16}}>☁️</div>
          <div style={{fontWeight:800,fontSize:16,color:"#6366f1"}}>Loading your data...</div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:6}}>Fetching from cloud</div>
        </div>
      ):(
        <>
          {tab==="home"&&<HomeTab chapters={batchChapters} profile={profile} onOpenChapter={id=>setDetailId(id)} onOpenBatch={b=>setBatchView(b)} syncStatus={syncStatus} onGoProfile={()=>setTab("profile")} completedBatches={completedBatches}/>}
          {tab==="batches"&&<BatchesTab chapters={batchChapters} onOpenBatch={b=>setBatchView(b)} onDeleteBatch={deleteBatch} onAddBatch={()=>setAddBatchOpen(true)} completedBatches={completedBatches}/>}
          {tab==="chapters"&&<ChaptersTab masterChapters={masterChapters} onOpenMaster={c=>setEditMaster(c)} onAddMaster={()=>setAddMasterOpen(true)} onDeleteMaster={deleteMasterChapter}/>}
          {tab==="profile"&&<ProfileTab profile={profile} chapters={batchChapters} onLogout={logout} onUpdateProfile={p=>setProfile(p)}/>}
        </>
      )}
    </div>
    <BottomNav active={tab} onChange={t=>setTab(t)}/>
    {addBatchOpen&&<BatchFormModal onSave={addBatch} onClose={()=>setAddBatchOpen(false)} subject={profile.subject} masterChapters={masterChapters}/>}
    {addMasterOpen&&<AddChapterMasterModal onSave={addMasterChapter} onClose={()=>setAddMasterOpen(false)} subject={profile.subject}/>}
    {editMaster&&<ChapterMasterModal chapter={editMaster} onSave={saveMasterTopics} onClose={()=>setEditMaster(null)}/>}
    </>
  );
}

// ── FIX #6: Edit Chapter Form — isolated component to avoid re-render keyboard issues ──
function EditChapterForm({chapter, onSave, onClose}) {
  const [name, setName] = useState(chapter.name);
  const [hours, setHours] = useState(String(chapter.totalHours));
  return (
    <>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Chapter Name</label>
        <input value={name} onChange={e=>setName(e.target.value)}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Allotted Hours</label>
        <input type="number" value={hours} onChange={e=>setHours(e.target.value)}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>{if(name&&hours)onSave({name,totalHours:parseFloat(hours)});}}
          style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save ✓</button>
      </div>
    </>
  );
}
