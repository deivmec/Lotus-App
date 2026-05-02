import { useState, useRef, useCallback, useEffect } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';
import Portfolio from './Portfolio';

const newId  = () => Date.now().toString() + Math.random().toString(36).slice(2, 6);
const mkBoard = (n) => ({ id: newId(), name: `Quadro ${n}`, items: [], drawing: null });

const TABS = [
  { id: 'moodboard', label: 'Quadro de Visões' },
  { id: 'paletas',   label: 'Paletas' },
  { id: 'portfolio', label: 'Portfólio' },
];

const BOARD_H     = 520;
const THUMB_SCALE = 0.24; // thumbnail = 24% of real board

const DRAW_COLORS = ['#1A1A1A','#E53935','#FF7043','#FDD835','#43A047','#1E88E5','#8E24AA','#F06292','#FFFFFF','#795548'];
const DRAW_SIZES  = [{ label:'S', value:2 },{ label:'M', value:5 },{ label:'L', value:12 }];

/* ── Image helpers ─────────────────────────────────────────────────────────── */
const compressImage = (file) => new Promise((res) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1400, scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width*scale); c.height = Math.round(img.height*scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res({ dataUrl: c.toDataURL('image/jpeg', 0.80) });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const cropImage = (src, region) => new Promise((res) => {
  const img = new Image();
  img.onload = () => {
    const nw=img.naturalWidth, nh=img.naturalHeight;
    const sx=region.left/100*nw, sy=region.top/100*nh;
    const sw=(region.right-region.left)/100*nw, sh=(region.bottom-region.top)/100*nh;
    const c=document.createElement('canvas'); c.width=sw; c.height=sh;
    c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
    res(c.toDataURL('image/jpeg',0.82));
  };
  img.src = src;
});

/* Export board to PNG download */
const exportBoard = async (board) => {
  const EW = 800, EH = 560;
  const canvas = document.createElement('canvas');
  canvas.width = EW; canvas.height = EH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white'; ctx.fillRect(0, 0, EW, EH);

  const sorted = [...board.items].sort((a,b) => (a.zIndex||1)-(b.zIndex||1));
  for (const item of sorted) {
    await new Promise(done => {
      const img = new Image();
      img.onload = () => {
        const x = item.x/100*EW, y = item.y/100*EH;
        const w = item.w/100*EW, h = w/(img.naturalWidth/img.naturalHeight);
        const rot = (item.rotation||0)*Math.PI/180;
        ctx.save();
        ctx.translate(x+w/2, y+h/2); ctx.rotate(rot);
        ctx.drawImage(img, -w/2, -h/2, w, h);
        ctx.restore(); done();
      };
      img.onerror = done; img.src = item.src;
    });
  }
  if (board.drawing) {
    await new Promise(done => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, EW, EH); done(); };
      img.onerror = done; img.src = board.drawing;
    });
  }
  const a = document.createElement('a');
  a.download = `${board.name || 'quadro'}.png`;
  a.href = canvas.toDataURL('image/png'); a.click();
};

/* ── Board thumbnail preview ───────────────────────────────────────────────── */
const BoardPreview = ({ items, drawing }) => {
  if (!items.length && !drawing) {
    return (
      <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F7F5',flexDirection:'column',gap:6 }}>
        <span style={{ fontSize:28 }}>🖼️</span>
        <span style={{ fontSize:11,color:'#CCC',fontFamily:'var(--sans)' }}>Quadro vazio</span>
      </div>
    );
  }
  // Scale real board layout down using CSS transform
  const W_INNER = `${100 / THUMB_SCALE}%`; // compensate for scale so % positions work right
  return (
    <div style={{ width:'100%',height:'100%',overflow:'hidden',position:'relative',background:'white' }}>
      <div style={{
        position:'absolute', top:0, left:0,
        width: W_INNER, height: BOARD_H,
        transform: `scale(${THUMB_SCALE})`,
        transformOrigin: 'top left',
        background:'white', pointerEvents:'none',
      }}>
        {[...items].sort((a,b)=>(a.zIndex||1)-(b.zIndex||1)).map(item => (
          <img key={item.id} src={item.src} draggable={false} style={{
            position:'absolute', left:`${item.x}%`, top:`${item.y}%`,
            width:`${item.w||32}%`,
            transform:`rotate(${item.rotation||0}deg)`, transformOrigin:'top left',
            boxShadow:'0 2px 8px rgba(0,0,0,0.14)',
          }} />
        ))}
        {drawing && (
          <img src={drawing} draggable={false} style={{ position:'absolute',inset:0,width:'100%',height:'100%' }} />
        )}
      </div>
    </div>
  );
};

