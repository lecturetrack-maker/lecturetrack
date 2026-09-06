import { useRef } from "react";
import { User as UserIcon, Camera, BarChart3, Clock, ClipboardList, Star, FolderOpen, BookOpen, Zap, Download, Plane, LogOut } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import SubjectIcon from "../components/SubjectIcon";
import { fmtHours, deriveExtraHours, buildCSV } from "../lib/helpers";

export default function ProfileTab({profile,chapters,onLogout,onUpdateProfile,onOpenTravel}) {
  const fileRef=useRef();
  const batchChapters=chapters.filter(c=>c.batchCode);
  const totalDone=batchChapters.reduce((s,c)=>s+c.completedHours,0);
  const totalAllotted=batchChapters.reduce((s,c)=>s+c.totalHours,0);
  const totalExtra=batchChapters.reduce((s,c)=>s+deriveExtraHours(c.completedHours,c.totalHours),0);
  const batches=[...new Set(batchChapters.map(c=>c.batchCode))];

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
          <div style={{width:90,height:90,borderRadius:"50%",border:"4px solid rgba(255,255,255,.4)",overflow:"hidden",margin:"0 auto",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {profile.photo?<img src={profile.photo} alt="profile" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<UserIcon size={38} color="#fff"/>}
          </div>
          <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,background:"#fff",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,.2)"}}><Camera size={14} color="#4f46e5"/></button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{display:"none"}}/>
        <div style={{fontSize:22,fontWeight:900,marginBottom:4}}>{profile.name}</div>
        <div style={{fontSize:14,opacity:.8,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><SubjectIcon subject={profile.subject} size={14} color="rgba(255,255,255,.8)"/> {profile.subject||"Teacher"}</div>
        <div style={{fontSize:13,opacity:.6,background:"rgba(255,255,255,.15)",borderRadius:99,padding:"4px 16px",display:"inline-block"}}>{profile.code}</div>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14,display:"flex",alignItems:"center",gap:7}}><BarChart3 size={16}/> Your Stats</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[{label:"Hours Taken",val:fmtHours(totalDone),color:"#6366f1",Icon:Clock},{label:"Allotted",val:fmtHours(totalAllotted),color:"#10b981",Icon:ClipboardList},{label:"Extra Hours",val:fmtHours(totalExtra),color:"#f59e0b",Icon:Star},{label:"Batches",val:batches.length,color:"#ef4444",Icon:FolderOpen},{label:"Chapters",val:batchChapters.length,color:"#8b5cf6",Icon:BookOpen},{label:"Progress",val:(totalAllotted>0?(totalDone/totalAllotted)*100:0).toFixed(0)+"%",color:"#14b8a6",Icon:BarChart3}].map(s=>(
            <div key={s.label} style={{background:`${s.color}0f`,borderRadius:14,padding:"14px 16px",border:`1.5px solid ${s.color}22`}}>
              <div style={{marginBottom:4}}><s.Icon size={19} color={s.color} strokeWidth={2.2}/></div>
              <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
              <div style={{fontSize:11,color:"#94a3b8",fontWeight:600,marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14,display:"flex",alignItems:"center",gap:7}}><Zap size={16}/> Quick Actions</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={downloadCSV} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14,boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}>
            <Download size={22}/>
            <div style={{textAlign:"left"}}><div>Download CSV Report</div><div style={{fontSize:11,opacity:.75,fontWeight:500}}>Full chapter report for all batches</div></div>
          </button>
          <button onClick={onOpenTravel} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#fff",color:"#0f172a",border:"2px solid #e2e8f0",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14}}>
            <Plane size={22} color="#6366f1"/>
            <div style={{textAlign:"left"}}><div>Travel Details</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Log trips for travel allowance</div></div>
          </button>
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#fff",color:"#ef4444",border:"2px solid #fee2e2",borderRadius:14,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14}}>
            <LogOut size={22}/>
            <div style={{textAlign:"left"}}><div>Logout</div><div style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Sign out of your account</div></div>
          </button>
        </div>
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"#cbd5e1",paddingBottom:10}}>LectureTrack v13 · Made for teachers</div>
    </div>
  );
}
