import { useState, useRef, useEffect, useCallback } from "react";
import { FolderOpen, Plus, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import BatchRowInput from "./BatchRowInput";
import { BATCH_CATEGORIES, CATEGORY_ICONS } from "../lib/constants";
import { uid } from "../lib/helpers";

// Added Batch Category selector (Repeaters / Residential / Long Term / Foundation / Tuition / Others)
export default function BatchFormModal({onSave,onClose,subject,masterChapters}) {
  const [batchCode,setBatchCode]=useState("");
  const [teacherName,setTeacherName]=useState("");
  const [batchCategory,setBatchCategory]=useState(BATCH_CATEGORIES[0]);
  const [rows,setRows]=useState([{id:uid(),name:"",hours:""}]);
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
    const validRows = rows
      .map(r => rowDataRef.current[r.id] || {name:"",hours:""})
      .filter(r => r.name.trim() && parseFloat(r.hours)>0);
    if(validRows.length===0) return;
    onSave({batchCode:batchCode.trim().toUpperCase(), teacherName:teacherName.trim(), batchCategory, rows:validRows});
  };

  return(
    <Modal title={<span style={{display:"flex",alignItems:"center",gap:8}}><FolderOpen size={17}/> Add Batch</span>} onClose={onClose}>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Batch Code / Name</label>
        <input value={batchCode} onChange={e=>setBatchCode(e.target.value.toUpperCase())} placeholder="e.g. X1, 11A, RISE"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:13,fontWeight:700,color:"#475569",marginBottom:5}}>Teacher Name (optional)</label>
        <input value={teacherName} onChange={e=>setTeacherName(e.target.value)} placeholder="e.g. Alice"
          style={{width:"100%",padding:"12px 14px",border:"2px solid #e2e8f0",borderRadius:12,fontSize:15,fontFamily:"inherit",outline:"none",background:"#f8fafc",boxSizing:"border-box"}}/>
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
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{background:"#f1f5f9",color:"#475569",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <button onClick={handleSave} style={{background:"linear-gradient(135deg,#6366f1,#4338ca)",color:"#fff",border:"none",borderRadius:12,padding:"11px 22px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(99,102,241,.3)"}}><span style={{display:"flex",alignItems:"center",gap:6}}><CheckCircle2 size={15}/> Create Batch</span></button>
      </div>
    </Modal>
  );
}
