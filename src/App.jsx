import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Cloud } from "lucide-react";

import { supabase } from "./lib/supabaseClient";
import { BATCH_COLORS, WHATS_NEW_ID } from "./lib/constants";
import { uid, toRow, fromRow, trFromRow, trToRow } from "./lib/helpers";

import SplashScreen from "./components/SplashScreen";
import CongratsScreen from "./components/CongratsScreen";
import Modal from "./components/Modal";
import BottomNav from "./components/BottomNav";
import BatchFormModal from "./components/BatchFormModal";
import AddChapterMasterModal from "./components/AddChapterMasterModal";
import ChapterMasterModal from "./components/ChapterMasterModal";
import WhatsNewModal from "./components/WhatsNewModal";
import EditChapterForm from "./components/EditChapterForm";

import Onboarding from "./pages/Onboarding";
import HomeTab from "./pages/HomeTab";
import ChaptersTab from "./pages/ChaptersTab";
import BatchesTab from "./pages/BatchesTab";
import ProfileTab from "./pages/ProfileTab";
import TravelPage from "./pages/TravelPage";
import BatchPage from "./pages/BatchPage";
import DetailPage from "./pages/DetailPage";

const STYLE=`
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;} body{margin:0;font-family:'Sora',sans-serif;background:#f8fafc;overscroll-behavior:none;}
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#dde;border-radius:99px;}
  input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.1);}
  html{touch-action:pan-x pan-y;} *{touch-action:inherit;}
  input,textarea,select{touch-action:manipulation;}
`;

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
  const [travelView,setTravelView]=useState(false);
  const congratsShown=useRef(false);
  const [showCongrats,setShowCongrats]=useState(false);
  // Tracks which batch codes have been marked "Completed" so they can be hidden from the Home tab
  const [completedBatches,setCompletedBatches]=useState([]);
  const [travelLogs,setTravelLogs]=useState([]);
  // Set when the travel_logs fetch fails (missing table / RLS blocking reads / network),
  // so the Travel page can show the person a real reason instead of a silently-empty list.
  const [travelLoadError,setTravelLoadError]=useState(null);
  const [showWhatsNew,setShowWhatsNew]=useState(false);
  // Picked once when the app first loads (not on every tab switch) so the Home tab's
  // "This Month" card shows a different color theme each time you reopen the app.
  const [bannerTheme]=useState(()=>Math.floor(Math.random()*3));

  // Phone back-button support. Without this, opening a batch or a chapter's detail page
  // doesn't add anything to browser history, so the hardware/gesture back button closes
  // the whole app. We push a history entry each time we drill into a batch or chapter,
  // and listen for the browser's back navigation (popstate) to close that view instead.
  const detailIdRef=useRef(detailId);
  const batchViewRef=useRef(batchView);
  const travelViewRef=useRef(travelView);
  useEffect(()=>{ detailIdRef.current=detailId; },[detailId]);
  useEffect(()=>{ batchViewRef.current=batchView; },[batchView]);
  useEffect(()=>{ travelViewRef.current=travelView; },[travelView]);

  useEffect(()=>{
    const handlePopState=()=>{
      if(detailIdRef.current){
        setDetailId(null);
      } else if(batchViewRef.current){
        setBatchView(null);
      } else if(travelViewRef.current){
        setTravelView(false);
      }
      // else: already at the top level — let the back button behave normally
    };
    window.addEventListener("popstate",handlePopState);
    return ()=>window.removeEventListener("popstate",handlePopState);
  },[]);

  // Wrapped navigation helpers that push a history entry when drilling in
  const openBatchView=useCallback((code)=>{
    window.history.pushState({ltView:"batch"},"");
    setBatchView(code);
  },[]);
  const openDetail=useCallback((id)=>{
    window.history.pushState({ltView:"detail"},"");
    setDetailId(id);
  },[]);
  const openTravelView=useCallback(()=>{
    window.history.pushState({ltView:"travel"},"");
    setTravelView(true);
  },[]);
  // "Back" actions go through history.back() so the popstate handler above is the
  // single source of truth for closing a view — keeps the history stack accurate.
  const goBackFromDetail=useCallback(()=>{ window.history.back(); },[]);
  const goBackFromBatch=useCallback(()=>{ window.history.back(); },[]);
  const goBackFromTravel=useCallback(()=>{ window.history.back(); },[]);

  useEffect(()=>{const t=setTimeout(()=>setSplashDone(true),2200);return()=>clearTimeout(t);},[]);

  // Load the completed-batches list for this teacher from localStorage
  useEffect(()=>{
    if(!profile){setCompletedBatches([]);return;}
    try{
      const stored=localStorage.getItem(`lt_completed_${profile.code}`);
      setCompletedBatches(stored?JSON.parse(stored):[]);
    }catch{setCompletedBatches([]);}
  },[profile?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle a batch's completed status and persist it
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
    // Load this teacher's travel log entries
    supabase.from("travel_logs").select("*").eq("teacher_code",profile.code).order("date",{ascending:false})
      .then(({data,error})=>{
        if(!error&&data){
          setTravelLogs(data.map(trFromRow));
          setTravelLoadError(null);
        } else if(error){
          // Surface the real reason (missing table, RLS blocking reads, etc.) instead of
          // silently leaving the list empty — check the browser console for the message.
          console.error("travel_logs fetch failed:", error.message);
          setTravelLoadError(error.message);
        }
      });
    // Show the "What's New" popup unless this teacher already dismissed this version of it
    try{
      const dismissed=localStorage.getItem(`lt_whatsnew_${WHATS_NEW_ID}_${profile.code}`);
      if(!dismissed) setShowWhatsNew(true);
    }catch{}
  },[profile?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live sync — listen for changes made from OTHER devices/tabs (needs Realtime
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
  },[profile?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback for when Realtime isn't enabled on the Supabase project — re-pull the
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
  },[profile?.code]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // addBatch copies topics from master chapters, and stores batchCategory
  const addBatch=async({batchCode,teacherName,batchCategory,rows})=>{
    const newChapters=[];
    for(const row of rows){
      const master=masterChapters.find(mc=>mc.name.toLowerCase()===row.name.trim().toLowerCase());
      // Copy topics from master, resetting done state
      const topics=master?master.topics.map(t=>({...t,id:uid(),done:false})):[];
      const nc={id:uid(),name:row.name.trim(),batchCode,totalHours:parseFloat(row.hours),completedHours:0,extraHours:0,topics,notes:"",lastCompletedTopic:null,hourLogs:[],batchTeacher:teacherName||null,batchCategory:batchCategory||null};
      newChapters.push(nc);
    }
    setChapters(prev=>[...prev,...newChapters]);
    setSyncStatus("saving");
    let hadError=false;
    for(const nc of newChapters){
      const {error}=await supabase.from("chapters").insert(toRow(profile.code,nc));
      if(error) hadError=true;
    }
    setSyncStatus(hadError?"error":"saved");
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
    // Also clean up the completed-batches list if this batch was marked completed
    setCompletedBatches(prev=>{
      const next=prev.filter(b=>b!==batchCode);
      try{if(profile) localStorage.setItem(`lt_completed_${profile.code}`,JSON.stringify(next));}catch{}
      return next;
    });
    // If we're currently viewing the batch being deleted, consume the history entry
    // that was pushed when it was opened (keeps the back-button stack accurate).
    if(batchViewRef.current===batchCode){
      window.history.back();
    } else {
      setBatchView(null);
    }
  };

  const editBatchChapterSave=async data=>{
    const updated={...editChapter,...data};
    setChapters(prev=>prev.map(c=>c.id===updated.id?updated:c));
    await supabase.from("chapters").upsert(toRow(profile.code,updated),{onConflict:"id"});
    setEditChapter(null);
  };

  // Travel Details CRUD
  const addTravelEntry=async(entry)=>{
    setTravelLogs(prev=>[entry,...prev]);
    const {error}=await supabase.from("travel_logs").insert(trToRow(profile.code,entry));
    if(error){
      console.error("travel_logs insert failed:", error.message);
      setSyncStatus("error");
      setTimeout(()=>setSyncStatus(null),2500);
    }
  };
  const editTravelEntry=async(entry)=>{
    setTravelLogs(prev=>prev.map(t=>t.id===entry.id?entry:t));
    const {error}=await supabase.from("travel_logs").upsert(trToRow(profile.code,entry),{onConflict:"id"});
    if(error) console.error("travel_logs update failed:", error.message);
  };
  const deleteTravelEntry=async(id)=>{
    if(!window.confirm("Remove this trip?")) return;
    setTravelLogs(prev=>prev.filter(t=>t.id!==id));
    const {error}=await supabase.from("travel_logs").delete().eq("id",id);
    if(error) console.error("travel_logs delete failed:", error.message);
  };

  const logout=()=>{localStorage.removeItem("lt_session");window.location.reload();};

  // "Don't show again" — permanently dismisses this What's New announcement for this teacher
  const dismissWhatsNewForever=()=>{
    try{ if(profile) localStorage.setItem(`lt_whatsnew_${WHATS_NEW_ID}_${profile.code}`,"1"); }catch{}
    setShowWhatsNew(false);
  };

  const batches=useMemo(()=>[...new Set(batchChapters.map(c=>c.batchCode))].sort(),[batchChapters]);
  const getBatchColor=useCallback(b=>BATCH_COLORS[batches.indexOf(b)%BATCH_COLORS.length],[batches]);

  if(!splashDone) return <><style>{STYLE}</style><SplashScreen/></>;
  if(!profile) return <><style>{STYLE}</style><Onboarding onDone={p=>setProfile(p)}/></>;
  if(showCongrats){
    const td=batchChapters.reduce((s,c)=>s+c.completedHours,0);
    return <><style>{STYLE}</style><CongratsScreen profile={profile} totalHours={td} onClose={()=>setShowCongrats(false)}/></>;
  }

  const detailChapter=chapters.find(c=>c.id===detailId);
  if(detailChapter) return(
    <><style>{STYLE}</style>
    <DetailPage chapter={detailChapter} color={getBatchColor(detailChapter.batchCode)||"#6366f1"} onUpdate={updateChapter} onBack={goBackFromDetail} syncStatus={syncStatus}/>
    </>
  );

  if(batchView){
    const bChs=batchChapters.filter(c=>c.batchCode===batchView);
    return(
      <><style>{STYLE}</style>
      <BatchPage batchCode={batchView} color={getBatchColor(batchView)} chapters={bChs} masterChapters={masterChapters}
        onBack={goBackFromBatch} onDeleteChapter={deleteChapter}
        onEditChapter={c=>setEditChapter(c)} onOpenChapter={openDetail}
        onDeleteBatch={()=>deleteBatch(batchView)}
        completed={completedBatches.includes(batchView)}
        onToggleCompleted={()=>toggleBatchCompleted(batchView)}/>
      {editChapter&&(
        <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}>Edit Chapter</span>} onClose={()=>setEditChapter(null)}>
          <EditChapterForm chapter={editChapter} onSave={editBatchChapterSave} onClose={()=>setEditChapter(null)}/>
        </Modal>
      )}
      </>
    );
  }

  if(travelView){
    return(
      <><style>{STYLE}</style>
      <TravelPage travelLogs={travelLogs} profile={profile} onBack={goBackFromTravel}
        onAdd={addTravelEntry} onEdit={editTravelEntry} onDelete={deleteTravelEntry}
        loadError={travelLoadError}/>
      </>
    );
  }

  return(
    <><style>{STYLE}</style>
    <div style={{maxWidth:560,margin:"0 auto",paddingBottom:72,minHeight:"100vh"}}>
      {loading?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"80vh"}}>
          <div style={{marginBottom:16}}><Cloud size={44} color="#6366f1" strokeWidth={1.5}/></div>
          <div style={{fontWeight:800,fontSize:16,color:"#6366f1"}}>Loading your data...</div>
          <div style={{fontSize:13,color:"#94a3b8",marginTop:6}}>Fetching from cloud</div>
        </div>
      ):(
        <>
          {tab==="home"&&<HomeTab chapters={batchChapters} profile={profile} onOpenChapter={openDetail} onOpenBatch={openBatchView} syncStatus={syncStatus} onGoProfile={()=>setTab("profile")} completedBatches={completedBatches} onAddBatch={()=>setAddBatchOpen(true)} bannerTheme={bannerTheme}/>}
          {tab==="batches"&&<BatchesTab chapters={batchChapters} onOpenBatch={openBatchView} onDeleteBatch={deleteBatch} onAddBatch={()=>setAddBatchOpen(true)} completedBatches={completedBatches}/>}
          {tab==="chapters"&&<ChaptersTab masterChapters={masterChapters} onOpenMaster={c=>setEditMaster(c)} onAddMaster={()=>setAddMasterOpen(true)} onDeleteMaster={deleteMasterChapter}/>}
          {tab==="profile"&&<ProfileTab profile={profile} chapters={batchChapters} onLogout={logout} onUpdateProfile={p=>setProfile(p)} onOpenTravel={openTravelView}/>}
        </>
      )}
    </div>
    <BottomNav active={tab} onChange={t=>setTab(t)}/>
    {addBatchOpen&&<BatchFormModal onSave={addBatch} onClose={()=>setAddBatchOpen(false)} subject={profile.subject} masterChapters={masterChapters}/>}
    {addMasterOpen&&<AddChapterMasterModal onSave={addMasterChapter} onClose={()=>setAddMasterOpen(false)} subject={profile.subject}/>}
    {editMaster&&<ChapterMasterModal chapter={editMaster} onSave={saveMasterTopics} onClose={()=>setEditMaster(null)}/>}
    {/* "What's New" popup — announces new features, dismissible per-teacher */}
    {showWhatsNew&&!loading&&<WhatsNewModal onClose={()=>setShowWhatsNew(false)} onDontShowAgain={dismissWhatsNewForever}/>}
    </>
  );
}
