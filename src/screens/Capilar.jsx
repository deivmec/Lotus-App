import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const today = new Date().toISOString().slice(0, 10);
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FUNCAO_CORES = {
  limpeza:      { bg: 'var(--blue-bg)',  color: 'var(--blue)' },
  hidratação:   { bg: 'oklch(96% 0.04 200)', color: 'oklch(48% 0.1 200)' },
  nutrição:     { bg: 'var(--accent-bg)', color: 'var(--accent-dk)' },
  reconstrução: { bg: 'var(--red-bg)',   color: 'var(--red)' },
  finalização:  { bg: 'var(--green-bg)', color: 'var(--green)' },
};

const Capilar = ({ onBack }) => {
  const [produtos, saveProdutos] = useStorage('capilar:produtos', []);
  const [logs, saveLogs] = useStorage('capilar:logs', {});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: '', funcao: 'hidratação', dias: [] });
  const toast = useToast();

  const addProduto = () => {
    if (!form.nome.trim()) return;
    saveProdutos(ps => [...ps, { id: newId(), ...form }]);
    setForm({ nome: '', funcao: 'hidratação', dias: [] });
    setShowModal(false);
    toast('Produto adicionado');
  };
  const delProduto = (id) => { saveProdutos(ps => ps.filter(p => p.id !== id)); toast('Removido'); };
  const toggleLog = (prodId) => {
    const key = `${prodId}:${today}`;
    saveLogs(l => ({ ...l, [key]: !l[key] }));
  };

  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), label: DIAS[d.getDay()], isToday: i === 0 });
    }
    return days;
  };
  const weekDays = getWeekDays();

  const todayDayOfWeek = new Date().getDay();

  const todayProdutos = produtos.filter(p => !p.dias?.length || p.dias.includes(todayDayOfWeek));
  const doneTodayCount = todayProdutos.filter(p => logs[`${p.id}:${today}`]).length;

  return (
    <div className="screen">
      <BackHeader title="Cronograma Capilar" onBack={onBack}
        action={<button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}><Icon name="plus" size={20} /></button>}
      />
      <div style={{ padding: '0 24px 32px' }}>

        {/* progresso hoje */}
        {todayProdutos.length > 0 && (
          <div className="card" style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>
              {doneTodayCount}/{todayProdutos.length}
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
          </div>
        ) : (
          <div>
            <div className="section-label">Produtos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {produtos.map(prod => {
                const fc = FUNCAO_CORES[prod.funcao] || { bg: 'var(--bg2)', color: 'var(--text3)' };
                const done = logs[`${prod.id}:${today}`];
                const isToday = !prod.dias?.length || prod.dias.includes(todayDayOfWeek);
                return (
                  <div key={prod.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: !isToday ? 0.5 : 1 }}>
                    <button onClick={isToday ? () => toggleLog(prod.id) : undefined} style={{
                      width: 36, height: 36, borderRadius: 10, border: '1.5px solid', borderColor: done ? 'var(--green)' : 'var(--line)',
                      background: done ? 'var(--green)' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isToday ? 'pointer' : 'default', flexShrink: 0,
                    }}>
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
                      {weekDays.map((d, i) => {
                        const k = `${prod.id}:${d.date}`;
                        return (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: logs[k] ? 'var(--green)' : d.isToday ? 'var(--line)' : 'var(--bg3)' }} />
                        );
                      })}
                    </div>
                    <button onClick={() => delProduto(prod.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button className="btn-add" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={16} />
          Adicionar produto
        </button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo produto"
        footer={<button className="btn-primary" onClick={addProduto}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do produto" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <select className="input" value={form.funcao} onChange={e => setForm(f => ({ ...f, funcao: e.target.value }))}>
            {Object.keys(FUNCAO_CORES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, marginBottom: 8 }}>Dias de uso (opcional)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DIAS.map((d, i) => (
                <button key={i} onClick={() => setForm(f => ({ ...f, dias: f.dias.includes(i) ? f.dias.filter(x => x !== i) : [...f.dias, i] }))} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${form.dias.includes(i) ? 'var(--accent)' : 'var(--line)'}`, background: form.dias.includes(i) ? 'var(--accent-bg)' : 'white', color: form.dias.includes(i) ? 'var(--accent-dk)' : 'var(--text3)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600 }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Capilar;
