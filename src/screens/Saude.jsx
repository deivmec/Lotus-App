import { useState, useEffect, useRef } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();
const today = new Date().toISOString().slice(0, 10);
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const WEEK_MINI = ['D','S','T','Q','Q','S','S'];

const TABS = [
  { id: 'humor',    label: 'Humor' },
  { id: 'remedios', label: 'Remédios' },
  { id: 'treinos',  label: 'Treinos' },
  { id: 'ciclo',    label: 'Ciclo' },
  { id: 'medidas',  label: 'Medidas' },
];

const MOODS = [
  { level: 1, emoji: '😔', label: 'Difícil' },
  { level: 2, emoji: '😕', label: 'Regular' },
  { level: 3, emoji: '😊', label: 'Ok' },
  { level: 4, emoji: '😄', label: 'Bem' },
  { level: 5, emoji: '🌟', label: 'Ótimo' },
];

const PHASES = [
  { id: 'menstrual',  name: 'Menstrual',  emoji: '🩸', color: '#E53935', dayRange: 'dias 1–5',  desc: 'Seu corpo está menstruando. Descanse, use calor e fique bem hidratada.' },
  { id: 'folicular',  name: 'Folicular',  emoji: '🌱', color: '#FF7043', dayRange: 'dias 6–13', desc: 'Energia crescendo. Ótimo para novos projetos, exercícios e socializar.' },
  { id: 'ovulatoria', name: 'Ovulatória', emoji: '✨', color: '#43A047', dayRange: 'dias 12–17', desc: 'Pico de energia e fertilidade. Você está mais comunicativa e confiante.' },
  { id: 'lutea',      name: 'Lútea',      emoji: '🌙', color: '#7B1FA2', dayRange: 'dias 18–28', desc: 'Fase de introspecção e autocuidado. Priorize descanso e alimentação saudável.' },
];

