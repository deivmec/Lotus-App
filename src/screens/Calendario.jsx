import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEK = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const CAT_COLORS = {
  pessoal:     'var(--accent)',
  trabalho:    'var(--blue)',
  saude:       'var(--green)',
  viagem:      'oklch(62% 0.09 60)',
  natal:       'oklch(55% 0.12 145)',
  aniversario: 'oklch(62% 0.12 350)',
};

const Sticker = ({ category, size = 16 }) => {
  const s = size;
  const style = { flexShrink: 0, display: 'block' };
  if (category === 'natal') return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <rect x="8.5" y="16" width="3" height="3.5" rx="0.5" fill="#8B6534"/>
      <polygon points="10,2 14.5,8.5 5.5,8.5" fill="#2E7D32"/>
      <polygon points="10,6 15.5,13 4.5,13" fill="#388E3C"/>
      <polygon points="10,10 16,18 4,18" fill="#43A047"/>
      <circle cx="10" cy="1.5" r="1.5" fill="#FDD835"/>
      <circle cx="8" cy="10.5" r="1" fill="#E53935"/>
      <circle cx="13" cy="12" r="0.8" fill="#FDD835"/>
      <circle cx="7" cy="14" r="0.8" fill="#1976D2"/>
    </svg>
  );
  if (category === 'trabalho') return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <rect x="2" y="8" width="16" height="10" rx="2" fill="#6D4C41"/>
      <path d="M7 8V6C7 5.45 7.45 5 8 5h4c.55 0 1 .45 1 1v2" stroke="#4E342E" strokeWidth="1.5" fill="none"/>
      <rect x="2" y="12" width="16" height="1" fill="#5D4037"/>
      <rect x="8.5" y="11" width="3" height="3" rx="0.5" fill="#8D6E63"/>
      <circle cx="10" cy="12.5" r="0.8" fill="#BCAAA4"/>
    </svg>
  );
  if (category === 'aniversario') return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <polygon points="10,2 4.5,16 15.5,16" fill="#E91E63"/>
      <line x1="7.5" y1="10" x2="10" y2="2" stroke="white" strokeWidth="0.8" strokeOpacity="0.4"/>
      <line x1="12.5" y1="10" x2="10" y2="2" stroke="white" strokeWidth="0.8" strokeOpacity="0.4"/>
      <ellipse cx="10" cy="16" rx="5.5" ry="1.8" fill="#F48FB1"/>
      <circle cx="10" cy="1.2" r="1.8" fill="#FFC107"/>
      <path d="M8.8 0.5 Q10 -0.5 11.2 0.5" stroke="#FF8F00" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <circle cx="7" cy="12" r="0.8" fill="white" fillOpacity="0.5"/>
      <circle cx="13" cy="13" r="0.8" fill="white" fillOpacity="0.5"/>
    </svg>
  );
  if (category === 'saude') return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <path d="M10 16C10 16 3 11 3 7C3 4.8 4.8 3 7 3C8.3 3 9.5 3.7 10 4.8C10.5 3.7 11.7 3 13 3C15.2 3 17 4.8 17 7C17 11 10 16 10 16Z" fill="#E53935"/>
      <line x1="10" y1="6" x2="10" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="7" y1="9" x2="13" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  if (category === 'viagem') return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <path d="M17 7.5L11 10.5L10 3.5H8L9 10.5L3 13.5V15L9.5 13.5L10 18H12L12.5 13.5L19 15V13.5L13 10.5L17 7.5Z" fill="#1976D2"/>
    </svg>
  );
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" style={style}>
      <path d="M10 16L4 10.5C2.5 9 2.5 6.5 4.5 5.2C6 4.2 8 4.8 10 7C12 4.8 14 4.2 15.5 5.2C17.5 6.5 17.5 9 16 10.5L10 16Z" fill="#E91E63"/>
    </svg>
  );
};

