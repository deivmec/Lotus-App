import { useState, useRef, useEffect } from 'react';
import TabSwitcher from '../components/TabSwitcher';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const TABS = [
  { id: 'diario', label: 'Diário' },
  { id: 'notas',  label: 'Notas' },
];

const todayStr = new Date().toISOString().slice(0, 10);
const newId = () => Date.now().toString() + Math.random().toString(36).slice(2);

const NOTE_COLORS = [
  { id: 'cream',  light: '#FAF8F5', dark: '#26211B', dot: '#D4C9B8' },
  { id: 'yellow', light: '#FFFBDC', dark: '#2A2500', dot: '#D4A820' },
  { id: 'pink',   light: '#FFF0F3', dark: '#2E0F18', dot: '#E08098' },
  { id: 'green',  light: '#EDFAF2', dark: '#0E2416', dot: '#60B478' },
  { id: 'blue',   light: '#EEF5FF', dark: '#0E1830', dot: '#6898D8' },
  { id: 'lilac',  light: '#F4EEFF', dark: '#1C1238', dot: '#9878C8' },
  { id: 'peach',  light: '#FFF3EC', dark: '#2C1208', dot: '#D89060' },
  { id: 'sage',   light: '#EEF3EA', dark: '#0C1C0A', dot: '#80A070' },
];

const getColorDef = (val) => {
  if (!val) return NOTE_COLORS[0];
  return NOTE_COLORS.find(c => c.id === val || c.light === val || c.dark === val) || NOTE_COLORS[0];
};

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

const getNoteBg = (colorVal) => {
  const c = getColorDef(colorVal);
  return isDark() ? c.dark : c.light;
};

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const DiaryEditor = ({ diaryRef, initialHtml, onSave, autoFocus, textCol, dark }) => {
  useEffect(() => {
    if (diaryRef.current) {
      diaryRef.current.innerHTML = initialHtml || '';
      if (autoFocus) diaryRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={diaryRef}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onSave(diaryRef.current?.innerHTML || '')}
      data-ph="O que está em sua mente?"
      style={{
        width: '100%', minHeight: 'calc(100vh - 110px)',
        outline: 'none', fontFamily: 'Georgia, serif', fontSize: 15,
        lineHeight: '28px', color: textCol,
        padding: '6px 24px 40px 72px', boxSizing: 'border-box',
        caretColor: dark ? '#D0A070' : 'var(--accent)',
        wordBreak: 'break-word',
      }}
    />
  );
};

const NoteBodyEditor = ({ noteRef, initialHtml, onSave, colorDot, autoFocus }) => {
  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.innerHTML = initialHtml || '';
      if (autoFocus) noteRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={noteRef}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onSave(noteRef.current?.innerHTML || '')}
      data-ph="Escreva aqui…"
      style={{
        outline: 'none', fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.75,
        color: 'var(--text)', flex: 1, minHeight: 280,
        wordBreak: 'break-word',
      }}
    />
  );
};

const RICH_COLORS = ['#1a1a1a','#555555','#e53935','#fb8c00','#f9a825','#43a047','#1e88e5','#7b1fa2','#f06292','#00897b'];

