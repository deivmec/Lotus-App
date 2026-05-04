import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const today = new Date().toISOString().slice(0, 10);
const newId = () => Date.now().toString();

const CATS_DEFAULT = [
  { id: 'moradia',      name: 'Moradia',      icon: 'home',       limit: 2000, color: 'var(--accent)' },
  { id: 'alimentacao',  name: 'Alimentação',  icon: 'utensils',   limit: 800,  color: 'var(--green)' },
  { id: 'transporte',   name: 'Transporte',   icon: 'car',        limit: 400,  color: 'var(--blue)' },
  { id: 'saude',        name: 'Saúde',        icon: 'heart',      limit: 500,  color: 'oklch(55% 0.12 15)' },
  { id: 'lazer',        name: 'Lazer',        icon: 'film',       limit: 300,  color: 'oklch(62% 0.09 280)' },
  { id: 'educacao',     name: 'Educação',     icon: 'book',       limit: 300,  color: 'oklch(62% 0.09 180)' },
  { id: 'outros',       name: 'Outros',       icon: 'layers',     limit: 300,  color: 'var(--text3)' },
];

const GOAL_COLORS = [
  '#4CAF85', '#5B9BD5', '#C4704A', '#9B76C4', '#E06060', '#E0A840',
];

const TABS = [
  { id: 'resumo',     label: 'Resumo' },
  { id: 'economias',  label: 'Economias' },
  { id: 'planejados', label: 'Planejados' },
];

const fmtMoney = (v) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const curMonth = today.slice(0, 7);

