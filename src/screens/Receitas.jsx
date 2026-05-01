import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Checkbox from '../components/Checkbox';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const CATS = ['todas', 'fit', 'salgado', 'doce', 'rápida'];

const TABS = [
  { id: 'receitas', label: 'Receitas' },
  { id: 'cardapio', label: 'Cardápio' },
];

// ── Cardápio constants ──
const DIAS = [
  { id: 'seg', label: 'Segunda-feira', short: 'Seg' },
  { id: 'ter', label: 'Terça-feira',   short: 'Ter' },
  { id: 'qua', label: 'Quarta-feira',  short: 'Qua' },
  { id: 'qui', label: 'Quinta-feira',  short: 'Qui' },
  { id: 'sex', label: 'Sexta-feira',   short: 'Sex' },
  { id: 'sab', label: 'Sábado',        short: 'Sáb' },
  { id: 'dom', label: 'Domingo',       short: 'Dom' },
];

const REFEICOES = [
  { id: 'cafe',   label: 'Café da manhã', emoji: '☕', color: 'oklch(96% 0.04 80)', textColor: 'oklch(48% 0.1 80)' },
  { id: 'almoco', label: 'Almoço',        emoji: '🥗', color: 'var(--green-bg)',    textColor: 'var(--green)' },
  { id: 'lanche', label: 'Lanche',        emoji: '🍎', color: 'var(--accent-bg)',   textColor: 'var(--accent-dk)' },
  { id: 'jantar', label: 'Jantar',        emoji: '🍽️', color: 'var(--blue-bg)',     textColor: 'var(--blue)' },
];

const TODAY_ID = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];

const DEFAULT_PLAN = Object.fromEntries(
  DIAS.map(d => [d.id, { cafe: '', almoco: '', lanche: '', jantar: '' }])
);

