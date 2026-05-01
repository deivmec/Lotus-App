import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEK = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

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

  const CAT_COLORS = {
    pessoal: 'var(--accent)',
    trabalho: 'var(--blue)',
    saude: 'var(--green)',
    viagem: 'oklch(62% 0.09 60)',
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
      <div style={{ padding: '0 24px 32px' }}>

        {/* nav mês */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
            <Icon name="arrowLeft" size={20} />
          </button>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, color: 'var(--text)' }}>{MONTHS[month]} {year}</div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 8 }}>
            <Icon name="arrow" size={20} />
          </button>
        </div>

        {/* grid semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {WEEK.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text3)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* grid dias */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 24 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const isSel = dateStr === selected;
            const dayEvents = eventsOnDay(day);
            return (
              <div
                key={i}
                onClick={() => setSelected(dateStr)}
                style={{
                  textAlign: 'center',
                  padding: '8px 4px 4px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: isSel ? 'var(--text)' : isToday ? 'var(--accent-bg)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: isToday ? 600 : 400, color: isSel ? 'white' : isToday ? 'var(--accent)' : 'var(--text)', lineHeight: 1 }}>{day}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                  {dayEvents.slice(0, 3).map((e, ei) => (
                    <div key={ei} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? 'rgba(255,255,255,0.7)' : (e.color || 'var(--accent)') }} />
                  ))}
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
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ width: 4, height: 36, borderRadius: 99, background: ev.color || 'var(--accent)', flexShrink: 0 }} />
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo evento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <input className="input" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, color: CAT_COLORS[e.target.value] || 'var(--accent)' }))}>
            {Object.entries(CAT_COLORS).map(([k]) => <option key={k} value={k}>{k}</option>)}
          </select>
          <button className="btn-primary" onClick={addEvent}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Calendario;
