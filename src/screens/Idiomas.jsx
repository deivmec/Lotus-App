import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const TABS = [
  { id: 'vocab',    label: 'Vocabulário' },
  { id: 'flash',    label: 'Flashcards' },
  { id: 'notas',    label: 'Notas' },
  { id: 'tradutor', label: 'Tradutor' },
];

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'Inglês' },
  { code: 'es', label: 'Espanhol' },
  { code: 'fr', label: 'Francês' },
  { code: 'de', label: 'Alemão' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: 'Japonês' },
];

const NIVEL_COLORS = {
  'fácil':   { bg: 'var(--green-bg)', color: 'var(--green)' },
  'médio':   { bg: 'var(--blue-bg)',  color: 'var(--blue)' },
  'difícil': { bg: 'var(--red-bg)',   color: 'var(--red)' },
};

const Idiomas = ({ onBack }) => {
  const [tab, setTab] = useState('vocab');
  const [vocab, saveVocab] = useStorage('idiomas:vocabulario', []);
  const [flashcards, saveFlashcards] = useStorage('idiomas:flashcards', []);
  const [notes, saveNotes] = useStorage('idiomas:notas', []);
  const [history, saveHistory] = useStorage('idiomas:tradutor', []);

  const [flipped, setFlipped] = useState({});
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyFlipped, setStudyFlipped] = useState(false);
  const [studyScore, setStudyScore] = useState({ yes: 0, no: 0 });

  const [showVocabModal, setShowVocabModal] = useState(false);
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newVocab, setNewVocab] = useState({ palavra: '', trad: '', ex: '', tema: '' });
  const [newFlash, setNewFlash] = useState({ frente: '', verso: '', nivel: 'médio' });
  const [newNote, setNewNote] = useState({ title: '', body: '' });

  // Tradutor
  const [tradInput, setTradInput] = useState('');
  const [tradFrom, setTradFrom] = useState('pt');
  const [tradTo, setTradTo] = useState('en');
  const [tradResult, setTradResult] = useState('');
  const [tradLoading, setTradLoading] = useState(false);
  const [tradError, setTradError] = useState('');

  const toast = useToast();

  const addVocab = () => {
    if (!newVocab.palavra.trim()) return;
    saveVocab(v => [...v, { id: newId(), ...newVocab }]);
    setNewVocab({ palavra: '', trad: '', ex: '', tema: '' });
    setShowVocabModal(false);
    toast('Palavra adicionada');
  };
  const addFlash = () => {
    if (!newFlash.frente.trim()) return;
    saveFlashcards(f => [...f, { id: newId(), ...newFlash }]);
    setNewFlash({ frente: '', verso: '', nivel: 'médio' });
    setShowFlashModal(false);
    toast('Flashcard adicionado');
  };
  const addNote = () => {
    if (!newNote.title.trim()) return;
    saveNotes(n => [...n, { id: newId(), date: new Date().toISOString().slice(0, 10), ...newNote }]);
    setNewNote({ title: '', body: '' });
    setShowNoteModal(false);
    toast('Nota adicionada');
  };

  const translate = async () => {
    if (!tradInput.trim()) return;
    setTradLoading(true);
    setTradError('');
    setTradResult('');
    try {
      const encoded = encodeURIComponent(tradInput.trim());
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=${tradFrom}|${tradTo}`);
      if (!res.ok) throw new Error('Falha na requisição');
      const data = await res.json();
      const result = data.responseData?.translatedText || '';
      setTradResult(result);
      const entry = { id: newId(), from: tradFrom, to: tradTo, input: tradInput.trim(), result };
      saveHistory(h => [entry, ...h].slice(0, 10));
    } catch {
      setTradError('Sem conexão ou serviço indisponível. Verifique sua internet.');
    } finally {
      setTradLoading(false);
    }
  };

  // Study mode
  const startStudy = () => {
    setStudyIndex(0);
    setStudyFlipped(false);
    setStudyScore({ yes: 0, no: 0 });
    setStudyMode(true);
  };
  const studyAnswer = (remembered) => {
    setStudyScore(s => ({ ...s, [remembered ? 'yes' : 'no']: s[remembered ? 'yes' : 'no'] + 1 }));
    const next = studyIndex + 1;
    if (next >= flashcards.length) {
      setStudyMode(false);
    } else {
      setStudyIndex(next);
      setStudyFlipped(false);
    }
  };

  const currentCard = flashcards[studyIndex];
  const total = studyScore.yes + studyScore.no;

  return (
    <div className="screen">
      <BackHeader title="Idiomas" onBack={onBack}
        action={!studyMode && <button onClick={() => {
          if (tab === 'vocab') setShowVocabModal(true);
          else if (tab === 'flash') setShowFlashModal(true);
          else if (tab === 'notas') setShowNoteModal(true);
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
          <Icon name="plus" size={20} />
        </button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        {!studyMode && (
          <div style={{ marginBottom: 24 }}>
            <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
          </div>
        )}

        {/* ── Vocabulário ── */}
        {!studyMode && tab === 'vocab' && (
          <div>
            {vocab.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🗣️</div>
                <div style={{ fontSize: 14 }}>Nenhuma palavra ainda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {vocab.map(v => (
                  <div key={v.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{v.palavra}</div>
                        <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 6 }}>{v.trad}</div>
                        {v.ex && <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', lineHeight: 1.5 }}>{v.ex}</div>}
                        {v.tema && <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)', marginTop: 6, display: 'inline-block' }}>{v.tema}</span>}
                      </div>
                      <button onClick={() => { saveVocab(vs => vs.filter(x => x.id !== v.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowVocabModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar palavra
            </button>
          </div>
        )}

        {/* ── Flashcards ── */}
        {!studyMode && tab === 'flash' && (
          <div>
            {flashcards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🃏</div>
                <div style={{ fontSize: 14 }}>Nenhum flashcard</div>
              </div>
            ) : (
              <>
                <button
                  onClick={startStudy}
                  style={{ width: '100%', marginBottom: 16, padding: '12px', borderRadius: 'var(--r)', border: '1.5px solid var(--accent)', background: 'var(--accent-bg)', color: 'var(--accent-dk)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Icon name="star" size={16} color="var(--accent)" />
                  Estudar {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''}
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {flashcards.map(f => {
                    const nc = NIVEL_COLORS[f.nivel] || NIVEL_COLORS['médio'];
                    const isFlipped = flipped[f.id];
                    return (
                      <div key={f.id} onClick={() => setFlipped(fl => ({ ...fl, [f.id]: !fl[f.id] }))} className="card" style={{ cursor: 'pointer', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', background: isFlipped ? 'var(--bg2)' : 'white', transition: 'background 0.2s' }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>
                            {isFlipped ? f.verso : f.frente}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{isFlipped ? 'Toque p/ ocultar' : 'Toque p/ revelar'}</div>
                        </div>
                        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                          <span className="tag" style={{ background: nc.bg, color: nc.color }}>{f.nivel}</span>
                          <button onClick={e => { e.stopPropagation(); saveFlashcards(fs => fs.filter(x => x.id !== f.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <button className="btn-add" onClick={() => setShowFlashModal(true)}>
              <Icon name="plus" size={16} />
              Novo flashcard
            </button>
          </div>
        )}

        {/* ── Modo Estudo ── */}
        {studyMode && currentCard && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                {studyIndex + 1} / {flashcards.length}
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ {studyScore.yes}</span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>✗ {studyScore.no}</span>
              </div>
              <button onClick={() => setStudyMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, fontFamily: 'var(--sans)' }}>
                Encerrar
              </button>
            </div>

            <div
              onClick={() => setStudyFlipped(f => !f)}
              style={{ background: studyFlipped ? 'var(--bg2)' : 'white', border: '1px solid var(--line)', borderRadius: 'var(--r)', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '32px 24px', cursor: 'pointer', marginBottom: 16, transition: 'background 0.2s' }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 16 }}>
                {studyFlipped ? 'VERSO' : 'FRENTE'}
              </div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--text)', lineHeight: 1.4 }}>
                {studyFlipped ? currentCard.verso : currentCard.frente}
              </div>
              {!studyFlipped && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 16 }}>Toque para revelar</div>
              )}
            </div>

            {studyFlipped ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => studyAnswer(false)}
                  style={{ padding: '14px', borderRadius: 'var(--r)', border: '1.5px solid var(--red)', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600 }}
                >
                  ✗ Não lembrei
                </button>
                <button
                  onClick={() => studyAnswer(true)}
                  style={{ padding: '14px', borderRadius: 'var(--r)', border: '1.5px solid var(--green)', background: 'var(--green-bg)', color: 'var(--green)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600 }}
                >
                  ✓ Lembrei
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
                Toque no card para revelar o verso
              </div>
            )}
          </div>
        )}

        {/* ── Notas ── */}
        {!studyMode && tab === 'notas' && (
          <div>
            {notes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 14 }}>Nenhuma nota</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {notes.map(n => (
                  <div key={n.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{n.title}</div>
                        {n.body && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{n.body}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{n.date}</div>
                      </div>
                      <button onClick={() => { saveNotes(ns => ns.filter(x => x.id !== n.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowNoteModal(true)}>
              <Icon name="plus" size={16} />
              Nova nota
            </button>
          </div>
        )}

        {/* ── Tradutor ── */}
        {!studyMode && tab === 'tradutor' && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              {/* seleção de idiomas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <select className="input" value={tradFrom} onChange={e => setTradFrom(e.target.value)}>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <button onClick={() => { const t = tradFrom; setTradFrom(tradTo); setTradTo(t); setTradResult(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 6 }}>
                  <Icon name="arrow" size={18} />
                </button>
                <select className="input" value={tradTo} onChange={e => setTradTo(e.target.value)}>
                  {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              <textarea
                className="input"
                placeholder="Digite o texto para traduzir…"
                value={tradInput}
                onChange={e => setTradInput(e.target.value)}
                rows={4}
                style={{ resize: 'none', marginBottom: 10 }}
              />

              <button
                className="btn-primary"
                onClick={translate}
                disabled={tradLoading || !tradInput.trim()}
              >
                {tradLoading ? 'Traduzindo…' : 'Traduzir'}
              </button>

              {tradError && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8 }}>
                  {tradError}
                </div>
              )}

              {tradResult && !tradError && (
                <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 'var(--r-sm)', padding: '14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tradução</div>
                  <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.5 }}>{tradResult}</div>
                  <button
                    onClick={() => navigator.clipboard?.writeText(tradResult).then(() => toast('Copiado!'))}
                    style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Icon name="copy" size={12} color="var(--accent)" /> Copiar
                  </button>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div className="section-label" style={{ marginBottom: 0 }}>Histórico</div>
                  <button onClick={() => saveHistory([])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--sans)' }}>Limpar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(h => (
                    <div key={h.id} className="card" style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{h.from.toUpperCase()} → {h.to.toUpperCase()}</div>
                      <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{h.input}</div>
                      <div style={{ fontSize: 13, color: 'var(--accent)' }}>{h.result}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showVocabModal} onClose={() => setShowVocabModal(false)} title="Nova palavra">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Palavra" value={newVocab.palavra} onChange={e => setNewVocab(v => ({ ...v, palavra: e.target.value }))} autoFocus />
          <input className="input" placeholder="Tradução" value={newVocab.trad} onChange={e => setNewVocab(v => ({ ...v, trad: e.target.value }))} />
          <input className="input" placeholder="Exemplo de uso" value={newVocab.ex} onChange={e => setNewVocab(v => ({ ...v, ex: e.target.value }))} />
          <input className="input" placeholder="Tema (ex: comida)" value={newVocab.tema} onChange={e => setNewVocab(v => ({ ...v, tema: e.target.value }))} />
          <button className="btn-primary" onClick={addVocab}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showFlashModal} onClose={() => setShowFlashModal(false)} title="Novo flashcard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Frente (palavra / pergunta)" value={newFlash.frente} onChange={e => setNewFlash(f => ({ ...f, frente: e.target.value }))} autoFocus />
          <input className="input" placeholder="Verso (tradução / resposta)" value={newFlash.verso} onChange={e => setNewFlash(f => ({ ...f, verso: e.target.value }))} />
          <select className="input" value={newFlash.nivel} onChange={e => setNewFlash(f => ({ ...f, nivel: e.target.value }))}>
            <option value="fácil">Fácil</option>
            <option value="médio">Médio</option>
            <option value="difícil">Difícil</option>
          </select>
          <button className="btn-primary" onClick={addFlash}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Nova nota de idioma">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Título (ex: Gramática — casos)" value={newNote.title} onChange={e => setNewNote(n => ({ ...n, title: e.target.value }))} autoFocus />
          <textarea className="input" placeholder="Conteúdo..." value={newNote.body} onChange={e => setNewNote(n => ({ ...n, body: e.target.value }))} rows={5} style={{ resize: 'none' }} />
          <button className="btn-primary" onClick={addNote}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Idiomas;