/* ── Crop Modal ────────────────────────────────────────────────────────────── */
const CropModal = ({ src, onConfirm, onCancel }) => {
  const [region, setRegion] = useState({ left:10,top:10,right:90,bottom:90 });
  const containerRef = useRef(null), dragging = useRef(null), startRef = useRef({});
  const MIN=15, clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));

  const onPD = (e, h) => {
    e.preventDefault(); e.stopPropagation();
    dragging.current=h; startRef.current={x:e.clientX,y:e.clientY,r:{...region}};
    window.addEventListener('pointermove',onPM); window.addEventListener('pointerup',onPU);
  };
  const onPM = useCallback((e) => {
    if (!dragging.current||!containerRef.current) return;
    const rect=containerRef.current.getBoundingClientRect();
    const dx=(e.clientX-startRef.current.x)/rect.width*100;
    const dy=(e.clientY-startRef.current.y)/rect.height*100;
    const r=startRef.current.r;
    setRegion(()=>{
      const n={...r},h=dragging.current;
      if(h==='tl'||h==='bl'||h==='move') n.left  =clamp(r.left  +dx,0,r.right -MIN);
      if(h==='tr'||h==='br'||h==='move') n.right =clamp(r.right +dx,r.left+MIN,100);
      if(h==='tl'||h==='tr'||h==='move') n.top   =clamp(r.top   +dy,0,r.bottom-MIN);
      if(h==='bl'||h==='br'||h==='move') n.bottom=clamp(r.bottom+dy,r.top +MIN,100);
      if(h==='move'){const w=n.right-n.left,ht=n.bottom-n.top;n.left=clamp(n.left,0,100-w);n.right=n.left+w;n.top=clamp(n.top,0,100-ht);n.bottom=n.top+ht;}
      return n;
    });
  },[]);
  const onPU = useCallback(()=>{ dragging.current=null; window.removeEventListener('pointermove',onPM); window.removeEventListener('pointerup',onPU); },[onPM]);

  const corner=(pos)=>{
    const s={tl:{top:-8,left:-8},tr:{top:-8,right:-8},bl:{bottom:-8,left:-8},br:{bottom:-8,right:-8}}[pos];
    return <div onPointerDown={e=>onPD(e,pos)} style={{ position:'absolute',width:18,height:18,borderRadius:4,background:'white',border:'2.5px solid var(--accent)',cursor:pos==='tl'||pos==='br'?'nwse-resize':'nesw-resize',zIndex:3,touchAction:'none',boxShadow:'0 1px 4px rgba(0,0,0,0.3)',...s }}/>;
  };

  return (
    <div style={{ position:'fixed',inset:0,zIndex:1200,background:'rgba(0,0,0,0.88)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ color:'white',fontSize:14,marginBottom:12,fontFamily:'var(--sans)' }}>Arraste os cantos para recortar</div>
      <div ref={containerRef} style={{ position:'relative',maxWidth:'100%',maxHeight:'70vh' }}>
        <img src={src} style={{ display:'block',maxWidth:'100%',maxHeight:'65vh',objectFit:'contain',userSelect:'none' }} draggable={false}/>
        <div style={{ position:'absolute',inset:0,pointerEvents:'none' }}>
          <div style={{ position:'absolute',top:0,left:0,right:0,height:`${region.top}%`,background:'rgba(0,0,0,0.6)' }}/>
          <div style={{ position:'absolute',bottom:0,left:0,right:0,top:`${region.bottom}%`,background:'rgba(0,0,0,0.6)' }}/>
          <div style={{ position:'absolute',top:`${region.top}%`,bottom:`${100-region.bottom}%`,left:0,width:`${region.left}%`,background:'rgba(0,0,0,0.6)' }}/>
          <div style={{ position:'absolute',top:`${region.top}%`,bottom:`${100-region.bottom}%`,left:`${region.right}%`,right:0,background:'rgba(0,0,0,0.6)' }}/>
        </div>
        <div onPointerDown={e=>onPD(e,'move')} style={{ position:'absolute',top:`${region.top}%`,left:`${region.left}%`,width:`${region.right-region.left}%`,height:`${region.bottom-region.top}%`,border:'2px solid white',cursor:'move',touchAction:'none',boxSizing:'border-box' }}>
          {corner('tl')}{corner('tr')}{corner('bl')}{corner('br')}
          {[33.3,66.6].map(p=>(<div key={p}><div style={{ position:'absolute',left:`${p}%`,top:0,bottom:0,width:1,background:'rgba(255,255,255,0.3)',pointerEvents:'none' }}/><div style={{ position:'absolute',top:`${p}%`,left:0,right:0,height:1,background:'rgba(255,255,255,0.3)',pointerEvents:'none' }}/></div>))}
        </div>
      </div>
      <div style={{ display:'flex',gap:12,marginTop:20 }}>
        <button onClick={onCancel} style={{ padding:'12px 24px',borderRadius:'var(--r)',background:'rgba(255,255,255,0.12)',border:'none',color:'white',fontFamily:'var(--sans)',fontSize:14,cursor:'pointer' }}>Cancelar</button>
        <button onClick={async()=>onConfirm(await cropImage(src,region))} style={{ padding:'12px 28px',borderRadius:'var(--r)',background:'var(--accent)',border:'none',color:'white',fontFamily:'var(--sans)',fontSize:14,fontWeight:600,cursor:'pointer' }}>Recortar ✓</button>
      </div>
    </div>
  );
};

/* ── Control button style ──────────────────────────────────────────────────── */
const ctrlBtn = { width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.25)',cursor:'pointer',fontSize:15,color:'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 };