const Receitas = ({ onBack }) => {
  const [tab, setTab] = useState('receitas');

  // ── Receitas state ──
  const [recipes, saveRecipes] = useStorage('receitas:items', []);
  const [catFilter, setCatFilter] = useState('todas');
  const [open, setOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: '', cat: 'salgado', tempo: '', porcoes: '', ingredientes: '', preparo: '', tags: '' });

  // ── Cardápio state ──
  const [plano, savePlano] = useStorage('cronograma:refeicoes', DEFAULT_PLAN);
  const [editModal, setEditModal] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [openDay, setOpenDay] = useState(TODAY_ID);

  const toast = useToast();

  // ── Receitas functions ──
  const filtered = recipes.filter(r => catFilter === 'todas' || r.cat === catFilter || (r.tags || []).includes(catFilter));

  const addRecipe = () => {
    if (!form.nome.trim()) return;
    const ingredientes = form.ingredientes.split('\n').map(l => l.trim()).filter(Boolean).map(nome => ({ id: newId(), nome, done: false }));
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    saveRecipes(rs => [...rs, { id: newId(), ...form, ingredientes, tags }]);
    setForm({ nome: '', cat: 'salgado', tempo: '', porcoes: '', ingredientes: '', preparo: '', tags: '' });
    setShowModal(false);
    toast('Receita adicionada');
  };

  const toggleIngrediente = (recipeId, ingId) => {
    saveRecipes(rs => rs.map(r => r.id === recipeId
      ? { ...r, ingredientes: r.ingredientes.map(i => i.id === ingId ? { ...i, done: !i.done } : i) }
      : r
    ));
  };

  // ── Cardápio functions ──
  const openEdit = (dia, ref) => {
    const refeicao = REFEICOES.find(r => r.id === ref);
    setEditVal(plano[dia]?.[ref] || '');
    setEditModal({ dia, ref, label: refeicao.label, emoji: refeicao.emoji });
  };

  const saveEdit = () => {
    if (!editModal) return;
    const { dia, ref } = editModal;
    savePlano(p => ({ ...p, [dia]: { ...(p[dia] || {}), [ref]: editVal.trim() } }));
    setEditModal(null);
    toast('Salvo');
  };

  const clearDay = (diaId) => {
    savePlano(p => ({ ...p, [diaId]: { cafe: '', almoco: '', lanche: '', jantar: '' } }));
    toast('Dia limpo');
  };

  const copyDay = (fromId, toId) => {
    savePlano(p => ({ ...p, [toId]: { ...(plano[fromId] || {}) } }));
    toast('Dia copiado');
  };

  const filledCount = (diaId) => {
    const d = plano[diaId] || {};
    return REFEICOES.filter(r => d[r.id]).length;
  };

  return (
    <div className="screen">
      <BackHeader
        title="Receitas"
        onBack={onBack}
        action={tab === 'receitas' ? (
          <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
            <Icon name="plus" size={20} />
          </button>
        ) : null}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Tab: Receitas ── */}
        {tab === 'receitas' && (
          <div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${catFilter === c ? 'var(--accent)' : 'var(--line)'}`, background: catFilter === c ? 'var(--accent-bg)' : 'white', color: catFilter === c ? 'var(--accent-dk)' : 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {c}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
                <div style={{ fontSize: 14 }}>Nenhuma receita ainda</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(recipe => (
                  <div key={recipe.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setOpen(open === recipe.id ? null : recipe.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{recipe.nome}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
                          {recipe.tempo && `⏱ ${recipe.tempo}`} {recipe.porcoes && `· 🍽 ${recipe.porcoes} porções`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {(recipe.tags || []).slice(0, 2).map((t, i) => <span key={i} className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>{t}</span>)}
                        <Icon name="chevronDown" size={16} color="var(--text3)" />
                      </div>
                    </div>

                    {open === recipe.id && (
                      <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>
                        <div className="divider" style={{ marginBottom: 16 }} />
                        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Ingredientes</div>
                        {recipe.ingredientes?.map(ing => (
                          <div key={ing.id} style={{ marginBottom: 8 }}>
                            <Checkbox checked={ing.done} onToggle={() => toggleIngrediente(recipe.id, ing.id)}>{ing.nome}</Checkbox>
                          </div>
                        ))}
                        {recipe.preparo && (
                          <>
                            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', margin: '16px 0 10px' }}>Modo de preparo</div>
                            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{recipe.preparo}</div>
                          </>
                        )}
                        <button onClick={() => { saveRecipes(rs => rs.filter(r => r.id !== recipe.id)); setOpen(null); toast('Removida'); }} style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="trash" size={14} color="var(--red)" /> Remover receita
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={16} /> Adicionar receita
            </button>
          </div>
        )}

        {/* ── Tab: Cardápio ── */}
        {tab === 'cardapio' && (
          <div>
            {/* seletor de dia */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
              {DIAS.map(dia => {
                const count = filledCount(dia.id);
                const isToday = dia.id === TODAY_ID;
                const isOpen = openDay === dia.id;
                return (
                  <button
                    key={dia.id}
                    onClick={() => setOpenDay(isOpen ? null : dia.id)}
                    style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 10px', borderRadius: 'var(--r)', border: `1.5px solid ${isOpen ? 'var(--accent)' : isToday ? 'var(--line)' : 'transparent'}`, background: isOpen ? 'var(--accent-bg)' : isToday ? 'var(--bg2)' : 'transparent', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: isOpen ? 'var(--accent-dk)' : isToday ? 'var(--accent)' : 'var(--text3)', letterSpacing: '0.04em' }}>{dia.short}</span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {REFEICOES.map((r, i) => (
                        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: plano[dia.id]?.[r.id] ? 'var(--accent)' : 'var(--line)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 9, color: isOpen ? 'var(--accent-dk)' : 'var(--text3)' }}>{count}/4</span>
                  </button>
                );
              })}
            </div>

            {/* dia(s) expandido(s) */}
            {DIAS.filter(d => !openDay || d.id === openDay).map(dia => {
              const isToday = dia.id === TODAY_ID;
              const diaPlano = plano[dia.id] || {};
              return (
                <div key={dia.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>{dia.label}</div>
                      {isToday && <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-bg)', color: 'var(--accent-dk)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>HOJE</span>}
                    </div>
                    <button onClick={() => clearDay(dia.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--sans)', padding: 4 }}>
                      Limpar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {REFEICOES.map(ref => {
                      const valor = diaPlano[ref.id] || '';
                      const hasValue = !!valor;
                      return (
                        <button
                          key={ref.id}
                          onClick={() => openEdit(dia.id, ref.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: hasValue ? ref.color : 'white', border: `1px solid ${hasValue ? 'transparent' : 'var(--line)'}`, borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'background 0.15s', width: '100%' }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{ref.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: hasValue ? ref.textColor : 'var(--text3)', marginBottom: hasValue ? 2 : 0 }}>{ref.label}</div>
                            {hasValue
                              ? <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{valor}</div>
                              : <div style={{ fontSize: 12, color: 'var(--text3)' }}>Toque para adicionar…</div>
                            }
                          </div>
                          <Icon name={hasValue ? 'edit' : 'plus'} size={14} color={hasValue ? ref.textColor : 'var(--text3)'} />
                        </button>
                      );
                    })}
                  </div>

                  {filledCount(dia.id) > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Copiar este dia para:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {DIAS.filter(d => d.id !== dia.id).map(d => (
                          <button key={d.id} onClick={() => copyDay(dia.id, d.id)} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500 }}>
                            {d.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {openDay && (
              <button onClick={() => setOpenDay(null)} style={{ width: '100%', padding: '12px', marginTop: 8, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>
                Ver semana completa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: nova receita */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova receita">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome da receita" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select className="input" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
              <option value="fit">Fit</option>
              <option value="salgado">Salgada</option>
              <option value="doce">Doce</option>
              <option value="rápida">Rápida</option>
            </select>
            <input className="input" placeholder="Tempo (ex: 30min)" value={form.tempo} onChange={e => setForm(f => ({ ...f, tempo: e.target.value }))} />
          </div>
          <input className="input" placeholder="Porções (ex: 4)" value={form.porcoes} onChange={e => setForm(f => ({ ...f, porcoes: e.target.value }))} />
          <textarea className="input" placeholder="Ingredientes (um por linha)" value={form.ingredientes} onChange={e => setForm(f => ({ ...f, ingredientes: e.target.value }))} rows={5} style={{ resize: 'none' }} />
          <textarea className="input" placeholder="Modo de preparo" value={form.preparo} onChange={e => setForm(f => ({ ...f, preparo: e.target.value }))} rows={4} style={{ resize: 'none' }} />
          <input className="input" placeholder="Tags (ex: rápida, fit)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          <button className="btn-primary" onClick={addRecipe}>Adicionar receita</button>
        </div>
      </Modal>

      {/* Modal: editar refeição do cardápio */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={editModal ? `${editModal.emoji} ${editModal.label}` : ''}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="input"
            placeholder={`O que vai comer no ${editModal?.label?.toLowerCase()}?`}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            rows={4}
            style={{ resize: 'none' }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveEdit(); }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditVal(''); savePlano(p => ({ ...p, [editModal.dia]: { ...(p[editModal.dia] || {}), [editModal.ref]: '' } })); setEditModal(null); toast('Limpo'); }}
              style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13 }}
            >
              Limpar
            </button>
            <button className="btn-primary" onClick={saveEdit} style={{ flex: 2 }}>Salvar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Receitas;
