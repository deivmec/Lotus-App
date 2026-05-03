import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2);
const today = new Date().toISOString().slice(0, 10);
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FUNCAO_CORES = {
  limpeza:      { bg: 'var(--blue-bg)',             color: 'var(--blue)' },
  hidratação:   { bg: 'oklch(96% 0.04 200)',        color: 'oklch(48% 0.1 200)' },
  nutrição:     { bg: 'var(--accent-bg)',            color: 'var(--accent-dk)' },
  reconstrução: { bg: 'var(--red-bg)',               color: 'var(--red)' },
  finalização:  { bg: 'var(--green-bg)',             color: 'var(--green)' },
};

const SK_TIPOS = ['limpeza', 'tônico', 'sérum', 'hidratante', 'protetor solar', 'esfoliante', 'máscara', 'óleo', 'contorno', 'outro'];
const SK_STEPS = ['manhã', 'noite', 'ambos', 'semanal'];
const SK_STEP_META = {
  manhã:   { emoji: '🌅', bg: 'oklch(98% 0.03 80)',  color: 'oklch(48% 0.14 80)' },
  noite:   { emoji: '🌙', bg: 'oklch(95% 0.04 280)', color: 'oklch(45% 0.12 280)' },
  ambos:   { emoji: '☀️🌙', bg: 'var(--accent-bg)',  color: 'var(--accent-dk)' },
  semanal: { emoji: '📅', bg: 'var(--green-bg)',      color: 'var(--green)' },
};

const TABS = [
  { id: 'capilar',  label: 'Capilar' },
  { id: 'skincare', label: 'Skincare' },
];

