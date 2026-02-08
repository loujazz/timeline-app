import { useState, useRef, useEffect } from "react";

const ICONS = [
  { name:"Star", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> },
  { name:"Heart", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> },
  { name:"Flag", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg> },
  { name:"Rocket", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg> },
  { name:"Trophy", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg> },
  { name:"Bulb", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg> },
  { name:"Camera", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg> },
  { name:"Music", svg:<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg> },
];
const COLORS = ["#111","#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];

const sample = [
  { id:1, date:"2020-01-15", title:"Inizio Progetto", desc:"Il viaggio è iniziato con un'idea rivoluzionaria", icon:0, color:"#111", image:null },
  { id:2, date:"2021-06-20", title:"Prima Milestone", desc:"Raggiunto il primo traguardo importante", icon:4, color:"#111", image:null },
  { id:3, date:"2023-03-10", title:"Lancio Pubblico", desc:"Il prodotto è finalmente disponibile per tutti", icon:3, color:"#111", image:null },
  { id:4, date:"2024-09-01", title:"Espansione Globale", desc:"Apertura verso nuovi mercati internazionali", icon:5, color:"#111", image:null },
];

export default function App() {
  const [events, setEvents] = useState(sample);
  const [sel, setSel] = useState(null);
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState({ date:"",title:"",desc:"",icon:0,color:COLORS[0],image:null });
  const [editId, setEditId] = useState(null);
  const fileRef = useRef(null);
  const lineRef = useRef(null);
  const nid = useRef(100);
  const sorted = [...events].sort((a,b)=>a.date.localeCompare(b.date));

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = () => {
    if (!form.date||!form.title) return;
    if (editId!==null) { setEvents(ev=>ev.map(e=>e.id===editId?{...e,...form}:e)); setEditId(null); }
    else setEvents(ev=>[...ev,{...form,id:nid.current++}]);
    setForm({date:"",title:"",desc:"",icon:0,color:COLORS[0],image:null});
    setMode("view");
  };

  const startEdit = e => { setForm({date:e.date,title:e.title,desc:e.desc,icon:e.icon,color:e.color,image:e.image}); setEditId(e.id); setMode("form"); };
  const cancel = () => { setEditId(null); setForm({date:"",title:"",desc:"",icon:0,color:COLORS[0],image:null}); setMode("view"); };
  const remove = id => { setEvents(ev=>ev.filter(e=>e.id!==id)); if(sel===id) setSel(null); };

  const onFile = e => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setF("image",ev.target.result); r.readAsDataURL(f); };

  const goNav = dir => {
    const idx = sorted.findIndex(e=>e.id===sel);
    if (sel===null) { setSel(sorted[0]?.id||null); return; }
    const next = idx+dir;
    if (next>=0 && next<sorted.length) setSel(sorted[next].id);
  };

  useEffect(() => {
    const h = e => {
      if (mode==="form") return;
      if (e.key==="ArrowRight") { e.preventDefault(); goNav(1); }
      if (e.key==="ArrowLeft") { e.preventDefault(); goNav(-1); }
      if (e.key==="Escape") setSel(null);
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  });

  // scroll selected node into view
  useEffect(() => {
    if (sel===null||!lineRef.current) return;
    const el = lineRef.current.querySelector(`[data-id="${sel}"]`);
    if (el) el.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
  },[sel]);

  const selEv = sorted.find(e=>e.id===sel);

  const fmtDate = d => new Date(d).toLocaleDateString("it-IT",{year:"numeric",month:"short",day:"numeric"});

  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:"#111", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .node:hover .dot { transform:scale(1.4); }
        .node .dot { transition:transform 0.2s; }
        ::-webkit-scrollbar { height:0; width:0; }
      `}</style>

      {/* Top bar */}
      <div style={{ padding:"20px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0f0f0" }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:600, letterSpacing:"-0.3px" }}>Timeline</h1>
          <p style={{ margin:"2px 0 0", fontSize:13, color:"#999" }}>{events.length} eventi</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {mode==="form" ? (
            <button onClick={cancel} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #e0e0e0", background:"#fff", cursor:"pointer", fontSize:13, color:"#666" }}>Annulla</button>
          ) : (
            <button onClick={()=>{setEditId(null);setForm({date:"",title:"",desc:"",icon:0,color:COLORS[0],image:null});setMode("form");}} style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #111", background:"#111", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:500 }}>+ Nuovo evento</button>
          )}
        </div>
      </div>

      {/* Form */}
      {mode==="form" && (
        <div style={{ padding:"24px 32px", borderBottom:"1px solid #f0f0f0", animation:"fadeIn 0.3s ease-out" }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:12, marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:500, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:"0.5px" }}>Data</label>
                <input type="date" value={form.date} onChange={e=>setF("date",e.target.value)} style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e0e0e0", fontSize:13, boxSizing:"border-box" }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:500, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:"0.5px" }}>Titolo</label>
                <input value={form.title} onChange={e=>setF("title",e.target.value)} placeholder="Nome dell'evento" style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e0e0e0", fontSize:13, boxSizing:"border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:500, color:"#999", marginBottom:4, display:"block", textTransform:"uppercase", letterSpacing:"0.5px" }}>Descrizione</label>
              <textarea value={form.desc} onChange={e=>setF("desc",e.target.value)} rows={2} placeholder="Descrizione opzionale..." style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #e0e0e0", fontSize:13, resize:"none", boxSizing:"border-box" }} />
            </div>
            <div style={{ display:"flex", gap:20, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ display:"flex", gap:4 }}>
                {ICONS.map((ic,i)=>(
                  <div key={i} onClick={()=>setF("icon",i)} style={{ width:32, height:32, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${form.icon===i?"#111":"#e8e8e8"}`, cursor:"pointer", color:form.icon===i?"#111":"#bbb", transition:"all 0.15s" }}>{ic.svg}</div>
                ))}
              </div>
              <div style={{ display:"flex", gap:4 }}>
                {COLORS.map(c=>(
                  <div key={c} onClick={()=>setF("color",c)} style={{ width:22, height:22, borderRadius:"50%", background:c, cursor:"pointer", border:`2.5px solid ${form.color===c?"#111":"transparent"}`, transition:"all 0.15s", opacity: form.color===c?1:0.5 }} />
                ))}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display:"none" }} />
                <button onClick={()=>fileRef.current?.click()} style={{ padding:"6px 14px", borderRadius:6, border:"1px dashed #ccc", background:"#fff", cursor:"pointer", fontSize:12, color:"#888" }}>{form.image?"✓ Immagine":"+ Immagine"}</button>
                {form.image && <span onClick={()=>setF("image",null)} style={{ marginLeft:6, cursor:"pointer", color:"#ccc", fontSize:12 }}>✕</span>}
              </div>
            </div>
            <button onClick={save} disabled={!form.date||!form.title} style={{ padding:"9px 24px", borderRadius:8, border:"none", background:(!form.date||!form.title)?"#e0e0e0":"#111", color:"#fff", cursor:(!form.date||!form.title)?"default":"pointer", fontSize:13, fontWeight:500 }}>{editId!==null?"Aggiorna":"Aggiungi"}</button>
          </div>
        </div>
      )}

      {/* Main timeline area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 0" }}>

        {sorted.length===0 ? (
          <div style={{ textAlign:"center", color:"#ccc", padding:60 }}>
            <p style={{ fontSize:15 }}>Nessun evento. Aggiungi il primo.</p>
          </div>
        ) : (
          <>
            {/* Horizontal timeline */}
            <div ref={lineRef} style={{ overflowX:"auto", padding:"0 40px 20px", scrollBehavior:"smooth" }}>
              <div style={{ display:"flex", alignItems:"center", minWidth:"max-content", position:"relative", padding:"80px 60px 80px" }}>
                {/* The line */}
                <div style={{ position:"absolute", left:60, right:60, top:"50%", height:1, background:"#ddd" }} />

                {sorted.map((ev,i)=>{
                  const active = sel===ev.id;
                  return (
                    <div key={ev.id} data-id={ev.id} className="node" onClick={()=>setSel(active?null:ev.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", position:"relative", minWidth:120, marginRight: i<sorted.length-1?40:0 }}>
                      {/* Top label (alternating) */}
                      <div style={{ position:"absolute", bottom:"calc(50% + 20px)", textAlign:"center", width:140, transition:"all 0.3s", opacity:active?1:0.5 }}>
                        {i%2===0 && <>
                          <div style={{ fontSize:11, color:"#999", marginBottom:2 }}>{fmtDate(ev.date)}</div>
                          <div style={{ fontSize:13, fontWeight:active?600:400, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ev.title}</div>
                        </>}
                      </div>

                      {/* Dot / Thumbnail */}
                      {ev.image ? (
                        <div className="dot" style={{ width:active?44:32, height:active?44:32, borderRadius:"50%", background:`url(${ev.image}) center/cover`, border:active?`3px solid ${ev.color}`:"2px solid #e0e0e0", boxShadow:active?`0 0 0 4px ${ev.color}20`:"none", transition:"all 0.3s", zIndex:2 }} />
                      ) : (
                        <div className="dot" style={{ width:active?16:10, height:active?16:10, borderRadius:"50%", background:active?ev.color:"#ccc", border:active?`3px solid ${ev.color}33`:"3px solid #fff", boxShadow:active?`0 0 0 4px ${ev.color}15`:"none", transition:"all 0.3s", zIndex:2 }} />
                      )}

                      {/* Bottom label (alternating) */}
                      <div style={{ position:"absolute", top:"calc(50% + 20px)", textAlign:"center", width:140, transition:"all 0.3s", opacity:active?1:0.5 }}>
                        {i%2===1 && <>
                          <div style={{ fontSize:13, fontWeight:active?600:400, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{ev.title}</div>
                          <div style={{ fontSize:11, color:"#999", marginTop:2 }}>{fmtDate(ev.date)}</div>
                        </>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nav arrows */}
            <div style={{ display:"flex", justifyContent:"center", gap:12, marginTop:8 }}>
              <button onClick={()=>goNav(-1)} style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #e0e0e0", background:"#fff", cursor:"pointer", fontSize:16, color:"#888", display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
              <button onClick={()=>goNav(1)} style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #e0e0e0", background:"#fff", cursor:"pointer", fontSize:16, color:"#888", display:"flex", alignItems:"center", justifyContent:"center" }}>→</button>
            </div>

            {/* Detail panel */}
            {selEv && (
              <div key={selEv.id} style={{ maxWidth:560, margin:"32px auto 0", padding:"0 32px", animation:"fadeIn 0.4s ease-out", width:"100%" }}>
                <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
                  {/* Icon or image */}
                  {selEv.image ? (
                    <div style={{ width:72, height:72, borderRadius:12, flexShrink:0, background:`url(${selEv.image}) center/cover`, border:"1px solid #f0f0f0" }} />
                  ) : (
                    <div style={{ width:48, height:48, borderRadius:10, flexShrink:0, background:"#f8f8f8", display:"flex", alignItems:"center", justifyContent:"center", color:selEv.color }}>
                      <div style={{ transform:"scale(1.2)" }}>{ICONS[selEv.icon]?.svg}</div>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, color:"#999", marginBottom:4 }}>{fmtDate(selEv.date)}</div>
                    <h2 style={{ margin:"0 0 6px", fontSize:20, fontWeight:600, letterSpacing:"-0.3px" }}>{selEv.title}</h2>
                    {selEv.desc && <p style={{ margin:0, fontSize:14, color:"#666", lineHeight:1.6 }}>{selEv.desc}</p>}
                    <div style={{ marginTop:12, display:"flex", gap:8 }}>
                      <button onClick={()=>startEdit(selEv)} style={{ padding:"5px 14px", borderRadius:6, border:"1px solid #e0e0e0", background:"#fff", cursor:"pointer", fontSize:12, color:"#666" }}>Modifica</button>
                      <button onClick={()=>remove(selEv.id)} style={{ padding:"5px 14px", borderRadius:6, border:"1px solid #fee2e2", background:"#fff", cursor:"pointer", fontSize:12, color:"#ef4444" }}>Elimina</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