const Calendario = ({ onBack }) => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(today.toISOString().slice(0, 10));
  const [events, saveEvents] = useStorage('events:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: selected, time: '09:00', category: 'pessoal', color: 'var(--accent)' });
  const toast = useToast();

  const addEvent = () => {
    if (!form.title.trim()) return;
    saveEvents(ev => [...ev, { id: newId(), ...form }]);
    setForm(f => ({ ...f, title: '', time: '09:00' }));
    setShowModal(false);
    toast('Evento adicionado');
  };
  const delEvent = (id) => { saveEvents(ev => ev.filter(e => e.id !== id)); toast('Evento removido'); };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = Array.from({ length: firstDay }, () => null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const eventsOnDay = (day) => {
    if (!day) return [];
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === d);
  };

  const selectedEvents = events.filter(e => e.date === selected).sort((a, b) => a.time > b.time ? 1 : -1);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const fmtDate = (d) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="screen">
      <BackHeader
        title="Calendário"
        onBack={onBack}
        action={
          <button onClick={() => { setForm(f => ({ ...f, date: selected })); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
            <Icon name="plus" size={20} />
          </button>
        }
      />
      <div style={{ padding: '0 12px 32px' }}>

        {/* nav mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
            <Icon name="arrowLeft" size={20} />
          </button>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>{MONTHS[month]} {year}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
            <Icon name="arrow" size={20} />
          </button>
        </div>

        {/* header semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
          {WEEK.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: 'var(--text3)', padding: '2px 0 4px' }}>{d}</div>
          ))}
        </div>

        {/* grade de dias — estilo calendário de papel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 20 }}>
          {cells.map((day, i) => {
            if (!day) return (
              <div key={i} style={{ minHeight: 48, border: '1px solid transparent', borderRadius: 6 }} />
            );
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const isSel = dateStr === selected;
            const dayEvents = eventsOnDay(day);
            return (
              <div
                key={i}
                onClick={() => setSelected(dateStr)}
                style={{
                  border: `1.5px solid ${isSel ? 'var(--accent)' : isToday ? 'var(--accent)' : 'var(--line)'}`,
                  borderRadius: 6,
                  minHeight: 48,
                  padding: '4px 2px 3px',
                  background: isSel ? 'var(--accent-bg)' : isToday ? 'var(--bg2)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  fontSize: 10,
                  fontWeight: isToday || isSel ? 700 : 400,
                  color: isSel ? 'var(--accent)' : isToday ? 'var(--accent)' : 'var(--text)',
                  lineHeight: 1,
                  marginBottom: 3,
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', flex: 1 }}>
                  {dayEvents.slice(0, 3).map((e, ei) => (
                    <Sticker key={ei} category={e.category} size={13} />
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ fontSize: 8, color: 'var(--text3)', width: '100%', textAlign: 'center' }}>
                      +{dayEvents.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* eventos do dia selecionado */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>{fmtDate(selected)}</div>
            <button onClick={() => { setForm(f => ({ ...f, date: selected })); setShowModal(true); }} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500 }}>
              + Evento
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 13 }}>Sem eventos neste dia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedEvents.map(ev => (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ width: 4, height: 36, borderRadius: 99, background: ev.color || 'var(--accent)', flexShrink: 0 }} />
                  <Sticker category={ev.category} size={22} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', minWidth: 36 }}>{ev.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text)' }}>{ev.title}</div>
                    {ev.category && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{ev.category}</div>}
                  </div>
                  <button onClick={() => delEvent(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo evento"
        footer={<button className="btn-primary" onClick={addEvent}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input className="input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Adesivo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {Object.keys(CAT_COLORS).map(cat => (
                <button
                  key={cat}
                  onClick={() => setForm(f => ({ ...f, category: cat, color: CAT_COLORS[cat] }))}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 6px',
                    border: `1.5px solid ${form.category === cat ? 'var(--accent)' : 'var(--line)'}`,
                    borderRadius: 8,
                    background: form.category === cat ? 'var(--accent-bg)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <Sticker category={cat} size={22} />
                  <span style={{ fontSize: 10, color: form.category === cat ? 'var(--accent)' : 'var(--text2)', fontWeight: 500, textTransform: 'capitalize' }}>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Calendario;
