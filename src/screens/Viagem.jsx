import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Checkbox from '../components/Checkbox';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const TABS = [
  { id: 'bucket',   label: 'Bucket List' },
  { id: 'docs',     label: 'Documentos' },
  { id: 'destinos', label: 'Destinos' },
];

const TIPOS = ['cidade', 'praia', 'montanha', 'mochilão', 'aventura', 'cultural', 'outro'];
const TIPO_EMOJI = { cidade: '🏙️', praia: '🏖️', montanha: '⛰️', mochilão: '🎒', aventura: '🧭', cultural: '🏛️', outro: '✈️' };

const Viagem = ({ onBack }) => {
  const [tab, setTab] = useState('bucket');
  const [bucket, saveBucket] = useStorage('viagem:bucket', []);
  const [docs, saveDocs] = useStorage('viagem:docs', []);
  const [destinos, saveDestinos] = useStorage('viagem:destinos', []);
  const [events, saveEvents] = useStorage('events:items', []);
  const [openDest, setOpenDest] = useState(null);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [newLinkTexts, setNewLinkTexts] = useState({});

  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDestinoModal, setShowDestinoModal] = useState(false);

  const [newBucket, setNewBucket] = useState({ place: '', note: '' });
  const [newDoc, setNewDoc] = useState({ name: '', expiry: '' });
  const [newDestino, setNewDestino] = useState({ name: '', emoji: '✈️', type: 'cidade', dateStart: '', dateEnd: '', notes: '' });

  const toast = useToast();

  const today = new Date();
  const daysUntilExpiry = (expiry) => {
    if (!expiry) return null;
    return Math.round((new Date(expiry) - today) / (1000 * 60 * 60 * 24));
  };

  // Bucket
  const addBucket = () => {
    if (!newBucket.place.trim()) return;
    saveBucket(b => [...b, { id: newId(), ...newBucket, visited: false }]);
    setNewBucket({ place: '', note: '' });
    setShowBucketModal(false);
    toast('Destino adicionado');
  };
  const toggleVisited = (id) => saveBucket(b => b.map(x => x.id === id ? { ...x, visited: !x.visited } : x));

  // Docs
  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    saveDocs(d => [...d, { id: newId(), ...newDoc }]);
    setNewDoc({ name: '', expiry: '' });
    setShowDocModal(false);
    toast('Documento adicionado');
  };

  // Destinos
  const addDestino = () => {
    if (!newDestino.name.trim()) return;
    const id = newId();
    saveDestinos(d => [...d, { id, ...newDestino, checklist: [], links: [] }]);

    // Sync dates to calendar
    const calEvents = [];
    const title = `${newDestino.emoji || '✈️'} ${newDestino.name}`;
    if (newDestino.dateStart) {
      calEvents.push({ id: newId(), title: `${title} · ida`, date: newDestino.dateStart, time: '00:00', category: 'viagem', color: 'oklch(62% 0.09 60)', sourceId: id });
    }
    if (newDestino.dateEnd && newDestino.dateEnd !== newDestino.dateStart) {
      calEvents.push({ id: newId(), title: `${title} · volta`, date: newDestino.dateEnd, time: '23:59', category: 'viagem', color: 'oklch(62% 0.09 60)', sourceId: id });
    }
    if (calEvents.length) saveEvents(evs => [...evs, ...calEvents]);

    setNewDestino({ name: '', emoji: '✈️', type: 'cidade', dateStart: '', dateEnd: '', notes: '' });
    setShowDestinoModal(false);
    toast('Destino criado');
  };

  const delDestino = (id) => {
    saveDestinos(ds => ds.filter(d => d.id !== id));
    saveEvents(evs => evs.filter(e => e.sourceId !== id));
    if (openDest === id) setOpenDest(null);
    toast('Removido');
  };

  const toggleDestinoItem = (destId, itemId) => {
    saveDestinos(ds => ds.map(d => d.id === destId
      ? { ...d, checklist: d.checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
      : d
    ));
  };

  const addDestinoItem = (destId) => {
    const text = (newItemTexts[destId] || '').trim();
    if (!text) return;
    saveDestinos(ds => ds.map(d => d.id === destId
      ? { ...d, checklist: [...d.checklist, { id: newId(), text, done: false }] }
      : d
    ));
    setNewItemTexts(t => ({ ...t, [destId]: '' }));
  };

  const delDestinoItem = (destId, itemId) => {
    saveDestinos(ds => ds.map(d => d.id === destId
      ? { ...d, checklist: d.checklist.filter(i => i.id !== itemId) }
      : d
    ));
  };

  const addDestinoLink = (destId) => {
    const { label = '', url = '' } = newLinkTexts[destId] || {};
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    saveDestinos(ds => ds.map(d => d.id === destId
      ? { ...d, links: [...(d.links || []), { id: newId(), label: label.trim() || url.trim(), url: fullUrl }] }
      : d
    ));
    setNewLinkTexts(t => ({ ...t, [destId]: { label: '', url: '' } }));
  };

  const delDestinoLink = (destId, linkId) => {
    saveDestinos(ds => ds.map(d => d.id === destId
      ? { ...d, links: (d.links || []).filter(l => l.id !== linkId) }
      : d
    ));
  };

  return (
    <div className="screen">
      <BackHeader title="Viagem" onBack={onBack}
        action={<button onClick={() => {
          if (tab === 'bucket') setShowBucketModal(true);
          else if (tab === 'docs') setShowDocModal(true);
          else setShowDestinoModal(true);
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
          <Icon name="plus" size={20} />
        </button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Bucket List ── */}
        {tab === 'bucket' && (
          <div>
            {bucket.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
                <div style={{ fontSize: 14 }}>Bucket list vazia</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {bucket.map(item => (
                  <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div onClick={() => toggleVisited(item.id)} style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid', borderColor: item.visited ? 'var(--green)' : 'var(--line)', background: item.visited ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                      {item.visited && <Icon name="check" size={10} color="white" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: item.visited ? 'var(--text3)' : 'var(--text)', textDecoration: item.visited ? 'line-through' : 'none' }}>{item.place}</div>
                      {item.note && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{item.note}</div>}
                    </div>
                    <button onClick={() => { saveBucket(b => b.filter(x => x.id !== item.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowBucketModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar destino
            </button>
          </div>
        )}

        {/* ── Documentos ── */}
        {tab === 'docs' && (
          <div>
            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛂</div>
                <div style={{ fontSize: 14 }}>Nenhum documento</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {docs.map(doc => {
                  const days = daysUntilExpiry(doc.expiry);
                  const warning = days !== null && days < 90;
                  return (
                    <div key={doc.id} className="card" style={{ borderColor: warning ? 'oklch(88% 0.05 15)' : 'var(--line)', background: warning ? 'var(--red-bg)' : 'var(--surface)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="compass" size={18} color={warning ? 'var(--red)' : 'var(--text2)'} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{doc.name}</div>
                          {doc.expiry && <div style={{ fontSize: 12, color: warning ? 'var(--red)' : 'var(--text3)', marginTop: 2 }}>Vence: {doc.expiry} {warning ? `⚠️ ${days}d` : ''}</div>}
                        </div>
                        <button onClick={() => { saveDocs(d => d.filter(x => x.id !== doc.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowDocModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar documento
            </button>
          </div>
        )}

        {/* ── Destinos / Pastas ── */}
        {tab === 'destinos' && (
          <div>
            {destinos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
                <div style={{ fontSize: 14 }}>Nenhum destino planejado</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {destinos.map(dest => {
                  const isOpen = openDest === dest.id;
                  const doneCount = dest.checklist.filter(i => i.done).length;
                  const typeEmoji = TIPO_EMOJI[dest.type] || '✈️';

                  return (
                    <div key={dest.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Header da pasta */}
                      <div
                        onClick={() => setOpenDest(isOpen ? null : dest.id)}
                        style={{ width: '100%', padding: '14px 16px', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--sans)', textAlign: 'left' }}
                      >
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{dest.emoji || typeEmoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dest.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                            {dest.type}
                            {dest.dateStart && ` · ${dest.dateStart}`}
                            {dest.dateEnd && ` → ${dest.dateEnd}`}
                            {dest.checklist.length > 0 && ` · ${doneCount}/${dest.checklist.length} itens`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <button
                            onClick={e => { e.stopPropagation(); delDestino(dest.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                          <Icon name={isOpen ? 'chevronDown' : 'arrow'} size={14} color="var(--text3)" />
                        </div>
                      </div>

                      {/* Conteúdo expandido */}
                      {isOpen && (
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--line)' }}>
                          {dest.notes && (
                            <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', marginTop: 12, marginBottom: 12 }}>{dest.notes}</div>
                          )}

                          {dest.checklist.length > 0 && (
                            <div style={{ marginTop: 12, marginBottom: 10 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>Checklist</div>
                              {dest.checklist.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <div style={{ flex: 1 }}>
                                    <Checkbox
                                      checked={item.done}
                                      onToggle={() => toggleDestinoItem(dest.id, item.id)}
                                      strikethrough
                                    >
                                      {item.text}
                                    </Checkbox>
                                  </div>
                                  <button onClick={() => delDestinoItem(dest.id, item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
                                    <Icon name="x" size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Campo inline para adicionar item */}
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <input
                              className="input"
                              placeholder="Adicionar item ao checklist…"
                              value={newItemTexts[dest.id] || ''}
                              onChange={e => setNewItemTexts(t => ({ ...t, [dest.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && addDestinoItem(dest.id)}
                              style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                            />
                            <button
                              onClick={() => addDestinoItem(dest.id)}
                              style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--r-sm)', padding: '8px 12px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}
                            >
                              <Icon name="plus" size={14} color="white" />
                            </button>
                          </div>

                          {/* Links úteis */}
                          <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 8 }}>Links úteis</div>
                            {(dest.links || []).map(link => (
                              <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Icon name="link" size={12} color="var(--text3)" />
                                <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {link.label}
                                </a>
                                <button onClick={() => delDestinoLink(dest.id, link.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2, flexShrink: 0 }}>
                                  <Icon name="x" size={12} />
                                </button>
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                className="input"
                                placeholder="Nome (hotel, restaurante…)"
                                value={(newLinkTexts[dest.id] || {}).label || ''}
                                onChange={e => setNewLinkTexts(t => ({ ...t, [dest.id]: { ...(t[dest.id] || {}), label: e.target.value } }))}
                                style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                              />
                              <input
                                className="input"
                                placeholder="URL"
                                value={(newLinkTexts[dest.id] || {}).url || ''}
                                onChange={e => setNewLinkTexts(t => ({ ...t, [dest.id]: { ...(t[dest.id] || {}), url: e.target.value } }))}
                                onKeyDown={e => e.key === 'Enter' && addDestinoLink(dest.id)}
                                style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                              />
                              <button
                                onClick={() => addDestinoLink(dest.id)}
                                style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '7px 10px', cursor: 'pointer', color: 'var(--text2)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                              >
                                <Icon name="plus" size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowDestinoModal(true)}>
              <Icon name="plus" size={16} />
              Novo destino
            </button>
          </div>
        )}
      </div>

      <Modal open={showBucketModal} onClose={() => setShowBucketModal(false)} title="Novo destino">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Destino (ex: Japão)" value={newBucket.place} onChange={e => setNewBucket(b => ({ ...b, place: e.target.value }))} autoFocus />
          <input className="input" placeholder="Nota (opcional)" value={newBucket.note} onChange={e => setNewBucket(b => ({ ...b, note: e.target.value }))} />
          <button className="btn-primary" onClick={addBucket}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Novo documento de viagem">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Documento (ex: Passaporte)" value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))} autoFocus />
          <input className="input" type="date" placeholder="Validade" value={newDoc.expiry} onChange={e => setNewDoc(d => ({ ...d, expiry: e.target.value }))} />
          <button className="btn-primary" onClick={addDoc}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showDestinoModal} onClose={() => setShowDestinoModal(false)} title="Nova viagem">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="✈️" value={newDestino.emoji} onChange={e => setNewDestino(d => ({ ...d, emoji: e.target.value }))} style={{ width: 64 }} />
            <input className="input" placeholder="Nome da viagem (ex: Japão 2027)" value={newDestino.name} onChange={e => setNewDestino(d => ({ ...d, name: e.target.value }))} autoFocus style={{ flex: 1 }} />
          </div>
          <select className="input" value={newDestino.type} onChange={e => setNewDestino(d => ({ ...d, type: e.target.value }))}>
            {TIPOS.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{TIPO_EMOJI[t]} {t}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Data início</label>
              <input className="input" type="date" value={newDestino.dateStart} onChange={e => setNewDestino(d => ({ ...d, dateStart: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Data fim</label>
              <input className="input" type="date" value={newDestino.dateEnd} onChange={e => setNewDestino(d => ({ ...d, dateEnd: e.target.value }))} />
            </div>
          </div>
          <textarea className="input" placeholder="Notas (opcional)" value={newDestino.notes} onChange={e => setNewDestino(d => ({ ...d, notes: e.target.value }))} rows={2} style={{ resize: 'none' }} />
          <button className="btn-primary" onClick={addDestino}>Criar destino</button>
        </div>
      </Modal>
    </div>
  );
};

export default Viagem;
