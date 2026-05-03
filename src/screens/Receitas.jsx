import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const CATS = ['todas', 'fit', 'salgado', 'doce', 'rápida'];

const TABS = [
  { id: 'receitas',    label: 'Receitas' },
  { id: 'cardapio',    label: 'Cardápio' },
  { id: 'alimentacao', label: 'Alimentação' },
];

const POSTIT = [
  { id: 'yellow', light: '#FEF9C3', dark: '#3A3000', border: '#FCD34D' },
  { id: 'green',  light: '#DCFCE7', dark: '#052E1A', border: '#6EE7B7' },
  { id: 'blue',   light: '#DBEAFE', dark: '#0C1A3A', border: '#93C5FD' },
  { id: 'pink',   light: '#FCE7F3', dark: '#3B0A28', border: '#F9A8D4' },
  { id: 'purple', light: '#EDE9FE', dark: '#2A1A5A', border: '#C4B5FD' },
  { id: 'peach',  light: '#FFEDD5', dark: '#431407', border: '#FDBA74' },
  { id: 'mint',   light: '#CCFBF1', dark: '#042F2E', border: '#5EEAD4' },
];

const DEFAULT_COLOR = 'yellow';

const getPostitStyle = (colorId) => {
  const c = POSTIT.find(p => p.id === colorId) || POSTIT[0];
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    bg:     dark ? c.dark   : c.light,
    border: dark ? c.border + '40' : c.border,
  };
};

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
  { id: 'cafe',   label: 'Café da manhã', emoji: '☕', colorId: 'yellow' },
  { id: 'almoco', label: 'Almoço',        emoji: '🥗', colorId: 'green' },
  { id: 'lanche', label: 'Lanche',        emoji: '🍎', colorId: 'peach' },
  { id: 'jantar', label: 'Jantar',        emoji: '🍽️', colorId: 'blue' },
];

const TODAY_ID = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];

const DEFAULT_PLAN = Object.fromEntries(
  DIAS.map(d => [d.id, { cafe: '', almoco: '', lanche: '', jantar: '' }])
);

