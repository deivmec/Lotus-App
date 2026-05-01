import { useState } from 'react';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const TABS = [
  { id: 'diario', label: 'Diário' },
  { id: 'notas',  label: 'Notas' },
];

const today = new Date().toISOString().slice(0, 10);
const newId = () => Date.now().toString();

const NOTE_COLORS = [
  { id: 'cream',  hex: '#FAF8F5', dot: '#D4C9B8' },
  { id: 'yellow', hex: '#FFFBDC', dot: '#E8C94A' },
  { id: 'pink',   hex: '#FFF0F3', dot: '#F0A0B0' },
  { id: 'green',  hex: '#EDFAF2', dot: '#72C48A' },
  { id: 'blue',   hex: '#EEF5FF', dot: '#80AAE8' },
  { id: 'lilac',  hex: '#F4EEFF', dot: '#B090D8' },
  { id: 'peach',  hex: '#FFF3EC', dot: '#E8A870' },
  { id: 'sage',   hex: '#EEF3EA', dot: '#90B080' },
];

const DEFAULT_COLOR = NOTE_COLORS[0].hex;

const Pessoal = () => {
  const [tab, setTab] = useState('diario');
  const [journal, saveJournal] = useStorage('journal:items', []);
  const [notes, saveNotes] = useStorage('notes:items', []);
  const [search, setSearch] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [newNote, setNewNote] = useState({ title: '', body: '', tags: '', color: DEFAULT_COLOR });
  const toast = useToast();

  const todayEntry = journal.find(j => j.date === today);
  const [journalText, setJournalText] = useState(todayEntry?.text || '');
  const [journalSaved, setJournalSaved] = useState(!!todayEntry);

  const saveJournalEntry = () => {
    if (!journalText.trim()) return;
    saveJournal(jl => {
      const idx = jl.findIndex(j => j.date === today);
      if (idx >= 0) {
        const updated = [...jl];
        updated[idx] = { ...updated[idx], text: journalText };
        return updated;
      }
      return [{ id: newId(), date: today, text: journalText }, ...jl];
    });
    setJournalSaved(true);
    toast('Entrada salva');
  };

  const openNew = () => {
    setEditNote(null);
    setNewNote({ title: '', body: '', tags: '', color: DEFAULT_COLOR });
    setShowNoteModal(true);
  };

  const openEdit = (note) => {
    setEditNote(note);
    setNewNote({ title: note.title, body: note.body, tags: (note.tags || []).join(', '), color: note.color || DEFAULT_COLOR });
    setShowNoteModal(true);
  };

  const saveNote = () => {
    if (!newNote.title.trim()) return;
    const tags = newNote.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editNote) {
      saveNotes(ns => ns.map(n => n.id === editNote.id ? { ...n, title: newNote.title, body: newNote.body, tags, color: newNote.color } : n));
      toast('Nota atualizada');
    } else {
      saveNotes(ns => [{ id: newId(), date: today, title: newNote.title, body: newNote.body, tags, color: newNote.color }, ...ns]);
      toast('Nota adicionada');
    }
    setShowNoteModal(false);
    setEditNote(null);
    setNewNote({ title: '', body: '', tags: '', color: DEFAULT_COLOR });
  };

  const deleteNote = (id) => {
    saveNotes(ns => ns.filter(n => n.id !== id));
    setShowNoteModal(false);
    setEditNote(null);
    toast('Nota removida');
  };

  const filteredNotes = notes.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase()) ||
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

      {/* ── Diário ── */}
      {tab === 'diario' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Hoje — {today}</div>
              {journalText.trim() && (
                <button onClick={saveJournalEntry} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500 }}>
                  {journalSaved ? '✓ Salvo' : 'Salvar'}
                </button>
              )}
            </div>
            <div className="card" style={{ padding: 0 }}>
              <textarea
                value={journalText}
                onChange={e => { setJournalText(e.target.value); setJournalSaved(false); }}
                placeholder="Como foi o seu dia? O que você está pensando e sentindo?"
                style={{ width: '100%', minHeight: 160, background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, padding: '16px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {journal.filter(j => j.date !== today).length > 0 && (
            <div>
              <div className="section-label">Entradas anteriores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {journal.filter(j => j.date !== today).slice(0, 10).map(entry => (
                  <div key={entry.id} className="card">
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 500 }}>{entry.date}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Notas (post-it) ── */}
      {tab === 'notas' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <input className="input" placeholder="Buscar notas..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
              <div style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={16} color="var(--text3)" />
              </div>
            </div>
          </div>

          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📓</div>
              <div style={{ fontSize: 14 }}>{search ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {filteredNotes.map(note => {
                const bg = note.color || DEFAULT_COLOR;
                const colorDef = NOTE_COLORS.find(c => c.hex === bg) || NOTE_COLORS[0];
                return (
                  <div
                    key={note.id}
                    onClick={() => openEdit(note)}
                    style={{
                      background: bg,
                      borderRadius: 'var(--r)',
                      padding: '14px 14px 12px',
                      border: '1px solid rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      position: 'relative',
                      minHeight: 110,
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Canto dobrado */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 18px 18px 0', borderColor: `transparent rgba(0,0,0,0.08) transparent transparent`, borderRadius: '0 var(--r) 0 0' }} />

                    {/* Bolinha de cor */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorDef.dot, marginBottom: 8, flexShrink: 0 }} />

                    <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6 }}>
                      {note.title}
                    </div>

                    {note.body && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                        {note.body}
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.03em' }}>{note.date}</div>
                      {note.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {note.tags.slice(0, 2).map((t, i) => (
                            <span key={i} style={{ fontSize: 9, background: 'rgba(0,0,0,0.07)', color: 'var(--text2)', borderRadius: 20, padding: '1px 6px', fontFamily: 'var(--sans)' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button className="btn-add" onClick={openNew}>
            <Icon name="plus" size={16} /> Nova nota
          </button>
        </div>
      )}

      {/* Modal: nota */}
      <Modal open={showNoteModal} onClose={() => { setShowNoteModal(false); setEditNote(null); }} title={editNote ? 'Editar nota' : 'Nova nota'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Seletor de cor */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Cor da nota</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {NOTE_COLORS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setNewNote(n => ({ ...n, color: c.hex }))}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c.hex,
                    border: `2.5px solid ${newNote.color === c.hex ? 'var(--accent)' : 'rgba(0,0,0,0.10)'}`,
                    cursor: 'pointer',
                    boxShadow: newNote.color === c.hex ? '0 0 0 1px var(--accent)' : 'none',
                    transition: 'all 0.15s',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Prévia da cor */}
          <div style={{ background: newNote.color, borderRadius: 'var(--r-sm)', padding: '10px 14px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{newNote.title || 'Prévia da nota'}</div>
          </div>

          <input className="input" placeholder="Título" value={newNote.title} onChange={e => setNewNote(n => ({ ...n, title: e.target.value }))} autoFocus />
          <textarea className="input" placeholder="Conteúdo..." value={newNote.body} onChange={e => setNewNote(n => ({ ...n, body: e.target.value }))} rows={5} style={{ resize: 'none' }} />
          <input className="input" placeholder="Tags (separadas por vírgula)" value={newNote.tags} onChange={e => setNewNote(n => ({ ...n, tags: e.target.value }))} />

          <button className="btn-primary" onClick={saveNote}>{editNote ? 'Salvar' : 'Adicionar'}</button>

          {editNote && (
            <button
              onClick={() => deleteNote(editNote.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontFamily: 'var(--sans)', padding: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="trash" size={14} color="var(--red)" /> Excluir nota
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Pessoal;
