import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ddfmkfkvvadzlihiulnj.supabase.co",
  "sb_publishable_CX_sPadRs8lkJZ2pHyQuZw_vHA_D4P6"
);

// ── Chapter Database ──────────────────────────────────────────────
const CHAPTER_DB = {
  Physics: ["Physical World","Kinematics","Laws of Motion","Work, Energy & Power","Rotational Motion","Gravitation","Properties of Matter","Thermodynamics","Kinetic Theory of Gases","Oscillations","Waves","Electrostatics","Current Electricity","Magnetic Effects of Current","Magnetism & Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature of Radiation","Atoms","Nuclei","Semiconductor Electronics","Units & Dimensions","Motion in a Straight Line","Motion in a Plane","Circular Motion","Fluid Mechanics","Thermal Properties","Electric Charges & Fields","Electric Potential & Capacitance","Moving Charges & Magnetism"],
  Chemistry: ["Some Basic Concepts","Structure of Atom","Classification of Elements","Chemical Bonding","States of Matter","Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","s-Block Elements","p-Block Elements","Organic Chemistry Basics","Hydrocarbons","Environmental Chemistry","Solid State","Solutions","Electrochemistry","Chemical Kinetics","Surface Chemistry","d & f Block Elements","Coordination Compounds","Haloalkanes & Haloarenes","Alcohols, Phenols & Ethers","Aldehydes & Ketones","Amines","Biomolecules","Polymers","Chemistry in Everyday Life","Mole Concept","Stoichiometry","Atomic Structure","Ionic Equilibrium"],
  Biology: ["The Living World","Biological Classification","Plant Kingdom","Animal Kingdom","Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals","Cell: Unit of Life","Biomolecules","Cell Cycle & Division","Transport in Plants","Mineral Nutrition","Photosynthesis","Respiration in Plants","Plant Growth","Digestion & Absorption","Breathing & Gas Exchange","Body Fluids & Circulation","Excretory Products","Locomotion & Movement","Neural Control","Chemical Coordination","Reproduction in Organisms","Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Principles of Inheritance","Molecular Basis of Inheritance","Evolution","Human Health & Disease","Biotechnology Principles","Biotechnology Applications","Organisms & Populations","Ecosystem","Biodiversity"],
  Mathematics: ["Sets","Relations & Functions","Trigonometric Functions","Mathematical Induction","Complex Numbers","Linear Inequalities","Permutations & Combinations","Binomial Theorem","Sequences & Series","Straight Lines","Conic Sections","Limits & Derivatives","Mathematical Reasoning","Statistics","Probability","Inverse Trigonometric Functions","Matrices","Determinants","Continuity & Differentiability","Application of Derivatives","Integrals","Application of Integrals","Differential Equations","Vector Algebra","3D Geometry","Linear Programming","Coordinate Geometry","Calculus","Algebra","Trigonometry"],
};
const ALL_CHAPTERS = [...new Set(Object.values(CHAPTER_DB).flat())].sort();

const SUBJECT_ICONS = { Physics:"⚡", Chemistry:"🧪", Biology:"🧬", Mathematics:"📐", "Multiple Subjects":"📚" };

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
  ok:      {color:"#10b981",bg:"#dcfce7",label:"On Track"},
  warning: {color:"#f59e0b",bg:"#fef3c7",label:"Near Limit"},
  exceeded:{color:"#ef4444",bg:"#fee2e2",label:"Exceeded"},
  none:    {color:"#94a3b8",bg:"#f1f5f9",label:"Not Started"},
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

function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}

function buildCSV(chapters) {
  const rows=[["Chapter","Batch","Allotted","Taken","Extra","Remaining","Progress %"]];
  chapters.forEach(c=>{
    const rem=Math.max(0,c.totalHours-c.completedHours);
    const pct=c.totalHours>0?((c.completedHours/c.totalHours)*100).toFixed(1)+"%":"0%";
    rows.push([c.name,c.batchCode||"—",fmtHours(c.totalHours),fmtHours(c.completedHours),fmtHours(c.extraHours||0),fmtHours(rem),pct]);
  });
  return rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
}

function toRow(teacherCode,c) {
  return {
    id:c.id, teacher_code:teacherCode, batch_code:c.batchCode||null, name:c.name,
    total_hours:c.totalHours, completed_hours:c.completedHours,
    extra_hours:c.extraHours||0, topics:c.topics||[],
    notes:c.notes||"", last_completed_topic:c.lastCompletedTopic||null,
    hour_logs:c.hourLogs||[], updated_at:new Date().toISOString()
  };
}

function fromRow(r) {
  return {
    id:r.id, batchCode:r.batch_code, name:r.name,
    totalHours:r.total_hours, completedHours:r.completed_hours,
    extraHours:r.extra_hours||0, topics:r.topics||[],
    notes:r.notes||"", lastCompletedTopic:r.last_completed_topic,
    hourLogs:r.hour_logs||[]
  };
}

