// Kept at module scope (not defined inside DetailPage) — previously being re-created on
// every render made React treat it as a brand-new component type on every keystroke and
// remount the whole section, including inputs, dropping focus and closing the keyboard.
export default function Sec({title,children}) {
  return(
    <div style={{background:"#fff",borderRadius:20,padding:20,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:14}}>{title}</div>
      {children}
    </div>
  );
}