const Autocuidados = ({ onBack }) => {
  const [tab, setTab] = useState('capilar');

  // ── Capilar ──
  const [produtos, saveProdutos] = useStorage('capilar:produtos', []);
  const [logs, saveLogs]         = useStorage('capilar:logs', {});
  const [showCapModal, setShowCapModal] = useState(false);
  const [capForm, setCapForm]     = useState({ nome: '', funcao: 'hidratação', dias: [] });

  // ── Skincare ──
  const [skincare, saveSkincare]  = useStorage('skincare:produtos', []);
  const [showSkModal, setShowSkModal] = useState(false);
  const [skForm, setSkForm]       = useState({ nome: '', tipo: 'hidratante', step: 'manhã', paraQue: '', comoUsar: '' });
  const [expandedSk, setExpandedSk] = useState(null);

  const toast = useToast();

  // ── Capilar helpers ──
  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), isToday: i === 0 });
    }
    return days;
  };
  const weekDays = getWeekDays();
  const todayDow = new Date().getDay();
  const todayProds = produtos.filter(p => !p.dias?.length || p.dias.includes(todayDow));
  const doneTodayCount = todayProds.filter(p => logs[`${p.id}:${today}`]).length;

  const addCapilar = () => {
    if (!capForm.nome.trim()) return;
    saveProdutos(ps => [...ps, { id: newId(), ...capForm }]);
    setCapForm({ nome: '', funcao: 'hidratação', dias: [] });
    setShowCapModal(false);
    toast('Produto adicionado');
  };

  const toggleLog = (prodId) => {
    const key = `${prodId}:${today}`;
    saveLogs(l => ({ ...l, [key]: !l[key] }));
  };

  // ── Skincare helpers ──
  const addSkincare = () => {
    if (!skForm.nome.trim()) return;
    saveSkincare(sk => [...sk, { id: newId(), ...skForm }]);
    setSkForm({ nome: '', tipo: 'hidratante', step: 'manhã', paraQue: '', comoUsar: '' });
    setShowSkModal(false);
    toast('Produto adicionado');
  };

  return (
    <div className="screen">
      <BackHeader
        title="Autocuidados"
        onBack={onBack}
        action={
          <button
            onClick={() => tab === 'capilar' ? setShowCapModal(true) : setShowSkModal(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}
          >
            <Icon name="plus" size={20} />
          </button>
        }
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Tab Capilar ── */}
        {tab === 'capilar' && (
          <div>
            {todayProds.length > 0 && (
              <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>
                  {doneTodayCount}/{todayProds.length}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Produtos de hoje aplicados
                </div>
              </div>
            )}

            {produtos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
                <div style={{ fontSize: 14 }}>Nenhum produto cadastrado</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Adicione seus produtos capilares e rotina</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {produtos.map(prod => {
                  const fc = FUNCAO_CORES[prod.funcao] || { bg: 'var(--bg2)', color: 'var(--text3)' };
                  const done = logs[`${prod.id}:${today}`];
                  const isToday = !prod.dias?.length || prod.dias.includes(todayDow);
                  return (
                    <div key={prod.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: !isToday ? 0.5 : 1 }}>
                      <button
                        onClick={isToday ? () => toggleLog(prod.id) : undefined}
                        style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid', borderColor: done ? 'var(--green)' : 'var(--line)', background: done ? 'var(--green)' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isToday ? 'pointer' : 'default', flexShrink: 0 }}
                      >
                        <Icon name="leaf" size={16} color={done ? 'white' : 'var(--text3)'} />
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.nome}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          <span className="tag" style={{ background: fc.bg, color: fc.color }}>{prod.funcao}</span>
                          {isToday && <span className="tag" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>Hoje</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {weekDays.map((d, i) => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: logs[`${prod.id}:${d.date}`] ? 'var(--green)' : d.isToday ? 'var(--line)' : 'var(--bg3)' }} />
                        ))}
                      </div>
                      <button onClick={() => { saveProdutos(ps => ps.filter(p => p.id !== prod.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowCapModal(true)}>
              <Icon name="plus" size={16} /> Adicionar produto
            </button>
          </div>
        )}

        {/* ── Tab Skincare ── */}
        {tab === 'skincare' && (
          <div>
            {skincare.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                <div style={{ fontSize: 14 }}>Nenhum produto adicionado</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Registre seus produtos e rotina de skincare</div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                {SK_STEPS.map(step => {
                  const stepProds = skincare.filter(p => p.step === step);
                  if (!stepProds.length) return null;
                  const meta = SK_STEP_META[step];
                  return (
                    <div key={step} style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 15 }}>{meta.emoji}</span>
                        <div className="section-label" style={{ margin: 0 }}>Rotina {step}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stepProds.map(prod => {
                          const expanded = expandedSk === prod.id;
                          return (
                            <div key={prod.id} className="card">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontSize: 16 }}>✨</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{prod.nome}</div>
                                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                                    <span className="tag" style={{ background: meta.bg, color: meta.color }}>{prod.step}</span>
                                    <span className="tag">{prod.tipo}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setExpandedSk(expanded ? null : prod.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}
                                >
                                  <Icon name="chevronDown" size={16} color="var(--text3)" />
                                </button>
                                <button onClick={() => { saveSkincare(sk => sk.filter(s => s.id !== prod.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                                  <Icon name="trash" size={14} />
                                </button>
                              </div>
                              {expanded && (prod.paraQue || prod.comoUsar) && (
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                                  {prod.paraQue && (
                                    <div style={{ marginBottom: 10 }}>
                                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 5 }}>Para que serve</div>
                                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{prod.paraQue}</div>
                                    </div>
                                  )}
                                  {prod.comoUsar && (
                                    <div>
                                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 5 }}>Como usar</div>
                                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{prod.comoUsar}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowSkModal(true)}>
              <Icon name="plus" size={16} /> Adicionar produto
            </button>
          </div>
        )}
      </div>

      {/* Modal Capilar */}
      <Modal open={showCapModal} onClose={() => setShowCapModal(false)} title="Novo produto capilar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do produto" value={capForm.nome} onChange={e => setCapForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <select className="input" value={capForm.funcao} onChange={e => setCapForm(f => ({ ...f, funcao: e.target.value }))}>
            {Object.keys(FUNCAO_CORES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Dias de uso (opcional)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIAS.map((d, i) => (
                <button key={i} onClick={() => setCapForm(f => ({ ...f, dias: f.dias.includes(i) ? f.dias.filter(x => x !== i) : [...f.dias, i] }))} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${capForm.dias.includes(i) ? 'var(--accent)' : 'var(--line)'}`, background: capForm.dias.includes(i) ? 'var(--accent-bg)' : 'var(--surface)', color: capForm.dias.includes(i) ? 'var(--accent-dk)' : 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600 }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={addCapilar}>Adicionar</button>
        </div>
      </Modal>

      {/* Modal Skincare */}
      <Modal open={showSkModal} onClose={() => setShowSkModal(false)} title="Novo produto skincare">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do produto" value={skForm.nome} onChange={e => setSkForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select className="input" value={skForm.tipo} onChange={e => setSkForm(f => ({ ...f, tipo: e.target.value }))}>
              {SK_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="input" value={skForm.step} onChange={e => setSkForm(f => ({ ...f, step: e.target.value }))}>
              {SK_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea className="input" placeholder="Para que serve? (benefícios, tipo de pele…)" value={skForm.paraQue} onChange={e => setSkForm(f => ({ ...f, paraQue: e.target.value }))} rows={3} style={{ resize: 'none' }} />
          <textarea className="input" placeholder="Como usar? (quantidade, frequência, como aplicar…)" value={skForm.comoUsar} onChange={e => setSkForm(f => ({ ...f, comoUsar: e.target.value }))} rows={3} style={{ resize: 'none' }} />
          <button className="btn-primary" onClick={addSkincare}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Autocuidados;
