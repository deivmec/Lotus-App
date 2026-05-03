import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

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
  { id: 'cafe',    label: 'Café da manhã', emoji: '☕', color: 'oklch(96% 0.04 80)', textColor: 'oklch(48% 0.1 80)' },
  { id: 'almoco',  label: 'Almoço',        emoji: '🥗', color: 'var(--green-bg)',    textColor: 'var(--green)' },
  { id: 'lanche',  label: 'Lanche',        emoji: '🍎', color: 'var(--accent-bg)',   textColor: 'var(--accent-dk)' },
  { id: 'jantar',  label: 'Jantar',        emoji: '🍽️', color: 'var(--blue-bg)',     textColor: 'var(--blue)' },
];

const TODAY_ID = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][new Date().getDay()];

const DEFAULT_PLAN = Object.fromEntries(
  DIAS.map(d => [d.id, { cafe: '', almoco: '', lanche: '', jantar: '' }])
);

const CronogramaAlimentar = ({ onBack }) => {
  const [plano, savePlano] = useStorage('cronograma:refeicoes', DEFAULT_PLAN);
  const [editModal, setEditModal] = useState(null); // {dia, refeicao, label}
  const [editVal, setEditVal] = useState('');
  const [openDay, setOpenDay] = useState(TODAY_ID);
  const toast = useToast();

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
    const source = plano[fromId] || {};
    savePlano(p => ({ ...p, [toId]: { ...source } }));
    toast('Dia copiado');
  };

  const filledCount = (diaId) => {
    const d = plano[diaId] || {};
    return REFEICOES.filter(r => d[r.id]).length;
  };

  return (
    <div className="screen">
      <BackHeader title="Cronograma Alimentar" onBack={onBack} />
      <div style={{ padding: '0 24px 32px' }}>

        {/* resumo da semana */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
          {DIAS.map(dia => {
            const count = filledCount(dia.id);
            const isToday = dia.id === TODAY_ID;
            const isOpen = openDay === dia.id;
            return (
              <button
                key={dia.id}
                onClick={() => setOpenDay(isOpen ? null : dia.id)}
                style={{
                  flex: '0 0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 10px',
                  borderRadius: 'var(--r)',
                  border: `1.5px solid ${isOpen ? 'var(--accent)' : isToday ? 'var(--line)' : 'transparent'}`,
                  background: isOpen ? 'var(--accent-bg)' : isToday ? 'var(--bg2)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 600, color: isOpen ? 'var(--accent-dk)' : isToday ? 'var(--accent)' : 'var(--text3)', letterSpacing: '0.04em' }}>
                  {dia.short}
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {REFEICOES.map((r, i) => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: (plano[dia.id]?.[r.id]) ? 'var(--accent)' : 'var(--line)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 9, color: isOpen ? 'var(--accent-dk)' : 'var(--text3)' }}>{count}/4</span>
              </button>
            );
          })}
        </div>

        {/* dia expandido */}
        {DIAS.filter(d => openDay === null || d.id === openDay).map(dia => {
          if (openDay && dia.id !== openDay) return null;
          const isToday = dia.id === TODAY_ID;
          const diaPlano = plano[dia.id] || {};

          return (
            <div key={dia.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>{dia.label}</div>
                  {isToday && (
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--accent-bg)', color: 'var(--accent-dk)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>HOJE</span>
                  )}
                </div>
                <button
                  onClick={() => clearDay(dia.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--sans)', padding: 4 }}
                >
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        background: hasValue ? ref.color : 'white',
                        border: `1px solid ${hasValue ? 'transparent' : 'var(--line)'}`,
                        borderRadius: 'var(--r)',
                        cursor: 'pointer',
                        fontFamily: 'var(--sans)',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                        width: '100%',
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{ref.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: hasValue ? ref.textColor : 'var(--text3)', marginBottom: hasValue ? 2 : 0 }}>
                          {ref.label}
                        </div>
                        {hasValue ? (
                          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{valor}</div>
                        ) : (
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>Toque para adicionar…</div>
                        )}
                      </div>
                      <Icon name={hasValue ? 'edit' : 'plus'} size={14} color={hasValue ? ref.textColor : 'var(--text3)'} />
                    </button>
                  );
                })}
              </div>

              {/* copiar para outro dia */}
              {filledCount(dia.id) > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Copiar este dia para:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {DIAS.filter(d => d.id !== dia.id).map(d => (
                      <button
                        key={d.id}
                        onClick={() => copyDay(dia.id, d.id)}
                        style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 500 }}
                      >
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* botão ver semana completa */}
        {openDay && (
          <button
            onClick={() => setOpenDay(null)}
            style={{ width: '100%', padding: '12px', marginTop: 8, borderRadius: 'var(--r)', border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}
          >
            Ver semana completa
          </button>
        )}
      </div>

      {/* Modal de edição */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={editModal ? `${editModal.emoji} ${editModal.label}` : ''}
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditVal(''); savePlano(p => ({ ...p, [editModal.dia]: { ...(p[editModal.dia] || {}), [editModal.ref]: '' } })); setEditModal(null); toast('Limpo'); }}
              style={{ flex: 1, padding: '12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'white', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13 }}
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
            rows={4}
            style={{ resize: 'none' }}
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) saveEdit(); }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CronogramaAlimentar;
