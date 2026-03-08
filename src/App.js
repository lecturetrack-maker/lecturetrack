import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://ddfmkfkvvadzlihiulnj.supabase.co",
  "sb_publishable_CX_sPadRs8lkJZ2pHyQuZw_vHA_D4P6"
);

// ── Helpers ───────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

// Convert decimal hours to "Xh Ym" display e.g. 1.25 → "1h 15m"
function fmtHours(h) {
  if (!h && h !== 0) return "0h";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

// Convert "Xh Ym" or decimal string to decimal number
function parseHours(val) {
  if (!val) return 0;
  const str = String(val).trim();
  // Handle "1h 30m" or "1h30m" format
  const hm = str.match(/^(\d+)h\s*(\d+)m$/i);
  if (hm) return parseFloat(hm[1]) + parseFloat(hm[2]) / 60;
  const hOnly = str.match(/^(\d+\.?\d*)h$/i);
  if (hOnly) return parseFloat(hOnly[1]);
  const mOnly = str.match(/^(\d+)m$/i);
  if (mOnly) return parseFloat(mOnly[1]) / 60;
  // Plain decimal: 1.25 = 1h 15m
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function roundToMinute(h) {
  return Math.round(h * 60) / 60;
}

function getStatus(completed, total) {
  if (!total) return "none";
  const p = (completed / total) * 100;
  if (p > 100) return "exceeded";
  if (p >= 80) return "warning";
  return "ok";
}

const STATUS = {
  ok:       { color: "#10b981", label: "On Track" },
  warning:  { color: "#f59e0b", label: "Near Limit" },
  exceeded: { color: "#ef4444", label: "Exceeded" },
  none:     { color: "#94a3b8", label: "Not Started" },
};

const BATCH_COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#06b6d4"];

const MOTIVATIONAL_QUOTES = [
  "100 hours of dedication — you are a true legend! 🌟",
  "Every hour you teach lights up a student's future! 💡",
  "Great teachers don't just teach subjects — they build dreams! 🚀",
  "100 hours down — countless lives changed forever! 🔥",
  "Your dedication inspires more than you will ever know! 💪",
  "The best investment in a student's future is a teacher like you! 🏆",
  "NEET and JEE toppers always remember their favourite teacher! 👑",
  "You didn't just teach — you transformed futures! 🌈",
  "100 hours of passion, patience and purpose! Incredible! 🎯",
  "Behind every successful student is a dedicated teacher like you! ❤️",
];

const SUBJECTS = ["Physics","Chemistry","Biology","Mathematics","Multiple Subjects"];

function buildCSV(chapters) {
  const rows = [["Batch","Chapter","Allotted Hours","Taken Hours","Extra Hours","Remaining Hours","Progress %"]];
  chapters.forEach(c => {
    const rem = Math.max(0, c.totalHours - c.completedHours);
    const pct = c.totalHours > 0 ? ((c.completedHours / c.totalHours) * 100).toFixed(1) + "%" : "0%";
    rows.push([c.batchCode, c.name, fmtHours(c.totalHours), fmtHours(c.completedHours), fmtHours(c.extraHours||0), fmtHours(rem), pct]);
  });
  return rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
}

function toRow(teacherCode, c) {
  return {
    id: c.id, teacher_code: teacherCode, batch_code: c.batchCode, name: c.name,
    total_hours: c.totalHours, completed_hours: c.completedHours,
    extra_hours: c.extraHours || 0, topics: c.topics || [],
    notes: c.notes || "", last_completed_topic: c.lastCompletedTopic || null,
    hour_logs: c.hourLogs || [],
    updated_at: new Date().toISOString()
  };
}

function fromRow(r) {
  return {
    id: r.id, batchCode: r.batch_code, name: r.name,
    totalHours: r.total_hours, completedHours: r.completed_hours,
    extraHours: r.extra_hours || 0, topics: r.topics || [],
    notes: r.notes || "", lastCompletedTopic: r.last_completed_topic,
    hourLogs: r.hour_logs || []
  };
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

// ── UI Primitives ─────────────────────────────────────────────────
function PBar({ pct }) {
  return (
    <div style={{ background:"rgba(255,255,255,.25)",borderRadius:99,height:7,overflow:"hidden" }}>
      <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",background:"#fff",borderRadius:99,transition:"width .6s" }} />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const h = e => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff",borderRadius:20,padding:26,width:"100%",maxWidth:440,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,.25)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:17,fontWeight:800,color:"#0f172a" }}>{title}</h3>
          {onClose && <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",borderRadius:99,width:32,height:32,cursor:"pointer",fontSize:18,color:"#64748b" }}>×</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

function TInput({ label, value, onChange, placeholder, type="text", min, step }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} step={step}
        style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box" }}
        onFocus={e=>e.target.style.borderColor="#6366f1"}
        onBlur={e=>e.target.style.borderColor="#e2e8f0"} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ background:"#fff",borderRadius:18,padding:18,marginBottom:16,boxShadow:"0 2px 10px rgba(0,0,0,.05)" }}>
      <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14 }}>{title}</div>
      {children}
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg = {
    saving: { bg:"#eef2ff",color:"#6366f1",text:"⏳ Saving..." },
    saved:  { bg:"#dcfce7",color:"#16a34a",text:"☁️ Saved to Cloud" },
    error:  { bg:"#fee2e2",color:"#dc2626",text:"❌ Save failed" },
  }[status];
  if (!cfg) return null;
  return (
    <div style={{ background:cfg.bg,color:cfg.color,fontSize:12,fontWeight:700,padding:"5px 14px",borderRadius:99,display:"inline-flex",alignItems:"center" }}>
      {cfg.text}
    </div>
  );
}

// ── Congrats Screen ───────────────────────────────────────────────
function CongratsScreen({ profile, totalHours, onClose }) {
  const quote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  const sal = profile.gender === "male" ? "Sir" : "Ma'am";
  const subjectEmoji = {
    "Physics":"⚡", "Chemistry":"🧪", "Biology":"🧬",
    "Mathematics":"📐", "Multiple Subjects":"📚"
  }[profile.subject] || "📖";
  return (
    <div style={{ position:"fixed",inset:0,background:"linear-gradient(135deg,#6366f1,#4338ca)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center",overflowY:"auto" }}>
      <div style={{ fontSize:80,marginBottom:10 }}>🎉</div>
      <div style={{ fontSize:28,fontWeight:900,color:"#fff",marginBottom:8 }}>Congratulations!</div>
      <div style={{ fontSize:18,fontWeight:700,color:"rgba(255,255,255,.9)",marginBottom:4 }}>{profile.code} {sal}</div>
      {profile.subject && (
        <div style={{ fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:6 }}>
          {subjectEmoji} {profile.subject} Teacher
        </div>
      )}
      <div style={{ fontSize:15,color:"rgba(255,255,255,.7)",marginBottom:24 }}>
        You've completed <strong style={{ color:"#fde68a" }}>{fmtHours(totalHours)}</strong> of lectures! 🏆
      </div>
      <div style={{ background:"rgba(255,255,255,.15)",borderRadius:18,padding:"20px 24px",maxWidth:340,marginBottom:30 }}>
        <div style={{ fontSize:32,marginBottom:10 }}>💡</div>
        <div style={{ fontSize:15,color:"#fff",fontWeight:600,lineHeight:1.7 }}>{quote}</div>
      </div>
      <div style={{ display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center" }}>
        <div style={{ background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 20px",color:"#fff",fontWeight:700,fontSize:13 }}>
          🎯 {fmtHours(totalHours)} Completed
        </div>
      </div>
      <button onClick={onClose} style={{ marginTop:30,background:"#fff",color:"#6366f1",border:"none",borderRadius:14,padding:"13px 40px",fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>
        Continue Teaching →
      </button>
    </div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────
function Onboarding({ onDone }) {
  const [mode,setMode] = useState("login");
  const [name,setName] = useState("");
  const [code,setCode] = useState("");
  const [pin,setPin] = useState("");
  const [confirmPin,setConfirmPin] = useState("");
  const [gender,setGender] = useState("male");
  const [subject,setSubject] = useState("Physics");
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  const h = new Date().getHours();
  const gw = h<12?"Good Morning ☀️":h<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const sal = gender==="male"?"Sir":"Ma'am";

  const handleLogin = async () => {
    if (!code.trim()||!pin.trim()) { setError("Please enter code and PIN"); return; }
    setLoading(true); setError("");
    try {
      const { data, error:err } = await supabase.from("teachers").select("*").eq("code",code.trim().toUpperCase()).single();
      if (err||!data) { setError("❌ Code not found. Register first."); setLoading(false); return; }
      if (data.pin !== pin.trim()) { setError("❌ Wrong PIN. Try again."); setLoading(false); return; }
      const profile = { code:data.code, name:data.name, gender:data.gender, pin:data.pin, subject:data.subject||"" };
      localStorage.setItem("lt_session", JSON.stringify(profile));
      onDone(profile);
    } catch { setError("❌ Connection failed. Check internet."); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name.trim()||!code.trim()||!pin.trim()) { setError("Fill all fields"); return; }
    if (pin.length < 4) { setError("PIN must be at least 4 digits"); return; }
    if (pin !== confirmPin) { setError("PINs do not match"); return; }
    setLoading(true); setError("");
    try {
      const { data:existing } = await supabase.from("teachers").select("code").eq("code",code.trim().toUpperCase()).single();
      if (existing) { setError("❌ Code taken. Choose another."); setLoading(false); return; }
      const profile = { code:code.trim().toUpperCase(), name:name.trim(), gender, pin:pin.trim(), subject };
      const { error:err } = await supabase.from("teachers").insert(profile);
      if (err) { setError("❌ Registration failed: "+err.message); setLoading(false); return; }
      localStorage.setItem("lt_session", JSON.stringify(profile));
      onDone(profile);
    } catch(e) { setError("❌ Error: "+e.message); }
    setLoading(false);
  };

  const SUBJECT_OPTIONS = [
    { label:"⚡ Physics",    value:"Physics" },
    { label:"🧪 Chemistry",  value:"Chemistry" },
    { label:"🧬 Biology",    value:"Biology" },
    { label:"📐 Mathematics",value:"Mathematics" },
    { label:"📚 Multiple",   value:"Multiple Subjects" },
  ];

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#6366f1,#4338ca)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:24,padding:32,width:"100%",maxWidth:400,boxShadow:"0 24px 60px rgba(0,0,0,.2)" }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:48 }}>👨‍🏫</div>
          <h2 style={{ margin:"10px 0 4px",fontSize:24,fontWeight:900,color:"#0f172a" }}>LectureTrack</h2>
          <p style={{ margin:0,color:"#94a3b8",fontSize:13 }}>NEET / JEE Coaching</p>
          <div style={{ marginTop:8,background:"#dcfce7",borderRadius:99,padding:"4px 14px",display:"inline-block",fontSize:12,color:"#16a34a",fontWeight:700 }}>
            🔒 PIN Protected · ☁️ Cloud Saved
          </div>
        </div>
        <div style={{ display:"flex",background:"#f1f5f9",borderRadius:12,padding:4,marginBottom:20,gap:4 }}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1,padding:"9px",borderRadius:10,border:"none",cursor:"pointer",background:mode===m?"#fff":"transparent",fontWeight:700,fontSize:14,color:mode===m?"#6366f1":"#64748b",fontFamily:"inherit",boxShadow:mode===m?"0 2px 8px rgba(0,0,0,.08)":"none" }}>
              {m==="login"?"🔑 Login":"📝 Register"}
            </button>
          ))}
        </div>
        {mode==="register"&&(
          <>
            <TInput label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. P M Krishna" />
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Gender</label>
              <div style={{ display:"flex",gap:10 }}>
                {["male","female"].map(g=>(
                  <button key={g} onClick={()=>setGender(g)} style={{ flex:1,padding:10,borderRadius:12,border:`2px solid ${gender===g?"#6366f1":"#e2e8f0"}`,background:gender===g?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:gender===g?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:13 }}>
                    {g==="male"?"👨 Male":"👩 Female"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6 }}>Subject You Teach</label>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {SUBJECT_OPTIONS.map(s=>(
                  <button key={s.value} onClick={()=>setSubject(s.value)}
                    style={{ padding:"8px 14px",borderRadius:12,border:`2px solid ${subject===s.value?"#6366f1":"#e2e8f0"}`,background:subject===s.value?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:subject===s.value?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12 }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <TInput label="Unique Code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="e.g. PMK" />
        <TInput label="PIN (4-6 digits)" type="password" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter PIN" />
        {mode==="register"&&<TInput label="Confirm PIN" type="password" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} placeholder="Re-enter PIN" />}
        {mode==="register"&&name&&code&&(
          <div style={{ background:"#eef2ff",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#4f46e5",fontWeight:700 }}>
            {gw}, {code} {sal}! 👋
          </div>
        )}
        {error&&<div style={{ background:"#fee2e2",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#dc2626",fontWeight:600 }}>{error}</div>}
        <button onClick={mode==="login"?handleLogin:handleRegister} disabled={loading}
          style={{ width:"100%",padding:13,background:"#6366f1",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",fontFamily:"inherit",opacity:loading?.7:1 }}>
          {loading?"Please wait...":mode==="login"?"Login →":"Create Account →"}
        </button>
      </div>
    </div>
  );
}

// ── Chapter Form ──────────────────────────────────────────────────
function ChapterFormModal({ chapter, onSave, onClose }) {
  const [name,setName]=useState(chapter?.name||"");
  const [batch,setBatch]=useState(chapter?.batchCode||"");
  const [hours,setHours]=useState(chapter?.totalHours||"");
  return (
    <Modal title={chapter?"Edit Chapter":"Add Chapter"} onClose={onClose}>
      <TInput label="Batch Code" value={batch} onChange={e=>setBatch(e.target.value.toUpperCase())} placeholder="e.g. X1, R2" />
      <TInput label="Chapter Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rotational Motion" />
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>Total Allotted Hours</label>
        <input type="number" value={hours} onChange={e=>setHours(e.target.value)} placeholder="e.g. 1.5 = 1h 30m" min={0} step={0.0833}
          style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box" }} />
        {hours && <div style={{ fontSize:12,color:"#6366f1",marginTop:4,fontWeight:600 }}>= {fmtHours(parseFloat(hours)||0)}</div>}
      </div>
      <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:6 }}>
        <button onClick={onClose} style={{ background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
        <button onClick={()=>{if(name.trim()&&batch.trim()&&hours)onSave({name:name.trim(),batchCode:batch.trim().toUpperCase(),totalHours:parseFloat(hours)})}}
          style={{ background:"#6366f1",color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Save</button>
      </div>
    </Modal>
  );
}

// ── Batch Page ────────────────────────────────────────────────────
function BatchPage({ batchCode, color, chapters, onBack, onDeleteChapter, onEditChapter, onOpenChapter }) {
  const totalAllotted = chapters.reduce((s,c)=>s+c.totalHours,0);
  const totalDone = chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct = totalAllotted>0?(totalDone/totalAllotted)*100:0;

  const handleDeleteBatch = async () => {
    if (!window.confirm(`Delete ALL chapters in batch ${batchCode}? This cannot be undone!`)) return;
    for (const c of chapters) await onDeleteChapter(c.id, true);
    onBack();
  };

  return (
    <div style={{ minHeight:"100vh",background:"#f8fafc" }}>
      <div style={{ background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-30,top:-30,width:140,height:140,background:"rgba(255,255,255,.07)",borderRadius:"50%" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <button onClick={onBack} style={{ background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>← Back</button>
          <button onClick={handleDeleteBatch} style={{ background:"rgba(239,68,68,.3)",border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>🗑️ Delete Batch</button>
        </div>
        <div style={{ fontSize:44,fontWeight:900,letterSpacing:"-1px",lineHeight:1 }}>{batchCode}</div>
        <div style={{ fontSize:14,opacity:.8,marginTop:4,marginBottom:16 }}>{chapters.length} chapters</div>
        <div style={{ display:"flex",gap:10,marginBottom:14 }}>
          {[{label:"Allotted",val:fmtHours(totalAllotted)},{label:"Completed",val:fmtHours(totalDone)},{label:"Remaining",val:fmtHours(Math.max(0,totalAllotted-totalDone))}].map(s=>(
            <div key={s.label} style={{ flex:1,background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 4px",textAlign:"center" }}>
              <div style={{ fontSize:15,fontWeight:800 }}>{s.val}</div>
              <div style={{ fontSize:9,opacity:.8,fontWeight:600,marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,.2)",borderRadius:99,height:7 }}>
          <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",background:"#fff",borderRadius:99 }} />
        </div>
        <div style={{ fontSize:12,opacity:.8,marginTop:5 }}>{pct.toFixed(0)}% overall progress</div>
      </div>

      <div style={{ padding:"20px 16px 60px",maxWidth:560,margin:"0 auto" }}>
        <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14 }}>Chapters in {batchCode}</div>
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {chapters.map(c=>{
            const cpct = c.totalHours>0?(c.completedHours/c.totalHours)*100:0;
            const rem = Math.max(0,c.totalHours-c.completedHours);
            return (
              <div key={c.id} onClick={()=>onOpenChapter(c.id)} style={{ background:"#fff",borderRadius:16,padding:16,boxShadow:"0 2px 10px rgba(0,0,0,.06)",cursor:"pointer",border:`1.5px solid ${color}22` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10 }}>
                  <div style={{ fontSize:15,fontWeight:800,color:"#0f172a",flex:1 }}>{c.name}</div>
                  <div style={{ display:"flex",gap:6 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>onEditChapter(c)} style={{ background:"#eef2ff",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
                    <button onClick={()=>onDeleteChapter(c.id)} style={{ background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,marginBottom:10 }}>
                  {[{l:"Allotted",v:fmtHours(c.totalHours)},{l:"Taken",v:fmtHours(c.completedHours),c:"#10b981"},{l:"Extra",v:fmtHours(c.extraHours||0),c:"#f59e0b"},{l:"Left",v:fmtHours(rem),c:"#ef4444"}].map(s=>(
                    <div key={s.l} style={{ flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 4px",textAlign:"center" }}>
                      <div style={{ fontSize:13,fontWeight:800,color:s.c||"#0f172a" }}>{s.v}</div>
                      <div style={{ fontSize:9,color:"#94a3b8",fontWeight:600,marginTop:1 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#f1f5f9",borderRadius:99,height:5,overflow:"hidden" }}>
                  <div style={{ width:`${Math.min(cpct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .6s" }} />
                </div>
                <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>{cpct.toFixed(0)}% complete · Tap to open →</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Export Modal ──────────────────────────────────────────────────
function ExportModal({ chapters, onClose }) {
  const csv = buildCSV(chapters);
  const [copied,setCopied]=useState(false);
  return (
    <Modal title="📊 Export Data" onClose={onClose}>
      <div style={{ overflowX:"auto",borderRadius:12,border:"1.5px solid #e2e8f0",marginBottom:16 }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11,fontFamily:"inherit",minWidth:380 }}>
          <thead>
            <tr style={{ background:"#6366f1",color:"#fff" }}>
              {["Batch","Chapter","Allotted","Taken","Extra","Remaining","Progress"].map(h=>(
                <th key={h} style={{ padding:"8px",textAlign:"left",fontWeight:700,whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chapters.map((c,i)=>{
              const rem=Math.max(0,c.totalHours-c.completedHours);
              const pct=c.totalHours>0?((c.completedHours/c.totalHours)*100).toFixed(0)+"%":"0%";
              return (
                <tr key={c.id} style={{ background:i%2===0?"#f8fafc":"#fff" }}>
                  <td style={{ padding:"7px 8px",fontWeight:800,color:"#6366f1" }}>{c.batchCode}</td>
                  <td style={{ padding:"7px 8px" }}>{c.name}</td>
                  <td style={{ padding:"7px 8px" }}>{fmtHours(c.totalHours)}</td>
                  <td style={{ padding:"7px 8px",color:"#10b981",fontWeight:700 }}>{fmtHours(c.completedHours)}</td>
                  <td style={{ padding:"7px 8px",color:"#f59e0b",fontWeight:700 }}>{fmtHours(c.extraHours||0)}</td>
                  <td style={{ padding:"7px 8px",color:"#ef4444",fontWeight:700 }}>{fmtHours(rem)}</td>
                  <td style={{ padding:"7px 8px",color:"#6366f1",fontWeight:700 }}>{pct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <button onClick={()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`LectureTrack_${new Date().toLocaleDateString("en-IN").replace(/\//g,"-")}.csv`;a.click();}}
          style={{ padding:12,background:"#6366f1",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          ⬇️ Download CSV
        </button>
        <button onClick={()=>{navigator.clipboard.writeText(csv);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
          style={{ padding:12,background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          {copied?"✅ Copied!":"📋 Copy to Clipboard"}
        </button>
      </div>
    </Modal>
  );
}

// ── Chapter Card ──────────────────────────────────────────────────
function ChapterCard({ chapter, color, onClick, onEdit, onDelete }) {
  const pct = chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining = Math.max(0,chapter.totalHours-chapter.completedHours);
  const status = getStatus(chapter.completedHours,chapter.totalHours);
  return (
    <div onClick={onClick} style={{ background:`linear-gradient(135deg,${color},${color}cc)`,borderRadius:18,padding:20,color:"#fff",cursor:"pointer",boxShadow:`0 4px 20px ${color}44`,transition:"transform .2s,box-shadow .2s",position:"relative",overflow:"hidden" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";}}
    >
      <div style={{ position:"absolute",right:-20,top:-20,width:100,height:100,background:"rgba(255,255,255,.08)",borderRadius:"50%" }} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
        <div style={{ fontSize:34,fontWeight:900,letterSpacing:"-.5px",lineHeight:1 }}>{chapter.batchCode}</div>
        <div style={{ display:"flex",gap:6 }} onClick={e=>e.stopPropagation()}>
          <button onClick={onEdit} style={{ background:"rgba(255,255,255,.2)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
          <button onClick={onDelete} style={{ background:"rgba(255,255,255,.2)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
        </div>
      </div>
      <div style={{ fontSize:16,fontWeight:700,marginBottom:14,opacity:.95 }}>{chapter.name}</div>
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        {[{label:"Allotted",val:fmtHours(chapter.totalHours)},{label:"Taken",val:fmtHours(chapter.completedHours)},{label:"Extra",val:fmtHours(chapter.extraHours||0)},{label:"Left",val:fmtHours(remaining)}].map(s=>(
          <div key={s.label} style={{ flex:1,background:"rgba(255,255,255,.18)",borderRadius:10,padding:"7px 4px",textAlign:"center" }}>
            <div style={{ fontSize:12,fontWeight:800 }}>{s.val}</div>
            <div style={{ fontSize:9,opacity:.8,fontWeight:600,marginTop:1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <PBar pct={pct} />
      <div style={{ display:"flex",justifyContent:"space-between",marginTop:6,fontSize:12,opacity:.9 }}>
        <span style={{ fontWeight:700 }}>{pct.toFixed(0)}% complete</span>
        <span style={{ background:"rgba(255,255,255,.2)",padding:"1px 8px",borderRadius:99,fontWeight:700 }}>{STATUS[status].label}</span>
      </div>
      <div style={{ marginTop:8,fontSize:11,opacity:.5 }}>Tap to open →</div>
    </div>
  );
}

// ── Detail Page ───────────────────────────────────────────────────
function DetailPage({ chapter, color, onUpdate, onBack, syncStatus }) {
  const [logH,setLogH]=useState("");
  const [extraH,setExtraH]=useState("");
  const [logDate,setLogDate]=useState(todayStr());
  const [logNote,setLogNote]=useState("");
  const [newTopic,setNewTopic]=useState("");
  const [notes,setNotes]=useState(chapter.notes||"");
  const [showLogs,setShowLogs]=useState(false);
  const [editLog,setEditLog]=useState(null); // {id, hours, date, note}
  const ntRef=useRef(null);

  const pct=chapter.totalHours>0?(chapter.completedHours/chapter.totalHours)*100:0;
  const remaining=Math.max(0,chapter.totalHours-chapter.completedHours);
  const status=getStatus(chapter.completedHours,chapter.totalHours);
  const logs = chapter.hourLogs || [];

  const logHours = () => {
    const h = roundToMinute(parseHours(logH));
    if (!h || h <= 0) return;
    const newLog = { id:uid(), hours:h, date:logDate, note:logNote, type:"regular" };
    const updated = {
      ...chapter,
      completedHours: roundToMinute(chapter.completedHours + h),
      hourLogs: [...logs, newLog]
    };
    onUpdate(updated);
    setLogH(""); setLogNote("");
  };

  const logExtra = () => {
    const h = roundToMinute(parseHours(extraH));
    if (!h || h <= 0) return;
    const newLog = { id:uid(), hours:h, date:logDate, note:logNote+" (Extra)", type:"extra" };
    const updated = {
      ...chapter,
      completedHours: roundToMinute(chapter.completedHours + h),
      extraHours: roundToMinute((chapter.extraHours||0) + h),
      hourLogs: [...logs, newLog]
    };
    onUpdate(updated);
    setExtraH(""); setLogNote("");
  };

  const deleteLog = (logId) => {
    const log = logs.find(l=>l.id===logId);
    if (!log) return;
    if (!window.confirm(`Remove ${fmtHours(log.hours)} logged on ${fmtDate(log.date)}?`)) return;
    const newLogs = logs.filter(l=>l.id!==logId);
    const updated = {
      ...chapter,
      completedHours: roundToMinute(Math.max(0, chapter.completedHours - log.hours)),
      extraHours: log.type==="extra" ? roundToMinute(Math.max(0,(chapter.extraHours||0)-log.hours)) : chapter.extraHours,
      hourLogs: newLogs
    };
    onUpdate(updated);
  };

  const saveEditLog = () => {
    if (!editLog) return;
    const oldLog = logs.find(l=>l.id===editLog.id);
    if (!oldLog) return;
    const newH = roundToMinute(parseHours(editLog.hours));
    const diff = newH - oldLog.hours;
    const newLogs = logs.map(l=>l.id===editLog.id?{...l,hours:newH,date:editLog.date,note:editLog.note}:l);
    const updated = {
      ...chapter,
      completedHours: roundToMinute(Math.max(0, chapter.completedHours + diff)),
      extraHours: oldLog.type==="extra" ? roundToMinute(Math.max(0,(chapter.extraHours||0)+diff)) : chapter.extraHours,
      hourLogs: newLogs
    };
    onUpdate(updated);
    setEditLog(null);
  };

  const toggleTopic=id=>{ const topics=(chapter.topics||[]).map(t=>t.id===id?{...t,done:!t.done}:t); onUpdate({...chapter,topics}); };
  const markLast=id=>onUpdate({...chapter,lastCompletedTopic:chapter.lastCompletedTopic===id?null:id});
  const deleteTopic=id=>onUpdate({...chapter,topics:(chapter.topics||[]).filter(t=>t.id!==id)});
  const addTopic=()=>{ if(!newTopic.trim())return; onUpdate({...chapter,topics:[...(chapter.topics||[]),{id:uid(),name:newTopic.trim(),done:false}]}); setNewTopic(""); };
  const handleNotes=v=>{ setNotes(v); clearTimeout(ntRef.current); ntRef.current=setTimeout(()=>onUpdate({...chapter,notes:v}),800); };

  return (
    <div style={{ minHeight:"100vh",background:"#f8fafc" }}>
      <div style={{ background:`linear-gradient(135deg,${color},${color}bb)`,padding:"24px 20px 28px",color:"#fff",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",right:-30,top:-30,width:140,height:140,background:"rgba(255,255,255,.07)",borderRadius:"50%" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <button onClick={onBack} style={{ background:"rgba(255,255,255,.2)",border:"none",borderRadius:10,padding:"7px 14px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>← Back</button>
          <SyncBadge status={syncStatus} />
        </div>
        <div style={{ fontSize:40,fontWeight:900,letterSpacing:"-1px",lineHeight:1 }}>{chapter.batchCode}</div>
        <div style={{ fontSize:20,fontWeight:700,marginTop:4,marginBottom:16 }}>{chapter.name}</div>
        <div style={{ display:"flex",gap:10 }}>
          {[{label:"Allotted",val:fmtHours(chapter.totalHours)},{label:"Taken",val:fmtHours(chapter.completedHours)},{label:"Extra",val:fmtHours(chapter.extraHours||0)},{label:"Left",val:fmtHours(remaining)}].map(s=>(
            <div key={s.label} style={{ flex:1,background:"rgba(255,255,255,.2)",borderRadius:12,padding:"10px 4px",textAlign:"center" }}>
              <div style={{ fontSize:14,fontWeight:800 }}>{s.val}</div>
              <div style={{ fontSize:9,opacity:.8,fontWeight:600,marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14 }}>
          <PBar pct={pct} />
          <div style={{ display:"flex",justifyContent:"space-between",marginTop:5,fontSize:13,fontWeight:700,opacity:.9 }}>
            <span>{pct.toFixed(0)}% complete</span><span>{STATUS[status].label}</span>
          </div>
        </div>
        {status==="exceeded"&&(
          <div style={{ marginTop:10,background:"rgba(239,68,68,.3)",borderRadius:10,padding:"8px 14px",fontSize:13,fontWeight:700 }}>
            ⚠️ Exceeded by {fmtHours(chapter.completedHours-chapter.totalHours)}
          </div>
        )}
      </div>

      <div style={{ padding:"20px 16px 60px",maxWidth:560,margin:"0 auto" }}>

        {/* Log Hours */}
        <Section title="📅 Log Class Hours">
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>Hours (e.g. 1.5 = 1h 30m)</label>
            <div style={{ display:"flex",gap:8,marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <input type="number" min={0} step={0.0833} value={logH} onChange={e=>setLogH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logHours()} placeholder="e.g. 1.25"
                  style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box" }} />
                {logH && <div style={{ fontSize:11,color:"#6366f1",marginTop:3,fontWeight:600 }}>= {fmtHours(parseHours(logH))}</div>}
              </div>
              <button onClick={logHours} style={{ background:color,color:"#fff",border:"none",borderRadius:12,padding:"0 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:15 }}>+ Log</button>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,marginBottom:8 }}>
            <div style={{ flex:1 }}>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:4 }}>📅 Date</label>
              <input type="date" value={logDate} onChange={e=>setLogDate(e.target.value)}
                style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box" }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:4 }}>📝 Period/Note</label>
              <input type="text" value={logNote} onChange={e=>setLogNote(e.target.value)} placeholder="e.g. Period 3"
                style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",boxSizing:"border-box" }} />
            </div>
          </div>

          {/* Extra Hours */}
          <div style={{ background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:12,padding:"14px 16px",marginTop:4 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8 }}>➕ Extra Hours (Beyond Allotted)</div>
            <div style={{ display:"flex",gap:8,marginBottom:4 }}>
              <div style={{ flex:1 }}>
                <input type="number" min={0} step={0.0833} value={extraH} onChange={e=>setExtraH(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&logExtra()} placeholder="e.g. 0.5"
                  style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #fde68a",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fffef5",boxSizing:"border-box" }} />
                {extraH && <div style={{ fontSize:11,color:"#92400e",marginTop:3,fontWeight:600 }}>= {fmtHours(parseHours(extraH))}</div>}
              </div>
              <button onClick={logExtra} style={{ background:"#f59e0b",color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>+ Add</button>
            </div>
          </div>
        </Section>

        {/* Hour Logs History */}
        {logs.length > 0 && (
          <Section title={`🕐 Hour Log History (${logs.length} entries)`}>
            <button onClick={()=>setShowLogs(!showLogs)} style={{ background:"#eef2ff",color:"#6366f1",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13,marginBottom:showLogs?12:0 }}>
              {showLogs?"Hide Logs ▲":"Show All Logs ▼"}
            </button>
            {showLogs && (
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {[...logs].reverse().map(log=>(
                  <div key={log.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:log.type==="extra"?"#fffbeb":"#f8fafc",border:`1.5px solid ${log.type==="extra"?"#fde68a":"#e2e8f0"}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:800,color:log.type==="extra"?"#92400e":color }}>{fmtHours(log.hours)} {log.type==="extra"?"⭐ Extra":""}</div>
                      <div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>📅 {fmtDate(log.date)}{log.note?" · "+log.note:""}</div>
                    </div>
                    <button onClick={()=>setEditLog({...log,hours:String(log.hours)})} style={{ background:"#eef2ff",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
                    <button onClick={()=>deleteLog(log.id)} style={{ background:"#fee2e2",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",fontSize:12,color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center" }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Edit Log Modal */}
        {editLog && (
          <Modal title="✏️ Edit Log Entry" onClose={()=>setEditLog(null)}>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>Hours</label>
              <input type="number" value={editLog.hours} onChange={e=>setEditLog({...editLog,hours:e.target.value})} step={0.0833}
                style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box" }} />
              {editLog.hours && <div style={{ fontSize:12,color:"#6366f1",marginTop:3,fontWeight:600 }}>= {fmtHours(parseHours(editLog.hours))}</div>}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>Date</label>
              <input type="date" value={editLog.date} onChange={e=>setEditLog({...editLog,date:e.target.value})}
                style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box" }} />
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:5 }}>Note / Period</label>
              <input type="text" value={editLog.note} onChange={e=>setEditLog({...editLog,note:e.target.value})}
                style={{ width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <button onClick={()=>setEditLog(null)} style={{ background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
              <button onClick={saveEditLog} style={{ background:color,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Save Changes</button>
            </div>
          </Modal>
        )}

        {/* Topics */}
        <Section title="📋 Topics">
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:12 }}>
            {(chapter.topics||[]).length===0&&<div style={{ textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:14 }}>No topics yet.</div>}
            {(chapter.topics||[]).map((t,i)=>{
              const isLast=chapter.lastCompletedTopic===t.id;
              return (
                <div key={t.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,background:isLast?"#eef2ff":t.done?"#f0fdf4":"#fff",border:`1.5px solid ${isLast?"#c7d2fe":t.done?"#bbf7d0":"#e2e8f0"}` }}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTopic(t.id)} style={{ width:17,height:17,accentColor:color,cursor:"pointer",flexShrink:0 }} />
                  <span style={{ flex:1,fontSize:14,color:t.done?"#64748b":"#1e293b",textDecoration:t.done?"line-through":"none" }}>{i+1}. {t.name}</span>
                  {isLast&&<span style={{ background:color,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,flexShrink:0 }}>Last Done</span>}
                  <button onClick={()=>markLast(t.id)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:15,opacity:.5,padding:0,flexShrink:0 }}>📍</button>
                  <button onClick={()=>deleteTopic(t.id)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#ef4444",opacity:.5,padding:0,flexShrink:0 }}>×</button>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex",gap:8 }}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTopic();}} placeholder="Add a topic..."
              style={{ flex:1,padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff" }} />
            <button onClick={addTopic} style={{ background:color,color:"#fff",border:"none",borderRadius:12,padding:"0 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>+ Add</button>
          </div>
        </Section>

        {/* Notes */}
        <Section title="📝 Notes">
          <textarea value={notes} onChange={e=>handleNotes(e.target.value)} placeholder="Notes, derivations, student doubts..."
            style={{ width:"100%",minHeight:120,padding:"14px",border:"1.5px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",resize:"vertical",outline:"none",background:"#fff",lineHeight:1.7,boxSizing:"border-box" }} />
          <div style={{ fontSize:11,color:"#94a3b8",marginTop:4 }}>☁️ Auto-saved to cloud</div>
        </Section>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────
function DashBar({ chapters, profile }) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct=total>0?(done/total)*100:0;
  const batches=[...new Set(chapters.map(c=>c.batchCode))];
  const h=new Date().getHours();
  const gw=h<12?"Good Morning ☀️":h<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const sal=profile.gender==="male"?"Sir":"Ma'am";
  return (
    <div style={{ background:"linear-gradient(135deg,#6366f1,#4338ca)",borderRadius:20,padding:"20px 20px 22px",color:"#fff",marginBottom:22 }}>
      <div style={{ fontSize:13,opacity:.8 }}>{gw},</div>
      <div style={{ fontSize:22,fontWeight:900,marginBottom:2 }}>{profile.code} {sal} 👋</div>
      <div style={{ fontSize:12,opacity:.6,marginBottom:6 }}>{profile.name}</div>
      {profile.subject && (
        <div style={{ display:"inline-block",background:"rgba(255,255,255,.2)",borderRadius:99,padding:"3px 12px",fontSize:12,fontWeight:700,marginBottom:10 }}>
          {{"Physics":"⚡","Chemistry":"🧪","Biology":"🧬","Mathematics":"📐","Multiple Subjects":"📚"}[profile.subject]||"📖"} {profile.subject}
        </div>
      )}
      {batches.length>0&&(
        <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
          {batches.map(b=><span key={b} style={{ background:"rgba(255,255,255,.2)",borderRadius:99,padding:"3px 12px",fontSize:12,fontWeight:700 }}>{b}</span>)}
        </div>
      )}
      <div style={{ background:"rgba(255,255,255,.2)",borderRadius:99,height:7 }}>
        <div style={{ width:`${Math.min(pct,100)}%`,height:"100%",background:"#fff",borderRadius:99,transition:"width .8s" }} />
      </div>
      <div style={{ fontSize:12,opacity:.8,marginTop:6 }}>{pct.toFixed(0)}% overall · {chapters.length} chapters · {batches.length} batches</div>
    </div>
  );
}

// ── Batch Card ────────────────────────────────────────────────────
function BatchCard({ batchCode, color, chapters, onClick, onDeleteAll }) {
  const total=chapters.reduce((s,c)=>s+c.totalHours,0);
  const done=chapters.reduce((s,c)=>s+c.completedHours,0);
  const pct=total>0?(done/total)*100:0;
  return (
    <div onClick={onClick} style={{ background:`linear-gradient(135deg,${color},${color}cc)`,borderRadius:18,padding:20,color:"#fff",cursor:"pointer",boxShadow:`0 4px 20px ${color}44`,position:"relative",overflow:"hidden",transition:"transform .2s" }}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="none"}
    >
      <div style={{ position:"absolute",right:-20,top:-20,width:100,height:100,background:"rgba(255,255,255,.08)",borderRadius:"50%" }} />
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
        <div style={{ fontSize:36,fontWeight:900 }}>{batchCode}</div>
        <button onClick={e=>{e.stopPropagation();onDeleteAll();}} style={{ background:"rgba(239,68,68,.3)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:12 }}>🗑️ Delete</button>
      </div>
      <div style={{ fontSize:13,opacity:.8,marginBottom:12 }}>{chapters.length} chapters · Tap to manage</div>
      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        {[{l:"Allotted",v:fmtHours(total)},{l:"Done",v:fmtHours(done)},{l:"Left",v:fmtHours(Math.max(0,total-done))}].map(s=>(
          <div key={s.l} style={{ flex:1,background:"rgba(255,255,255,.18)",borderRadius:10,padding:"7px 4px",textAlign:"center" }}>
            <div style={{ fontSize:13,fontWeight:800 }}>{s.v}</div>
            <div style={{ fontSize:9,opacity:.8,fontWeight:600,marginTop:1 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <PBar pct={pct} />
      <div style={{ fontSize:12,opacity:.8,marginTop:5 }}>{pct.toFixed(0)}% complete</div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [profile,setProfile] = useState(()=>{
    try { const s=localStorage.getItem("lt_session"); return s?JSON.parse(s):null; } catch { return null; }
  });
  const [chapters,setChapters] = useState([]);
  const [loading,setLoading] = useState(false);
  const [syncStatus,setSyncStatus] = useState(null);
  const [addOpen,setAddOpen] = useState(false);
  const [editChapter,setEditChapter] = useState(null);
  const [detailId,setDetailId] = useState(null);
  const [batchView,setBatchView] = useState(null); // batchCode string
  const [exportOpen,setExportOpen] = useState(false);
  const [search,setSearch] = useState("");
  const [viewMode,setViewMode] = useState("chapters"); // "chapters" | "batches"
  const [showCongrats,setShowCongrats] = useState(false);
  const congratsShown = useRef(false);

  useEffect(()=>{
    if (!profile) return;
    setLoading(true);
    supabase.from("chapters").select("*").eq("teacher_code",profile.code).order("created_at")
      .then(({ data, error }) => {
        if (!error && data) {
          const chs = data.map(fromRow);
          setChapters(chs);
          // Check for 100h milestone
          if (!congratsShown.current) {
            const totalDone = chs.reduce((s,c)=>s+c.completedHours,0);
            if (totalDone >= 100) { setShowCongrats(true); congratsShown.current = true; }
          }
        }
        setLoading(false);
      });
  }, [profile]);

  const syncChapter = useCallback(async (chapter) => {
    if (!profile) return;
    setSyncStatus("saving");
    const { error } = await supabase.from("chapters").upsert(toRow(profile.code, chapter), { onConflict:"id" });
    setSyncStatus(error?"error":"saved");
    setTimeout(()=>setSyncStatus(null), 2500);
  }, [profile]);

  const updateChapter = useCallback(updated => {
    setChapters(prev => {
      const newChs = prev.map(c=>c.id===updated.id?updated:c);
      // Check milestone
      if (!congratsShown.current) {
        const totalDone = newChs.reduce((s,c)=>s+c.completedHours,0);
        if (totalDone >= 100) { setShowCongrats(true); congratsShown.current = true; }
      }
      return newChs;
    });
    syncChapter(updated);
  }, [syncChapter]);

  const addChapter = async (data) => {
    const chapter = { id:uid(), ...data, completedHours:0, extraHours:0, topics:[], notes:"", lastCompletedTopic:null, hourLogs:[] };
    setChapters(prev=>[...prev,chapter]);
    setSyncStatus("saving");
    const { error } = await supabase.from("chapters").insert(toRow(profile.code, chapter));
    setSyncStatus(error?"error":"saved");
    setTimeout(()=>setSyncStatus(null),2500);
    setAddOpen(false);
  };

  const deleteChapter = async (id, silent=false) => {
    if (!silent && !window.confirm("Delete this chapter? Cannot be undone.")) return;
    setChapters(prev=>prev.filter(c=>c.id!==id));
    await supabase.from("chapters").delete().eq("id",id);
  };

  const deleteAllInBatch = async (batchCode) => {
    if (!window.confirm(`Delete ALL chapters in batch ${batchCode}? Cannot be undone!`)) return;
    const toDelete = chapters.filter(c=>c.batchCode===batchCode);
    setChapters(prev=>prev.filter(c=>c.batchCode!==batchCode));
    for (const c of toDelete) await supabase.from("chapters").delete().eq("id",c.id);
    setBatchView(null);
  };

  const editAndSave = async (data) => {
    const updated = { ...editChapter, ...data };
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    await supabase.from("chapters").upsert(toRow(profile.code, updated), { onConflict:"id" });
    setEditChapter(null);
  };

  const logout = () => { localStorage.removeItem("lt_session"); setProfile(null); setChapters([]); };

  if (!profile) return <Onboarding onDone={p=>setProfile(p)} />;

  const batches=[...new Set(chapters.map(c=>c.batchCode))].sort();
  const getBatchColor=b=>BATCH_COLORS[batches.indexOf(b)%BATCH_COLORS.length];
  const totalDone = chapters.reduce((s,c)=>s+c.completedHours,0);

  // Congrats screen
  if (showCongrats) return <CongratsScreen profile={profile} totalHours={totalDone} onClose={()=>setShowCongrats(false)} />;

  // Detail page
  const detailChapter=chapters.find(c=>c.id===detailId);
  if (detailChapter) return (
    <DetailPage chapter={detailChapter} color={getBatchColor(detailChapter.batchCode)}
      onUpdate={updateChapter} onBack={()=>setDetailId(null)} syncStatus={syncStatus} />
  );

  // Batch page
  if (batchView) {
    const batchChapters = chapters.filter(c=>c.batchCode===batchView);
    return (
      <BatchPage batchCode={batchView} color={getBatchColor(batchView)} chapters={batchChapters}
        onBack={()=>setBatchView(null)}
        onDeleteChapter={deleteChapter}
        onEditChapter={c=>setEditChapter(c)}
        onOpenChapter={id=>setDetailId(id)}
      />
    );
  }

  const filtered=chapters.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.batchCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;} body{margin:0;font-family:'Sora',sans-serif;background:#f8fafc;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-thumb{background:#dde;border-radius:99px;}
      `}</style>
      <div style={{ maxWidth:560,margin:"0 auto",padding:"22px 15px 70px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <div>
            <div style={{ fontSize:20,fontWeight:900,color:"#0f172a" }}>LectureTrack</div>
            <div style={{ fontSize:11,color:"#94a3b8" }}>Physics · NEET / JEE</div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            {syncStatus&&<SyncBadge status={syncStatus} />}
            <button onClick={()=>setExportOpen(true)} style={{ background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center" }}>📊</button>
            <button onClick={logout} title="Logout" style={{ background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center" }}>🔒</button>
            <button onClick={()=>setAddOpen(true)} style={{ background:"#6366f1",color:"#fff",border:"none",borderRadius:10,padding:"0 14px",height:36,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit" }}>+ Add</button>
          </div>
        </div>

        {loading?(
          <div style={{ textAlign:"center",padding:"60px 20px" }}>
            <div style={{ fontSize:40,marginBottom:16 }}>☁️</div>
            <div style={{ fontWeight:700,fontSize:16,color:"#6366f1" }}>Loading your data...</div>
          </div>
        ):(
          <>
            <DashBar chapters={chapters} profile={profile} />

            {/* View Toggle */}
            <div style={{ display:"flex",background:"#f1f5f9",borderRadius:12,padding:4,marginBottom:16,gap:4 }}>
              {["chapters","batches"].map(m=>(
                <button key={m} onClick={()=>setViewMode(m)} style={{ flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",background:viewMode===m?"#fff":"transparent",fontWeight:700,fontSize:13,color:viewMode===m?"#6366f1":"#64748b",fontFamily:"inherit",boxShadow:viewMode===m?"0 2px 8px rgba(0,0,0,.08)":"none" }}>
                  {m==="chapters"?"📚 Chapters":"🗂️ Batches"}
                </button>
              ))}
            </div>

            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search chapter or batch..."
              style={{ width:"100%",padding:"11px 16px",border:"1.5px solid #e2e8f0",borderRadius:14,fontSize:14,fontFamily:"inherit",outline:"none",background:"#fff",marginBottom:16,boxSizing:"border-box" }} />

            {viewMode==="batches"?(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {batches.length===0&&(
                  <div style={{ textAlign:"center",padding:"50px 20px",color:"#94a3b8" }}>
                    <div style={{ fontSize:44 }}>📭</div>
                    <div style={{ fontWeight:700,marginTop:12,fontSize:16 }}>No batches yet</div>
                    <div style={{ fontSize:13,marginTop:4 }}>Add a chapter to create a batch</div>
                  </div>
                )}
                {batches.map(b=>(
                  <BatchCard key={b} batchCode={b} color={getBatchColor(b)}
                    chapters={chapters.filter(c=>c.batchCode===b)}
                    onClick={()=>setBatchView(b)}
                    onDeleteAll={()=>deleteAllInBatch(b)}
                  />
                ))}
              </div>
            ):(
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                {filtered.length===0&&(
                  <div style={{ textAlign:"center",padding:"50px 20px",color:"#94a3b8" }}>
                    <div style={{ fontSize:44 }}>📭</div>
                    <div style={{ fontWeight:700,marginTop:12,fontSize:16 }}>No chapters yet</div>
                    <div style={{ fontSize:13,marginTop:4 }}>Tap "+ Add" to get started</div>
                  </div>
                )}
                {filtered.map(c=>(
                  <ChapterCard key={c.id} chapter={c} color={getBatchColor(c.batchCode)}
                    onClick={()=>setDetailId(c.id)}
                    onEdit={e=>{e.stopPropagation();setEditChapter(c);}}
                    onDelete={e=>{e.stopPropagation();deleteChapter(c.id);}}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {addOpen&&<ChapterFormModal onSave={addChapter} onClose={()=>setAddOpen(false)} />}
      {editChapter&&<ChapterFormModal chapter={editChapter} onSave={editAndSave} onClose={()=>setEditChapter(null)} />}
      {exportOpen&&<ExportModal chapters={chapters} onClose={()=>setExportOpen(false)} />}
    </>
  );
}