const Financas = ({ onBack }) => {
  const [tab, setTab] = useState('resumo');
  const [transactions, saveTransactions] = useStorage('financas:transacoes', []);
  const [cats] = useStorage('financas:categorias', CATS_DEFAULT);
  const [planejados, savePlanejados] = useStorage('financas:planejados', []);
  const [objetivos, saveObjetivos] = useStorage('financas:objetivos', []);

  const [showModal, setShowModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDepModal, setGoalDepModal] = useState(null);
  const [openGoal, setOpenGoal] = useState(null);

  const [form, setForm] = useState({ desc: '', amount: '', category: 'alimentacao', date: today, type: 'expense' });
  const [planForm, setPlanForm] = useState({ desc: '', amount: '', dueDate: '', category: 'outros' });
  const [goalForm, setGoalForm] = useState({ name: '', emoji: '💰', color: '#4CAF85', target: '' });
  const [goalDepForm, setGoalDepForm] = useState({ valor: '', data: today, nota: '' });

  const toast = useToast();

  const monthTx = transactions.filter(t => t.date?.startsWith(curMonth));
  const totalExpense = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const catSpend = (catId) => monthTx.filter(t => t.amount < 0 && t.category === catId).reduce((s, t) => s + Math.abs(t.amount), 0);

  const addTransaction = () => {
    if (!form.desc || !form.amount) return;
    const amount = form.type === 'expense' ? -Math.abs(parseFloat(form.amount)) : Math.abs(parseFloat(form.amount));
    saveTransactions(ts => [{ id: newId(), desc: form.desc, amount, category: form.category, date: form.date, icon: form.category }, ...ts]);
    setForm({ desc: '', amount: '', category: 'alimentacao', date: today, type: 'expense' });
    setShowModal(false);
    toast('Lançamento adicionado');
  };
  const delTx = (id) => { saveTransactions(ts => ts.filter(t => t.id !== id)); toast('Removido'); };

  const addObjetivo = () => {
    if (!goalForm.name.trim() || !goalForm.target) return;
    saveObjetivos(os => [...os, { id: newId(), ...goalForm, target: parseFloat(goalForm.target), current: 0, deposits: [] }]);
    setGoalForm({ name: '', emoji: '💰', color: '#4CAF85', target: '' });
    setShowGoalModal(false);
    toast('Objetivo criado');
  };

  const addGoalDeposit = (goalId) => {
    if (!goalDepForm.valor) return;
    const valor = parseFloat(goalDepForm.valor);
    saveObjetivos(os => os.map(o => o.id === goalId
      ? { ...o, current: (o.current || 0) + valor, deposits: [{ id: newId(), ...goalDepForm, valor }, ...(o.deposits || [])] }
      : o
    ));
    setGoalDepForm({ valor: '', data: today, nota: '' });
    setGoalDepModal(null);
    toast('Depósito registrado');
  };

  const delGoalDeposit = (goalId, depId, valor) => {
    saveObjetivos(os => os.map(o => o.id === goalId
      ? { ...o, current: Math.max(0, (o.current || 0) - valor), deposits: (o.deposits || []).filter(d => d.id !== depId) }
      : o
    ));
    toast('Removido');
  };

  const delObjetivo = (id) => { saveObjetivos(os => os.filter(o => o.id !== id)); setOpenGoal(null); toast('Objetivo removido'); };

  const addPlanned = () => {
    if (!planForm.desc || !planForm.amount) return;
    savePlanejados(p => [...p, { id: newId(), ...planForm, amount: parseFloat(planForm.amount), paid: false }]);
    setPlanForm({ desc: '', amount: '', dueDate: '', category: 'outros' });
    setShowPlanModal(false);
    toast('Gasto planejado adicionado');
  };
  const togglePaid = (id) => savePlanejados(p => p.map(x => x.id === id ? { ...x, paid: !x.paid } : x));
  const delPlanned = (id) => { savePlanejados(p => p.filter(x => x.id !== id)); toast('Removido'); };

  const pendingTotal = planejados.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
  const totalEconomizado = objetivos.reduce((s, o) => s + (o.current || 0), 0);

  const activeGoal = objetivos.find(o => o.id === goalDepModal);

  return (
    <div className="screen">
      <BackHeader title="Finanças" subtitle={curMonth} onBack={onBack}
        action={<button onClick={() => {
          if (tab === 'resumo') setShowModal(true);
          else if (tab === 'economias') setShowGoalModal(true);
          else setShowPlanModal(true);
        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
          <Icon name="plus" size={20} />
        </button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Resumo ── */}
        {tab === 'resumo' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Receitas</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--green)' }}>{fmtMoney(totalIncome)}</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Gastos</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--red)' }}>{fmtMoney(totalExpense)}</div>
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>Saldo do mês</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: balance >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoney(balance)}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className="section-label">Categorias</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {cats.map((cat, i) => {
                  const spent = catSpend(cat.id);
                  const pct = cat.limit ? Math.min(100, (spent / cat.limit) * 100) : 0;
                  const over = spent > cat.limit;
                  return (
                    <div key={cat.id} style={{ padding: '14px 16px', borderBottom: i < cats.length - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Icon name={cat.icon} size={16} color={cat.color} />
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{cat.name}</div>
                        <div style={{ fontSize: 12, color: over ? 'var(--red)' : 'var(--text2)' }}>{fmtMoney(spent)} / {fmtMoney(cat.limit)}</div>
                      </div>
                      <ProgressBar value={pct} color={over ? 'var(--red)' : cat.color} height={4} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div className="section-label">Lançamentos do mês</div>
              {monthTx.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 14 }}>Nenhum lançamento este mês</div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {monthTx.slice(0, 15).map((tx, i) => (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < Math.min(monthTx.length, 15) - 1 ? '1px solid var(--line)' : 'none' }}>
                      <div style={{ width: 36, height: 36, background: 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={tx.icon || 'wallet'} size={16} color="var(--text2)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.desc}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{tx.date}</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: tx.amount >= 0 ? 'var(--green)' : 'var(--red)', flexShrink: 0 }}>
                        {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
                      </span>
                      <button onClick={() => delTx(tx.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn-add" onClick={() => setShowModal(true)}>
              <Icon name="plus" size={16} /> Adicionar lançamento
            </button>
          </div>
        )}

        {/* ── Economias / Objetivos ── */}
        {tab === 'economias' && (
          <div>
            {objetivos.length > 0 && (
              <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Total economizado</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--green)' }}>{fmtMoney(totalEconomizado)}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{objetivos.length} objetivo{objetivos.length !== 1 ? 's' : ''}</div>
              </div>
            )}

            {objetivos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>Nenhum objetivo ainda</div>
                <div style={{ fontSize: 12 }}>Crie metas para guardar dinheiro</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {objetivos.map(obj => {
                  const isOpen = openGoal === obj.id;
                  const pct = obj.target ? Math.min(100, ((obj.current || 0) / obj.target) * 100) : 0;
                  const falta = Math.max(0, obj.target - (obj.current || 0));
                  return (
                    <div key={obj.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      {/* Header do objetivo */}
                      <button
                        onClick={() => setOpenGoal(isOpen ? null : obj.id)}
                        style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: obj.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                            {obj.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{obj.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                              {fmtMoney(obj.current || 0)} de {fmtMoney(obj.target)}
                              {pct >= 100 ? ' · ✅ Concluído!' : ` · faltam ${fmtMoney(falta)}`}
                            </div>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: obj.color, flexShrink: 0 }}>{Math.round(pct)}%</div>
                        </div>
                        <ProgressBar value={pct} color={obj.color} height={5} />
                      </button>

                      {/* Depósitos expandidos */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid var(--line)', padding: '12px 16px' }}>
                          <button
                            onClick={() => { setGoalDepModal(obj.id); setGoalDepForm({ valor: '', data: today, nota: '' }); }}
                            style={{ width: '100%', padding: '10px', borderRadius: 'var(--r-sm)', border: `1.5px solid ${obj.color}`, background: obj.color + '15', color: obj.color, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            <Icon name="plus" size={14} color={obj.color} /> Registrar depósito
                          </button>

                          {(obj.deposits || []).length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 12 }}>
                              {(obj.deposits || []).slice(0, 5).map(dep => (
                                <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{dep.nota || 'Depósito'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{dep.data}</div>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)' }}>+{fmtMoney(dep.valor)}</span>
                                  <button onClick={() => delGoalDeposit(obj.id, dep.id, dep.valor)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
                                    <Icon name="trash" size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            onClick={() => delObjetivo(obj.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Icon name="trash" size={12} color="var(--red)" /> Remover objetivo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button className="btn-add" onClick={() => setShowGoalModal(true)}>
              <Icon name="plus" size={16} /> Novo objetivo
            </button>
          </div>
        )}

        {/* ── Planejados ── */}
        {tab === 'planejados' && (
          <div>
            {planejados.length > 0 && (
              <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>Total pendente</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--red)' }}>{fmtMoney(pendingTotal)}</div>
              </div>
            )}
            {planejados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14 }}>Nenhum gasto planejado</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {[...planejados].sort((a, b) => a.dueDate > b.dueDate ? 1 : -1).map(item => (
                  <div key={item.id} className="card" style={{ opacity: item.paid ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => togglePaid(item.id)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: '1.5px solid', borderColor: item.paid ? 'var(--green)' : 'var(--line)', background: item.paid ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {item.paid && <Icon name="check" size={12} color="white" />}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: item.paid ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {item.dueDate && `Vence: ${item.dueDate}`}
                          {item.category && ` · ${cats.find(c => c.id === item.category)?.name || item.category}`}
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: item.paid ? 'var(--text3)' : 'var(--red)', flexShrink: 0 }}>{fmtMoney(item.amount)}</span>
                      <button onClick={() => delPlanned(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowPlanModal(true)}>
              <Icon name="plus" size={16} /> Adicionar gasto planejado
            </button>
          </div>
        )}
      </div>

      {/* Modal: novo lançamento */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo lançamento"
        footer={<button className="btn-primary" onClick={addTransaction}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['expense', 'income'].map(type => (
              <button key={type} onClick={() => setForm(f => ({ ...f, type }))} style={{ padding: '10px', borderRadius: 'var(--r-sm)', border: `1.5px solid ${form.type === type ? 'var(--accent)' : 'var(--line)'}`, background: form.type === type ? 'var(--accent-bg)' : 'white', color: form.type === type ? 'var(--accent-dk)' : 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>
                {type === 'expense' ? '↓ Gasto' : '↑ Receita'}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Descrição" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} autoFocus />
          <input className="input" type="number" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        </div>
      </Modal>

      {/* Modal: novo objetivo */}
      <Modal open={showGoalModal} onClose={() => setShowGoalModal(false)} title="Novo objetivo de poupança"
        footer={<button className="btn-primary" onClick={addObjetivo}>Criar objetivo</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="🎯" value={goalForm.emoji} onChange={e => setGoalForm(f => ({ ...f, emoji: e.target.value }))} style={{ width: 64 }} />
            <input className="input" placeholder="Ex: Viagem para Europa" value={goalForm.name} onChange={e => setGoalForm(f => ({ ...f, name: e.target.value }))} autoFocus style={{ flex: 1 }} />
          </div>
          <input className="input" type="number" placeholder="Valor da meta (R$)" value={goalForm.target} onChange={e => setGoalForm(f => ({ ...f, target: e.target.value }))} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Cor</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {GOAL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setGoalForm(f => ({ ...f, color }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: `3px solid ${goalForm.color === color ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s' }}
                />
              ))}
            </div>
          </div>
          {goalForm.name && (
            <div style={{ background: goalForm.color + '15', borderRadius: 'var(--r-sm)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{goalForm.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{goalForm.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Meta: {goalForm.target ? fmtMoney(parseFloat(goalForm.target)) : '—'}</div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: depósito em objetivo */}
      <Modal open={!!goalDepModal} onClose={() => setGoalDepModal(null)} title={activeGoal ? `Depositar em "${activeGoal.name}"` : 'Depositar'}
        footer={<button className="btn-primary" onClick={() => addGoalDeposit(goalDepModal)}>Registrar depósito</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" type="number" placeholder="Valor (R$)" value={goalDepForm.valor} onChange={e => setGoalDepForm(f => ({ ...f, valor: e.target.value }))} autoFocus />
          <input className="input" type="date" value={goalDepForm.data} onChange={e => setGoalDepForm(f => ({ ...f, data: e.target.value }))} />
          <input className="input" placeholder="Nota (opcional)" value={goalDepForm.nota} onChange={e => setGoalDepForm(f => ({ ...f, nota: e.target.value }))} />
        </div>
      </Modal>

      {/* Modal: gasto planejado */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="Gasto planejado"
        footer={<button className="btn-primary" onClick={addPlanned}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Descrição (ex: Aluguel)" value={planForm.desc} onChange={e => setPlanForm(f => ({ ...f, desc: e.target.value }))} autoFocus />
          <input className="input" type="number" placeholder="Valor (R$)" value={planForm.amount} onChange={e => setPlanForm(f => ({ ...f, amount: e.target.value }))} />
          <input className="input" type="date" value={planForm.dueDate} onChange={e => setPlanForm(f => ({ ...f, dueDate: e.target.value }))} />
          <select className="input" value={planForm.category} onChange={e => setPlanForm(f => ({ ...f, category: e.target.value }))}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Financas;
