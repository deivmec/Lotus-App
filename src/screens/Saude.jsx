import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const today = new Date().toISOString().slice(0, 10);

const TABS = [
  { id: 'humor', label: 'Humor' },
  { id: 'remedios', label: 'Remédios' },
  { id: 'treinos', label: 'Treinos' },
  { id: 'ciclo', label: 'Ciclo' },
];

const MOODS = [
  { level: 1, emoji: '😔', label: 'Difícil' },
  { level: 2, emoji: '😕', label: 'Regular' },
  { level: 3, emoji: '😊', label: 'Ok' },
  { level: 4, emoji: '😄', label: 'Bem' },
  { level: 5, emoji: '🌟', label: 'Ótimo' },
];

const Saude = ({ onBack }) => {
  const [tab, setTab] = useState('humor');
  const [moods, saveMoods] = useStorage('saude:moods', []);
  const [meds, saveMeds] = useStorage('saude:meds', []);
  const [medLogs, saveMedLogs] = useStorage('saude:medlogs', {});
  const [workouts, saveWorkouts] = useStorage('saude:treinos', []);
  const [cycle, saveCycle] = useStorage('saude:ciclo', []);
  const [showMedModal, setShowMedModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: 'manhã' });
  const [newWorkout, setNewWorkout] = useState({ type: '', date: today, duration: '', category: 'musculação' });
  const toast = useToast();

  const todayMood = moods.find(m => m.date === today);
  const setMood = (level) => {
    saveMoods(ms => {
      const idx = ms.findIndex(m => m.date === today);
      if (idx >= 0) { const u = [...ms]; u[idx] = { date: today, level }; return u; }
      return [...ms, { date: today, level }];
    });
    toast('Humor registrado');
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const m = moods.find(x => x.date === date);
    return { date, level: m?.level || 0, label: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()] };
  });

  const addMed = () => {
    if (!newMed.name.trim()) return;
    saveMeds(ms => [...ms, { id: newId(), ...newMed, takenToday: false }]);
    setNewMed({ name: '', dose: '', time: 'manhã' });
    setShowMedModal(false);
    toast('Remédio adicionado');
  };
  const delMed = (id) => { saveMeds(ms => ms.filter(m => m.id !== id)); toast('Removido'); };
  const toggleMed = (id) => {
    const key = `${id}:${today}`;
    saveMedLogs(logs => ({ ...logs, [key]: !logs[key] }));
  };

  const addWorkout = () => {
    if (!newWorkout.type.trim()) return;
    saveWorkouts(ws => [{ id: newId(), ...newWorkout }, ...ws]);
    setNewWorkout({ type: '', date: today, duration: '', category: 'musculação' });
    setShowWorkoutModal(false);
    toast('Treino adicionado');
  };
  const delWorkout = (id) => { saveWorkouts(ws => ws.filter(w => w.id !== id)); toast('Removido'); };

  const toggleCycle = (day, type) => {
    const key = `${today.slice(0, 7)}-${day}`;
    saveCycle(c => {
      const idx = c.findIndex(x => x.key === key);
      if (idx >= 0) { const u = [...c]; u[idx] = { key, type }; return u; }
      return [...c, { key, type }];
    });
  };
  const curMonth = today.slice(0, 7);
  const cycleDays = Array.from({ length: 28 }, (_, i) => {
    const key = `${curMonth}-${i + 1}`;
    return cycle.find(c => c.key === key) || null;
  });

  return (
    <div className="screen">
      <BackHeader title="Saúde & Bem-estar" onBack={onBack} />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === 'humor' && (
          <div>
            <div className="section-label">Como você está hoje?</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              {MOODS.map(m => (
                <button key={m.level} onClick={() => setMood(m.level)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', borderRadius: 'var(--r)', border: `1.5px solid ${todayMood?.level === m.level ? 'var(--accent)' : 'var(--line)'}`,
                  background: todayMood?.level === m.level ? 'var(--accent-bg)' : 'white',
                  cursor: 'pointer', flex: 1, margin: '0 3px', transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 24 }}>{m.emoji}</span>
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.05em' }}>{m.label}</span>
                </button>
              ))}
            </div>

            <div className="section-label">Últimos 7 dias</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
              {last7.map((d, i) => {
                const m = MOODS.find(x => x.level === d.level);
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{m ? m.emoji : '·'}</div>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'remedios' && (
          <div>
            {meds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💊</div>
                <div style={{ fontSize: 14 }}>Nenhum remédio cadastrado</div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                {meds.map((med, i) => {
                  const taken = medLogs[`${med.id}:${today}`];
                  return (
                    <div key={med.id} style={{ padding: '14px 16px', borderBottom: i < meds.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button onClick={() => toggleMed(med.id)} style={{ width: 36, height: 36, borderRadius: 10, background: taken ? 'var(--green)' : 'var(--bg2)', border: '1.5px solid', borderColor: taken ? 'var(--green)' : 'var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name="pill" size={16} color={taken ? 'white' : 'var(--text3)'} />
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{med.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{med.dose} · {med.time}</div>
                      </div>
                      {taken && <span className="tag" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>Tomado</span>}
                      <button onClick={() => delMed(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowMedModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar remédio/vitamina
            </button>
          </div>
        )}

        {tab === 'treinos' && (
          <div>
            {workouts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
                <div style={{ fontSize: 14 }}>Nenhum treino registrado</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {workouts.slice(0, 20).map(w => (
                  <div key={w.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={w.category === 'cardio' ? 'run' : w.category === 'flexibilidade' ? 'leaf' : 'dumbbell'} size={18} color="var(--text2)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{w.type}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{w.date} · {w.duration}</div>
                    </div>
                    <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>{w.category}</span>
                    <button onClick={() => delWorkout(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowWorkoutModal(true)}>
              <Icon name="plus" size={16} />
              Registrar treino
            </button>
          </div>
        )}

        {tab === 'ciclo' && (
          <div>
            <div className="section-label">Marcar dias — {curMonth}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 20 }}>
              {cycleDays.map((d, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{i + 1}</div>
                  <div onClick={() => toggleCycle(i + 1, d?.type === 'menstrual' ? 'ovulacao' : d?.type === 'ovulacao' ? null : 'menstrual')} style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto', cursor: 'pointer',
                    background: d?.type === 'menstrual' ? 'oklch(62% 0.12 15)' : d?.type === 'ovulacao' ? 'oklch(62% 0.09 140)' : 'var(--bg2)',
                    border: '1.5px solid', borderColor: d?.type ? 'transparent' : 'var(--line)',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'oklch(62% 0.12 15)' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Menstrual</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'oklch(62% 0.09 140)' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Ovulação</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal open={showMedModal} onClose={() => setShowMedModal(false)} title="Novo remédio/vitamina">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome" value={newMed.name} onChange={e => setNewMed(m => ({ ...m, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Dose (ex: 500mg)" value={newMed.dose} onChange={e => setNewMed(m => ({ ...m, dose: e.target.value }))} />
          <select className="input" value={newMed.time} onChange={e => setNewMed(m => ({ ...m, time: e.target.value }))}>
            <option value="manhã">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>
          <button className="btn-primary" onClick={addMed}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} title="Novo treino">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Tipo (ex: Peito + Ombro)" value={newWorkout.type} onChange={e => setNewWorkout(w => ({ ...w, type: e.target.value }))} autoFocus />
          <select className="input" value={newWorkout.category} onChange={e => setNewWorkout(w => ({ ...w, category: e.target.value }))}>
            <option value="musculação">Musculação</option>
            <option value="cardio">Cardio</option>
            <option value="flexibilidade">Flexibilidade</option>
            <option value="esporte">Esporte</option>
          </select>
          <input className="input" type="date" value={newWorkout.date} onChange={e => setNewWorkout(w => ({ ...w, date: e.target.value }))} />
          <input className="input" placeholder="Duração (ex: 45min)" value={newWorkout.duration} onChange={e => setNewWorkout(w => ({ ...w, duration: e.target.value }))} />
          <button className="btn-primary" onClick={addWorkout}>Salvar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Saude;
