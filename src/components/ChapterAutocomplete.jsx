import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { CHAPTER_DB, ALL_CHAPTERS } from "../lib/constants";

export default function ChapterAutocomplete({value,onChange,subject}) {
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
              <span style={{display:"flex",alignItems:"center",gap:6}}><BookOpen size={13}/> {s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