// ── Splash Screen ─────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div style={{position:"fixed",inset:0,background:"#ffffff",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .sp-logo{animation:fadeIn .5s ease forwards}
        .sp-title{animation:slideUp .5s ease .25s both;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif!important;font-weight:800!important;letter-spacing:-1.5px!important}
        .sp-tag{animation:slideUp .5s ease .45s both}
      `}</style>
      <div className="sp-logo" style={{width:80,height:80,background:"#0f172a",borderRadius:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:42,marginBottom:20}}>👨‍🏫</div>
      <div className="sp-title" style={{fontSize:38,fontWeight:800,color:"#0f172a",marginBottom:8}}>LectureTrack</div>
      <div className="sp-tag" style={{fontSize:14,color:"#94a3b8",fontWeight:500,letterSpacing:".5px"}}>Track every hour. Teach with clarity.</div>
    </div>
  );
}

// ── Congrats Screen ───────────────────────────────────────────────
function CongratsScreen({profile,totalHours,onClose}) {
  const quote=MOTIVATIONAL_QUOTES[Math.floor(Math.random()*MOTIVATIONAL_QUOTES.length)];
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  const emoji=SUBJECT_ICONS[profile.subject]||"📖";
  return (
    <div style={{position:"fixed",inset:0,background:"#0f172a",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",overflowY:"auto"}}>
      <style>{`@keyframes bounce2{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}} .bns{animation:bounce2 1.2s ease infinite}`}</style>
      <div className="bns" style={{fontSize:72,marginBottom:16}}>🎉</div>
      <div style={{fontSize:30,fontWeight:900,color:"#fff",marginBottom:6,fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}>Congratulations!</div>
      <div style={{fontSize:17,fontWeight:700,color:"rgba(255,255,255,.8)",marginBottom:4}}>{profile.code} {sal}</div>
      {profile.subject&&<div style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:20}}>{emoji} {profile.subject} Teacher</div>}
      <div style={{fontSize:15,color:"rgba(255,255,255,.7)",marginBottom:28}}>You've completed <strong style={{color:"#fbbf24"}}>{fmtHours(totalHours)}</strong> of lectures! 🏆</div>
      <div style={{background:"rgba(255,255,255,.08)",borderRadius:20,padding:"22px 26px",maxWidth:340,marginBottom:30,border:"1px solid rgba(255,255,255,.12)"}}>
        <div style={{fontSize:32,marginBottom:12}}>💡</div>
        <div style={{fontSize:15,color:"rgba(255,255,255,.9)",fontWeight:600,lineHeight:1.8}}>{quote}</div>
      </div>
      <button onClick={onClose} style={{background:"#fff",color:"#0f172a",border:"none",borderRadius:16,padding:"14px 44px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
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
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);

  const handleInput=v=>{
    onChange(v);
    if (v.length<1){setSuggestions([]);setOpen(false);return;}
    const pool=subject&&subject!=="Multiple Subjects"&&CHAPTER_DB[subject]?CHAPTER_DB[subject]:ALL_CHAPTERS;
    const filtered=pool.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,8);
    setSuggestions(filtered);
    setOpen(filtered.length>0);
  };

  return (
    <div ref={ref} style={{position:"relative",marginBottom:14}}>
      <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Chapter Name</label>
      <input value={value} onChange={e=>handleInput(e.target.value)} placeholder="Type to search chapters..."
        onFocus={()=>value&&suggestions.length>0&&setOpen(true)}
        style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      {open&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,.14)",zIndex:200,maxHeight:260,overflowY:"auto",marginTop:4,border:"1.5px solid #e2e8f0"}}>
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

  const SUBJECT_OPTIONS=[
    {label:"⚡ Physics",value:"Physics"},
    {label:"🧪 Chemistry",value:"Chemistry"},
    {label:"🧬 Biology",value:"Biology"},
    {label:"📐 Mathematics",value:"Mathematics"},
    {label:"📚 Multiple",value:"Multiple Subjects"},
  ];

  const inp={width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"};

  return(
    <div style={{minHeight:"100vh",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        .ob-card{animation:fadeUp .4s ease forwards}
      `}</style>
      <div className="ob-card" style={{width:"100%",maxWidth:420}}>
        {/* Header */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,background:"#0f172a",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 16px"}}>👨‍🏫</div>
          <h2 style={{margin:"0 0 4px",fontSize:30,fontWeight:800,color:"#0f172a",fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif",letterSpacing:"-1px"}}>LectureTrack</h2>
          <p style={{margin:0,color:"#94a3b8",fontSize:13,fontWeight:500}}>Track every hour. Teach with clarity.</p>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:14,padding:4,marginBottom:24,gap:4}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}}
              style={{flex:1,padding:"10px",borderRadius:11,border:"none",cursor:"pointer",background:mode===m?"#fff":"transparent",fontWeight:800,fontSize:14,color:mode===m?"#0f172a":"#94a3b8",fontFamily:"inherit",boxShadow:mode===m?"0 1px 8px rgba(0,0,0,.1)":"none",transition:"all .2s"}}>
              {m==="login"?"🔑 Login":"📝 Register"}
            </button>
          ))}
        </div>

        {mode==="register"&&(
          <>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Full Name</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. P M Krishna" style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:6}}>Gender</label>
              <div style={{display:"flex",gap:10}}>
                {["male","female"].map(g=>(
                  <button key={g} onClick={()=>setGender(g)} style={{flex:1,padding:"10px",borderRadius:12,border:`2px solid ${gender===g?"#0f172a":"#e2e8f0"}`,background:gender===g?"#0f172a":"#f8fafc",fontWeight:700,cursor:"pointer",color:gender===g?"#fff":"#64748b",fontFamily:"inherit",fontSize:13}}>
                    {g==="male"?"👨 Male":"👩 Female"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Subject You Teach</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {SUBJECT_OPTIONS.map(s=>(
                  <button key={s.value} onClick={()=>setSubject(s.value)}
                    style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${subject===s.value?"#0f172a":"#e2e8f0"}`,background:subject===s.value?"#0f172a":"#f8fafc",fontWeight:700,cursor:"pointer",color:subject===s.value?"#fff":"#64748b",fontFamily:"inherit",fontSize:12}}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Unique Code</label>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. PMK" style={inp}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>PIN (4–6 digits)</label>
          <input type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter PIN" style={inp}/>
        </div>
        {mode==="register"&&(
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Confirm PIN</label>
            <input type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Re-enter PIN" style={inp}/>
          </div>
        )}
        {mode==="register"&&name&&code&&(
          <div style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 16px",marginBottom:14,fontSize:13,color:"#475569",fontWeight:600}}>
            {gw}, {code} {sal}! 👋
          </div>
        )}
        {error&&<div style={{background:"#fee2e2",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#dc2626",fontWeight:600}}>{error}</div>}
        <button onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}
          style={{width:"100%",padding:14,background:"#0f172a",color:"#fff",border:"none",borderRadius:14,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",opacity:loading?.7:1}}>
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
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"0"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 22px 32px",width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.18)"}}>
        <div style={{width:40,height:4,background:"#e2e8f0",borderRadius:99,margin:"0 auto 20px"}}/>
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
  const cfg={saving:{bg:"#f1f5f9",color:"#6366f1",text:"⏳ Saving..."},saved:{bg:"#dcfce7",color:"#16a34a",text:"☁️ Saved"},error:{bg:"#fee2e2",color:"#dc2626",text:"❌ Failed"}}[status];
  if(!cfg) return null;
  return <div style={{background:cfg.bg,color:cfg.color,fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:99,display:"inline-block"}}>{cfg.text}</div>;
}

function PBar({pct,color="#0f172a",bg="#f1f5f9",height=6}) {
  return(
    <div style={{background:bg,borderRadius:99,height,overflow:"hidden"}}>
      <div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .7s ease"}}/>
    </div>
  );
}

// ── Chapter Form Modal (no batch — just name + hours + topics) ────
function ChapterFormModal({chapter,onSave,onClose,subject}) {
  const [name,setName]=useState(chapter?.name||"");
  const [hours,setHours]=useState(chapter?.totalHours||"");
  const [topics,setTopics]=useState(chapter?.topics||[]);
  const [newTopic,setNewTopic]=useState("");

  const addTopic=()=>{if(!newTopic.trim())return;setTopics(prev=>[...prev,{id:uid(),name:newTopic.trim(),done:false}]);setNewTopic("");};

  return(
    <Modal title={chapter?"Edit Chapter":"Add Chapter"} onClose={onClose}>
      <ChapterAutocomplete value={name} onChange={setName} subject={subject}/>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Total Allotted Hours</label>
        <input type="number" value={hours} onChange={e=>setHours(e.target.value)} placeholder="e.g. 1.5 = 1h 30m" min={0} step={0.0833}
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
        {hours&&<div style={{fontSize:12,color:"#6366f1",marginTop:4,fontWeight:700}}>= {fmtHours(parseFloat(hours)||0)}</div>}
      </div>

      {/* Topics inside add chapter */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>📋 Topics (optional)</label>
        {topics.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"#f8fafc",border:"1.5px solid #e2e8f0",marginBottom:6}}>
            <span style={{flex:1,fontSize:13,color:"#1e293b",fontWeight:600}}>{i+1}. {t.name}</span>
            <button onClick={()=>setTopics(prev=>prev.filter(x=>x.id!==t.id))} style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:16,padding:0}}>×</button>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTopic()} placeholder="Add a topic..."
            style={{flex:1,padding:"10px 12px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
          <button onClick={addTopic} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>+ Add</button>
        </div>
      </div>

      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>{if(name.trim()&&hours)onSave({name:name.trim(),totalHours:parseFloat(hours),topics})}}
          style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save ✓</button>
      </div>
    </Modal>
  );
}

// ── Batch Form Modal ──────────────────────────────────────────────
function BatchFormModal({chapters,onSave,onClose}) {
  const [batchCode,setBatchCode]=useState("");
  const [selected,setSelected]=useState([]);
  const [hours,setHours]=useState({});

  const toggleChapter=id=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);

  return(
    <Modal title="➕ Add Batch" onClose={onClose}>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Batch Code</label>
        <input value={batchCode} onChange={e=>setBatchCode(e.target.value.toUpperCase())} placeholder="e.g. X1, R2, 11A"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Select Chapters & Set Hours</label>
        {chapters.length===0&&<div style={{fontSize:13,color:"#94a3b8",padding:"12px 0"}}>No chapters yet. Add chapters first.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:260,overflowY:"auto"}}>
          {chapters.map(c=>(
            <div key={c.id} style={{padding:"12px 14px",borderRadius:12,border:`2px solid ${selected.includes(c.id)?"#0f172a":"#e2e8f0"}`,background:selected.includes(c.id)?"#f8fafc":"#fff",cursor:"pointer"}} onClick={()=>toggleChapter(c.id)}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:selected.includes(c.id)?8:0}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${selected.includes(c.id)?"#0f172a":"#cbd5e1"}`,background:selected.includes(c.id)?"#0f172a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {selected.includes(c.id)&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
                </div>
                <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>{c.name}</span>
              </div>
              {selected.includes(c.id)&&(
                <div onClick={e=>e.stopPropagation()} style={{marginLeft:30}}>
                  <input type="number" value={hours[c.id]||""} onChange={e=>setHours(prev=>({...prev,[c.id]:e.target.value}))}
                    placeholder="Allotted hours for this batch" min={0} step={0.5}
                    style={{width:"100%",padding:"8px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"}}/>
                  {hours[c.id]&&<div style={{fontSize:11,color:"#6366f1",marginTop:2,fontWeight:700}}>= {fmtHours(parseFloat(hours[c.id])||0)}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={()=>{if(batchCode.trim()&&selected.length>0)onSave({batchCode:batchCode.trim(),chapterIds:selected,hoursMap:hours})}}
          style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"12px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Create Batch ✓</button>
      </div>
    </Modal>
  );
}

// ── Home Tab ──────────────────────────────────────────────────────
function HomeTab({chapters,profile,onOpenChapter,onOpenBatch,syncStatus}) {
  const allBatchChapters=chapters.filter(c=>c.batchCode);
  const totalAllotted=allBatchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalDone=chapters.reduce((s,c)=>s+c.completedHours,0);
  const totalExtra=chapters.reduce((s,c)=>s+(c.extraHours||0),0);
  const pct=totalAllotted>0?(totalDone/totalAllotted)*100:0;
  const hr=new Date().getHours();
  const gw=hr<12?"Good Morning ☀️":hr<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  const emoji=SUBJECT_ICONS[profile.subject]||"📖";
  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))].sort();

  const recentChapters=[...chapters].filter(c=>c.completedHours>0).sort((a,b)=>{
    const aL=a.hourLogs?.slice(-1)[0]?.date||"";
    const bL=b.hourLogs?.slice(-1)[0]?.date||"";
    return bL.localeCompare(aL);
  }).slice(0,4);

  return(
    <div style={{paddingBottom:20}}>
      {/* Hero */}
      <div style={{background:"#0f172a",padding:"28px 20px 26px",color:"#fff",borderRadius:"0 0 28px 28px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:13,opacity:.5,fontWeight:500,marginBottom:4}}>{gw},</div>
            <div style={{fontSize:22,fontWeight:900,letterSpacing:"-.5px",lineHeight:1.2}}>{profile.code} {sal}</div>
            <div style={{fontSize:12,opacity:.4,marginTop:4}}>{profile.name} · {emoji} {profile.subject||"Teacher"}</div>
          </div>
          {syncStatus&&<SyncBadge status={syncStatus}/>}
        </div>
        {/* 3 stat boxes */}
        <div style={{display:"flex",gap:10,marginBottom:16}}>
          {[
            {label:"Total Taken",val:fmtHours(totalDone),icon:"⏱️"},
            {label:"Allotted",val:fmtHours(totalAllotted),icon:"📋"},
            {label:"Extra",val:fmtHours(totalExtra),icon:"⭐"},
          ].map(s=>(
            <div key={s.label} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:14,padding:"12px 6px",textAlign:"center",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontSize:18,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:16,fontWeight:900}}>{s.val}</div>
              <div style={{fontSize:9,opacity:.5,fontWeight:600,marginTop:2,textTransform:"uppercase",letterSpacing:".5px"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct} color="#fff" bg="rgba(255,255,255,.15)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:11,opacity:.5,fontWeight:600}}>
          <span>{pct.toFixed(0)}% overall progress</span>
          <span>{chapters.length} chapters · {batches.length} batches</span>
        </div>
      </div>

      <div style={{padding:"20px 16px 0"}}>
        {/* Batch Pills */}
        {batches.length>0&&(
          <div style={{marginBottom:22}}>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Your Batches</div>
            <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:4,scrollbarWidth:"none"}}>
              {batches.map((b,i)=>{
                const bc=BATCH_COLORS[i%BATCH_COLORS.length];
                const chs=chapters.filter(c=>c.batchCode===b);
                const done=chs.reduce((s,c)=>s+c.completedHours,0);
                const total=chs.reduce((s,c)=>s+c.totalHours,0);
                const p=total>0?(done/total)*100:0;
                return(
                  <div key={b} onClick={()=>onOpenBatch(b)} style={{flexShrink:0,background:"#fff",border:`2px solid ${bc}33`,borderRadius:18,padding:"14px 16px",cursor:"pointer",minWidth:110,boxShadow:`0 2px 12px ${bc}22`}}>
                    <div style={{fontSize:22,fontWeight:900,color:bc,marginBottom:2}}>{b}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>{chs.length} ch.</div>
                    <PBar pct={p} color={bc} bg={`${bc}22`}/>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:3,fontWeight:600}}>{p.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent */}
        {recentChapters.length>0&&(
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>Recent Activity</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {recentChapters.map(c=>{
                const p=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
                const lastLog=c.hourLogs?.slice(-1)[0];
                return(
                  <div key={c.id} onClick={()=>onOpenChapter(c.id)} style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 8px rgba(0,0,0,.06)",cursor:"pointer",display:"flex",alignItems:"center",gap:14,border:"1.5px solid #f1f5f9"}}>
                    <div style={{width:40,height:40,background:"#f1f5f9",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📖</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{lastLog?fmtDate(lastLog.date):"No logs yet"}</div>
                      <PBar pct={p} color="#6366f1" bg="#f1f5f9" height={4}/>
                    </div>
                    <div style={{fontSize:13,color:"#94a3b8",fontWeight:700}}>→</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {chapters.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
            <div style={{fontSize:52,marginBottom:16}}>📭</div>
            <div style={{fontWeight:800,fontSize:18,color:"#475569",marginBottom:8}}>Nothing here yet</div>
            <div style={{fontSize:14}}>Add chapters first, then create batches</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chapters Tab ──────────────────────────────────────────────────
function ChaptersTab({chapters,profile,onOpenChapter,onAddChapter,onEditChapter,onDeleteChapter}) {
  const [search,setSearch]=useState("");
  const filtered=chapters.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a"}}>Chapters</div>
        <button onClick={onAddChapter} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+ Add</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search chapters..."
        style={{width:"100%",padding:"11px 16px",border:"2px solid #f1f5f9",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",marginBottom:14,boxSizing:"border-box"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"50px 20px",color:"#94a3b8"}}><div style={{fontSize:40}}>📭</div><div style={{fontWeight:700,marginTop:10}}>No chapters</div></div>}
        {filtered.map(c=>{
          const pct=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
          const status=getStatus(c.completedHours,c.totalHours);
          const topicCount=(c.topics||[]).length;
          const doneTopic=(c.topics||[]).filter(t=>t.done).length;
          return(
            <div key={c.id} onClick={()=>onOpenChapter(c.id)}
              style={{background:"#fff",borderRadius:16,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.05)",cursor:"pointer",border:"1.5px solid #f1f5f9",display:"flex",alignItems:"center",gap:14,transition:"box-shadow .2s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.1)"}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.05)"}>
              {/* Icon */}
              <div style={{width:44,height:44,background:"#f8fafc",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,border:"2px solid #f1f5f9"}}>
                {SUBJECT_ICONS[profile.subject]||"📖"}
              </div>
              {/* Info */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:800,color:"#0f172a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}>{c.name}</div>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>{fmtHours(c.completedHours)} / {fmtHours(c.totalHours)}</span>
                  {topicCount>0&&<span style={{fontSize:11,color:"#94a3b8",fontWeight:600}}>· {doneTopic}/{topicCount} topics</span>}
                  <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:STATUS[status].bg,color:STATUS[status].color}}>{STATUS[status].label}</span>
                </div>
                <PBar pct={pct} color="#6366f1" bg="#f1f5f9" height={4}/>
              </div>
              {/* Actions */}
              <div style={{display:"flex",flexDirection:"column",gap:6}} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>onEditChapter(c)} style={{background:"#f8fafc",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                <button onClick={()=>onDeleteChapter(c.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Batches Tab ───────────────────────────────────────────────────
function BatchesTab({chapters,allChapters,onOpenBatch,onDeleteBatch,onAddBatch}) {
  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))].sort();
  return(
    <div style={{padding:"20px 16px 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:20,fontWeight:900,color:"#0f172a"}}>Batches</div>
        <button onClick={onAddBatch} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"10px 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>+ Add Batch</button>
      </div>
      {batches.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}><div style={{fontSize:44}}>📭</div><div style={{fontWeight:700,marginTop:12,fontSize:16}}>No batches yet</div><div style={{fontSize:13,marginTop:4}}>Add chapters first, then create a batch</div></div>}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {batches.map((b,i)=>{
          const bc=BATCH_COLORS[i%BATCH_COLORS.length];
          const chs=chapters.filter(c=>c.batchCode===b);
          const done=chs.reduce((s,c)=>s+c.completedHours,0);
          const total=chs.reduce((s,c)=>s+c.totalHours,0);
          const p=total>0?(done/total)*100:0;
          return(
            <div key={b} onClick={()=>onOpenBatch(b)} style={{background:"#fff",borderRadius:18,padding:"18px 20px",boxShadow:"0 1px 8px rgba(0,0,0,.06)",cursor:"pointer",border:`2px solid ${bc}22`,transition:"box-shadow .2s"}}
              onMouseEnter={e=>e.currentTarget.style.boxShadow=`0 4px 20px ${bc}33`}
              onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 8px rgba(0,0,0,.06)"}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontSize:26,fontWeight:900,color:bc,letterSpacing:"-1px"}}>{b}</div>
                  <div style={{fontSize:12,color:"#94a3b8",marginTop:2}}>{chs.length} chapters</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#0f172a"}}>{fmtHours(done)}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>of {fmtHours(total)}</div>
                </div>
              </div>
              <PBar pct={p} color={bc} bg={`${bc}22`} height={6}/>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontWeight:600}}>{p.toFixed(0)}% · Tap to manage →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────
function ProfileTab({profile,chapters,onLogout,onUpdateProfile,recentDeletes,onRestoreChapter}) {
  const fileRef=useRef();
  const totalDone=chapters.reduce((s,c)=>s+c.completedHours,0);
  const totalAllotted=chapters.reduce((s,c)=>s+c.totalHours,0);
  const totalExtra=chapters.reduce((s,c)=>s+(c.extraHours||0),0);
  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))];
  const emoji=SUBJECT_ICONS[profile.subject]||"📖";

  const handlePhotoUpload=e=>{
    const file=e.target.files[0];
    if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const photoData=ev.target.result;
      const updated={...profile,photo:photoData};
      localStorage.setItem("lt_session",JSON.stringify(updated));
      onUpdateProfile(updated);
      supabase.from("teachers").update({photo:photoData}).eq("code",profile.code);
    };
    reader.readAsDataURL(file);
  };

  const downloadCSV=()=>{
    const csv=buildCSV(chapters);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`LectureTrack_${profile.code}_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;
    a.click();
  };

  return(
    <div style={{padding:"20px 16px 20px"}}>
      {/* Profile Card */}
      <div style={{background:"#0f172a",borderRadius:24,padding:"28px 24px",color:"#fff",marginBottom:20,textAlign:"center",position:"relative"}}>
        <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
          <div style={{width:88,height:88,borderRadius:"50%",border:"3px solid rgba(255,255,255,.2)",overflow:"hidden",margin:"0 auto",background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:42}}>
            {profile.photo?<img src={profile.photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span>{profile.gender==="female"?"👩":"👨"}</span>}
          </div>
          <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,background:"#fff",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.3)",fontSize:14}}>📷</button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
        <div style={{fontSize:22,fontWeight:900,marginBottom:4,fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif"}}>{profile.name}</div>
        <div style={{fontSize:13,opacity:.6,marginBottom:6}}>{emoji} {profile.subject||"Teacher"}</div>
        <div style={{fontSize:12,opacity:.4,background:"rgba(255,255,255,.08)",borderRadius:99,padding:"3px 14px",display:"inline-block"}}>{profile.code}</div>
      </div>

      {/* Stats grid */}
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>Your Stats</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[
            {label:"Hours Taken",val:fmtHours(totalDone),color:"#6366f1",icon:"⏱️"},
            {label:"Allotted",val:fmtHours(totalAllotted),color:"#10b981",icon:"📋"},
            {label:"Extra Hours",val:fmtHours(totalExtra),color:"#f59e0b",icon:"⭐"},
            {label:"Batches",val:batches.length,color:"#ef4444",icon:"🗂️"},
            {label:"Chapters",val:chapters.length,color:"#8b5cf6",icon:"📚"},
            {label:"Progress",val:(totalAllotted>0?(totalDone/totalAllotted)*100:0).toFixed(0)+"%",color:"#14b8a6",icon:"📈"},
          ].map(s=>(
            <div key={s.label} style={{background:"#f8fafc",borderRadius:14,padding:"14px 16px",border:"1.5px solid #f1f5f9"}}>
              <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>Quick Actions</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={downloadCSV} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#0f172a",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,textAlign:"left"}}>
            <span style={{fontSize:22}}>📊</span>
            <div>
              <div>Download CSV Report</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:500,marginTop:1}}>All chapters, hours, progress</div>
            </div>
          </button>
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#fff",color:"#ef4444",border:"2px solid #fee2e2",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,textAlign:"left"}}>
            <span style={{fontSize:22}}>🔒</span>
            <div>
              <div>Logout</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:500,marginTop:1}}>Sign out of your account</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Deletes */}
      {recentDeletes&&recentDeletes.length>0&&(
        <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>
          <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:4}}>🗑️ Recently Deleted</div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:12}}>Restore chapters deleted in this session</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recentDeletes.map(c=>(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#f8fafc",borderRadius:12,border:"1.5px solid #e2e8f0"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{c.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{c.batchCode||"No batch"}</div>
                </div>
                <button onClick={()=>onRestoreChapter(c)} style={{background:"#dcfce7",color:"#16a34a",border:"none",borderRadius:8,padding:"6px 12px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Restore</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{textAlign:"center",fontSize:12,color:"#cbd5e1",paddingBottom:10}}>LectureTrack v10 · Made with ❤️ for teachers</div>
    </div>
  );
}

// ── Batch Detail Page ─────────────────────────────────────────────
function BatchPage({batchCode,color,chapters,onBack,onDeleteChapter,onEditChapter,onOpenChapter,onDeleteBatch}) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct=total>0?(done/total)*100:0;

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      {/* Header */}
      <div style={{background:"#0f172a",padding:"24px 20px 24px",color:"#fff",borderRadius:"0 0 24px 24px"}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:16}}>← Back</button>
        <div style={{fontSize:36,fontWeight:900,color,letterSpacing:"-1px",lineHeight:1}}>{batchCode}</div>
        <div style={{fontSize:13,opacity:.5,marginTop:4,marginBottom:16}}>{chapters.length} chapters</div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          {[{l:"Allotted",v:fmtHours(total)},{l:"Completed",v:fmtHours(done)},{l:"Remaining",v:fmtHours(Math.max(0,total-done))}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{fontSize:15,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:9,opacity:.5,fontWeight:600,marginTop:2,textTransform:"uppercase"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct} color={color} bg="rgba(255,255,255,.1)"/>
        <div style={{fontSize:11,opacity:.5,marginTop:5,fontWeight:600}}>{pct.toFixed(0)}% overall</div>
      </div>

      <div style={{padding:"20px 16px 100px"}}>
        {chapters.map(c=>{
          const cp=c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
          const status=getStatus(c.completedHours,c.totalHours);
          return(
            <div key={c.id} onClick={()=>onOpenChapter(c.id)} style={{background:"#fff",borderRadius:16,padding:"16px",marginBottom:12,boxShadow:"0 1px 8px rgba(0,0,0,.06)",cursor:"pointer",border:"1.5px solid #f1f5f9"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:800,color:"#0f172a",flex:1}}>{c.name}</div>
                <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>onEditChapter(c)} style={{background:"#f8fafc",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                  <button onClick={()=>onDeleteChapter(c.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {[{l:"Allotted",v:fmtHours(c.totalHours)},{l:"Taken",v:fmtHours(c.completedHours),col:"#10b981"},{l:"Extra",v:fmtHours(c.extraHours||0),col:"#f59e0b"},{l:"Left",v:fmtHours(Math.max(0,c.totalHours-c.completedHours)),col:"#ef4444"}].map(s=>(
                  <div key={s.l} style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:12,fontWeight:800,color:s.col||"#0f172a"}}>{s.v}</div>
                    <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:1}}>{s.l}</div>
                  </div>
                ))}
              </div>
              <PBar pct={cp} color={color} bg="#f1f5f9" height={5}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:11,color:"#94a3b8"}}>{cp.toFixed(0)}% · Tap to open →</span>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,background:STATUS[status].bg,color:STATUS[status].color}}>{STATUS[status].label}</span>
              </div>
            </div>
          );
        })}

        {/* Delete Batch Button */}
        <button onClick={onDeleteBatch} style={{width:"100%",marginTop:16,padding:"16px",background:"#fff",color:"#ef4444",border:"2px solid #fee2e2",borderRadius:16,fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          🗑️ Delete This Batch
        </button>
      </div>
    </div>
  );
}

// ── Chapter Detail Page ───────────────────────────────────────────
function DetailPage({chapter,color,onUpdate,onBack,syncStatus}) {
  const [logH,setLogH]=useState("");
  const [extraH,setExtraH]=useState("");
  const [logDate,setLogDate]=useState(todayStr());
  const [logNote,setLogNote]=useState("");
  const [selectedTopics,setSelectedTopics]=useState([]);
  const [newTopic,setNewTopic]=useState("");
  const [notes,setNotes]=useState(chapter.notes||"");
  const [showLogs,setShowLogs]=useState(false);
  const [editLog,setEditLog]=useState(null);
  const ntRef=useRef(null);

  const pct=chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining=Math.max(0,chapter.totalHours-chapter.completedHours);
  const status=getStatus(chapter.completedHours,chapter.totalHours);
  const logs=chapter.hourLogs||[];

  // Fix #7: extra hours only counted as extra when logged via extra section
  const logHours=()=>{
    const h=roundToMinute(parseHours(logH));
    if(!h||h<=0) return;
    // Mark topics as done if selected
    const updatedTopics=(chapter.topics||[]).map(t=>selectedTopics.includes(t.id)?{...t,done:true}:t);
    const topicNote=selectedTopics.length>0?" ["+selectedTopics.map(id=>(chapter.topics||[]).find(t=>t.id===id)?.name).filter(Boolean).join(", ")+"]":"";
    const newLog={id:uid(),hours:h,date:logDate,note:(logNote||"")+topicNote,type:"regular"};
    onUpdate({...chapter,completedHours:roundToMinute(chapter.completedHours+h),topics:updatedTopics,hourLogs:[...logs,newLog]});
    setLogH("");setLogNote("");setSelectedTopics([]);
  };

  const logExtra=()=>{
    const h=roundToMinute(parseHours(extraH));
    if(!h||h<=0) return;
    const newLog={id:uid(),hours:h,date:logDate,note:logNote||"",type:"extra"};
    // extra hours: adds to completedHours AND extraHours — NOT counted again as regular
    onUpdate({...chapter,completedHours:roundToMinute(chapter.completedHours+h),extraHours:roundToMinute((chapter.extraHours||0)+h),hourLogs:[...logs,newLog]});
    setExtraH("");setLogNote("");
  };

  const deleteLog=logId=>{
    const log=logs.find(l=>l.id===logId);
    if(!log||!window.confirm(`Remove ${fmtHours(log.hours)} on ${fmtDate(log.date)}?`)) return;
    onUpdate({
      ...chapter,
      completedHours:roundToMinute(Math.max(0,chapter.completedHours-log.hours)),
      extraHours:log.type==="extra"?roundToMinute(Math.max(0,(chapter.extraHours||0)-log.hours)):chapter.extraHours,
      hourLogs:logs.filter(l=>l.id!==logId)
    });
  };

  const saveEditLog=()=>{
    if(!editLog) return;
    const old=logs.find(l=>l.id===editLog.id);
    if(!old) return;
    const newH=roundToMinute(parseHours(editLog.hours));
    const diff=newH-old.hours;
    onUpdate({
      ...chapter,
      completedHours:roundToMinute(Math.max(0,chapter.completedHours+diff)),
      extraHours:old.type==="extra"?roundToMinute(Math.max(0,(chapter.extraHours||0)+diff)):chapter.extraHours,
      hourLogs:logs.map(l=>l.id===editLog.id?{...l,hours:newH,date:editLog.date,note:editLog.note}:l)
    });
    setEditLog(null);
  };

  const toggleTopic=id=>onUpdate({...chapter,topics:(chapter.topics||[]).map(t=>t.id===id?{...t,done:!t.done}:t)});
  const markLast=id=>onUpdate({...chapter,lastCompletedTopic:chapter.lastCompletedTopic===id?null:id});
  const deleteTopic=id=>onUpdate({...chapter,topics:(chapter.topics||[]).filter(t=>t.id!==id)});
  const addTopic=()=>{if(!newTopic.trim())return;onUpdate({...chapter,topics:[...(chapter.topics||[]),{id:uid(),name:newTopic.trim(),done:false}]});setNewTopic("");};
  const handleNotes=v=>{setNotes(v);clearTimeout(ntRef.current);ntRef.current=setTimeout(()=>onUpdate({...chapter,notes:v}),800);};

  const Sec=({title,children})=>(
    <div style={{background:"#fff",borderRadius:18,padding:18,marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.05)"}}>
      <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:12}}>{title}</div>
      {children}
    </div>
  );

  const inp16={width:"100%",padding:"11px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box"};

  return(
    <div style={{minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:"#0f172a",padding:"24px 20px 24px",color:"#fff",borderRadius:"0 0 24px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>← Back</button>
          <SyncBadge status={syncStatus}/>
        </div>
        {chapter.batchCode&&<div style={{fontSize:13,color:color,fontWeight:700,marginBottom:4,letterSpacing:".5px"}}>{chapter.batchCode}</div>}
        <div style={{fontSize:22,fontWeight:900,lineHeight:1.3,marginBottom:16}}>{chapter.name}</div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          {[{l:"Allotted",v:fmtHours(chapter.totalHours)},{l:"Taken",v:fmtHours(chapter.completedHours)},{l:"Extra",v:fmtHours(chapter.extraHours||0)},{l:"Left",v:fmtHours(remaining)}].map(s=>(
            <div key={s.l} style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 4px",textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800}}>{s.v}</div>
              <div style={{fontSize:9,opacity:.5,fontWeight:600,marginTop:2,textTransform:"uppercase"}}>{s.l}</div>
            </div>
          ))}
        </div>
        <PBar pct={pct} color={color} bg="rgba(255,255,255,.1)"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:5,fontSize:11,opacity:.5,fontWeight:600}}>
          <span>{pct.toFixed(0)}% complete</span><span>{STATUS[status].label}</span>
        </div>
        {status==="exceeded"&&<div style={{marginTop:10,background:"rgba(239,68,68,.2)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700}}>⚠️ Exceeded by {fmtHours(chapter.completedHours-chapter.totalHours)}</div>}
      </div>

      <div style={{padding:"16px 16px 80px",maxWidth:560,margin:"0 auto"}}>

        <Sec title="📅 Log Class Hours">
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={logH} onChange={e=>setLogH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logHours()} placeholder="Hours (e.g. 1.5 = 1h 30m)" style={inp16}/>
                {logH&&<div style={{fontSize:11,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(logH))}</div>}
              </div>
              <button onClick={logHours} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,flexShrink:0}}>+ Log</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:3}}>DATE</label>
                <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)} style={inp16}/>
              </div>
              <div style={{flex:1}}>
                <label style={{display:"block",fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:3}}>PERIOD / NOTE</label>
                <input type="text" value={logNote} onChange={e=>setLogNote(e.target.value)} placeholder="e.g. Period 3" style={inp16}/>
              </div>
            </div>
          </div>

          {/* Tick topics when logging */}
          {(chapter.topics||[]).length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>📋 Topics covered in this class:</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {(chapter.topics||[]).map(t=>(
                  <label key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:selectedTopics.includes(t.id)?"#eef2ff":"#f8fafc",border:`1.5px solid ${selectedTopics.includes(t.id)?"#6366f1":"#e2e8f0"}`,cursor:"pointer"}}>
                    <input type="checkbox" checked={selectedTopics.includes(t.id)} onChange={()=>setSelectedTopics(prev=>prev.includes(t.id)?prev.filter(x=>x!==t.id):[...prev,t.id])} style={{width:16,height:16,accentColor:"#6366f1",cursor:"pointer",flexShrink:0}}/>
                    <span style={{fontSize:13,color:t.done?"#94a3b8":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:600}}>{t.name}</span>
                    {t.done&&<span style={{fontSize:10,color:"#10b981",fontWeight:700,marginLeft:"auto"}}>✓ Done</span>}
                  </label>
                ))}
              </div>
              {selectedTopics.length>0&&<div style={{fontSize:12,color:"#6366f1",marginTop:6,fontWeight:700}}>✓ {selectedTopics.length} topic(s) will be marked as covered</div>}
            </div>
          )}

          {/* Extra hours */}
          <div style={{background:"#fffbeb",border:"2px solid #fde68a",borderRadius:14,padding:"14px"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#92400e",marginBottom:8}}>⭐ Extra Hours (Beyond Allotted)</div>
            <div style={{display:"flex",gap:8}}>
              <div style={{flex:1}}>
                <input type="number" min={0} step={0.0833} value={extraH} onChange={e=>setExtraH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logExtra()} placeholder="Extra hours..." style={{...inp16,border:"1.5px solid #fde68a",background:"#fffef5"}}/>
                {extraH&&<div style={{fontSize:11,color:"#92400e",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(extraH))}</div>}
              </div>
              <button onClick={logExtra} style={{background:"#f59e0b",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:14,flexShrink:0}}>+ Add</button>
            </div>
          </div>
        </Sec>

        {/* Hour Logs */}
        {logs.length>0&&(
          <Sec title={`🕐 Hour Logs (${logs.length})`}>
            <button onClick={()=>setShowLogs(!showLogs)} style={{background:"#f8fafc",color:"#6366f1",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:showLogs?12:0}}>
              {showLogs?"Hide ▲":"Show All Logs ▼"}
            </button>
            {showLogs&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[...logs].reverse().map(log=>(
                  <div key={log.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",borderRadius:12,background:log.type==="extra"?"#fffbeb":"#f8fafc",border:`1.5px solid ${log.type==="extra"?"#fde68a":"#e2e8f0"}`}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:800,color:log.type==="extra"?"#92400e":"#0f172a"}}>
                        {fmtHours(log.hours)} · {log.type==="extra"?"⭐ Extra":"🕐 Regular"}
                      </div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:2}}>📅 {fmtDate(log.date)}{log.note?" · "+log.note:""}</div>
                    </div>
                    <button onClick={()=>setEditLog({...log,hours:String(log.hours)})} style={{background:"#f1f5f9",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
                    <button onClick={()=>deleteLog(log.id)} style={{background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </Sec>
        )}

        {editLog&&(
          <Modal title="✏️ Edit Log" onClose={()=>setEditLog(null)}>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Hours</label>
              <input type="number" value={editLog.hours} onChange={e=>setEditLog({...editLog,hours:e.target.value})} step={0.0833} style={inp16}/>
              {editLog.hours&&<div style={{fontSize:12,color:"#6366f1",marginTop:3,fontWeight:700}}>= {fmtHours(parseHours(editLog.hours))}</div>}
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Date</label>
              <input type="date" value={editLog.date} onChange={e=>setEditLog({...editLog,date:e.target.value})} style={inp16}/>
            </div>
            <div style={{marginBottom:18}}>
              <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Note</label>
              <input type="text" value={editLog.note} onChange={e=>setEditLog({...editLog,note:e.target.value})} style={inp16}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setEditLog(null)} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={saveEditLog} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
            </div>
          </Modal>
        )}

        {/* Topics */}
        <Sec title="📋 Topics">
          {(chapter.topics||[]).length===0&&<div style={{textAlign:"center",padding:"12px",color:"#94a3b8",fontSize:13}}>No topics yet. Add below.</div>}
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
            {(chapter.topics||[]).map((t,i)=>{
              const isLast=chapter.lastCompletedTopic===t.id;
              return(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:12,background:isLast?"#eef2ff":t.done?"#f0fdf4":"#f8fafc",border:`1.5px solid ${isLast?"#c7d2fe":t.done?"#bbf7d0":"#e2e8f0"}`}}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTopic(t.id)} style={{width:17,height:17,accentColor:"#6366f1",cursor:"pointer",flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,color:t.done?"#94a3b8":"#1e293b",textDecoration:t.done?"line-through":"none",fontWeight:600}}>{i+1}. {t.name}</span>
                  {isLast&&<span style={{background:"#6366f1",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:99,flexShrink:0}}>Last Done</span>}
                  <button onClick={()=>markLast(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,opacity:.4,padding:0,flexShrink:0}}>📍</button>
                  <button onClick={()=>deleteTopic(t.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#ef4444",opacity:.5,padding:0,flexShrink:0}}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTopic();}} placeholder="Add a topic..." style={{flex:1,padding:"10px 13px",border:"2px solid #e2e8f0",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",background:"#fff"}}/>
            <button onClick={addTopic} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:10,padding:"0 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>+ Add</button>
          </div>
        </Sec>

        {/* Notes */}
        <Sec title="📝 Notes">
          <textarea value={notes} onChange={e=>handleNotes(e.target.value)} placeholder="Notes, derivations, doubts..."
            style={{width:"100%",minHeight:110,padding:"12px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none",background:"#fff",lineHeight:1.8,boxSizing:"border-box"}}/>
          <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>☁️ Auto-saved</div>
        </Sec>
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────
// Order: Home, Batches, Chapters, Profile
function BottomNav({active,onChange}) {
  const tabs=[
    {id:"home",icon:"🏠",label:"Home"},
    {id:"batches",icon:"🗂️",label:"Batches"},
    {id:"chapters",icon:"📚",label:"Chapters"},
    {id:"profile",icon:"👤",label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"1.5px solid #f1f5f9",display:"flex",zIndex:100,boxShadow:"0 -2px 16px rgba(0,0,0,.06)",maxWidth:560,margin:"0 auto"}}>
      {tabs.map(t=>{
        const isActive=active===t.id;
        return(
          <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={{fontSize:20}}>{t.icon}</div>
            <div style={{fontSize:10,fontWeight:isActive?800:600,color:isActive?"#0f172a":"#94a3b8"}}>{t.label}</div>
            {isActive&&<div style={{width:18,height:3,background:"#0f172a",borderRadius:99,marginTop:1}}/>}
          </button>
        );
      })}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [splashDone,setSplashDone]=useState(false);
  const [profile,setProfile]=useState(()=>{
    try{const s=localStorage.getItem("lt_session");return s?JSON.parse(s):null;}catch{return null;}
  });
  const [chapters,setChapters]=useState([]);
  const [loading,setLoading]=useState(false);
  const [syncStatus,setSyncStatus]=useState(null);
  const [tab,setTab]=useState("home");
  const [addChOpen,setAddChOpen]=useState(false);
  const [editChapter,setEditChapter]=useState(null);
  const [addBatchOpen,setAddBatchOpen]=useState(false);
  const [detailId,setDetailId]=useState(null);
  const [batchView,setBatchView]=useState(null);
  const [showCongrats,setShowCongrats]=useState(false);
  const [recentDeletes,setRecentDeletes]=useState([]);
  const congratsShown=useRef(false);

  useEffect(()=>{const t=setTimeout(()=>setSplashDone(true),2200);return()=>clearTimeout(t);},[]);

  useEffect(()=>{
    if(!profile) return;
    setLoading(true);
    supabase.from("chapters").select("*").eq("teacher_code",profile.code).order("created_at")
      .then(({data,error})=>{
        if(!error&&data){
          const chs=data.map(fromRow);
          setChapters(chs);
          if(!congratsShown.current){
            const td=chs.reduce((s,c)=>s+c.completedHours,0);
            if(td>=100){setShowCongrats(true);congratsShown.current=true;}
          }
        }
        setLoading(false);
      });
  },[profile]);

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
        const td=next.reduce((s,c)=>s+c.completedHours,0);
        if(td>=100){setShowCongrats(true);congratsShown.current=true;}
      }
      return next;
    });
    syncChapter(updated);
  },[syncChapter]);

  // Add chapter (no batch — standalone)
  const addChapter=async data=>{
    const chapter={id:uid(),name:data.name,batchCode:null,totalHours:data.totalHours,completedHours:0,extraHours:0,topics:data.topics||[],notes:"",lastCompletedTopic:null,hourLogs:[]};
    setChapters(prev=>[...prev,chapter]);
    setSyncStatus("saving");
    const{error}=await supabase.from("chapters").insert(toRow(profile.code,chapter));
    setSyncStatus(error?"error":"saved");
    setTimeout(()=>setSyncStatus(null),2500);
    setAddChOpen(false);
  };

  // Add batch: creates copies of selected chapters with batchCode assigned
  const addBatch=async({batchCode,chapterIds,hoursMap})=>{
    const newChapters=[];
    for(const cid of chapterIds){
      const src=chapters.find(c=>c.id===cid);
      if(!src) continue;
      const h=parseFloat(hoursMap[cid])||src.totalHours;
      const nc={id:uid(),name:src.name,batchCode,totalHours:h,completedHours:0,extraHours:0,topics:(src.topics||[]).map(t=>({...t,id:uid(),done:false})),notes:"",lastCompletedTopic:null,hourLogs:[]};
      newChapters.push(nc);
    }
    setChapters(prev=>[...prev,...newChapters]);
    setSyncStatus("saving");
    for(const nc of newChapters){
      await supabase.from("chapters").insert(toRow(profile.code,nc));
    }
    setSyncStatus("saved");
    setTimeout(()=>setSyncStatus(null),2500);
    setAddBatchOpen(false);
  };

  const deleteChapter=async(id,silent=false)=>{
    if(!silent&&!window.confirm("Delete this chapter? You can restore it from Profile page.")) return;
    const ch=chapters.find(c=>c.id===id);
    if(ch) setRecentDeletes(prev=>[ch,...prev].slice(0,10));
    setChapters(prev=>prev.filter(c=>c.id!==id));
    await supabase.from("chapters").delete().eq("id",id);
  };

  const deleteBatch=async batchCode=>{
    if(!window.confirm(`Delete ALL chapters in batch "${batchCode}"?\n\nYou can restore them from Profile → Recently Deleted.`)) return;
    const toDelete=chapters.filter(c=>c.batchCode===batchCode);
    setRecentDeletes(prev=>[...toDelete,...prev].slice(0,10));
    setChapters(prev=>prev.filter(c=>c.batchCode!==batchCode));
    for(const c of toDelete) await supabase.from("chapters").delete().eq("id",c.id);
    setBatchView(null);
  };

  const restoreChapter=async chapter=>{
    setChapters(prev=>[...prev,chapter]);
    await supabase.from("chapters").insert(toRow(profile.code,chapter));
    setRecentDeletes(prev=>prev.filter(c=>c.id!==chapter.id));
  };

  const editAndSave=async data=>{
    const updated={...editChapter,...data};
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    await supabase.from("chapters").upsert(toRow(profile.code,updated),{onConflict:"id"});
    setEditChapter(null);
  };

  const logout=()=>{localStorage.removeItem("lt_session");setProfile(null);setChapters([]);};

  // ── Render ─────────────────────────────────────────────────────
  const GLOBAL_STYLE=`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;}
    body{margin:0;font-family:'Inter',sans-serif;background:#f8fafc;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:99px;}
    input:focus,textarea:focus{border-color:#0f172a!important;outline:none;}
  `;

  if(!splashDone) return <><style>{GLOBAL_STYLE}</style><SplashScreen/></>;
  if(!profile) return <><style>{GLOBAL_STYLE}</style><Onboarding onDone={p=>setProfile(p)}/></>;
  if(showCongrats){
    const td=chapters.reduce((s,c)=>s+c.completedHours,0);
    return <><style>{GLOBAL_STYLE}</style><CongratsScreen profile={profile} totalHours={td} onClose={()=>setShowCongrats(false)}/></>;
  }

  const batches=[...new Set(chapters.filter(c=>c.batchCode).map(c=>c.batchCode))].sort();
  const getBatchColor=b=>BATCH_COLORS[batches.indexOf(b)%BATCH_COLORS.length];

  const detailChapter=chapters.find(c=>c.id===detailId);
  if(detailChapter) return(
    <><style>{GLOBAL_STYLE}</style>
    <DetailPage chapter={detailChapter} color={getBatchColor(detailChapter.batchCode)||"#6366f1"} onUpdate={updateChapter} onBack={()=>setDetailId(null)} syncStatus={syncStatus}/>
    </>
  );

  if(batchView){
    const bChs=chapters.filter(c=>c.batchCode===batchView);
    return(
      <><style>{GLOBAL_STYLE}</style>
      <BatchPage batchCode={batchView} color={getBatchColor(batchView)} chapters={bChs}
        onBack={()=>setBatchView(null)} onDeleteChapter={deleteChapter}
        onEditChapter={c=>setEditChapter(c)} onOpenChapter={id=>setDetailId(id)}
        onDeleteBatch={()=>deleteBatch(batchView)}/>
      {editChapter&&<ChapterFormModal chapter={editChapter} onSave={editAndSave} onClose={()=>setEditChapter(null)} subject={profile.subject}/>}
      </>
    );
  }

  return(
    <>
      <style>{GLOBAL_STYLE}</style>
      <div style={{maxWidth:560,margin:"0 auto",paddingBottom:72,minHeight:"100vh"}}>
        {loading?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}>
            <div style={{fontSize:44,marginBottom:16}}>☁️</div>
            <div style={{fontWeight:800,fontSize:16,color:"#0f172a"}}>Loading your data...</div>
          </div>
        ):(
          <>
            {tab==="home"&&<HomeTab chapters={chapters} profile={profile} onOpenChapter={id=>setDetailId(id)} onOpenBatch={b=>setBatchView(b)} syncStatus={syncStatus}/>}
            {tab==="chapters"&&<ChaptersTab chapters={chapters} profile={profile} onOpenChapter={id=>setDetailId(id)} onAddChapter={()=>setAddChOpen(true)} onEditChapter={c=>setEditChapter(c)} onDeleteChapter={deleteChapter}/>}
            {tab==="batches"&&<BatchesTab chapters={chapters} allChapters={chapters} onOpenBatch={b=>setBatchView(b)} onDeleteBatch={deleteBatch} onAddBatch={()=>setAddBatchOpen(true)}/>}
            {tab==="profile"&&<ProfileTab profile={profile} chapters={chapters} onLogout={logout} onUpdateProfile={p=>setProfile(p)} recentDeletes={recentDeletes} onRestoreChapter={restoreChapter}/>}
          </>
        )}
      </div>
      <BottomNav active={tab} onChange={t=>setTab(t)}/>
      {addChOpen&&<ChapterFormModal onSave={addChapter} onClose={()=>setAddChOpen(false)} subject={profile.subject}/>}
      {editChapter&&!batchView&&<ChapterFormModal chapter={editChapter} onSave={editAndSave} onClose={()=>setEditChapter(null)} subject={profile.subject}/>}
      {addBatchOpen&&<BatchFormModal chapters={chapters.filter(c=>!c.batchCode)} onSave={addBatch} onClose={()=>setAddBatchOpen(false)}/>}
    </>
  );
}
