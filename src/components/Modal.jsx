import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({title,onClose,children}) {
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
          {onClose&&<button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:99,width:34,height:34,cursor:"pointer",color:"#64748b",display:"flex",alignItems:"center",justifyContent:"center"}}><X size={18}/></button>}
        </div>
        {children}
      </div>
    </div>
  );
}
