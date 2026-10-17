import { useState, useRef, useEffect, useCallback } from "react";
import { FolderOpen, Plus, CheckCircle2, MapPin, Pencil } from "lucide-react";
import Modal from "./Modal";
import BatchRowInput from "./BatchRowInput";
import { BATCH_CATEGORIES, CATEGORY_ICONS } from "../lib/constants";
import { uid, fmtHours } from "../lib/helpers";

const inputStyle={width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"};

// Used for both "Add Batch" and "Edit Batch".
// Edit mode: pass `initial` = {batchCode, teacherName, batchCentre, batchCategory, chapters:[{id,name,totalHours,completedHours}]}
// Everything already saved is pre-filled, so teachers only need to pick the centre for older batches.
export default function BatchFormModal({onSave,onClose,subject,masterChapters,existingCentres=[],initial=null}) {
  const editing=!!initial;
  const [batchCode,setBatchCode]=useState(initial?.batchCode||"");
  const [teacherName,setTeacherName]=useState(initial?.teacherName||"");
  const [batchCentre,setBatchCentre]=useState(initial?initial.batchCentre||"":(existingCentres.length===1?existingCentres[0]:""));
  const [batchCategory,setBatchCategory]=useState(initial?.batchCategory||BATCH_CATEGORIES[0]);
  const [rows,setRows]=useState([{id:uid(),name:"",hours:""}]);
  // Edit mode: one editable entry per existing chapter (name + allotted hours)
  const [chEdits,setChEdits]=useState(()=>Object.fromEntries((initial?.chapters||[]).map(c=>[c.id,{name:c.name,hours:String(c.totalHours)}])));
  const setCh=(id,patch)=>setChEdits(prev=>({...prev,[id]:{...prev[id],...patch}}));
  // Use refs to track current row data without re-rendering the inputs
  const rowDataRef = useRef({});

  useEffect(() => {
    rows.forEach(r => {
      if(!rowDataRef.current[r.id]) rowDataRef.current[r.id] = {name:"",hours:""};
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if(editing){
      const chapters=(initial.chapters||[]).map(c=>{
        const e=chEdits[c.id]||{name:c.name,hours:String(c.totalHours)};
        const h=parseFloat(e.hours);
        return {id:c.id,name:(e.name||"").trim()||c.name,totalHours:h>0?h:c.totalHours};
      });
      onSave({batchCode:batchCode.trim().toUpperCase(), teacherName:teacherName.trim(), batchCentre:batchCentre.trim(), batchCategory, chapters});
      return;
    }
    const validRows = rows
      .map(r => rowDataRef.current[r.id] || {name:"",hours:""})
      .filter(r => r.name.trim() && parseFloat(r.hours)>0);
    if(validRows.length===0) return;
    onSave({batchCode:batchCode.trim().toUpperCase(), teacherName:teacherName.trim(), batchCentre:batchCentre.trim(), batchCategory, rows:validRows});
  };

  const needsCentre=editing&&!batchCentre.trim();

  return(
    <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}>{editing?<Pencil size={16}/>:<FolderOpen size={17}/>} {editing?"Edit Batch":"Add Batch"}</span>} onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Batch Code / Name</label>
        <input value={batchCode} onChange={e=>setBatchCode(e.target.value.toUpperCase())} placeholder="e.g. X1, 11A, RISE" style={inputStyle}/>
      </div>
      <div style={{marginBottom:14,padding:needsCentre?"12px":0,background:needsCentre?"#fffbeb":"transparent",border:needsCentre?"2px solid #fde68a":"none",borderRadius:14}}>
        <label style={{display:"flex",alignItems:"center",gap:5,fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}><MapPin size={13}/> Centre / Branch</label>
        {needsCentre&&<div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:8}}>This batch has no centre yet. Choose one below so it is grouped correctly.</div>}
        <input value={batchCentre} onChange={e=>setBatchCentre(e.target.value)} placeholder="e.g. Main Campus, Kukatpally Branch" style={inputStyle}/>
        {existingCentres.length>0&&(
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
            {existingCentres.map(c=>{
              const on=batchCentre.trim().toLowerCase()===c.toLowerCase();
              return(
                <button key={c} onClick={()=>setBatchCentre(c)} style={{padding:"6px 12px",borderRadius:99,border:`2px solid ${on?"#6366f1":"#e2e8f0"}`,background:on?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:on?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12}}>{c}</button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Teacher Name (optional)</label>
        <input value={teacherName} onChange={e=>setTeacherName(e.target.value)} placeholder="e.g. Alice" style={inputStyle}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Batch Category</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {BATCH_CATEGORIES.map(cat=>{
            const Icon=CATEGORY_ICONS[cat];
            return(
              <button key={cat} onClick={()=>setBatchCategory(cat)} style={{padding:"8px 14px",borderRadius:12,border:`2px solid ${batchCategory===cat?"#6366f1":"#e2e8f0"}`,background:batchCategory===cat?"#eef2ff":"#f8fafc",fontWeight:700,cursor:"pointer",color:batchCategory===cat?"#6366f1":"#64748b",fontFamily:"inherit",fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                <Icon size={13}/>{cat}
              </button>
            );
          })}
        </div>
      </div>

      {editing?(
        <>
          <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:8}}>Chapters &amp; allotted hours:</div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {(initial.chapters||[]).map((c,i)=>{
              const e=chEdits[c.id]||{name:c.name,hours:String(c.totalHours)};
              return(
                <div key={c.id} style={{background:"#f8fafc",borderRadius:14,padding:"12px 14px",border:"1.5px solid #e2e8f0"}}>
                  <input value={e.name} onChange={ev=>setCh(c.id,{name:ev.target.value})} placeholder={`Chapter ${i+1} name`} style={{...inputStyle,padding:"10px 12px",fontSize:14,background:"#fff",marginBottom:8}}/>
                  <input type="number" min={0} step={0.5} value={e.hours} onChange={ev=>setCh(c.id,{hours:ev.target.value})} placeholder="Allotted hours" style={{...inputStyle,padding:"10px 12px",fontSize:14,background:"#fff"}}/>
                  <div style={{fontSize:11,color:"#6366f1",marginTop:4,fontWeight:700}}>
                    {parseFloat(e.hours)>0?`= ${fmtHours(parseFloat(e.hours))} allotted`:""}{(c.completedHours||0)>0?` · ${fmtHours(c.completedHours)} taken so far`:""}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ):(
        <>
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
            <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Plus size={15}/> Add Another Chapter</span>
          </button>
        </>
      )}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={handleSave} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}><span style={{display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={15}/> {editing?"Save Changes":"Create Batch"}</span></button>
      </div>
    </Modal>
  );
}