/* ── Vision Board editor ───────────────────────────────────────────────────── */
const VisionBoard = ({ boardId, items, boardDrawing, onUpdate, onDelete, onReorder, onDrawingChange, palettes }) => {
  const [drawMode,   setDrawMode]   = useState(false);
  const [drawColor,  setDrawColor]  = useState('#1A1A1A');
  const [drawSize,   setDrawSize]   = useState(5);
  const [isEraser,   setIsEraser]   = useState(false);
  const [selPalette, setSelPalette] = useState(null);
  const [activeId,   setActiveId]   = useState(null);

  const boardRef  = useRef(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPt    = useRef(null);
  const dragRef   = useRef(null);

  useEffect(() => {
    setActiveId(null);
    const canvas = canvasRef.current, board = boardRef.current;
    if (!canvas || !board) return;
    canvas.width  = board.offsetWidth || 340;
    canvas.height = BOARD_H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (boardDrawing) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = boardDrawing;
    }
  }, [boardId]); // eslint-disable-line

  const startDrag = (e, id) => {
    if (drawMode || (e.button !== undefined && e.button !== 0)) return;
    e.preventDefault();
    const board = boardRef.current; if (!board) return;
    const br = board.getBoundingClientRect();
    const item = items.find(i => i.id===id);
    dragRef.current = { id, sx:e.clientX, sy:e.clientY, ox:item.x, oy:item.y, moved:false };
    onReorder(id);
    const onMove = (ev) => {
      const d=dragRef.current; if (!d) return;
      if (Math.hypot(ev.clientX-d.sx,ev.clientY-d.sy)>5) d.moved=true;
      if (!d.moved) return;
      onUpdate(d.id,{ x:Math.max(0,Math.min(88,(ev.clientX-d.sx)/br.width*100+d.ox)), y:Math.max(0,Math.min(88,(ev.clientY-d.sy)/br.height*100+d.oy)) });
    };
    const onUp = () => {
      if (!dragRef.current?.moved) setActiveId(id);
      dragRef.current=null;
      window.removeEventListener('pointermove',onMove); window.removeEventListener('pointerup',onUp);
    };
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp);
  };

  const getCtx = () => {
    const canvas=canvasRef.current; if (!canvas) return null;
    const ctx=canvas.getContext('2d');
    ctx.globalCompositeOperation=isEraser?'destination-out':'source-over';
    ctx.strokeStyle=isEraser?'rgba(0,0,0,1)':drawColor;
    ctx.lineWidth=isEraser?drawSize*3:drawSize;
    ctx.lineCap='round'; ctx.lineJoin='round'; return ctx;
  };
  const drawStart = (e) => { if (!drawMode) return; e.preventDefault(); const rect=canvasRef.current.getBoundingClientRect(); isDrawing.current=true; lastPt.current={x:e.clientX-rect.left,y:e.clientY-rect.top}; const ctx=getCtx(); ctx.beginPath(); ctx.moveTo(lastPt.current.x,lastPt.current.y); };
  const drawMove  = (e) => { if (!isDrawing.current||!drawMode) return; e.preventDefault(); const rect=canvasRef.current.getBoundingClientRect(); const x=e.clientX-rect.left,y=e.clientY-rect.top; const ctx=getCtx(); ctx.beginPath(); ctx.moveTo(lastPt.current.x,lastPt.current.y); ctx.lineTo(x,y); ctx.stroke(); lastPt.current={x,y}; };
  const drawEnd   = () => { if (!isDrawing.current) return; isDrawing.current=false; const canvas=canvasRef.current; if (canvas) onDrawingChange(canvas.toDataURL('image/png')); };
  const clearDraw = () => { const canvas=canvasRef.current; if (canvas) canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height); onDrawingChange(null); };

  const activeItem   = items.find(i => i.id===activeId);
  const paletteColors = selPalette ? (palettes.find(p=>p.id===selPalette)?.colors||[]).map(c=>typeof c==='string'?c:c.hex) : DRAW_COLORS;

  return (
    <div>
      {/* Board */}
      <div ref={boardRef} onClick={()=>setActiveId(null)} style={{ position:'relative',width:'100%',height:BOARD_H,background:'white',borderRadius:'var(--r-lg)',border:'1px solid var(--line)',overflow:'hidden',boxShadow:'0 2px 16px rgba(0,0,0,0.08)',cursor:drawMode?'crosshair':'default' }}>
        {items.length===0&&!drawMode&&(
          <div style={{ position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#CCC',pointerEvents:'none' }}>
            <div style={{ fontSize:36,marginBottom:8 }}>🖼️</div>
            <div style={{ fontSize:12,fontFamily:'var(--sans)' }}>Adicione fotos ou desenhe</div>
          </div>
        )}

        {[...items].sort((a,b)=>(a.zIndex||1)-(b.zIndex||1)).map(item => (
          <div key={item.id} onMouseEnter={()=>!drawMode&&setActiveId(item.id)} onPointerDown={e=>startDrag(e,item.id)} style={{ position:'absolute',left:`${item.x}%`,top:`${item.y}%`,width:`${item.w||32}%`,zIndex:item.zIndex||1,transform:`rotate(${item.rotation||0}deg)`,cursor:drawMode?'crosshair':'grab',userSelect:'none',touchAction:'none',borderRadius:4,outline:activeId===item.id?'2px solid var(--accent)':'none',outlineOffset:2,boxShadow:activeId===item.id?'0 6px 24px rgba(0,0,0,0.28)':'0 2px 8px rgba(0,0,0,0.14)' }}>
            <img src={item.src} draggable={false} style={{ width:'100%',display:'block',borderRadius:4 }}/>
          </div>
        ))}

        <canvas ref={canvasRef} onPointerDown={drawStart} onPointerMove={drawMove} onPointerUp={drawEnd} onPointerLeave={drawEnd} style={{ position:'absolute',inset:0,zIndex:200,width:'100%',height:'100%',pointerEvents:drawMode?'auto':'none',cursor:drawMode?(isEraser?'cell':'crosshair'):'default',touchAction:'none' }}/>

        {/* Control panel — pinned to bottom, no hover-gap issue */}
        {activeItem && !drawMode && (
          <div onMouseEnter={()=>setActiveId(activeItem.id)} onClick={e=>e.stopPropagation()} style={{ position:'absolute',bottom:0,left:0,right:0,zIndex:300,background:'rgba(18,16,14,0.82)',backdropFilter:'blur(6px)',padding:'10px 14px 14px',display:'flex',flexDirection:'column',gap:8 }}>
            <div style={{ display:'flex',alignItems:'center',gap:6 }}>
              <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onUpdate(activeItem.id,{rotation:Math.round((activeItem.rotation||0)-15)})} style={ctrlBtn}>↺</button>
              <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onUpdate(activeItem.id,{rotation:Math.round((activeItem.rotation||0)+15)})} style={ctrlBtn}>↻</button>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.5)',minWidth:32,textAlign:'center' }}>{Math.round(activeItem.rotation||0)}°</span>
              <div style={{ width:1,height:18,background:'rgba(255,255,255,0.2)',margin:'0 2px' }}/>
              <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onUpdate(activeItem.id,{w:Math.max(12,(activeItem.w||32)-8)})} style={ctrlBtn}>−</button>
              <button onPointerDown={e=>e.stopPropagation()} onClick={()=>onUpdate(activeItem.id,{w:Math.min(75,(activeItem.w||32)+8)})} style={ctrlBtn}>+</button>
              <span style={{ fontSize:11,color:'rgba(255,255,255,0.5)',minWidth:30,textAlign:'center' }}>{Math.round(activeItem.w||32)}%</span>
              <div style={{ flex:1 }}/>
              <button onPointerDown={e=>e.stopPropagation()} onClick={()=>{onDelete(activeItem.id);setActiveId(null);}} style={{ ...ctrlBtn,background:'#E53935',color:'white',fontSize:16,border:'none' }}>×</button>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)',marginBottom:2 }}>Ângulo {Math.round(activeItem.rotation||0)}°</div>
                <input type="range" min={-180} max={180} step={1} value={activeItem.rotation||0} onPointerDown={e=>e.stopPropagation()} onChange={e=>onUpdate(activeItem.id,{rotation:parseInt(e.target.value)})} style={{ width:'100%',accentColor:'var(--accent)' }}/>
              </div>
              <div>
                <div style={{ fontSize:10,color:'rgba(255,255,255,0.45)',marginBottom:2 }}>Tamanho {Math.round(activeItem.w||32)}%</div>
                <input type="range" min={10} max={75} step={1} value={activeItem.w||32} onPointerDown={e=>e.stopPropagation()} onChange={e=>onUpdate(activeItem.id,{w:parseInt(e.target.value)})} style={{ width:'100%',accentColor:'var(--accent)' }}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display:'flex',gap:8,marginTop:12,marginBottom:drawMode?10:0 }}>
        <button onClick={()=>setDrawMode(false)} style={{ flex:1,padding:'9px 0',borderRadius:'var(--r)',border:`1.5px solid ${!drawMode?'var(--accent)':'var(--line)'}`,background:!drawMode?'var(--accent-bg)':'var(--surface)',color:!drawMode?'var(--accent-dk)':'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:13,fontWeight:500 }}>🖱️ Mover</button>
        <button onClick={()=>setDrawMode(true)}  style={{ flex:1,padding:'9px 0',borderRadius:'var(--r)',border:`1.5px solid ${drawMode?'var(--accent)':'var(--line)'}`,background:drawMode?'var(--accent-bg)':'var(--surface)',color:drawMode?'var(--accent-dk)':'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:13,fontWeight:500 }}>✏️ Desenhar</button>
      </div>

      {drawMode && (
        <div style={{ background:'var(--surface)',borderRadius:'var(--r)',padding:'12px 14px',border:'1px solid var(--line)',display:'flex',flexDirection:'column',gap:12 }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
            {paletteColors.map((color,i)=>(
              <button key={i} onClick={()=>{setDrawColor(color);setIsEraser(false);}} style={{ width:drawColor===color&&!isEraser?26:22,height:drawColor===color&&!isEraser?26:22,borderRadius:'50%',padding:0,background:color,border:drawColor===color&&!isEraser?'3px solid var(--accent)':color==='#FFFFFF'?'1.5px solid #CCC':'2px solid transparent',cursor:'pointer',flexShrink:0,transition:'all 0.15s' }}/>
            ))}
            <label style={{ width:22,height:22,borderRadius:'50%',border:'2px dashed var(--line)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'var(--text3)',flexShrink:0,overflow:'hidden',position:'relative' }}>+<input type="color" value={drawColor} onChange={e=>{setDrawColor(e.target.value);setIsEraser(false);}} style={{ position:'absolute',opacity:0,width:'100%',height:'100%',cursor:'pointer' }}/></label>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ fontSize:11,color:'var(--text3)',fontWeight:500,marginRight:2 }}>Espessura:</span>
            {DRAW_SIZES.map(s=>(
              <button key={s.label} onClick={()=>{setDrawSize(s.value);setIsEraser(false);}} style={{ width:32,height:32,borderRadius:'var(--r-sm)',border:`1.5px solid ${drawSize===s.value&&!isEraser?'var(--accent)':'var(--line)'}`,background:drawSize===s.value&&!isEraser?'var(--accent-bg)':'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0 }}>
                <div style={{ borderRadius:'50%',background:drawColor,width:s.value+4,height:s.value+4 }}/>
              </button>
            ))}
            <div style={{ flex:1 }}/>
            <button onClick={()=>setIsEraser(e=>!e)} style={{ padding:'6px 10px',borderRadius:'var(--r-sm)',fontSize:12,border:`1.5px solid ${isEraser?'var(--accent)':'var(--line)'}`,background:isEraser?'var(--accent-bg)':'var(--surface)',color:isEraser?'var(--accent-dk)':'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',fontWeight:500 }}>🧹</button>
            <button onClick={clearDraw} style={{ padding:'6px 10px',borderRadius:'var(--r-sm)',fontSize:12,border:'1.5px solid var(--line)',background:'var(--surface)',color:'var(--text3)',cursor:'pointer',fontFamily:'var(--sans)' }}>Limpar</button>
          </div>
          {palettes.length>0&&(
            <div>
              <div style={{ fontSize:11,color:'var(--text3)',marginBottom:6,fontWeight:500 }}>Usar paleta:</div>
              <div style={{ display:'flex',gap:6,overflowX:'auto',paddingBottom:2 }}>
                <button onClick={()=>setSelPalette(null)} style={{ padding:'4px 10px',borderRadius:20,whiteSpace:'nowrap',border:`1.5px solid ${!selPalette?'var(--accent)':'var(--line)'}`,background:!selPalette?'var(--accent-bg)':'var(--surface)',color:!selPalette?'var(--accent-dk)':'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12 }}>Padrão</button>
                {palettes.map(p=>(
                  <button key={p.id} onClick={()=>setSelPalette(selPalette===p.id?null:p.id)} style={{ padding:'4px 10px',borderRadius:20,whiteSpace:'nowrap',border:`1.5px solid ${selPalette===p.id?'var(--accent)':'var(--line)'}`,background:selPalette===p.id?'var(--accent-bg)':'var(--surface)',color:selPalette===p.id?'var(--accent-dk)':'var(--text2)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12,display:'flex',alignItems:'center',gap:5 }}>
                    <span style={{ display:'flex',gap:2 }}>{(p.colors||[]).slice(0,4).map((c,i)=><span key={i} style={{ width:8,height:8,borderRadius:'50%',background:typeof c==='string'?c:c.hex,display:'inline-block' }}/>)}</span>{p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Palette helpers ───────────────────────────────────────────────────────── */
const normalizeColor = (c) => typeof c==='string' ? {hex:c,name:''} : c;
const DEFAULT_PALETTES = [
  {id:'dp1', name:'Natureza',    colors:[{hex:'#4A5240',name:'Musgo'},{hex:'#8A9E7A',name:'Sage'},{hex:'#C8D4AD',name:'Bambu'},{hex:'#E8DCC8',name:'Areia'},{hex:'#A0784A',name:'Terra'}]},
  {id:'dp2', name:'Oceano',      colors:[{hex:'#0D2137',name:'Abismo'},{hex:'#1B5E8A',name:'Mar'},{hex:'#4A90B8',name:'Ondas'},{hex:'#A8CCE0',name:'Espuma'},{hex:'#D4C4A8',name:'Areia Molhada'}]},
  {id:'dp3', name:'Pôr do Sol',  colors:[{hex:'#1A1035',name:'Noite'},{hex:'#6B3FA0',name:'Roxo'},{hex:'#E8614A',name:'Coral'},{hex:'#F5943A',name:'Laranja'},{hex:'#F7CC6A',name:'Dourado'}]},
  {id:'dp4', name:'Pastel',      colors:[{hex:'#FFD6D9',name:'Rosa Bebê'},{hex:'#DDD6F3',name:'Lilás'},{hex:'#C8ECD8',name:'Menta'},{hex:'#C8E6F5',name:'Céu'},{hex:'#FFE4C8',name:'Pêssego'}]},
  {id:'dp5', name:'Terroso',     colors:[{hex:'#2C2A28',name:'Carvão'},{hex:'#C4704A',name:'Ferrugem'},{hex:'#D4A878',name:'Caramelo'},{hex:'#F2EBE0',name:'Creme'},{hex:'#FAF8F5',name:'Branco Quente'}]},
  {id:'dp6', name:'Rosa & Vinho',colors:[{hex:'#6B1F3A',name:'Vinho'},{hex:'#9E3A5A',name:'Marsala'},{hex:'#C47A8A',name:'Rosa Antigo'},{hex:'#E8B4B8',name:'Blush'},{hex:'#F5E6D8',name:'Champagne'}]},
  {id:'dp7', name:'Minimalista', colors:[{hex:'#1A1A1A',name:'Preto'},{hex:'#4A4A4A',name:'Grafite'},{hex:'#8A8A8A',name:'Cinza'},{hex:'#C8C8C8',name:'Prata'},{hex:'#F0F0F0',name:'Gelo'}]},
  {id:'dp8', name:'Floral',      colors:[{hex:'#3D6B47',name:'Verde Folha'},{hex:'#9B72A8',name:'Lilás'},{hex:'#C8A8D8',name:'Lavanda'},{hex:'#F0C8D8',name:'Rosa Claro'},{hex:'#F5E8B8',name:'Palha'}]},
  {id:'dp9', name:'Vintage',     colors:[{hex:'#5C3D2E',name:'Mogno'},{hex:'#A0522D',name:'Sienna'},{hex:'#C8A870',name:'Âmbar'},{hex:'#E8D8B0',name:'Marfim'},{hex:'#F5F0E8',name:'Pergaminho'}]},
  {id:'dp10',name:'Tropical',    colors:[{hex:'#1A5C3A',name:'Selva'},{hex:'#2E9E5A',name:'Folha'},{hex:'#F7B731',name:'Abacaxi'},{hex:'#FF6B6B',name:'Hibisco'},{hex:'#4ECDC4',name:'Turquesa'}]},
  {id:'dp11',name:'Nórdico',     colors:[{hex:'#2C3E50',name:'Meia-Noite'},{hex:'#7F8C8D',name:'Chumbo'},{hex:'#BDC3C7',name:'Névoa'},{hex:'#ECF0F1',name:'Neve'},{hex:'#E8D5B7',name:'Bege Quente'}]},
  {id:'dp12',name:'Outono',      colors:[{hex:'#7B3F00',name:'Castanha'},{hex:'#CC5500',name:'Abóbora'},{hex:'#E8822A',name:'Laranja Queimado'},{hex:'#D4A828',name:'Mostarda'},{hex:'#8B7355',name:'Caqui'}]},
  {id:'dp13',name:'Jóias',       colors:[{hex:'#1A1A5E',name:'Safira'},{hex:'#2E8B57',name:'Esmeralda'},{hex:'#8B0000',name:'Rubi'},{hex:'#4B0082',name:'Ametista'},{hex:'#DAA520',name:'Âmbar Dourado'}]},
  {id:'dp14',name:'Candy',       colors:[{hex:'#FF85A1',name:'Chiclete'},{hex:'#FFA3D7',name:'Cotton Candy'},{hex:'#B8F0E6',name:'Hortelã'},{hex:'#FFF0A0',name:'Baunilha'},{hex:'#C8B4FF',name:'Lavanda Doce'}]},
  {id:'dp15',name:'Urbano',      colors:[{hex:'#1C1C1E',name:'Asfalto'},{hex:'#48484A',name:'Concreto'},{hex:'#98989A',name:'Cimento'},{hex:'#FF3B30',name:'Vermelho Néon'},{hex:'#F5F5F7',name:'Alumínio'}]},
  {id:'dp16',name:'Aquarela',    colors:[{hex:'#A8D8EA',name:'Céu Claro'},{hex:'#AA96DA',name:'Lavanda'},{hex:'#FCBAD3',name:'Rosé'},{hex:'#FFFFD2',name:'Limão'},{hex:'#B8F4C8',name:'Menta'}]},
];

const PaletteCard = ({ palette, onEdit, onDelete, onCopyHex, onSave }) => (
  <div className="card">
    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
      <div style={{ fontSize:14,fontWeight:500,color:'var(--text)',flex:1 }}>{palette.name}</div>
      {onSave   && <button onClick={onSave}   style={{ background:'var(--accent-bg)',border:'none',borderRadius:'var(--r-sm)',padding:'4px 10px',cursor:'pointer',color:'var(--accent-dk)',fontSize:12,fontFamily:'var(--sans)',fontWeight:500 }}>Salvar</button>}
      {onEdit   && <button onClick={onEdit}   style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4 }}><Icon name="edit"  size={14}/></button>}
      {onDelete && <button onClick={onDelete} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4 }}><Icon name="trash" size={14}/></button>}
    </div>
    <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
      {palette.colors.map((rawColor,i)=>{const c=normalizeColor(rawColor);return(<div key={i} onClick={()=>onCopyHex(c.hex)} title={`Copiar ${c.hex}`} style={{ cursor:'pointer',textAlign:'center' }}><div style={{ width:44,height:44,borderRadius:10,background:c.hex,border:'1px solid var(--line)' }}/>{c.name&&<div style={{ fontSize:10,color:'var(--text2)',marginTop:4,maxWidth:52,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{c.name}</div>}<div style={{ fontSize:8,color:'var(--text3)',fontFamily:'monospace',marginTop:c.name?1:4 }}>{c.hex.toUpperCase()}</div></div>);})}
    </div>
  </div>
);

const ColorRows = ({ colors, onHex, onName, onRemove }) => (
  <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
    {colors.map((rawColor,i)=>{const c=normalizeColor(rawColor);return(<div key={i} style={{ display:'flex',alignItems:'center',gap:8 }}><input type="color" value={c.hex} onChange={e=>onHex(i,e.target.value)} style={{ width:40,height:36,borderRadius:8,border:'1px solid var(--line)',cursor:'pointer',padding:2,flexShrink:0 }}/><div style={{ width:36,height:36,borderRadius:8,background:c.hex,border:'1px solid var(--line)',flexShrink:0 }}/><input className="input" placeholder="Nome da cor" value={c.name} onChange={e=>onName(i,e.target.value)} style={{ flex:1,padding:'8px 10px',fontSize:13 }}/>{colors.length>1&&<button onClick={()=>onRemove(i)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',padding:4,flexShrink:0 }}><Icon name="x" size={14}/></button>}</div>);})}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Inspiracao = ({ onBack }) => {
  const [tab, setTab] = useState('moodboard');

  // ── Boards ──
  const FIRST = mkBoard(1);
  const [boards, saveBoards]         = useStorage('inspiracao:boards',    [FIRST]);
  const [activeBid, setActiveBid]    = useStorage('inspiracao:active-bid', FIRST.id);
  const [moodView, setMoodView]      = useState('gallery'); // 'gallery' | 'edit'
  const [renamingId,  setRenamingId] = useState(null);
  const [renameVal,   setRenameVal]  = useState('');
  const [zCounter,    setZCounter]   = useState(100);
  const [cropSrc,     setCropSrc]    = useState(null);
  const fileInputRef                 = useRef(null);
  const toast = useToast();

  const activeBoard = boards.find(b=>b.id===activeBid) || boards[0];

  const openBoard = (id) => { setActiveBid(id); setMoodView('edit'); };
  const addBoard  = () => { const b=mkBoard(boards.length+1); saveBoards(bs=>[...bs,b]); openBoard(b.id); };

  const deleteBoard = (id) => {
    if (boards.length<=1) { toast('Crie outro quadro antes de excluir'); return; }
    saveBoards(bs=>bs.filter(b=>b.id!==id));
    if (activeBid===id) setActiveBid(boards.find(b=>b.id!==id)?.id);
  };

  const startRename  = (b) => { setRenamingId(b.id); setRenameVal(b.name); };
  const commitRename = () => {
    if (renameVal.trim()) saveBoards(bs=>bs.map(b=>b.id===renamingId?{...b,name:renameVal.trim()}:b));
    setRenamingId(null);
  };

  const bUpdate  = (id,patch) => saveBoards(bs=>bs.map(b=>b.id===activeBid?{...b,items:b.items.map(i=>i.id===id?{...i,...patch}:i)}:b));
  const bDelete  = (id)       => { saveBoards(bs=>bs.map(b=>b.id===activeBid?{...b,items:b.items.filter(i=>i.id!==id)}:b)); toast('Foto removida'); };
  const bFront   = (id)       => { const z=zCounter+1; setZCounter(z); bUpdate(id,{zIndex:z}); };
  const bDrawing = (dataUrl)  => saveBoards(bs=>bs.map(b=>b.id===activeBid?{...b,drawing:dataUrl}:b));

  const onFileChange = async (e) => { const f=e.target.files?.[0]; if (!f) return; e.target.value=''; const {dataUrl}=await compressImage(f); setCropSrc(dataUrl); };
  const onCropConfirm = (src) => {
    const z=zCounter+1; setZCounter(z); setCropSrc(null);
    saveBoards(bs=>bs.map(b=>b.id===activeBid?{...b,items:[...b.items,{id:newId(),src,zIndex:z,x:4+Math.random()*14,y:4+Math.random()*14,w:34,rotation:(Math.random()-0.5)*8}]}:b));
    toast('Foto adicionada');
  };

  const doExport = async (board) => {
    toast('Gerando imagem…');
    await exportBoard(board);
    toast(`"${board.name}" salvo como imagem 🖼️`);
  };

  // ── Palettes ──
  const [palettes, savePalettes]               = useStorage('inspiracao:paletas', DEFAULT_PALETTES);
  const [showPaletteModal, setShowPaletteModal] = useState(false);
  const [editPalette, setEditPalette]           = useState(null);
  const [newPalette, setNewPalette]             = useState({ name:'', colors:[{hex:'#C4704A',name:''}] });

  const addPalette = () => { if (!newPalette.name.trim()) return; savePalettes(p=>[...p,{id:newId(),...newPalette}]); setNewPalette({name:'',colors:[{hex:'#C4704A',name:''}]}); setShowPaletteModal(false); toast('Paleta adicionada'); };
  const addPC    = ()       => setNewPalette(p=>({...p,colors:[...p.colors,{hex:'#AAAAAA',name:''}]}));
  const removePC = (i)      => setNewPalette(p=>({...p,colors:p.colors.filter((_,idx)=>idx!==i)}));
  const updatePH = (i,hex)  => setNewPalette(p=>({...p,colors:p.colors.map((c,idx)=>idx===i?{...c,hex}:c)}));
  const updatePN = (i,name) => setNewPalette(p=>({...p,colors:p.colors.map((c,idx)=>idx===i?{...c,name}:c)}));
  const saveEP   = ()       => { if (!editPalette) return; savePalettes(ps=>ps.map(p=>p.id===editPalette.id?editPalette:p)); setEditPalette(null); toast('Paleta atualizada'); };
  const addEC    = ()       => setEditPalette(p=>({...p,colors:[...p.colors,{hex:'#AAAAAA',name:''}]}));
  const removeEC = (i)      => setEditPalette(p=>({...p,colors:p.colors.filter((_,idx)=>idx!==i)}));
  const updateEH = (i,hex)  => setEditPalette(p=>({...p,colors:p.colors.map((c,idx)=>idx===i?{...c,hex}:c)}));
  const updateEN = (i,name) => setEditPalette(p=>({...p,colors:p.colors.map((c,idx)=>idx===i?{...c,name}:c)}));
  const copyHex  = (hex)    => navigator.clipboard?.writeText(hex).then(()=>toast(`Copiado: ${hex}`));

  if (tab === 'portfolio') {
    return <Portfolio onBack={() => setTab('moodboard')} />;
  }

  return (
    <div className="screen">
      {cropSrc && <CropModal src={cropSrc} onConfirm={onCropConfirm} onCancel={()=>setCropSrc(null)}/>}

      <BackHeader
        title="Inspiração"
        onBack={moodView==='edit' ? ()=>setMoodView('gallery') : onBack}
        action={
          tab==='moodboard' && moodView==='edit' ? (
            <button onClick={()=>doExport(activeBoard)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--accent)',padding:'4px 8px',fontFamily:'var(--sans)',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
              ⬇ Salvar
            </button>
          ) : tab==='paletas' ? (
            <button onClick={()=>setShowPaletteModal(true)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--accent)',padding:4 }}>
              <Icon name="plus" size={20}/>
            </button>
          ) : null
        }
      />

      <div style={{ padding:'0 24px 32px' }}>
        <div style={{ marginBottom:24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={t=>{setTab(t); if(t==='moodboard') setMoodView('gallery');}}/>
        </div>

        {/* ════════════════════ QUADRO DE VISÕES ════════════════════ */}
        {tab==='moodboard' && (

          /* ── Gallery ── */
          moodView==='gallery' ? (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {boards.map(b => (
                  <div key={b.id} style={{ borderRadius:'var(--r)',overflow:'hidden',border:'1px solid var(--line)',background:'var(--surface)',boxShadow:'0 1px 6px rgba(0,0,0,0.06)',cursor:'pointer',transition:'box-shadow 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'}
                    onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.06)'}
                    onClick={()=>openBoard(b.id)}
                  >
                    {/* Thumbnail */}
                    <div style={{ height:120,overflow:'hidden',position:'relative',background:'#F8F7F4',borderBottom:'1px solid var(--line)' }}>
                      <BoardPreview items={b.items} drawing={b.drawing}/>
                      {/* Item count badge */}
                      {b.items.length>0 && (
                        <div style={{ position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.45)',color:'white',fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:20,fontFamily:'var(--sans)' }}>
                          {b.items.length}🖼
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div style={{ padding:'10px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6 }}>
                      {renamingId===b.id ? (
                        <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                          onBlur={commitRename} onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenamingId(null);}}
                          onClick={e=>e.stopPropagation()}
                          style={{ flex:1,padding:'3px 8px',borderRadius:8,border:'1.5px solid var(--accent)',background:'var(--bg)',fontFamily:'var(--sans)',fontSize:12,outline:'none',color:'var(--text)' }}
                        />
                      ) : (
                        <div style={{ flex:1,overflow:'hidden' }}>
                          <div style={{ fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{b.name}</div>
                          <div style={{ fontSize:10,color:'var(--text3)',marginTop:1 }}>{b.items.length===0?'Vazio':`${b.items.length} foto${b.items.length!==1?'s':''}`}</div>
                        </div>
                      )}

                      <div style={{ display:'flex',gap:4,flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                        {/* Rename */}
                        <button onClick={()=>startRename(b)} title="Renomear" style={{ width:28,height:28,borderRadius:'50%',border:'1px solid var(--line)',background:'var(--bg2)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)' }}>✏️</button>
                        {/* Export */}
                        <button onClick={()=>doExport(b)} title="Salvar imagem" style={{ width:28,height:28,borderRadius:'50%',border:'1px solid var(--line)',background:'var(--bg2)',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--accent)' }}>⬇</button>
                        {/* Delete */}
                        {boards.length>1 && (
                          <button onClick={()=>deleteBoard(b.id)} title="Excluir" style={{ width:28,height:28,borderRadius:'50%',border:'1px solid var(--line)',background:'var(--bg2)',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--red)' }}>×</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New board card */}
                <div onClick={addBoard} style={{ borderRadius:'var(--r)',border:'1.5px dashed var(--line)',background:'var(--bg2)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:160,gap:8,transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--bg2)'}
                >
                  <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--accent-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>+</div>
                  <div style={{ fontSize:13,color:'var(--text3)',fontFamily:'var(--sans)',fontWeight:500 }}>Novo quadro</div>
                </div>
              </div>
            </div>

          /* ── Editor ── */
          ) : activeBoard ? (
            <div>
              {/* Board title + breadcrumb */}
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
                <button onClick={()=>setMoodView('gallery')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text2)',fontFamily:'var(--sans)',fontSize:13,padding:'4px 0',display:'flex',alignItems:'center',gap:4 }}>
                  ‹ Quadros
                </button>
                <div style={{ width:1,height:14,background:'var(--line)' }}/>
                {renamingId===activeBoard.id ? (
                  <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)} onBlur={commitRename} onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenamingId(null);}} style={{ flex:1,padding:'3px 8px',borderRadius:8,border:'1.5px solid var(--accent)',background:'var(--bg)',fontFamily:'var(--serif)',fontSize:16,fontWeight:600,outline:'none',color:'var(--text)' }}/>
                ) : (
                  <div style={{ flex:1,fontFamily:'var(--serif)',fontSize:16,fontWeight:600,color:'var(--text)',display:'flex',alignItems:'center',gap:6 }}>
                    {activeBoard.name}
                    <button onClick={()=>startRename(activeBoard)} style={{ background:'none',border:'none',cursor:'pointer',fontSize:12,padding:'2px',color:'var(--text3)' }}>✏️</button>
                  </div>
                )}
              </div>

              <VisionBoard
                key={activeBid}
                boardId={activeBid}
                items={activeBoard.items}
                boardDrawing={activeBoard.drawing}
                onUpdate={bUpdate}
                onDelete={bDelete}
                onReorder={bFront}
                onDrawingChange={bDrawing}
                palettes={palettes}
              />

              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={onFileChange}/>

              <div style={{ display:'flex',gap:10,marginTop:14 }}>
                <button onClick={()=>fileInputRef.current?.click()} className="btn-add" style={{ flex:1,justifyContent:'center' }}>
                  <Icon name="plus" size={16}/> Adicionar foto
                </button>
                <button onClick={()=>doExport(activeBoard)} style={{ padding:'10px 16px',borderRadius:'var(--r)',border:'1.5px solid var(--accent)',background:'var(--accent-bg)',color:'var(--accent-dk)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:5 }}>
                  ⬇ Salvar imagem
                </button>
              </div>

              {activeBoard.items.length>0 && (
                <button onClick={()=>{saveBoards(bs=>bs.map(b=>b.id===activeBid?{...b,items:[]}:b));toast('Fotos removidas');}} style={{ marginTop:8,width:'100%',padding:'8px',borderRadius:'var(--r)',border:'1px solid var(--line)',background:'var(--surface)',color:'var(--text3)',cursor:'pointer',fontFamily:'var(--sans)',fontSize:12 }}>
                  Limpar fotos
                </button>
              )}
            </div>
          ) : null
        )}

        {/* ════════════════════ PALETAS ════════════════════ */}
        {tab==='paletas' && (
          <div>
            {palettes.length>0&&(<><div className="section-label" style={{ marginBottom:10 }}>Minhas paletas</div><div style={{ display:'flex',flexDirection:'column',gap:12,marginBottom:16 }}>{palettes.map(palette=>(<PaletteCard key={palette.id} palette={palette} onEdit={()=>setEditPalette({...palette,colors:palette.colors.map(normalizeColor)})} onDelete={()=>{savePalettes(p=>p.filter(x=>x.id!==palette.id));toast('Removida');}} onCopyHex={copyHex}/>))}</div></>)}
            <button className="btn-add" onClick={()=>setShowPaletteModal(true)} style={{ marginBottom:28 }}><Icon name="plus" size={16}/> Nova paleta</button>
            <div className="section-label" style={{ marginBottom:10 }}>Exemplos prontos</div>
            <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
              {DEFAULT_PALETTES.map(palette=>(<PaletteCard key={palette.id} palette={palette} onCopyHex={copyHex} onSave={()=>{if(palettes.some(p=>p.name===palette.name)){toast('Já salva');return;}savePalettes(p=>[...p,{...palette,id:newId()}]);toast(`"${palette.name}" salva`);}}/>))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showPaletteModal} onClose={()=>setShowPaletteModal(false)} title="Nova paleta">
        <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
          <input className="input" placeholder="Nome da paleta" value={newPalette.name} onChange={e=>setNewPalette(p=>({...p,name:e.target.value}))} autoFocus/>
          <div><div style={{ fontSize:12,color:'var(--text2)',fontWeight:500,marginBottom:8 }}>Cores</div><ColorRows colors={newPalette.colors} onHex={updatePH} onName={updatePN} onRemove={removePC}/><button onClick={addPC} style={{ marginTop:10,background:'none',border:'1.5px dashed var(--line)',borderRadius:'var(--r-sm)',padding:'8px 14px',cursor:'pointer',color:'var(--text3)',fontSize:13,fontFamily:'var(--sans)',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center' }}><Icon name="plus" size={14}/> Adicionar cor</button></div>
          <button className="btn-primary" onClick={addPalette}>Salvar paleta</button>
        </div>
      </Modal>

      <Modal open={!!editPalette} onClose={()=>setEditPalette(null)} title="Editar paleta">
        {editPalette&&(<div style={{ display:'flex',flexDirection:'column',gap:12 }}><input className="input" value={editPalette.name} onChange={e=>setEditPalette(p=>({...p,name:e.target.value}))}/><div><div style={{ fontSize:12,color:'var(--text2)',fontWeight:500,marginBottom:8 }}>Cores</div><ColorRows colors={editPalette.colors} onHex={updateEH} onName={updateEN} onRemove={removeEC}/><button onClick={addEC} style={{ marginTop:10,background:'none',border:'1.5px dashed var(--line)',borderRadius:'var(--r-sm)',padding:'8px 14px',cursor:'pointer',color:'var(--text3)',fontSize:13,fontFamily:'var(--sans)',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center' }}><Icon name="plus" size={14}/> Adicionar cor</button></div><button className="btn-primary" onClick={saveEP}>Salvar</button></div>)}
      </Modal>
    </div>
  );
};

export default Inspiracao;