const fmtShortDate = (d) => {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${parseInt(day)} ${MONTH_NAMES[parseInt(m, 10) - 1]}`;
};

const Saude = ({ onBack }) => {
  const [tab, setTab] = useState('humor');
  const [moods, saveMoods]       = useStorage('saude:moods', []);
  const [meds, saveMeds]         = useStorage('saude:meds', []);
  const [medLogs, saveMedLogs]   = useStorage('saude:medlogs', {});
  const [workouts, saveWorkouts] = useStorage('saude:treinos', []);
  const [cycleStarts, saveCycleStarts] = useStorage('saude:ciclo-starts', []);
  const [periodEnds, savePeriodEnds]   = useStorage('saude:period-ends', []); // [{ start, end }]
  const [cycleLen, saveCycleLen]       = useStorage('saude:cycle-len', 28);
  const [periodLen, savePeriodLen]     = useStorage('saude:period-len', 5);

  const [medidas, saveMedidas] = useStorage('saude:medidas', []);

  const [showMedModal,      setShowMedModal]      = useState(false);
  const [showWorkoutModal,  setShowWorkoutModal]  = useState(false);
  const [showMarkModal,     setShowMarkModal]     = useState(false);
  const [showEndModal,      setShowEndModal]      = useState(false);
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const [showMedidasModal,  setShowMedidasModal]  = useState(false);
  const [markDate, setMarkDate] = useState(today);
  const [endDate,  setEndDate]  = useState(today);
  const [newMed,     setNewMed]     = useState({ name: '', dose: '', time: '08:00', notify: false });
  const [newWorkout, setNewWorkout] = useState({ type: '', date: today, duration: '', category: 'musculação' });
  const [medidasForm, setMedidasForm] = useState({ date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '' });
  const toast = useToast();

  // ── Humor ──
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

  // ── Notification engine ──
  const notifiedRef = useRef(new Set());
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const dateKey = now.toISOString().slice(0,10);
      meds.forEach(med => {
        if (!med.notify || !med.time) return;
        const key = `${med.id}:${hhmm}:${dateKey}`;
        if (notifiedRef.current.has(key)) return;
        if (med.time !== hhmm) return;
        if (medLogs[`${med.id}:${dateKey}`]) return; // already taken
        notifiedRef.current.add(key);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`💊 Hora do remédio`, { body: `${med.name}${med.dose ? ` · ${med.dose}` : ''}`, icon: '/icons/icon-192x192.png' });
        }
      });
    };
    check();
    const id = setInterval(check, 30000); // check every 30s
    return () => clearInterval(id);
  }, [meds, medLogs]);

  const requestNotifyPermission = async () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') await Notification.requestPermission();
  };

  // ── Meds ──
  const addMed = () => {
    if (!newMed.name.trim()) return;
    if (newMed.notify) requestNotifyPermission();
    saveMeds(ms => [...ms, { id: newId(), ...newMed }]);
    setNewMed({ name: '', dose: '', time: '08:00', notify: false });
    setShowMedModal(false);
    toast('Remédio adicionado');
  };
  const delMed = (id) => { saveMeds(ms => ms.filter(m => m.id !== id)); toast('Removido'); };
  const toggleMed = (id) => {
    const key = `${id}:${today}`;
    saveMedLogs(logs => ({ ...logs, [key]: !logs[key] }));
  };
  const toggleMedNotify = (id) => {
    saveMeds(ms => ms.map(m => {
      if (m.id !== id) return m;
      const next = { ...m, notify: !m.notify };
      if (next.notify) requestNotifyPermission();
      return next;
    }));
  };

  // ── Workouts ──
  const addWorkout = () => {
    if (!newWorkout.type.trim()) return;
    saveWorkouts(ws => [{ id: newId(), ...newWorkout }, ...ws]);
    setNewWorkout({ type: '', date: today, duration: '', category: 'musculação' });
    setShowWorkoutModal(false);
    toast('Treino adicionado');
  };
  const delWorkout = (id) => { saveWorkouts(ws => ws.filter(w => w.id !== id)); toast('Removido'); };

  // ── Medidas ──
  const addMedida = () => {
    const hasValue = Object.entries(medidasForm).some(([k, v]) => k !== 'date' && String(v).trim());
    if (!hasValue) return;
    saveMedidas(ms => [{ id: newId(), ...medidasForm }, ...ms.filter(m => m.date !== medidasForm.date)]);
    setMedidasForm({ date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '' });
    setShowMedidasModal(false);
    toast('Medidas salvas');
  };
  const lastMedida = medidas[0] || null;

  // ── Ciclo ──
  const calcCycleInfo = () => {
    if (!cycleStarts.length) return null;
    const sorted = [...cycleStarts].sort();
    const lastStart = sorted.at(-1);
    const todayD = new Date(today + 'T00:00:00');
    const lastD  = new Date(lastStart + 'T00:00:00');

    let avgLen = cycleLen;
    if (sorted.length >= 2) {
      const diffs = [];
      for (let i = 1; i < sorted.length; i++) {
        diffs.push(Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000));
      }
      // Weighted average — recent cycles count more
      let ws = 0, wv = 0;
      diffs.forEach((v, i) => { const w = i + 1; ws += w; wv += v * w; });
      const weighted = Math.round(wv / ws);
      avgLen = Math.max(21, Math.min(45, weighted));
    }
    // Use computed period length if we have end records, else fall back to manual
    const periodEndsData = periodEnds || [];
    const pLens = periodEndsData.map(r => r.start && r.end
      ? Math.max(1, Math.round((new Date(r.end) - new Date(r.start)) / 86400000) + 1)
      : null).filter(Boolean);
    if (pLens.length) {
      const avgPLen = Math.round(pLens.reduce((a, b) => a + b) / pLens.length);
      savePeriodLen(Math.max(2, Math.min(10, avgPLen)));
    }

    const rawDay = Math.max(1, Math.round((todayD - lastD) / 86400000) + 1);
    const cyclesElapsed = Math.max(0, Math.floor((rawDay - 1) / avgLen));
    const cycleDayNum   = rawDay - cyclesElapsed * avgLen;

    const currentCycleStartD = new Date(lastD);
    currentCycleStartD.setDate(currentCycleStartD.getDate() + cyclesElapsed * avgLen);

    const nextPeriodD = new Date(currentCycleStartD);
    nextPeriodD.setDate(nextPeriodD.getDate() + avgLen);
    const daysUntilNext = Math.round((nextPeriodD - todayD) / 86400000);

    const pd = periodLen;
    const ovDay = avgLen - 14; // 1-indexed ovulation day

    let phase = PHASES[3];
    if (cycleDayNum <= pd)                              phase = PHASES[0];
    else if (cycleDayNum <= 13)                         phase = PHASES[1];
    else if (cycleDayNum <= Math.max(17, avgLen - 11)) phase = PHASES[2];

    const fertileStartD = new Date(currentCycleStartD);
    fertileStartD.setDate(fertileStartD.getDate() + ovDay - 5);
    const fertileEndD = new Date(currentCycleStartD);
    fertileEndD.setDate(fertileEndD.getDate() + ovDay + 1);

    return {
      cycleDayNum, avgLen, periodLen: pd, ovDay, phase,
      nextPeriod:   nextPeriodD.toISOString().slice(0, 10),
      daysUntilNext,
      fertileStart: fertileStartD.toISOString().slice(0, 10),
      fertileEnd:   fertileEndD.toISOString().slice(0, 10),
      currentCycleStart: currentCycleStartD.toISOString().slice(0, 10),
    };
  };

  const getDayType = (dateStr, info) => {
    if (!info) return null;
    const { currentCycleStart, avgLen, periodLen: pd, ovDay } = info;
    const base = new Date(currentCycleStart + 'T00:00:00');
    const d    = new Date(dateStr + 'T00:00:00');
    const ovDiff = ovDay - 1; // 0-indexed
    for (let cycle = -2; cycle <= 4; cycle++) {
      const cs = new Date(base);
      cs.setDate(cs.getDate() + cycle * avgLen);
      const diff = Math.round((d - cs) / 86400000);
      if (diff >= 0 && diff < pd)                          return 'period';
      if (diff >= ovDiff - 4 && diff <= ovDiff + 2)       return 'fertile';
    }
    return null;
  };

  const markPeriod = (date) => {
    if (cycleStarts.includes(date)) {
      saveCycleStarts(cs => cs.filter(x => x !== date));
      toast('Data removida');
    } else {
      saveCycleStarts(cs => [...cs, date].sort());
      toast('Menstruação marcada!');
    }
    setShowMarkModal(false);
  };

  const markPeriodEnd = (end) => {
    const sorted = [...cycleStarts].sort();
    const start  = sorted.findLast(s => s <= end);
    if (!start) { toast('Nenhum início registrado antes desta data'); return; }
    savePeriodEnds(es => {
      const filtered = es.filter(e => e.start !== start);
      return [...filtered, { start, end }];
    });
    setShowEndModal(false);
    toast('Fim do período registrado');
  };

  // ── Analysis ──
  const calcAnalysis = () => {
    const sorted = [...cycleStarts].sort();
    if (sorted.length < 2) return null;
    const diffs = [];
    for (let i = 1; i < sorted.length; i++) {
      diffs.push(Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000));
    }
    const mean = diffs.reduce((a, b) => a + b) / diffs.length;
    const variance = diffs.length > 1
      ? diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / (diffs.length - 1)
      : 0;
    const std = Math.sqrt(variance);
    // Weighted avg — recent cycles weigh more
    let ws = 0, wv = 0;
    diffs.forEach((v, i) => { const w = i + 1; ws += w; wv += v * w; });
    const weighted = Math.round(wv / ws);
    // Period durations from end records
    const pLens = periodEnds
      .map(r => r.start && r.end ? Math.max(1, Math.round((new Date(r.end) - new Date(r.start)) / 86400000) + 1) : null)
      .filter(Boolean);
    const avgPeriod = pLens.length ? Math.round(pLens.reduce((a, b) => a + b) / pLens.length) : null;
    // Trend: last 3 vs all-time avg
    const recentAvg = diffs.length >= 4 ? diffs.slice(-3).reduce((a, b) => a + b) / 3 : null;
    const trend = recentAvg !== null
      ? (recentAvg > mean + 1.5 ? 'longer' : recentAvg < mean - 1.5 ? 'shorter' : 'stable')
      : null;
    const regularity = std < 2 ? 'Muito regular' : std < 4 ? 'Regular' : std < 7 ? 'Levemente irregular' : 'Irregular';
    const regColor   = std < 2 ? 'var(--green)' : std < 4 ? '#1E88E5' : std < 7 ? 'oklch(58% 0.14 50)' : 'var(--red)';
    const confidence = diffs.length >= 6 ? 'Alta' : diffs.length >= 3 ? 'Média' : 'Baixa';
    const confColor  = diffs.length >= 6 ? 'var(--green)' : diffs.length >= 3 ? '#1E88E5' : 'var(--text3)';
    return { count: diffs.length, mean: Math.round(mean), weighted, min: Math.min(...diffs), max: Math.max(...diffs), std: parseFloat(std.toFixed(1)), regularity, regColor, avgPeriod, trend, confidence, confColor };
  };

  const analysis = calcAnalysis();

  const cycleInfo = calcCycleInfo();

  // Mini calendar helpers
  const calYear  = parseInt(today.slice(0, 4));
  const calMonth = parseInt(today.slice(5, 7)) - 1;
  const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstCalDay    = new Date(calYear, calMonth, 1).getDay();

  return (
    <div className="screen">
      <BackHeader title="Saúde & Bem-estar" onBack={onBack} />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* ── Humor ── */}
        {tab === 'humor' && (
          <div>
            <div className="section-label">Como você está hoje?</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 28 }}>
              {MOODS.map(m => (
                <button key={m.level} onClick={() => setMood(m.level)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '12px 8px', borderRadius: 'var(--r)',
                  border: `1.5px solid ${todayMood?.level === m.level ? 'var(--accent)' : 'var(--line)'}`,
                  background: todayMood?.level === m.level ? 'var(--accent-bg)' : 'var(--surface)',
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

        {/* ── Remédios ── */}
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{med.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                          {med.time && (
                            <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 20 }}>
                              🕐 {med.time}
                            </span>
                          )}
                          {med.dose && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{med.dose}</span>}
                        </div>
                      </div>
                      {/* Notification bell toggle */}
                      <button
                        onClick={() => toggleMedNotify(med.id)}
                        title={med.notify ? 'Notificação ativa' : 'Ativar notificação'}
                        style={{ background: med.notify ? 'var(--accent-bg)' : 'var(--bg2)', border: `1.5px solid ${med.notify ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      >
                        <Icon name="bell" size={14} color={med.notify ? 'var(--accent)' : 'var(--text3)'} />
                      </button>
                      {taken && <span className="tag" style={{ background: 'var(--green-bg)', color: 'var(--green)', flexShrink: 0 }}>✓</span>}
                      <button onClick={() => delMed(med.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowMedModal(true)}>
              <Icon name="plus" size={16} /> Adicionar remédio/vitamina
            </button>
          </div>
        )}

        {/* ── Treinos ── */}
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
              <Icon name="plus" size={16} /> Registrar treino
            </button>
          </div>
        )}

        {/* ── Ciclo ── */}
        {tab === 'ciclo' && (
          <div>
            {!cycleInfo ? (
              <div>
                <div style={{ textAlign: 'center', padding: '32px 0 24px', color: 'var(--text3)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🩸</div>
                  <div style={{ fontSize: 15, color: 'var(--text)', fontWeight: 500, marginBottom: 8 }}>Rastreie seu ciclo</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>Marque o início da sua menstruação para receber previsões personalizadas das fases do ciclo.</div>
                </div>
                <button className="btn-primary" onClick={() => { setMarkDate(today); setShowMarkModal(true); }}>
                  🩸  Minha menstruação começou
                </button>
              </div>
            ) : (
              <div>
                {/* ── Card de fase atual ── */}
                <div style={{
                  background: cycleInfo.phase.color + '14',
                  border: `1.5px solid ${cycleInfo.phase.color}35`,
                  borderRadius: 'var(--r)',
                  padding: '18px 16px',
                  marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Fase atual</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 22 }}>{cycleInfo.phase.emoji}</span>
                        <span style={{ fontFamily: 'var(--serif)', fontSize: 21, color: 'var(--text)' }}>{cycleInfo.phase.name}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Dia do ciclo</div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 30, color: cycleInfo.phase.color, lineHeight: 1 }}>{cycleInfo.cycleDayNum}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>de {cycleInfo.avgLen}</div>
                    </div>
                  </div>

                  {/* Barra de dias do ciclo */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {Array.from({ length: cycleInfo.avgLen }, (_, i) => {
                      const day = i + 1;
                      const pd = cycleInfo.periodLen;
                      const ov = cycleInfo.ovDay;
                      let segColor;
                      if (day <= pd)                            segColor = '#E53935';
                      else if (day >= ov - 4 && day <= ov + 2) segColor = '#43A047';
                      else if (day < ov - 4)                   segColor = '#FF7043';
                      else                                      segColor = '#7B1FA2';
                      const active  = day <= cycleInfo.cycleDayNum;
                      const current = day === cycleInfo.cycleDayNum;
                      return (
                        <div key={i} style={{
                          flex: 1,
                          height: current ? 12 : 6,
                          borderRadius: 3,
                          background: active ? segColor : 'var(--bg3)',
                          marginTop: current ? -3 : 0,
                          transition: 'height 0.2s',
                        }} />
                      );
                    })}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{cycleInfo.phase.desc}</div>

                  <div style={{ marginTop: 10, fontSize: 12 }}>
                    {cycleInfo.daysUntilNext > 0 && (
                      <span style={{ color: 'var(--text3)' }}>
                        Próxima menstruação em{' '}
                        <span style={{ color: '#E53935', fontWeight: 600 }}>{cycleInfo.daysUntilNext} dias</span>
                      </span>
                    )}
                    {cycleInfo.daysUntilNext === 0 && (
                      <span style={{ color: '#E53935', fontWeight: 600 }}>Sua menstruação pode começar hoje!</span>
                    )}
                    {cycleInfo.daysUntilNext < 0 && (
                      <span style={{ color: '#E53935', fontWeight: 600 }}>
                        Período esperado há {Math.abs(cycleInfo.daysUntilNext)} dias
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão marcar hoje */}
                <button
                  onClick={() => { setMarkDate(today); setShowMarkModal(true); }}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 'var(--r-sm)',
                    border: `1.5px solid #E5393540`,
                    background: cycleStarts.includes(today) ? '#E5393518' : 'var(--surface)',
                    color: cycleStarts.includes(today) ? '#E53935' : 'var(--text2)',
                    cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginBottom: 16, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>🩸</span>
                  {cycleStarts.includes(today) ? 'Menstruação marcada hoje ✓' : 'Minha menstruação começou'}
                </button>

                {/* Próximas datas */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="section-label" style={{ marginBottom: 12 }}>Próximas datas</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E53935', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>Próxima menstruação</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E53935' }}>{fmtShortDate(cycleInfo.nextPeriod)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#43A047', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>Janela fértil</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#43A047' }}>
                        {fmtShortDate(cycleInfo.fertileStart)} – {fmtShortDate(cycleInfo.fertileEnd)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fases do ciclo — legenda */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>Fases do ciclo</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {PHASES.map(ph => {
                      const active = cycleInfo.phase.id === ph.id;
                      return (
                        <div key={ph.id} style={{
                          display: 'flex', alignItems: active ? 'flex-start' : 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 8,
                          background: active ? ph.color + '12' : 'transparent',
                          border: `1px solid ${active ? ph.color + '35' : 'transparent'}`,
                          transition: 'all 0.2s',
                        }}>
                          <span style={{ fontSize: 15, marginTop: active ? 1 : 0 }}>{ph.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: active ? ph.color : 'var(--text2)' }}>
                              {ph.name}{' '}
                              <span style={{ fontWeight: 400, color: 'var(--text3)' }}>· {ph.dayRange}</span>
                            </div>
                            {active && (
                              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, lineHeight: 1.5 }}>{ph.desc}</div>
                            )}
                          </div>
                          {active && (
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: ph.color, flexShrink: 0, marginTop: 3 }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calendário do ciclo */}
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="section-label" style={{ marginBottom: 10 }}>
                    Calendário — {MONTH_NAMES[calMonth]}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
                    {WEEK_MINI.map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text3)', fontWeight: 600, paddingBottom: 2 }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                    {Array.from({ length: firstCalDay }, (_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInCalMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isToday = dateStr === today;
                      const isActual = cycleStarts.some(s => {
                        const diff = Math.round((new Date(dateStr) - new Date(s)) / 86400000);
                        return diff >= 0 && diff < periodLen;
                      });
                      const dayType = getDayType(dateStr, cycleInfo);
                      const bg = isActual
                        ? '#E53935'
                        : dayType === 'period'  ? '#E5393555'
                        : dayType === 'fertile' ? '#43A04755'
                        : 'transparent';
                      return (
                        <div
                          key={day}
                          onClick={() => { setMarkDate(dateStr); setShowMarkModal(true); }}
                          style={{
                            aspectRatio: '1', borderRadius: 6, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: bg,
                            border: isToday ? '1.5px solid var(--accent)' : '1px solid transparent',
                            fontSize: 11,
                            fontWeight: isToday ? 700 : 400,
                            color: isActual ? 'white' : isToday ? 'var(--accent)' : 'var(--text)',
                          }}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                    {[
                      { color: '#E53935',   label: 'Menstruação real' },
                      { color: '#E5393555', label: 'Previsto' },
                      { color: '#43A04755', label: 'Fértil' },
                    ].map(({ color, label }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico */}
                {cycleStarts.length > 0 && (
                  <div className="card" style={{ marginBottom: 14 }}>
                    <div className="section-label" style={{ marginBottom: 10 }}>Histórico de ciclos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[...cycleStarts].sort().reverse().slice(0, 10).map(date => (
                        <div key={date} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 10px', borderRadius: 20,
                          background: 'var(--bg2)', border: '1px solid var(--line)',
                        }}>
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>🩸 {fmtShortDate(date)}</span>
                          <button
                            onClick={() => saveCycleStarts(cs => cs.filter(d => d !== date))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '0 0 0 4px', lineHeight: 1, display: 'flex' }}
                          >
                            <Icon name="x" size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marcar fim do período */}
                <button
                  onClick={() => { setEndDate(today); setShowEndModal(true); }}
                  style={{ width:'100%', padding:'13px', borderRadius:'var(--r-sm)', border:'1.5px solid #9C27B040', background:'var(--surface)', color:'var(--text2)', cursor:'pointer', fontFamily:'var(--sans)', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:10, transition:'all 0.15s' }}
                >
                  <span style={{ fontSize:16 }}>✅</span> Minha menstruação terminou
                </button>

                <button className="btn-add" onClick={() => { setMarkDate(today); setShowMarkModal(true); }}>
                  <Icon name="plus" size={16} /> Marcar outro dia
                </button>

                {/* ── Análise ── */}
                {analysis && (
                  <div className="card" style={{ marginTop:16 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                      <div className="section-label" style={{ margin:0 }}>Análise do seu ciclo</div>
                      <span style={{ fontSize:11, fontWeight:600, color:analysis.confColor, background:analysis.confColor+'18', padding:'3px 8px', borderRadius:20 }}>
                        Confiança {analysis.confidence}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                      {[
                        { label:'Ciclos registrados', value:`${analysis.count}`, unit:'ciclos' },
                        { label:'Duração média', value:`${analysis.weighted}`, unit:'dias' },
                        { label:'Menor ciclo', value:`${analysis.min}`, unit:'dias' },
                        { label:'Maior ciclo', value:`${analysis.max}`, unit:'dias' },
                        ...(analysis.avgPeriod ? [{ label:'Período médio', value:`${analysis.avgPeriod}`, unit:'dias' }] : []),
                      ].map(s => (
                        <div key={s.label} style={{ background:'var(--bg2)', borderRadius:'var(--r-sm)', padding:'10px 12px' }}>
                          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>{s.label}</div>
                          <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                            <span style={{ fontFamily:'var(--serif)', fontSize:22, color:'var(--text)', lineHeight:1 }}>{s.value}</span>
                            <span style={{ fontSize:10, color:'var(--text3)' }}>{s.unit}</span>
                          </div>
                        </div>
                      ))}
                      <div style={{ background: analysis.regColor + '14', border:`1px solid ${analysis.regColor}30`, borderRadius:'var(--r-sm)', padding:'10px 12px' }}>
                        <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4 }}>Regularidade</div>
                        <div style={{ fontSize:13, fontWeight:600, color:analysis.regColor }}>{analysis.regularity}</div>
                        <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>±{analysis.std} dias</div>
                      </div>
                    </div>

                    {/* Trend */}
                    {analysis.trend && (
                      <div style={{ fontSize:12, color:'var(--text2)', padding:'8px 10px', background:'var(--bg2)', borderRadius:'var(--r-sm)', marginBottom:10 }}>
                        {analysis.trend === 'longer' && '📈 Seus últimos ciclos estão sendo mais longos que o habitual.'}
                        {analysis.trend === 'shorter' && '📉 Seus últimos ciclos estão sendo mais curtos que o habitual.'}
                        {analysis.trend === 'stable' && '✨ Seu ciclo está estável — sem variações significativas recentes.'}
                      </div>
                    )}

                    {/* Confidence note */}
                    <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.55 }}>
                      {analysis.count < 3
                        ? 'Registre mais ciclos para previsões mais precisas. Com 3+ ciclos, as estimativas ficam bem melhores.'
                        : analysis.count < 6
                        ? `Com ${analysis.count} ciclos registrados, as previsões já são personalizadas para você.`
                        : `Com ${analysis.count} ciclos, as previsões estão bem calibradas para o seu padrão.`
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Configurações */}
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowCycleSettings(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}
              >
                <Icon name={showCycleSettings ? 'chevronDown' : 'arrow'} size={12} />
                Configurações do ciclo
              </button>
              {showCycleSettings && (
                <div className="card" style={{ marginTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Duração do ciclo</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number" className="input" value={cycleLen} min={21} max={45}
                          onChange={e => saveCycleLen(Math.max(21, Math.min(45, parseInt(e.target.value) || 28)))}
                          style={{ textAlign: 'center' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>dias</span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Duração do período</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input
                          type="number" className="input" value={periodLen} min={2} max={10}
                          onChange={e => savePeriodLen(Math.max(2, Math.min(10, parseInt(e.target.value) || 5)))}
                          style={{ textAlign: 'center' }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap' }}>dias</span>
                      </div>
                    </div>
                  </div>
                  {cycleStarts.length >= 2 && (() => {
                    const sorted = [...cycleStarts].sort();
                    const diffs = [];
                    for (let i = 1; i < sorted.length; i++) {
                      diffs.push(Math.round((new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000));
                    }
                    const avg = Math.round(diffs.reduce((a, b) => a + b) / diffs.length);
                    return (
                      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
                        Média calculada do seu histórico: <strong>{avg}</strong> dias
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── Medidas ── */}
        {tab === 'medidas' && (
          <div>
            {lastMedida ? (
              <div>
                {/* Últimas medidas */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div className="section-label" style={{ margin: 0 }}>Últimas medidas</div>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{lastMedida.date}</span>
                  </div>
                  {/* Peso e altura em destaque */}
                  {(lastMedida.peso || lastMedida.altura) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {lastMedida.peso && (
                        <div style={{ background: 'var(--accent-bg)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Peso</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--accent)', lineHeight: 1 }}>{lastMedida.peso}</span>
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>kg</span>
                          </div>
                        </div>
                      )}
                      {lastMedida.altura && (
                        <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Altura</div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--text)', lineHeight: 1 }}>{lastMedida.altura}</span>
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>cm</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Demais medidas */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { key: 'busto',  label: 'Busto' },
                      { key: 'cintura',label: 'Cintura' },
                      { key: 'quadril',label: 'Quadril' },
                      { key: 'bracoe', label: 'Braço E' },
                      { key: 'bracod', label: 'Braço D' },
                      { key: 'coxa',   label: 'Coxa' },
                    ].filter(f => lastMedida[f.key]).map(f => (
                      <div key={f.key} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 2 }}>{f.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{lastMedida[f.key]}</span>
                          <span style={{ fontSize: 9, color: 'var(--text3)' }}>cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico */}
                {medidas.length > 1 && (
                  <div>
                    <div className="section-label">Histórico</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {medidas.slice(1, 10).map(m => (
                        <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{m.date}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {m.peso  && <span style={{ fontSize: 12, color: 'var(--text2)' }}>⚖️ {m.peso}kg</span>}
                              {m.busto && <span style={{ fontSize: 12, color: 'var(--text2)' }}>👙 {m.busto}cm</span>}
                              {m.cintura && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📏 {m.cintura}cm</span>}
                              {m.quadril && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{m.quadril}cm</span>}
                            </div>
                          </div>
                          <button onClick={() => { saveMedidas(ms => ms.filter(x => x.id !== m.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                            <Icon name="trash" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📏</div>
                <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>Nenhuma medida registrada</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Registre peso, altura e medidas corporais</div>
              </div>
            )}
            <button className="btn-add" onClick={() => { setMedidasForm({ date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '' }); setShowMedidasModal(true); }}>
              <Icon name="plus" size={16} /> Registrar medidas
            </button>
          </div>
        )}
      </div>

      {/* ── Modais ── */}
      <Modal open={showMarkModal} onClose={() => setShowMarkModal(false)} title="Marcar menstruação"
        footer={<button className="btn-primary" onClick={() => markPeriod(markDate)}>
          {cycleStarts.includes(markDate) ? '✕  Remover esta data' : '🩸  Marcar menstruação'}
        </button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Selecione a data de início da menstruação:</div>
          <input className="input" type="date" value={markDate} onChange={e => setMarkDate(e.target.value)} />
        </div>
      </Modal>

      <Modal open={showEndModal} onClose={() => setShowEndModal(false)} title="Fim do período"
        footer={<button className="btn-primary" onClick={() => markPeriodEnd(endDate)}>✅ Registrar fim</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Quando sua menstruação terminou?</div>
          <input className="input" type="date" value={endDate} max={today} onChange={e => setEndDate(e.target.value)} />
        </div>
      </Modal>

      <Modal open={showMedModal} onClose={() => setShowMedModal(false)} title="Novo remédio/vitamina"
        footer={<button className="btn-primary" onClick={addMed}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome (ex: Vitamina D)" value={newMed.name} onChange={e => setNewMed(m => ({ ...m, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Dose (ex: 500mg, 1 cápsula)" value={newMed.dose} onChange={e => setNewMed(m => ({ ...m, dose: e.target.value }))} />
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Horário</label>
            <input className="input" type="time" value={newMed.time} onChange={e => setNewMed(m => ({ ...m, time: e.target.value }))} />
          </div>
          <button
            type="button"
            onClick={() => setNewMed(m => ({ ...m, notify: !m.notify }))}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--r)', border: `1.5px solid ${newMed.notify ? 'var(--accent)' : 'var(--line)'}`, background: newMed.notify ? 'var(--accent-bg)' : 'var(--surface)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bell" size={16} color={newMed.notify ? 'var(--accent)' : 'var(--text3)'} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--sans)' }}>Notificação</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--sans)' }}>Lembrete no horário marcado</div>
              </div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: newMed.notify ? 'var(--accent)' : 'var(--line)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: newMed.notify ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </button>
        </div>
      </Modal>

      <Modal open={showMedidasModal} onClose={() => setShowMedidasModal(false)} title="Registrar medidas"
        footer={<button className="btn-primary" onClick={addMedida}>Salvar medidas</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" type="date" value={medidasForm.date} max={today} onChange={e => setMedidasForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Peso (kg)</label>
              <input className="input" type="number" step="0.1" placeholder="Ex: 62.5" value={medidasForm.peso} onChange={e => setMedidasForm(f => ({ ...f, peso: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Altura (cm)</label>
              <input className="input" type="number" placeholder="Ex: 165" value={medidasForm.altura} onChange={e => setMedidasForm(f => ({ ...f, altura: e.target.value }))} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 4 }}>Medidas corporais (cm)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { key: 'busto',   label: 'Busto' },
              { key: 'cintura', label: 'Cintura' },
              { key: 'quadril', label: 'Quadril' },
              { key: 'bracoe',  label: 'Braço Esq.' },
              { key: 'bracod',  label: 'Braço Dir.' },
              { key: 'coxa',    label: 'Coxa' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                <input className="input" type="number" step="0.5" placeholder="cm" value={medidasForm[f.key]} onChange={e => setMedidasForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} title="Novo treino"
        footer={<button className="btn-primary" onClick={addWorkout}>Salvar</button>}
      >
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
        </div>
      </Modal>
    </div>
  );
};

export default Saude;
