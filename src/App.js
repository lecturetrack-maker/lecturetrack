import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

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

const MASTER = "__MASTER__"; // sentinel for library chapters with no batch

function toRow(teacherCode,c) {
  return {
    id:c.id, teacher_code:teacherCode,
    batch_code: c.batchCode || MASTER,   // never null — avoids DB NOT NULL issue
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

// ── Splash Screen (v9 original) ───────────────────────────────────
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

// ── Onboarding (v9 original) ──────────────────────────────────────
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

// ── BATCH ADD MODAL (like v9 original — batch code + chapter + hours) ─
// FIX #5: Batch add is self-contained: enter batch code, chapter name, hours
// FIX #6: Topics auto-populate from the master chapter list
function BatchFormModal({onSave,onClose,subject,masterChapters}) {
  const [batchCode,setBatchCode]=useState("");
  const [rows,setRows]=useState([{id:uid(),name:"",hours:""}]);

  const addRow=()=>setRows(prev=>[...prev,{id:uid(),name:"",hours:""}]);
  const removeRow=id=>setRows(prev=>prev.filter(r=>r.id!==id));
  const updateRow=(id,field,val)=>setRows(prev=>prev.map(r=>r.id===id?{...r,[field]:val}:r));

  // Autocomplete state per row
  const [openRow,setOpenRow]=useState(null);
  const [suggestions,setSuggestions]=useState([]);
  const acRef=useRef();

  useEffect(()=>{
    const h=e=>{if(acRef.current&&!acRef.current.contains(e.target))setOpenRow(null);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const handleChapterInput=(id,v)=>{
    updateRow(id,"name",v);
    if(v.length<1){setSuggestions([]);setOpenRow(null);return;}
    const pool=subject&&subject!=="Multiple Subjects"&&CHAPTER_DB[subject]?CHAPTER_DB[subject]:ALL_CHAPTERS;
    const filtered=pool.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,7);
    setSuggestions(filtered);
    setOpenRow(filtered.length>0?id:null);
  };

  const handleSave=()=>{
    const validRows=rows.filter(r=>r.name.trim()&&parseFloat(r.hours)>0);
    if(!batchCode.trim()||validRows.length===0) return;
    onSave({batchCode:batchCode.trim().toUpperCase(),rows:validRows});
  };

  return(
    <Modal title="🗂️ Add Batch" onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Batch Code / Name</label>
        <input value={batchCode} onChange={e=>setBatchCode(e.target.value.toUpperCase())} placeholder="e.g. X1, 11A, RISE"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Chapters in this batch:</div>
      <div ref={acRef} style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
        {rows.map((row,i)=>(
          <div key={row.id} style={{background:"#f8fafc",borderRadius:14,padding:"12px 14px",border:"1.5px solid #e2e8f0",position:"relative"}}>
            <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
              <div style={{flex:1,position:"relative"}}>
                <input value={row.name} onChange={e=>handleChapterInput(row.id,e.target.value)}
                  placeholder={`Chapter ${i+1} name...`}
                  style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                {openRow===row.id&&suggestions.length>0&&(
                  <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:10,boxShadow:"0 8px 30px rgba(0,0,0,.13)",zIndex:250,maxHeight:200,overflowY:"auto",marginTop:3,border:"1.5px solid #e2e8f0"}}>
                    {suggestions.map((s,si)=>(
                      <div key={si} onMouseDown={()=>{updateRow(row.id,"name",s);setOpenRow(null);}}
                        style={{padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#1e293b",borderBottom:"1px solid #f1f5f9"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#f0f4ff"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        📖 {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {rows.length>1&&(
                <button onClick={()=>removeRow(row.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:32,height:32,cursor:"pointer",color:"#ef4444",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>×</button>
              )}
            </div>
            <div>
              <input type="number" value={row.hours} onChange={e=>updateRow(row.id,"hours",e.target.value)}
                placeholder="Allotted hours (e.g. 1.5 = 1h 30m)" min={0} step={0.5}
                style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
              {row.hours&&parseFloat(row.hours)>0&&<div style={{fontSize:11,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseFloat(row.hours))}</div>}
            </div>
            {/* Show topics from master chapter if found */}
            {(()=>{
              const master=masterChapters.find(mc=>mc.name.toLowerCase()===row.name.toLowerCase());
              const topics=master?.topics||[];
              if(topics.length===0) return null;
              return(
                <div style={{marginTop:8,padding:"8px 10px",background:"#eef2ff",borderRadius:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:4}}>📋 Topics from chapter library ({topics.length})</div>
                  <div style={{fontSize:11,color:"#475569"}}>{topics.slice(0,3).map(t=>t.name).join(" · ")}{topics.length>3?` · +${topics.length-3} more`:""}</div>
                </div>
              );
            })()}
          </div>
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

// ── CHAPTER MASTER MODAL (topics only — no hours/batch/log) ───────
// FIX #1 #2: chapters section = topic management only
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

// ── NEW CHAPTER MASTER MODAL ──────────────────────────────────────
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

// ── Home Tab (v9 design — FIX #3: remove recent activity) ─────────
function HomeTab({chapters,profile,onOpenChapter,onOpenBatch,syncStatus}) {
  const batchChapters=chapters.filter(c=>c.batchCode);
  const totalAllotted=batchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalDone=batchChapters.reduce((s,c)=>s+c.completedHours,0);
  const totalExtra=batchChapters.reduce((s,c)=>s+(c.extraHours||0),0);
  const pct=totalAllotted>0?(totalDone/totalAllotted)*100:0;
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning ☀️":hr<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  const emoji=SUBJECT_EMOJI[profile.subject]||"📖";
  const batches=[...new Set(batchChapters.map(c=>c.batchCode))].sort();

  return(
    <div style={{padding:"0 0 20px"}}>
      {/* Hero Banner — v9 original */}
      <div style={{background:"linear-gradient(135deg,#4f46e5 0%,#7c3aed 60%,#6366f1 100%)",padding:"28px 20px 24px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontSize:13,opacity:.75,fontWeight:500}}>{gw},</div>
            <div style={{fontSize:24,fontWeight:900,letterSpacing:"-.5px",marginTop:2}}>{profile.code} {sal} 👋</div>
            <div style={{fontSize:12,opacity:.6,marginTop:2}}>{profile.name} · {emoji} {profile.subject||"Teacher"}</div>
          </div>
          {syncStatus&&<SyncBadge status={syncStatus}/>}
        </div>
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[{label:"Total Taken",val:fmtHours(totalDone),icon:"⏱️"},{label:"Allotted",val:fmtHours(totalAllotted),icon:"📋"},{label:"Extra",val:fmtHours(totalExtra),icon:"⭐"}].map(s=>(
            <div key={s.label} style={{flex:1,background:"rgba(255,255,255,.15)",borderRadius:14,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:15,fontWeight:900}}>{s.val}</div>
              <div style={{fontSize:9,opacity:.75,fontWeight:600,marginTop:1}}>{s.label}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct}/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,opacity:.8,fontWeight:600}}>
          <span>{pct.toFixed(0)}% overall progress</span>
          <span>{batchChapters.length} chapters · {batches.length} batches</span>
        </div>
      </div>

      <div style={{padding:"20px 16px 0"}}>
        {/* Batch Pills */}
        {batches.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:10}}>🗂️ Your Batches</div>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
              {batches.map((b,i)=>{
                const bc=BATCH_COLORS[i%BATCH_COLORS.length];
                const chs=batchChapters.filter(c=>c.batchCode===b);
                const done=chs.reduce((s,c)=>s+c.completedHours,0);
                const total=chs.reduce((s,c)=>s+c.totalHours,0);
                const p=total>0?(done/total)*100:0;
                return(
                  <div key={b} onClick={()=>onOpenBatch(b)} style={{flexShrink:0,background:`linear-gradient(135deg,${bc},${bc}cc)`,borderRadius:16,padding:"12px 16px",color:"#fff",cursor:"pointer",minWidth:110,boxShadow:`0 4px 16px ${bc}44`}}>
                    <div style={{fontSize:20,fontWeight:900,marginBottom:2}}>{b}</div>
                    <div style={{fontSize:11,opacity:.8}}>{chs.length} chapters</div>
                    <div style={{background:"rgba(255,255,255,.25)",borderRadius:99,height:4,marginTop:8}}>
                      <div style={{width:`${Math.min(p,100)}%`,height:"100%",background:"#fff",borderRadius:99}}/>
                    </div>
                    <div style={{fontSize:10,opacity:.8,marginTop:3}}>{p.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FIX #3: No recent activity section */}

        {batchChapters.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
            <div style={{fontSize:56,marginBottom:16}}>📭</div>
            <div style={{fontWeight:800,fontSize:18,color:"#475569",marginBottom:8}}>No batches yet</div>
            <div style={{fontSize:14}}>Go to Batches tab to add your first batch</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chapters Tab (FIX #1 #2 #4: topic manager, one entry per chapter, no batch/hours/logo) ──
function ChaptersTab({masterChapters,onOpenMaster,onAddMaster,onDeleteMaster}) {
  const [search,setSearch]=useState("");
  // FIX #4: unique chapter names — masterChapters already unique (one per name)
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
            // FIX #1: compact, no logo on left, no batch/hours info
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

// ── Batches Tab (v9 design — + Add Batch button) ──────────────────
function BatchesTab({chapters,onOpenBatch,onDeleteBatch,onAddBatch}) {
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
          return(
            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:`linear-gradient(135deg,${bc},${bc}cc)`,borderRadius:20,padding:22,color:"#fff",cursor:"pointer",boxShadow:`0 6px 24px ${bc}44`,transition:"transform .2s",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{fontSize:38,fontWeight:900,letterSpacing:"-1px"}}>{b}</div>
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

// ── Profile Tab (v9 original) ─────────────────────────────────────
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
      // Save to Supabase (primary store for photo)
      supabase.from("teachers").update({photo:photoData}).eq("code",profile.code);
      // Try localStorage but ignore quota errors — Supabase is the source of truth
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
      <div style={{textAlign:"center",fontSize:12,color:"#cbd5e1",paddingBottom:10}}>LectureTrack v11 · Made with ❤️ for teachers</div>
    </div>
  );
}

// ── Batch Detail Page (FIX #6: topics auto from master, Show More) ─
function BatchPage({batchCode,color,chapters,masterChapters,onBack,onDeleteChapter,onEditChapter,onOpenChapter,onDeleteBatch}) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct=total>0?(done/total)*100:0;
  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden",borderRadius:"0 0 24px 24px"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:12,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{fontSize:42,fontWeight:900,letterSpacing:"-1px"}}>{batchCode}</div>
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
        {chapters.map(c=>{
          const cp=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
          // FIX #6: get topics from chapter itself (synced from master)
          const topics=c.topics||[];
          return(
            <BatchChapterCard key={c.id} chapter={c} cp={cp} color={color} topics={topics}
              onOpen={()=>onOpenChapter(c.id)} onEdit={()=>onEditChapter(c)} onDelete={()=>onDeleteChapter(c.id)}/>
          );
        })}
        {/* Delete batch button at bottom */}
        <button onClick={onDeleteBatch}
          style={{width:"100%",marginTop:8,padding:"14px",background:"#fff",color:"#ef4444",border:"2px solid #fecaca",borderRadius:16,fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(239,68,68,.1)"}}>
          🗑️ Delete This Entire Batch
        </button>
      </div>
    </div>
  );
}

// ── Batch Chapter Card (with Show More topics) ────────────────────
function BatchChapterCard({chapter,cp,color,topics,onOpen,onEdit,onDelete}) {
  const [showAllTopics,setShowAllTopics]=useState(false);
  const SHOW_LIMIT=3;
  const visibleTopics=showAllTopics?topics:topics.slice(0,SHOW_LIMIT);

  return(
    <div style={{background:"#fff",borderRadius:18,padding:16,marginBottom:12,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${color}22`}}>
      {/* Header row */}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
        <div onClick={onOpen} style={{fontSize:15,fontWeight:800,color:"#0f172a",flex:1,cursor:"pointer"}}>{chapter.name}</div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onEdit} style={{background:"#eef2ff",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
          <button onClick={onDelete} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
        </div>
      </div>
      {/* Stats */}
      <div onClick={onOpen} style={{cursor:"pointer"}}>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours)},{l:"Taken",v:fmtHours(chapter.completedHours),col:"#10b981"},{l:"Extra",v:fmtHours(chapter.extraHours||0),col:"#f59e0b"},{l:"Left",v:fmtHours(Math.max(0,chapter.totalHours-chapter.completedHours)),col:"#ef4444"}].map(s=>(
            <div key={s.l} style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
              <div style={{fontSize:12,fontWeight:800,color:s.col||"#0f172a"}}>{s.v}</div>
              <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={cp} color={color} bg="#f1f5f9" height={5}/>
        <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{cp.toFixed(0)}% · Tap to open →</div>
      </div>
      {/* FIX #6: Topics with Show More */}
      {topics.length>0&&(
        <div style={{marginTop:10,borderTop:"1px solid #f1f5f9",paddingTop:10}}>
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
  );
}

// ── Chapter Detail Page (v9 original — hours + log + topics + notes) ──
function DetailPage({chapter,color,onUpdate,onBack,syncStatus}) {
  const [logH,setLogH]=useState("");
  const [extraH,setExtraH]=useState("");
  const [logDate,setLogDate]=useState(todayStr());
  const [logNote,setLogNote]=useState("");
  const [newTopic,setNewTopic]=useState("");
  const [notes,setNotes]=useState(chapter.notes||"");
  const [showLogs,setShowLogs]=useState(false);
  const [editLog,setEditLog]=useState(null);
  const ntRef=useRef(null);

  const pct=chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining=Math.max(0,chapter.totalHours-chapter.completedHours);
  const status=getStatus(chapter.completedHours,chapter.totalHours);
  const logs=chapter.hourLogs||[];

  const logHours=()=>{
    const h=roundToMinute(parseHours(logH));
    if(!h||h<=0) return;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote,type:"regular"};
    onUpdate({...chapter,completedHours:roundToMinute(chapter.completedHours+h),hourLogs:[...logs,newLog]});
    setLogH("");setLogNote("");
  };

  const logExtra=()=>{
    const h=roundToMinute(parseHours(extraH));
    if(!h||h<=0) return;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote||"Extra",type:"extra"};
    onUpdate({...chapter,completedHours:roundToMinute(chapter.completedHours+h),extraHours:roundToMinute((chapter.extraHours||0)+h),hourLogs:[...logs,newLog]});
    setExtraH("");setLogNote("");
  };

  const deleteLog=logId=>{
    const log=logs.find(l=>l.id===logId);
    if(!log||!window.confirm(`Remove ${fmtHours(log.hours)} on ${fmtDate(log.date)}?`)) return;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours-log.hours)),extraHours:log.type==="extra"?roundToMinute(Math.max(0,(chapter.extraHours||0)-log.hours)):chapter.extraHours,hourLogs:logs.filter(l=>l.id!==logId)});
  };

  const saveEditLog=()=>{
    if(!editLog) return;
    const old=logs.find(l=>l.id===editLog.id);
    if(!old) return;
    const newH=roundToMinute(parseHours(editLog.hours));
    const diff=newH-old.hours;
    onUpdate({...chapter,completedHours:roundToMinute(Math.max(0,chapter.completedHours+diff)),extraHours:old.type==="extra"?roundToMinute(Math.max(0,(chapter.extraHours||0)+diff)):chapter.extraHours,hourLogs:logs.map(l=>l.id===editLog.id?{...l,hours:newH,date:editLog.date,note:editLog.note}:l)});
    setEditLog(null);
  };

  const toggleTopic=id=>onUpdate({...chapter,topics:(chapter.topics||[]).map(t=>t.id===id?{...t,done:!t.done}:t)});
  const markLast=id=>onUpdate({...chapter,lastCompletedTopic:chapter.lastCompletedTopic===id?null:id});
  const deleteTopic=id=>onUpdate({...chapter,topics:(chapter.topics||[]).filter(t=>t.id!==id)});
  const addTopic=()=>{if(!newTopic.trim())return;onUpdate({...chapter,topics:[...(chapter.topics||[]),{id:uid(),name:newTopic.trim(),done:false}]});setNewTopic("");};
  const handleNotes=v=>{setNotes(v);clearTimeout(ntRef.current);ntRef.current=setTimeout(()=>onUpdate({...chapter,notes:v}),800);};

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
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={logH} onChange={e=>setLogH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logHours()} placeholder="e.g. 1.5"
                  style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                {logH&&<div style={{fontSize:11,color:color,marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(logH))}</div>}
              </div>
              <button onClick={logHours} style={{background:`linear-gradient(135deg,${color},${color}bb)`,color:"#fff",border:"none",borderRadius:12,padding:"0 22px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:15,boxShadow:`0 4px 14px ${color}44`}}>+ Log</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}>📅 Date</label>
                <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:4}}>📝 Period/Note</label>
                <input type="text" value={logNote} onChange={e=>setLogNote(e.target.value)} placeholder="e.g. Period 3" style={{width:"100%",padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
              </div>
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,#fffbeb,#fef9c3)",border:"2px solid #fde68a",borderRadius:14,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#92400e",marginBottom:10}}>⭐ Extra Hours (Beyond Allotted)</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={extraH} onChange={e=>setExtraH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logExtra()} placeholder="e.g. 0.5"
                  style={{width:"100%",padding:"11px 14px",border:"2px solid #fde68a",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fffef5",boxSizing:"border-box"}}/>
                {extraH&&<div style={{fontSize:11,color:"#92400e",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(extraH))}</div>}
              </div>
              <button onClick={logExtra} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,boxShadow:"0 4px 14px rgba(245,158,11,.3)"}}>+ Add</button>
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
                      <div style={{fontSize:14,fontWeight:800,color:log.type==="extra"?"#92400e":color}}>{fmtHours(log.hours)} {log.type==="extra"?"⭐ Extra":"🕐 Regular"}</div>
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
          <div style={{display:"flex",gap:8}}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTopic();}} placeholder="Add a topic..."
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

// ── Bottom Nav (v9 order: Home, Batches, Chapters, Profile) ───────
function BottomNav({active,onChange}) {
  const tabs=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"batches",icon:"🗂️",label:"Batches"},
    {id:"chapters",icon:"📚",label:"Chapters"},
    {id:"profile",icon:"👤",label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1px solid #f1f5f9",display:"flex",zIndex:100,boxShadow:"0 -4px 24px rgba(0,0,0,.08)"}}>
      {tabs.map(t=>{
        const isActive=active===t.id;
        return(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{fontSize:22,transition:"transform .2s",transform:isActive?"scale(1.2)":"scale(1)"}}>{t.icon}</div>
            <div style={{fontSize:10,fontWeight:isActive?800:600,color:isActive?"#6366f1":"#94a3b8"}}>{t.label}</div>
            {isActive&&<div style={{width:20,height:3,background:"#6366f1",borderRadius:99,marginTop:1}}/>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
// Data model:
//   masterChapters: stored in Supabase with batch_code = null → chapter library (topics only)
//   batchChapters:  stored with batch_code set → actual tracking chapters
export default function App() {
  const [splashDone,setSplashDone]=useState(false);
  const [profile,setProfile]=useState(()=>{try{const s=localStorage.getItem("lt_session");return s?JSON.parse(s):null;}catch{return null;}});
  const [chapters,setChapters]=useState([]);  // all from supabase
  const [loading,setLoading]=useState(false);
  const [syncStatus,setSyncStatus]=useState(null);
  const [tab,setTab]=useState("home");
  const [addBatchOpen,setAddBatchOpen]=useState(false);
  const [addMasterOpen,setAddMasterOpen]=useState(false);
  const [editMaster,setEditMaster]=useState(null);  // for topic editing
  const [editChapter,setEditChapter]=useState(null); // for batch chapter edit
  const [detailId,setDetailId]=useState(null);
  const [batchView,setBatchView]=useState(null);
  const congratsShown=useRef(false);
  const [showCongrats,setShowCongrats]=useState(false);

  useEffect(()=>{const t=setTimeout(()=>setSplashDone(true),2200);return()=>clearTimeout(t);},[]);

  // ── PWA icon injection ─────────────────────────────────────────
  useEffect(()=>{
    // Build an SVG icon for the PWA bookmark / home screen
    const svgIcon=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
      <rect width='512' height='512' rx='112' fill='%234f46e5'/>
      <rect x='40' y='40' width='432' height='432' rx='80' fill='url(%23g)'/>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%25' stop-color='%236366f1'/>
          <stop offset='100%25' stop-color='%234338ca'/>
        </linearGradient>
      </defs>
      <text x='256' y='340' font-family='Arial Black,sans-serif' font-size='260' font-weight='900'
        fill='white' text-anchor='middle'>LT</text>
    </svg>`;
    const iconUrl=`data:image/svg+xml,${svgIcon}`;
    // Inject apple-touch-icon and shortcut icon
    ['apple-touch-icon','shortcut icon','icon'].forEach(rel=>{
      let link=document.querySelector(`link[rel='${rel}']`);
      if(!link){link=document.createElement('link');document.head.appendChild(link);}
      link.rel=rel; link.href=iconUrl;
    });
    // Inject/update manifest
    let mLink=document.querySelector("link[rel='manifest']");
    if(!mLink){mLink=document.createElement('link');document.head.appendChild(mLink);}
    const manifest={
      name:'LectureTrack',short_name:'LectureTrack',
      description:'Track every hour. Teach with clarity.',
      start_url:'/',display:'standalone',
      background_color:'#4f46e5',theme_color:'#4f46e5',
      icons:[{src:iconUrl,sizes:'512x512',type:'image/svg+xml',purpose:'any maskable'}]
    };
    const mBlob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
    mLink.rel='manifest'; mLink.href=URL.createObjectURL(mBlob);
    // Also set theme-color meta
    let meta=document.querySelector("meta[name='theme-color']");
    if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta);}
    meta.content='#4f46e5';
    // App name meta
    let appMeta=document.querySelector("meta[name='apple-mobile-web-app-title']");
    if(!appMeta){appMeta=document.createElement('meta');appMeta.name='apple-mobile-web-app-title';document.head.appendChild(appMeta);}
    appMeta.content='LectureTrack';
    let capMeta=document.querySelector("meta[name='apple-mobile-web-app-capable']");
    if(!capMeta){capMeta=document.createElement('meta');capMeta.name='apple-mobile-web-app-capable';document.head.appendChild(capMeta);}
    capMeta.content='yes';
  },[]);

  // On load: fetch profile (for photo) + chapters from Supabase
  useEffect(()=>{
    if(!profile) return;
    setLoading(true);
    // Re-fetch teacher row to get latest photo (localStorage photo can be lost on quota exceed)
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
  },[profile.code]);

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

  // Master chapter: batch_code = null, totalHours = 0
  const addMasterChapter=async({name,topics})=>{
    // Prevent duplicate master chapter names
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
    // Also sync topics to all batch chapters with same name
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

  // Add batch: create batch chapters from the form rows, copying topics from master
  const addBatch=async({batchCode,rows})=>{
    const newChapters=[];
    for(const row of rows){
      const master=masterChapters.find(mc=>mc.name.toLowerCase()===row.name.trim().toLowerCase());
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
    setBatchView(null);
  };

  const editBatchChapterSave=async data=>{
    const updated={...editChapter,...data};
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    await supabase.from("chapters").upsert(toRow(profile.code,updated),{onConflict:"id"});
    setEditChapter(null);
  };

  const logout=()=>{localStorage.removeItem("lt_session");setProfile(null);setChapters([]);};

  // Derived lists
  const masterChapters=chapters.filter(c=>!c.batchCode);  // chapter library
  const batchChapters=chapters.filter(c=>c.batchCode);    // actual tracking

  const STYLE=`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;} body{margin:0;font-family:'Sora',sans-serif;background:#f8fafc;}
    ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#dde;border-radius:99px;}
    input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  `;

  if(!splashDone) return <><style>{STYLE}</style><SplashScreen/></>;
  if(!profile) return <><style>{STYLE}</style><Onboarding onDone={p=>setProfile(p)}/></>;
  if(showCongrats){
    const td=batchChapters.reduce((s,c)=>s+c.completedHours,0);
    return <><style>{STYLE}</style><CongratsScreen profile={profile} totalHours={td} onClose={()=>setShowCongrats(false)}/></>;
  }

  const batches=[...new Set(batchChapters.map(c=>c.batchCode))].sort();
  const getBatchColor=b=>BATCH_COLORS[batches.indexOf(b)%BATCH_COLORS.length];

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
        onDeleteBatch={()=>deleteBatch(batchView)}/>
      {editChapter&&(
        <Modal title="✏️ Edit Chapter" onClose={()=>setEditChapter(null)}>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Chapter Name</label>
            <input defaultValue={editChapter.name} id="ec-name" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:18}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Allotted Hours</label>
            <input type="number" defaultValue={editChapter.totalHours} id="ec-hours" style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button onClick={()=>setEditChapter(null)} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            <button onClick={()=>{const n=document.getElementById("ec-name").value;const h=document.getElementById("ec-hours").value;if(n&&h)editBatchChapterSave({name:n,totalHours:parseFloat(h)});}} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save ✓</button>
          </div>
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
          {tab==="home"&&<HomeTab chapters={batchChapters} profile={profile} onOpenChapter={id=>setDetailId(id)} onOpenBatch={b=>setBatchView(b)} syncStatus={syncStatus}/>}
          {tab==="batches"&&<BatchesTab chapters={batchChapters} onOpenBatch={b=>setBatchView(b)} onDeleteBatch={deleteBatch} onAddBatch={()=>setAddBatchOpen(true)}/>}
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
