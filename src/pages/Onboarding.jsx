import { useState } from "react";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import SubjectIcon from "../components/SubjectIcon";

export default function Onboarding({onDone}) {
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
  const SUBJECT_OPTIONS=[{label:"Physics",value:"Physics"},{label:"Chemistry",value:"Chemistry"},{label:"Biology",value:"Biology"},{label:"Mathematics",value:"Mathematics"},{label:"Multiple",value:"Multiple Subjects"}];
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#4f46e5,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp .4s ease forwards}`}</style>
      <div className="fade-up" style={{background:"#fff",borderRadius:28,padding:32,width:"100%",maxWidth:420,boxShadow:"0 32px 80px rgba(0,0,0,.25)"}}>
        <div style={{textAlign:"center",marginBottom:26}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#6366f1,#4338ca)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}><GraduationCap size={38} color="#fff" strokeWidth={1.8}/></div>
          <h2 style={{margin:"0 0 4px",fontSize:26,fontWeight:900,color:"#0f172a",letterSpacing:"-0.5px"}}>LectureTrack</h2>
          <p style={{margin:0,color:"#94a3b8",fontSize:13,fontWeight:500}}>Track every hour. Teach with clarity.</p>
        </div>
        <div style={{display:"flex",background:"#f1f5f9",borderRadius:14,padding:4,marginBottom:22,gap:4}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:11,border:"none",cursor:"pointer",background:mode===m?"#fff":"transparent",fontWeight:800,fontSize:14,color:mode===m?"#6366f1":"#64748b",fontFamily:"inherit",boxShadow:mode===m?"0 2px 10px rgba(99,102,241,.15)":"none",transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {m==="login"?<LogIn size={15}/>:<UserPlus size={15}/>}{m==="login"?"Login":"Register"}
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
                  {g==="male"?"Male":"Female"}
                </button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Subject You Teach</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {SUBJECT_OPTIONS.map(s=>(
                <button key={s.value} onClick={()=>setSubject(s.value)} style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${subject===s.value?"#6366f1":"#e2e8f0"}`,background:subject===s.value?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:subject===s.value?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                  <SubjectIcon subject={s.value} size={13} color={subject===s.value?"#6366f1":"#64748b"}/>{s.label}
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