const RichBar = ({ editorRef, onSave, barStyle = {} }) => {
  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    setTimeout(() => onSave(editorRef.current?.innerHTML || ''), 0);
  };
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', padding: '6px 10px', ...barStyle }}>
      {[
        { label: 'B', cmd: 'bold',         s: { fontWeight: 900 } },
        { label: 'I', cmd: 'italic',        s: { fontStyle: 'italic' } },
        { label: 'U', cmd: 'underline',     s: { textDecoration: 'underline' } },
        { label: 'S', cmd: 'strikeThrough', s: { textDecoration: 'line-through' } },
      ].map(b => (
        <button key={b.cmd} onMouseDown={e => { e.preventDefault(); exec(b.cmd); }}
          style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.4, ...b.s }}>
          {b.label}
        </button>
      ))}
      <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
      <select defaultValue="" onMouseDown={e => e.stopPropagation()}
        onChange={e => { if (e.target.value) { exec('fontSize', e.target.value); } e.target.value = ''; }}
        style={{ padding: '3px 5px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)' }}>
        <option value="">Tam</option>
        <option value="1">Pequeno</option>
        <option value="3">Normal</option>
        <option value="5">Grande</option>
        <option value="7">XL</option>
      </select>
      <select defaultValue="" onMouseDown={e => e.stopPropagation()}
        onChange={e => { if (e.target.value) { exec('fontName', e.target.value); } e.target.value = ''; }}
        style={{ padding: '3px 5px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text2)' }}>
        <option value="">Fonte</option>
        <option value="Georgia, serif">Georgia</option>
        <option value="Arial, sans-serif">Arial</option>
        <option value="'Courier New', monospace">Mono</option>
        <option value="'Times New Roman', serif">Times</option>
      </select>
      <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
      {RICH_COLORS.map(c => (
        <button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
          style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: '1.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
      ))}
      <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)', margin: '0 2px' }} />
      <button onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }} style={{ padding: '3px 7px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>•</button>
      <button onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }} style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid rgba(0,0,0,0.14)', background: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--sans)' }}>1.</button>
    </div>
  );
};

/* ── PIN Pad ──────────────────────────────────────────────────────────────── */
const PinPad = ({ value, onChange }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 230, margin: '0 auto' }}>
      {keys.map((k, i) => (
        <button
          key={i}
          onClick={() => {
            if (!k) return;
            if (k === '⌫') onChange(value.slice(0, -1));
            else if (value.length < 4) onChange(value + k);
          }}
          style={{
            height: 58, borderRadius: 'var(--r)',
            background: k ? 'var(--bg2)' : 'transparent',
            border: 'none', cursor: k ? 'pointer' : 'default',
            fontSize: k === '⌫' ? 18 : 22,
            fontFamily: 'var(--sans)', color: 'var(--text)',
            transition: 'background 0.12s',
          }}
          onMouseDown={e => k && (e.currentTarget.style.background = 'var(--bg3)')}
          onMouseUp={e => k && (e.currentTarget.style.background = 'var(--bg2)')}
        >
          {k}
        </button>
      ))}
    </div>
  );
};

/* ── PIN Dots ─────────────────────────────────────────────────────────────── */
const PinDots = ({ value, error }) => (
  <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
    {[0,1,2,3].map(i => (
      <div key={i} style={{
        width: 14, height: 14, borderRadius: '50%',
        background: value.length > i
          ? (error ? 'var(--red)' : 'var(--accent)')
          : 'var(--line)',
        transition: 'background 0.18s, transform 0.18s',
        transform: value.length > i ? 'scale(1.15)' : 'scale(1)',
      }} />
    ))}
  </div>
);

/* ── Full-page overlay shell ──────────────────────────────────────────────── */
const FullPage = ({ children, bg = 'var(--bg)' }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: bg,
    display: 'flex', flexDirection: 'column',
  }}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════ */