const Receitas = ({ onBack }) => {
  const [tab, setTab] = useState('receitas');

  const [recipes, saveRecipes] = useStorage('receitas:items', []);
  const [catFilter, setCatFilter] = useState('todas');
  const [open, setOpen] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nome: '', cat: 'salgado', color: DEFAULT_COLOR, tempo: '', porcoes: '', calorias: '', ingredientes: '', preparo: '', tags: '' });

  const [plano, savePlano] = useStorage('cronograma:refeicoes', DEFAULT_PLAN);
  const [editModal, setEditModal] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [editCal, setEditCal] = useState('');
  const [openDay, setOpenDay] = useState(TODAY_ID);

  // ── Alimentação ──
  const [alimentacao, saveAlimentacao] = useStorage('alimentacao:items', []);
  const [showAlimModal, setShowAlimModal] = useState(false);
  const [alimForm, setAlimForm] = useState({ date: new Date().toISOString().slice(0,10), refeicao: 'café da manhã', alimento: '', porcao: '', calorias: '' });

  const toast = useToast();

  const filtered = recipes.filter(r => catFilter === 'todas' || r.cat === catFilter || (r.tags || []).includes(catFilter));

  const openRecipeEdit = (recipe) => {
    setForm({
      nome: recipe.nome,
      cat: recipe.cat,
      color: recipe.color || DEFAULT_COLOR,
      tempo: recipe.tempo || '',
      porcoes: recipe.porcoes || '',
      calorias: recipe.calorias || '',
      ingredientes: (recipe.ingredientes || []).map(i => i.nome).join('\n'),
      preparo: recipe.preparo || '',
      tags: (recipe.tags || []).join(', '),
    });
    setEditingId(recipe.id);
    setShowModal(true);
  };

  const addRecipe = () => {
    if (!form.nome.trim()) return;
    const ingredientes = form.ingredientes.split('\n').map(l => l.trim()).filter(Boolean).map(nome => ({ id: newId(), nome, done: false }));
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingId) {
      saveRecipes(rs => rs.map(r => r.id === editingId ? { ...r, ...form, ingredientes, tags } : r));
      toast('Receita atualizada');
    } else {
      saveRecipes(rs => [...rs, { id: newId(), ...form, ingredientes, tags }]);
      toast('Receita adicionada');
    }
    setForm({ nome: '', cat: 'salgado', color: DEFAULT_COLOR, tempo: '', porcoes: '', calorias: '', ingredientes: '', preparo: '', tags: '' });
    setEditingId(null);
    setShowModal(false);
  };

  const toggleIngrediente = (recipeId, ingId) => {
    saveRecipes(rs => rs.map(r => r.id === recipeId
      ? { ...r, ingredientes: r.ingredientes.map(i => i.id === ingId ? { ...i, done: !i.done } : i) }
      : r
    ));
  };

  const openEdit = (dia, ref) => {
    const refeicao = REFEICOES.find(r => r.id === ref);
    const slot = plano[dia]?.[ref];
    setEditVal(typeof slot === 'object' ? slot.texto || '' : slot || '');
    setEditCal(typeof slot === 'object' ? slot.calorias || '' : '');
    setEditModal({ dia, ref, label: refeicao.label, emoji: refeicao.emoji, colorId: refeicao.colorId });
  };

  const saveEdit = () => {
    if (!editModal) return;
    const val = editVal.trim() ? { texto: editVal.trim(), calorias: editCal.trim() } : '';
    savePlano(p => ({ ...p, [editModal.dia]: { ...(p[editModal.dia] || {}), [editModal.ref]: val } }));
    setEditModal(null);
    toast('Salvo');
  };

  const getSlotText = (slot) => typeof slot === 'object' ? slot?.texto || '' : slot || '';
  const getSlotCal  = (slot) => typeof slot === 'object' ? slot?.calorias || '' : '';

  const addAlimento = () => {
    if (!alimForm.alimento.trim()) return;
    saveAlimentacao(items => [...items, { id: newId(), ...alimForm }]);
    setAlimForm(f => ({ ...f, alimento: '', porcao: '', calorias: '' }));
    setShowAlimModal(false);
    toast('Adicionado');
  };

  const clearDay = (diaId) => {
    savePlano(p => ({ ...p, [diaId]: { cafe: '', almoco: '', lanche: '', jantar: '' } }));
    toast('Dia limpo');
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
            {/* Filtros de categoria */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: `1.5px solid ${catFilter === c ? 'var(--accent)' : 'var(--line)'}`,
                  background: catFilter === c ? 'var(--accent-bg)' : 'var(--surface)',
                  color: catFilter === c ? 'var(--accent-dk)' : 'var(--text2)',
                  cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500,
                  whiteSpace: 'nowrap', textTransform: 'capitalize',
                }}>
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
              <div style={{ columns: 2, columnGap: 10, marginBottom: 16 }}>
                {filtered.map(recipe => {
                  const ps = getPostitStyle(recipe.color || DEFAULT_COLOR);
                  const isOpen = open === recipe.id;
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => setOpen(isOpen ? null : recipe.id)}
                      style={{
                        breakInside: 'avoid',
                        marginBottom: 10,
                        background: ps.bg,
                        border: `1.5px solid ${ps.border}`,
                        borderRadius: 'var(--r)',
                        padding: '14px 12px 12px',
                        cursor: 'pointer',
                        boxShadow: '2px 3px 8px rgba(0,0,0,0.08)',
                        position: 'relative',
                        transition: 'box-shadow 0.15s',
                      }}
                    >
                      {/* Linha decorativa no topo (post-it fold) */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: ps.border, borderRadius: '8px 8px 0 0' }} />

                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3, marginBottom: 6 }}>
                        {recipe.nome}
                      </div>

                      {(recipe.tempo || recipe.porcoes || recipe.calorias) && (
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {recipe.tempo && <span>⏱ {recipe.tempo}</span>}
                          {recipe.porcoes && <span>🍽 {recipe.porcoes}p</span>}
                          {recipe.calorias && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>🔥 {recipe.calorias} kcal</span>}
                        </div>
                      )}

                      {recipe.cat && (
                        <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,0,0,0.08)', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                          {recipe.cat}
                        </span>
                      )}

                      {/* Preview dos ingredientes */}
                      {!isOpen && recipe.ingredientes?.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                          {recipe.ingredientes.slice(0, 3).map(i => i.nome).join(', ')}
                          {recipe.ingredientes.length > 3 && ` +${recipe.ingredientes.length - 3}`}
                        </div>
                      )}

                      {/* Conteúdo expandido */}
                      {isOpen && (
                        <div onClick={e => e.stopPropagation()}>
                          <div style={{ height: 1, background: 'rgba(0,0,0,0.1)', margin: '10px 0' }} />

                          {recipe.ingredientes?.length > 0 && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10 }}>Ingredientes</div>
                              {recipe.ingredientes.map(ing => (
                                <div
                                  key={ing.id}
                                  onClick={() => toggleIngrediente(recipe.id, ing.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, cursor: 'pointer' }}
                                >
                                  <div style={{
                                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                    border: `2px solid ${ing.done ? ps.border : 'rgba(0,0,0,0.22)'}`,
                                    background: ing.done ? ps.border : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.18s',
                                    boxShadow: ing.done ? `0 0 0 3px ${ps.border}30` : 'none',
                                  }}>
                                    {ing.done && (
                                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.8 7L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    )}
                                  </div>
                                  <span style={{
                                    fontSize: 12, lineHeight: 1.45, flex: 1,
                                    color: ing.done ? 'rgba(0,0,0,0.3)' : 'var(--text)',
                                    textDecoration: ing.done ? 'line-through' : 'none',
                                    transition: 'all 0.18s',
                                  }}>
                                    {ing.nome}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}

                          {recipe.preparo && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', margin: '12px 0 8px' }}>Modo de preparo</div>
                              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{recipe.preparo}</div>
                            </>
                          )}

                          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <button
                              onClick={() => openRecipeEdit(recipe)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <Icon name="edit" size={13} color="var(--accent)" /> Editar
                            </button>
                            <button
                              onClick={() => { saveRecipes(rs => rs.filter(r => r.id !== recipe.id)); setOpen(null); toast('Removida'); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <Icon name="trash" size={13} color="var(--red)" /> Remover
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                      const slot = diaPlano[ref.id];
                      const texto = getSlotText(slot);
                      const cal   = getSlotCal(slot);
                      const hasValue = !!texto;
                      const ps = getPostitStyle(ref.colorId);
                      return (
                        <button
                          key={ref.id}
                          onClick={() => openEdit(dia.id, ref.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                            background: hasValue ? ps.bg : 'var(--surface)',
                            border: `1px solid ${hasValue ? ps.border : 'var(--line)'}`,
                            borderRadius: 'var(--r)', cursor: 'pointer', fontFamily: 'var(--sans)',
                            textAlign: 'left', transition: 'background 0.15s', width: '100%',
                          }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{ref.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: hasValue ? 2 : 0 }}>{ref.label}</div>
                            {hasValue
                              ? <div>
                                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{texto}</div>
                                  {cal && <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>🔥 {cal} kcal</div>}
                                </div>
                              : <div style={{ fontSize: 12, color: 'var(--text3)' }}>Toque para adicionar…</div>
                            }
                          </div>
                          <Icon name={hasValue ? 'edit' : 'plus'} size={14} color="var(--text3)" />
                        </button>
                      );
                    })}
                  </div>

                  {filledCount(dia.id) > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Copiar este dia para:</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {DIAS.filter(d => d.id !== dia.id).map(d => (
                          <button key={d.id} onClick={() => { savePlano(p => ({ ...p, [d.id]: { ...(plano[dia.id] || {}) } })); toast('Dia copiado'); }} style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500 }}>
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
              <button onClick={() => setOpenDay(null)} style={{ width: '100%', padding: '12px', marginTop: 8, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>
                Ver semana completa
              </button>
            )}
          </div>
        )}
        {/* ── Tab: Alimentação ── */}
        {tab === 'alimentacao' && (() => {
          const todayStr = new Date().toISOString().slice(0,10);
          const todayItems = alimentacao.filter(i => i.date === todayStr);
          const totalCal = todayItems.reduce((s, i) => s + (parseFloat(i.calorias) || 0), 0);
          const grouped = {};
          alimentacao.forEach(item => {
            if (!grouped[item.date]) grouped[item.date] = [];
            grouped[item.date].push(item);
          });
          const dates = Object.keys(grouped).sort().reverse();
          return (
            <div>
              {/* Hoje */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div className="section-label" style={{ margin: 0 }}>Hoje</div>
                  {totalCal > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>🔥 {Math.round(totalCal)} kcal</span>
                  )}
                </div>
                {todayItems.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '12px 0' }}>Nenhum alimento registrado hoje</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {todayItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{item.alimento}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                            {item.refeicao}{item.porcao ? ` · ${item.porcao}` : ''}{item.calorias ? ` · 🔥 ${item.calorias} kcal` : ''}
                          </div>
                        </div>
                        <button onClick={() => { saveAlimentacao(a => a.filter(x => x.id !== item.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico por dia */}
              {dates.filter(d => d !== todayStr).length > 0 && (
                <div>
                  <div className="section-label">Histórico</div>
                  {dates.filter(d => d !== todayStr).slice(0, 7).map(date => {
                    const items = grouped[date];
                    const cal = items.reduce((s, i) => s + (parseFloat(i.calorias) || 0), 0);
                    return (
                      <div key={date} className="card" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{date}</span>
                          {cal > 0 && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>🔥 {Math.round(cal)} kcal</span>}
                        </div>
                        {items.map(item => (
                          <div key={item.id} style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 3 }}>
                            {item.refeicao}: {item.alimento}{item.porcao ? ` (${item.porcao})` : ''}{item.calorias ? ` · ${item.calorias} kcal` : ''}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="btn-add" onClick={() => setShowAlimModal(true)}>
                <Icon name="plus" size={16} /> Registrar alimento
              </button>
            </div>
          );
        })()}
      </div>

      {/* Modal: nova / editar receita */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null); setForm({ nome: '', cat: 'salgado', color: DEFAULT_COLOR, tempo: '', porcoes: '', calorias: '', ingredientes: '', preparo: '', tags: '' }); }} title={editingId ? 'Editar receita' : 'Nova receita'}
        footer={<button className="btn-primary" onClick={addRecipe}>{editingId ? 'Salvar alterações' : 'Adicionar receita'}</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome da receita" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />

          {/* Cor do post-it */}
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Cor do post-it</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {POSTIT.map(p => {
                const ps = getPostitStyle(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => setForm(f => ({ ...f, color: p.id }))}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: ps.bg,
                      border: `2.5px solid ${form.color === p.id ? 'var(--accent)' : ps.border}`,
                      cursor: 'pointer',
                      boxShadow: form.color === p.id ? '0 0 0 2px var(--accent)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select className="input" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
              <option value="fit">Fit</option>
              <option value="salgado">Salgada</option>
              <option value="doce">Doce</option>
              <option value="rápida">Rápida</option>
            </select>
            <input className="input" placeholder="Tempo (ex: 30min)" value={form.tempo} onChange={e => setForm(f => ({ ...f, tempo: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="input" placeholder="Porções (ex: 4)" value={form.porcoes} onChange={e => setForm(f => ({ ...f, porcoes: e.target.value }))} />
            <input className="input" type="number" placeholder="Calorias/porção" value={form.calorias} onChange={e => setForm(f => ({ ...f, calorias: e.target.value }))} />
          </div>
          <textarea className="input" placeholder="Ingredientes (um por linha)" value={form.ingredientes} onChange={e => setForm(f => ({ ...f, ingredientes: e.target.value }))} rows={5} style={{ resize: 'none' }} />
          <textarea className="input" placeholder="Modo de preparo" value={form.preparo} onChange={e => setForm(f => ({ ...f, preparo: e.target.value }))} rows={4} style={{ resize: 'none' }} />
          <input className="input" placeholder="Tags (ex: rápida, fit)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
        </div>
      </Modal>

      {/* Modal: editar refeição do cardápio */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={editModal ? `${editModal.emoji} ${editModal.label}` : ''}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditVal(''); setEditCal(''); savePlano(p => ({ ...p, [editModal.dia]: { ...(p[editModal.dia] || {}), [editModal.ref]: '' } })); setEditModal(null); toast('Limpo'); }}
              style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13 }}
            >
              Limpar
            </button>
            <button className="btn-primary" onClick={saveEdit} style={{ flex: 2 }}>Salvar</button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="input"
            placeholder={`O que vai comer no ${editModal?.label?.toLowerCase()}?`}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            rows={3}
            style={{ resize: 'none' }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveEdit(); }}
          />
          <input className="input" type="number" placeholder="Calorias (kcal) — opcional" value={editCal} onChange={e => setEditCal(e.target.value)} />
        </div>
      </Modal>

      {/* Modal: alimentação */}
      <Modal open={showAlimModal} onClose={() => setShowAlimModal(false)} title="Registrar alimento"
        footer={<button className="btn-primary" onClick={addAlimento}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" type="date" value={alimForm.date} max={new Date().toISOString().slice(0,10)} onChange={e => setAlimForm(f => ({ ...f, date: e.target.value }))} />
          <select className="input" value={alimForm.refeicao} onChange={e => setAlimForm(f => ({ ...f, refeicao: e.target.value }))}>
            <option value="café da manhã">☕ Café da manhã</option>
            <option value="lanche da manhã">🍎 Lanche da manhã</option>
            <option value="almoço">🥗 Almoço</option>
            <option value="lanche da tarde">🍌 Lanche da tarde</option>
            <option value="jantar">🍽️ Jantar</option>
            <option value="ceia">🌙 Ceia</option>
          </select>
          <input className="input" placeholder="Alimento (ex: arroz integral)" value={alimForm.alimento} onChange={e => setAlimForm(f => ({ ...f, alimento: e.target.value }))} autoFocus />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input className="input" placeholder="Porção (ex: 100g)" value={alimForm.porcao} onChange={e => setAlimForm(f => ({ ...f, porcao: e.target.value }))} />
            <input className="input" type="number" placeholder="Kcal" value={alimForm.calorias} onChange={e => setAlimForm(f => ({ ...f, calorias: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Receitas;