const Pessoal = () => {
  const [tab, setTab]     = useState('diario');
  const [journal, saveJournal]   = useStorage('journal:items', []);
  const [journalPin, saveJournalPin] = useStorage('journal:pin', '');
  const [notes, saveNotes]       = useStorage('notes:items', []);
  const [search, setSearch]    = useState('');
  const toast = useToast();

  const diaryRef = useRef(null);
  const noteRef  = useRef(null);

  // ── Diary state ──
  const [journalPage, setJournalPage] = useState(null); // { mode:'new'|'view', entry? }
  const [pageText, setPageText]       = useState('');
  const [pinPhase, setPinPhase]       = useState(null); // 'unlock'|'set'|'confirm'
  const [pinTarget, setPinTarget]     = useState(null);
  const [pinInput, setPinInput]       = useState('');
  const [pinFirst, setPinFirst]       = useState('');
  const [pinError, setPinError]       = useState('');

  // ── Notes state ──
  const [notePage, setNotePage] = useState(null); // { id?, title, body, tags, color, date?, isNew }

  // ── Custom date state ──
  const [showDateSheet, setShowDateSheet]   = useState(false);
  const [customDate, setCustomDate]         = useState('');

  /* helpers */
  const openUnlock = (entry) => {
    if (!journalPin) { openNotebook(entry); return; }
    setPinTarget(entry);
    setPinInput('');
    setPinError('');
    setPinPhase('unlock');
  };

  const closePinFlow = () => {
    setPinPhase(null);
    setPinInput('');
    setPinFirst('');
    setPinError('');
    setPinTarget(null);
  };

  const openNotebook = (entry) => {
    setPageText(entry ? entry.text : '');
    setJournalPage(entry ? { mode: 'view', entry } : { mode: 'new' });
    closePinFlow();
  };

  const closeNotebook = () => {
    setJournalPage(null);
    setPinPhase(null);
  };

  const handleSaveNotebook = () => {
    if (!pageText.trim()) { closeNotebook(); return; }
    const entryDate = journalPage.entry?.date || todayStr;
    if (journalPin) {
      saveJournal(jl => {
        const idx = jl.findIndex(j => j.date === entryDate);
        if (idx >= 0) { const upd = [...jl]; upd[idx] = { ...upd[idx], text: pageText }; return upd; }
        return [{ id: newId(), date: entryDate, text: pageText }, ...jl];
      });
      closeNotebook();
      toast('Entrada salva');
    } else {
      setPinInput('');
      setPinPhase('set');
    }
  };

  /* ══ PIN: unlock ═════════════════════════════════════════════════════════ */
  if (pinPhase === 'unlock' && pinTarget) {
    return (
      <FullPage>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💗🔒</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
            {new Date(pinTarget.date + 'T12:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32 }}>Digite a senha para acessar</div>

          {pinError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{pinError}</div>}
          <PinDots value={pinInput} error={!!pinError} />

          <PinPad value={pinInput} onChange={v => {
            setPinInput(v);
            setPinError('');
            if (v.length === 4) {
              if (v === journalPin) {
                openNotebook(pinTarget);
              } else {
                setPinError('Senha incorreta');
                setPinInput('');
              }
            }
          }} />

          <button onClick={closePinFlow} style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--sans)' }}>
            Cancelar
          </button>
        </div>
      </FullPage>
    );
  }

  /* ══ Notes full-page (iPhone Notes style) ════════════════════════════════ */
  if (notePage !== null) {
    const dark = isDark();
    const colorDef = getColorDef(notePage.color);
    const bg = dark ? colorDef.dark : colorDef.light;

    const goBack = () => {
      const tags = (notePage.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      if (!notePage.title.trim() && !notePage.body?.trim()) {
        setNotePage(null);
        return;
      }
      if (notePage.isNew) {
        saveNotes(ns => [{ id: newId(), date: todayStr, title: notePage.title, body: notePage.body || '', tags, color: colorDef.id }, ...ns]);
        toast('Nota adicionada');
      } else {
        saveNotes(ns => ns.map(n => n.id === notePage.id ? { ...n, title: notePage.title, body: notePage.body || '', tags, color: colorDef.id } : n));
        toast('Nota salva');
      }
      setNotePage(null);
    };

    const deleteNote = () => {
      if (!notePage.isNew) { saveNotes(ns => ns.filter(n => n.id !== notePage.id)); toast('Nota removida'); }
      setNotePage(null);
    };

    return (
      <FullPage bg={bg}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px',
          borderBottom: `1px solid ${colorDef.dot}50`,
          flexShrink: 0,
        }}>
          <button onClick={goBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2, fontSize: 16, color: colorDef.dot, fontFamily: 'var(--sans)', fontWeight: 500, padding: '4px 0', filter: dark ? 'brightness(1.4)' : 'none' }}>
            ‹ <span style={{ fontSize: 14 }}>Notas</span>
          </button>

          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {NOTE_COLORS.map(c => {
              const swatchBg = dark ? c.dark : c.light;
              const isActive = notePage.color === c.id;
              return (
                <button key={c.id} onClick={() => setNotePage(p => ({ ...p, color: c.id }))} style={{
                  width: isActive ? 22 : 17, height: isActive ? 22 : 17,
                  borderRadius: '50%', background: swatchBg,
                  border: `2px solid ${isActive ? c.dot : c.dot + '60'}`,
                  cursor: 'pointer', padding: 0,
                  transition: 'all 0.15s', flexShrink: 0,
                }} />
              );
            })}
          </div>

          {!notePage.isNew ? (
            <button onClick={deleteNote} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}>
              <Icon name="trash" size={17} color={colorDef.dot} />
            </button>
          ) : <div style={{ width: 25 }} />}
        </div>

        {/* Formatting toolbar */}
        <RichBar
          editorRef={noteRef}
          onSave={html => setNotePage(p => ({ ...p, body: html }))}
          barStyle={{ borderBottom: `1px solid ${colorDef.dot}50` }}
        />

        {/* Writing area */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 24px 0' }}>
          <input
            value={notePage.title}
            onChange={e => setNotePage(p => ({ ...p, title: e.target.value }))}
            placeholder="Título"
            autoFocus={notePage.isNew}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700,
              color: 'var(--text)', width: '100%', marginBottom: 2,
            }}
          />
          <div style={{ fontSize: 12, color: colorDef.dot, marginBottom: 18, fontWeight: 500, filter: dark ? 'brightness(1.4)' : 'none' }}>
            {notePage.date || todayStr}
          </div>
          <NoteBodyEditor
            noteRef={noteRef}
            initialHtml={notePage.body}
            onSave={html => setNotePage(p => ({ ...p, body: html }))}
            autoFocus={!notePage.isNew}
          />
          <input
            value={notePage.tags}
            onChange={e => setNotePage(p => ({ ...p, tags: e.target.value }))}
            placeholder="Tags (separadas por vírgula)"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              borderTop: `1px solid ${colorDef.dot}40`,
              padding: '12px 0 20px',
              fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', width: '100%',
            }}
          />
        </div>
      </FullPage>
    );
  }

  /* ══ Diary notebook page ════════════════════════════════════════════════ */
  if (journalPage !== null) {
    const dark = isDark();
    const pageBg    = dark ? '#1A1812' : '#FAF6ED';
    const lineColor = dark ? '#28241A' : '#E6DCC8';
    const marginCol = dark ? '#40281E' : '#EDBBAA';
    const textCol   = dark ? '#E2D8C8' : '#2A2018';
    const barBg     = dark ? '#1E1A12' : '#F5F0E6';
    const entryDate = journalPage.entry?.date || todayStr;

    /* PIN: set */
    if (pinPhase === 'set') {
      return (
        <FullPage>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💗🔒</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Criar senha do diário</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32, textAlign: 'center' }}>Defina uma senha única para todas as entradas</div>

            <PinDots value={pinInput} error={false} />
            <PinPad value={pinInput} onChange={v => {
              setPinInput(v);
              if (v.length === 4) { setPinFirst(v); setPinInput(''); setPinPhase('confirm'); }
            }} />

            <button onClick={() => { closeNotebook(); }} style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--sans)' }}>
              Cancelar
            </button>
          </div>
        </FullPage>
      );
    }

    /* PIN: confirm */
    if (pinPhase === 'confirm') {
      return (
        <FullPage>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💗🔒</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Confirmar senha</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32, textAlign: 'center' }}>Digite novamente para confirmar</div>

            {pinError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{pinError}</div>}
            <PinDots value={pinInput} error={!!pinError} />
            <PinPad value={pinInput} onChange={v => {
              setPinInput(v);
              setPinError('');
              if (v.length === 4) {
                if (v === pinFirst) {
                  const pin = v;
                  saveJournalPin(pin);
                  saveJournal(jl => {
                    const idx = jl.findIndex(j => j.date === entryDate);
                    if (idx >= 0) {
                      const upd = [...jl];
                      upd[idx] = { ...upd[idx], text: pageText };
                      return upd;
                    }
                    return [{ id: newId(), date: entryDate, text: pageText }, ...jl];
                  });
                  closeNotebook();
                  setJournalPage(null);
                  toast('Senha do diário definida 💗🔒');
                } else {
                  setPinError('As senhas não coincidem');
                  setPinInput('');
                }
              }
            }} />

            <button onClick={() => { setPinPhase('set'); setPinInput(''); setPinError(''); }} style={{ marginTop: 24, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)', fontFamily: 'var(--sans)' }}>
              Voltar
            </button>
          </div>
        </FullPage>
      );
    }

    /* Notebook page */
    const dateLabel = new Date(entryDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: pageBg,
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Georgia, serif',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', background: barBg,
          borderBottom: `1px solid ${lineColor}`,
          flexShrink: 0, gap: 12,
        }}>
          <button onClick={closeNotebook} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: dark ? '#A09070' : 'var(--accent)', fontFamily: 'var(--sans)', fontWeight: 500, padding: '4px 0', flexShrink: 0 }}>
            ‹ Diário
          </button>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 13, color: dark ? '#907C68' : '#9A7C62', textAlign: 'center', flex: 1, lineHeight: 1.3 }}>
            {dateLabel}
          </div>
          <button onClick={handleSaveNotebook} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: dark ? '#A09070' : 'var(--accent)', fontFamily: 'var(--sans)', fontWeight: 700, padding: '4px 0', flexShrink: 0 }}>
            Salvar
          </button>
        </div>

        {/* Formatting toolbar */}
        <RichBar
          editorRef={diaryRef}
          onSave={setPageText}
          barStyle={{ background: barBg, borderBottom: `1px solid ${lineColor}` }}
        />

        {/* Paper area */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'auto',
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 27px, ${lineColor} 28px)`,
          backgroundSize: '100% 28px',
        }}>
          {/* Left margin */}
          <div style={{ position: 'sticky', top: 0, left: 56, width: 1, height: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 2 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 1, height: '100vh', background: marginCol }} />
          </div>

          <DiaryEditor
            diaryRef={diaryRef}
            initialHtml={pageText}
            onSave={setPageText}
            autoFocus={journalPage.mode === 'new'}
            textCol={textCol}
            dark={dark}
          />
        </div>
      </div>
    );
  }

  /* ══ Main list view ══════════════════════════════════════════════════════ */
  const todayEntry = journal.find(j => j.date === todayStr);

  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  const filteredNotes = notes.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body?.toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="screen" style={{ padding: '24px 24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', lineHeight: 1.2 }}>Pessoal</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Diário e notas</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {/* ── Diário ───────────────────────────────────────────────────────── */}
      {tab === 'diario' && (
        <div>
          {/* Today card */}
          <button
            onClick={() => {
              if (todayEntry) { openUnlock(todayEntry); }
              else { openNotebook(null); }
            }}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 'var(--r)',
              background: 'var(--accent-bg)', border: '1.5px dashed var(--accent)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: 'var(--sans)', marginBottom: 28, textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>✏️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>
                {todayEntry ? 'Ver entrada de hoje' : 'Escrever hoje'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{todayLabel}</div>
            </div>
            {todayEntry && <span style={{ fontSize: 20, flexShrink: 0 }}>💗🔒</span>}
          </button>

          {/* Past entries */}
          {journal.filter(j => j.date !== todayStr).length > 0 && (
            <>
              <div className="section-label">Entradas anteriores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {journal.filter(j => j.date !== todayStr).slice(0, 30).map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => openUnlock(entry)}
                    style={{
                      background: 'var(--surface)', borderRadius: 'var(--r)',
                      padding: '14px 16px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: '1px solid var(--line)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                  >
                    {/* Notebook page icon */}
                    <div style={{ width: 36, height: 40, borderRadius: 4, background: isDark() ? '#2A2418' : '#FAF3E0', border: `1px solid ${isDark() ? '#3A3020' : '#E0D4B8'}`, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3, padding: '5px 5px 5px 9px', boxSizing: 'border-box', overflow: 'hidden' }}>
                      {[0,1,2].map(i => <div key={i} style={{ height: 1.5, background: isDark() ? '#3A3020' : '#D4C8A8', borderRadius: 1 }} />)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, marginBottom: 4, letterSpacing: '0.02em' }}>
                        {new Date(entry.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', filter: 'blur(3.5px)', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stripHtml(entry.text).slice(0, 50)}
                      </div>
                    </div>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>💗🔒</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {journal.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>📖</div>
              <div style={{ fontSize: 14 }}>Nenhuma entrada ainda</div>
              <div style={{ fontSize: 12, marginTop: 6, color: 'var(--text3)' }}>Comece escrevendo hoje</div>
            </div>
          )}

          {/* Nova entrada para data específica */}
          <button
            className="btn-add"
            style={{ marginTop: 20 }}
            onClick={() => { setCustomDate(''); setShowDateSheet(true); }}
          >
            <Icon name="plus" size={16} /> Escrever em outra data
          </button>

          {/* Bottom sheet date picker */}
          {showDateSheet && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
              onClick={() => setShowDateSheet(false)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: '24px 24px 48px', width: '100%', maxWidth: 420, boxSizing: 'border-box' }}
              >
                <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 20px' }} />
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)', marginBottom: 16 }}>Nova entrada</div>
                <input
                  type="date"
                  className="input"
                  value={customDate}
                  max={todayStr}
                  onChange={e => setCustomDate(e.target.value)}
                  style={{ marginBottom: 12 }}
                  autoFocus
                />
                <button
                  className="btn-primary"
                  disabled={!customDate}
                  onClick={() => {
                    if (!customDate) return;
                    setShowDateSheet(false);
                    const existing = journal.find(j => j.date === customDate);
                    if (existing) {
                      openUnlock(existing);
                    } else {
                      setPageText('');
                      setJournalPage({ mode: 'new', entry: { date: customDate } });
                      closePinFlow();
                    }
                  }}
                >
                  {journal.find(j => j.date === customDate) ? 'Acessar entrada 💗🔒' : 'Escrever →'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Notas ────────────────────────────────────────────────────────── */}
      {tab === 'notas' && (
        <div>
          <div style={{ marginBottom: 16, position: 'relative' }}>
            <input
              className="input"
              placeholder="Buscar notas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
            <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}>
              <Icon name="search" size={16} color="var(--text3)" />
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📓</div>
              <div style={{ fontSize: 14 }}>{search ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {filteredNotes.map(note => {
                const bg = getNoteBg(note.color);
                const colorDef = getColorDef(note.color);
                return (
                  <div
                    key={note.id}
                    onClick={() => setNotePage({ ...note, tags: (note.tags || []).join(', '), isNew: false })}
                    style={{
                      background: bg, borderRadius: 'var(--r)',
                      padding: '14px 14px 12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer', position: 'relative',
                      minHeight: 110, display: 'flex', flexDirection: 'column',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Dog-ear */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 18px 18px 0', borderColor: `transparent rgba(0,0,0,0.08) transparent transparent`, borderRadius: '0 var(--r) 0 0' }} />
                    {/* Color dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorDef.dot, marginBottom: 8, flexShrink: 0 }} />

                    <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6 }}>
                      {note.title}
                    </div>
                    {note.body && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                        {stripHtml(note.body)}
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.03em' }}>{note.date}</div>
                      {note.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {note.tags.slice(0, 2).map((t, i) => (
                            <span key={i} style={{ fontSize: 9, background: 'rgba(0,0,0,0.07)', color: 'var(--text2)', borderRadius: 20, padding: '1px 6px' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button className="btn-add" onClick={() => setNotePage({ title: '', body: '', tags: '', color: 'cream', isNew: true })}>
            <Icon name="plus" size={16} /> Nova nota
          </button>
        </div>
      )}
    </div>
  );
};

export default Pessoal;
