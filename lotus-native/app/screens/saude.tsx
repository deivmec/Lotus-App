import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2);
const today = new Date().toISOString().slice(0, 10);
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const fmtShortDate = (d: string) => {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${parseInt(day)} ${MONTH_NAMES[parseInt(m, 10) - 1]}`;
};

// ─── Constants ────────────────────────────────────────────────────────────────

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

const WORKOUT_CATS = ['musculação', 'cardio', 'flexibilidade', 'esporte'];

const MEDIDAS_FIELDS = [
  { key: 'busto',   label: 'Busto' },
  { key: 'cintura', label: 'Cintura' },
  { key: 'quadril', label: 'Quadril' },
  { key: 'bracoe',  label: 'Braço Esq.' },
  { key: 'bracod',  label: 'Braço Dir.' },
  { key: 'coxa',    label: 'Coxa' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mood { date: string; level: number; }
interface Med { id: string; name: string; dose: string; time: string; notify?: boolean; }
interface MedLogs { [key: string]: boolean; }
interface Workout { id: string; type: string; date: string; duration: string; category: string; }
interface PeriodEnd { start: string; end: string; }
interface Medida { id: string; date: string; peso: string; altura: string; busto: string; cintura: string; quadril: string; bracoe: string; bracod: string; coxa: string; }

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SaudeScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { width } = useWindowDimensions();
  const cellW = Math.floor((width - 2 * spacing.screenPad - 6 * 3) / 7);

  const [tab, setTab] = useState('humor');

  // Storage
  const [moods,       saveMoods]       = useStorage<Mood[]>('saude:moods', []);
  const [meds,        saveMeds]        = useStorage<Med[]>('saude:meds', []);
  const [medLogs,     saveMedLogs]     = useStorage<MedLogs>('saude:medlogs', {});
  const [workouts,    saveWorkouts]    = useStorage<Workout[]>('saude:treinos', []);
  const [cycleStarts, saveCycleStarts] = useStorage<string[]>('saude:ciclo-starts', []);
  const [periodEnds,  savePeriodEnds]  = useStorage<PeriodEnd[]>('saude:period-ends', []);
  const [cycleLen,    saveCycleLen]    = useStorage<number>('saude:cycle-len', 28);
  const [periodLen,   savePeriodLen]   = useStorage<number>('saude:period-len', 5);
  const [medidas,     saveMedidas]     = useStorage<Medida[]>('saude:medidas', []);

  // Modal states
  const [showMedModal,      setShowMedModal]      = useState(false);
  const [showWorkoutModal,  setShowWorkoutModal]  = useState(false);
  const [showMarkModal,     setShowMarkModal]     = useState(false);
  const [showEndModal,      setShowEndModal]      = useState(false);
  const [showCycleSettings, setShowCycleSettings] = useState(false);
  const [showMedidasModal,  setShowMedidasModal]  = useState(false);

  // Form states
  const [markDate,  setMarkDate]  = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [cycleLenInput,  setCycleLenInput]  = useState(String(cycleLen));
  const [periodLenInput, setPeriodLenInput] = useState(String(periodLen));

  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '08:00' });
  const [newWorkout, setNewWorkout] = useState({ type: '', date: today, duration: '', category: 'musculação' });
  const [medidasForm, setMedidasForm] = useState<Omit<Medida, 'id'>>({
    date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '',
  });

  const toast = useToast();

  // Sync input strings when storage loads
  useEffect(() => { setCycleLenInput(String(cycleLen)); }, [cycleLen]);
  useEffect(() => { setPeriodLenInput(String(periodLen)); }, [periodLen]);

  // ── Humor ────────────────────────────────────────────────────────────────────

  const todayMood = moods.find(m => m.date === today);

  const setMood = (level: number) => {
    saveMoods((ms: Mood[]) => {
      const idx = ms.findIndex(m => m.date === today);
      if (idx >= 0) { const u = [...ms]; u[idx] = { date: today, level }; return u; }
      return [...ms, { date: today, level }];
    });
    toast('Humor registrado');
  };

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const m = moods.find((x: Mood) => x.date === date);
    return { date, level: m?.level || 0, label: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()] };
  });

  // ── Meds ─────────────────────────────────────────────────────────────────────

  const addMed = () => {
    if (!newMed.name.trim()) return;
    saveMeds((ms: Med[]) => [...ms, { id: newId(), ...newMed }]);
    setNewMed({ name: '', dose: '', time: '08:00' });
    setShowMedModal(false);
    toast('Remédio adicionado');
  };

  const delMed = (id: string) => {
    saveMeds((ms: Med[]) => ms.filter(m => m.id !== id));
    toast('Removido');
  };

  const toggleMed = (id: string) => {
    const key = `${id}:${today}`;
    saveMedLogs((logs: MedLogs) => ({ ...logs, [key]: !logs[key] }));
  };

  // ── Workouts ──────────────────────────────────────────────────────────────────

  const addWorkout = () => {
    if (!newWorkout.type.trim()) return;
    saveWorkouts((ws: Workout[]) => [{ id: newId(), ...newWorkout }, ...ws]);
    setNewWorkout({ type: '', date: today, duration: '', category: 'musculação' });
    setShowWorkoutModal(false);
    toast('Treino adicionado');
  };

  const delWorkout = (id: string) => {
    saveWorkouts((ws: Workout[]) => ws.filter(w => w.id !== id));
    toast('Removido');
  };

  // ── Medidas ───────────────────────────────────────────────────────────────────

  const addMedida = () => {
    const hasValue = Object.entries(medidasForm).some(([k, v]) => k !== 'date' && String(v).trim());
    if (!hasValue) return;
    saveMedidas((ms: Medida[]) => [
      { id: newId(), ...medidasForm },
      ...ms.filter(m => m.date !== medidasForm.date),
    ]);
    setMedidasForm({ date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '' });
    setShowMedidasModal(false);
    toast('Medidas salvas');
  };

  const lastMedida = medidas[0] || null;

  // ── Ciclo ─────────────────────────────────────────────────────────────────────

  const calcCycleInfo = () => {
    if (!cycleStarts.length) return null;
    const sorted = [...cycleStarts].sort();
    const lastStart = sorted[sorted.length - 1];
    const todayD = new Date(today + 'T00:00:00');
    const lastD  = new Date(lastStart + 'T00:00:00');

    let avgLen = cycleLen;
    if (sorted.length >= 2) {
      const diffs: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        diffs.push(Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000));
      }
      let ws = 0, wv = 0;
      diffs.forEach((v, i) => { const w = i + 1; ws += w; wv += v * w; });
      const weighted = Math.round(wv / ws);
      avgLen = Math.max(21, Math.min(45, weighted));
    }

    const periodEndsData = periodEnds || [];
    const pLens = periodEndsData
      .map(r => r.start && r.end
        ? Math.max(1, Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 86400000) + 1)
        : null)
      .filter((x): x is number => x !== null);
    if (pLens.length) {
      const avgPLen = Math.round(pLens.reduce((a, b) => a + b) / pLens.length);
      savePeriodLen(Math.max(2, Math.min(10, avgPLen)));
    }

    const rawDay = Math.max(1, Math.round((todayD.getTime() - lastD.getTime()) / 86400000) + 1);
    const cyclesElapsed = Math.max(0, Math.floor((rawDay - 1) / avgLen));
    const cycleDayNum   = rawDay - cyclesElapsed * avgLen;

    const currentCycleStartD = new Date(lastD);
    currentCycleStartD.setDate(currentCycleStartD.getDate() + cyclesElapsed * avgLen);

    const nextPeriodD = new Date(currentCycleStartD);
    nextPeriodD.setDate(nextPeriodD.getDate() + avgLen);
    const daysUntilNext = Math.round((nextPeriodD.getTime() - todayD.getTime()) / 86400000);

    const pd = periodLen;
    const ovDay = avgLen - 14;

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
      nextPeriod:        nextPeriodD.toISOString().slice(0, 10),
      daysUntilNext,
      fertileStart:      fertileStartD.toISOString().slice(0, 10),
      fertileEnd:        fertileEndD.toISOString().slice(0, 10),
      currentCycleStart: currentCycleStartD.toISOString().slice(0, 10),
    };
  };

  const getDayType = (dateStr: string, info: ReturnType<typeof calcCycleInfo>): 'period' | 'fertile' | null => {
    if (!info) return null;
    const { currentCycleStart, avgLen, periodLen: pd, ovDay } = info;
    const base = new Date(currentCycleStart + 'T00:00:00');
    const d    = new Date(dateStr + 'T00:00:00');
    const ovDiff = ovDay - 1;
    for (let cycle = -2; cycle <= 4; cycle++) {
      const cs = new Date(base);
      cs.setDate(cs.getDate() + cycle * avgLen);
      const diff = Math.round((d.getTime() - cs.getTime()) / 86400000);
      if (diff >= 0 && diff < pd)                    return 'period';
      if (diff >= ovDiff - 4 && diff <= ovDiff + 2) return 'fertile';
    }
    return null;
  };

  const markPeriod = (date: string) => {
    if (cycleStarts.includes(date)) {
      saveCycleStarts((cs: string[]) => cs.filter(x => x !== date));
      toast('Data removida');
    } else {
      saveCycleStarts((cs: string[]) => [...cs, date].sort());
      toast('Menstruação marcada!');
    }
    setShowMarkModal(false);
  };

  const markPeriodEnd = (end: string) => {
    const sorted = [...cycleStarts].sort();
    const start = sorted.filter(s => s <= end).pop();
    if (!start) { toast('Nenhum início registrado antes desta data'); return; }
    savePeriodEnds((es: PeriodEnd[]) => {
      const filtered = es.filter(e => e.start !== start);
      return [...filtered, { start, end }];
    });
    setShowEndModal(false);
    toast('Fim do período registrado');
  };

  const calcAnalysis = () => {
    const sorted = [...cycleStarts].sort();
    if (sorted.length < 2) return null;
    const diffs: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      diffs.push(Math.round((new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000));
    }
    const mean = diffs.reduce((a, b) => a + b) / diffs.length;
    const variance = diffs.length > 1
      ? diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / (diffs.length - 1)
      : 0;
    const std = Math.sqrt(variance);
    let ws = 0, wv = 0;
    diffs.forEach((v, i) => { const w = i + 1; ws += w; wv += v * w; });
    const weighted = Math.round(wv / ws);
    const pLens = periodEnds
      .map(r => r.start && r.end ? Math.max(1, Math.round((new Date(r.end).getTime() - new Date(r.start).getTime()) / 86400000) + 1) : null)
      .filter((x): x is number => x !== null);
    const avgPeriod = pLens.length ? Math.round(pLens.reduce((a, b) => a + b) / pLens.length) : null;
    const recentAvg = diffs.length >= 4 ? diffs.slice(-3).reduce((a, b) => a + b) / 3 : null;
    const trend = recentAvg !== null
      ? (recentAvg > mean + 1.5 ? 'longer' : recentAvg < mean - 1.5 ? 'shorter' : 'stable')
      : null;
    const regularity = std < 2 ? 'Muito regular' : std < 4 ? 'Regular' : std < 7 ? 'Levemente irregular' : 'Irregular';
    const regColor   = std < 2 ? colors.green : std < 4 ? '#1E88E5' : std < 7 ? colors.accent : colors.red;
    const confidence = diffs.length >= 6 ? 'Alta' : diffs.length >= 3 ? 'Média' : 'Baixa';
    const confColor  = diffs.length >= 6 ? colors.green : diffs.length >= 3 ? '#1E88E5' : colors.text3;
    return {
      count: diffs.length, mean: Math.round(mean), weighted,
      min: Math.min(...diffs), max: Math.max(...diffs),
      std: parseFloat(std.toFixed(1)),
      regularity, regColor, avgPeriod, trend, confidence, confColor,
    };
  };

  const cycleInfo  = calcCycleInfo();
  const analysis   = calcAnalysis();

  // Calendar helpers
  const calYear      = parseInt(today.slice(0, 4));
  const calMonth     = parseInt(today.slice(5, 7)) - 1;
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const firstCalDay  = new Date(calYear, calMonth, 1).getDay();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <BackHeader title="Saúde & Bem-estar" />

      {/* Tab chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabChip, tab === t.id && styles.tabChipActive]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabChipText, tab === t.id && styles.tabChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ══════════════════════════════════════════
            TAB: HUMOR
        ══════════════════════════════════════════ */}
        {tab === 'humor' && (
          <View style={styles.gap16}>
            <Text style={styles.sectionLabel}>Como você está hoje?</Text>

            {/* Mood buttons */}
            <View style={styles.moodRow}>
              {MOODS.map(m => {
                const selected = todayMood?.level === m.level;
                return (
                  <TouchableOpacity
                    key={m.level}
                    style={[styles.moodBtn, selected && styles.moodBtnSelected]}
                    onPress={() => setMood(m.level)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={styles.moodLabel}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Últimos 7 dias</Text>

            {/* Last 7 days */}
            <View style={styles.moodRow}>
              {last7.map((d, i) => {
                const m = MOODS.find(x => x.level === d.level);
                return (
                  <View key={i} style={styles.moodDaySlot}>
                    <Text style={styles.moodDayEmoji}>{m ? m.emoji : '·'}</Text>
                    <Text style={styles.moodDayLabel}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB: REMÉDIOS
        ══════════════════════════════════════════ */}
        {tab === 'remedios' && (
          <View style={styles.gap16}>
            {meds.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>💊</Text>
                <Text style={styles.emptyTitle}>Nenhum remédio cadastrado</Text>
              </View>
            ) : (
              <View style={[styles.card, styles.cardFlush]}>
                {meds.map((med, i) => {
                  const taken = medLogs[`${med.id}:${today}`];
                  return (
                    <View
                      key={med.id}
                      style={[
                        styles.medRow,
                        i < meds.length - 1 && styles.borderBottom,
                      ]}
                    >
                      {/* Pill toggle */}
                      <TouchableOpacity
                        style={[styles.pillToggle, taken && styles.pillToggleTaken]}
                        onPress={() => toggleMed(med.id)}
                        activeOpacity={0.75}
                      >
                        <Icon name="pill" size={16} color={taken ? '#fff' : colors.text3} />
                      </TouchableOpacity>

                      {/* Info */}
                      <View style={styles.flex1}>
                        <Text style={styles.medName} numberOfLines={1}>{med.name}</Text>
                        <View style={styles.tagsRow}>
                          {!!med.time && (
                            <View style={styles.timeTag}>
                              <Text style={styles.timeTagText}>🕐 {med.time}</Text>
                            </View>
                          )}
                          {!!med.dose && (
                            <Text style={styles.medDose}>{med.dose}</Text>
                          )}
                        </View>
                      </View>

                      {/* Taken badge */}
                      {taken && (
                        <View style={styles.takenBadge}>
                          <Text style={styles.takenBadgeText}>✓</Text>
                        </View>
                      )}

                      {/* Trash */}
                      <TouchableOpacity onPress={() => delMed(med.id)} activeOpacity={0.7} style={styles.iconBtn}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowMedModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar remédio/vitamina</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB: TREINOS
        ══════════════════════════════════════════ */}
        {tab === 'treinos' && (
          <View style={styles.gap16}>
            {workouts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🏋️</Text>
                <Text style={styles.emptyTitle}>Nenhum treino registrado</Text>
              </View>
            ) : (
              <View style={styles.gap8}>
                {workouts.slice(0, 20).map(w => {
                  const icon = w.category === 'cardio' ? 'run' : w.category === 'flexibilidade' ? 'leaf' : 'dumbbell';
                  return (
                    <View key={w.id} style={[styles.card, styles.workoutCard]}>
                      <View style={styles.workoutIcon}>
                        <Icon name={icon} size={18} color={colors.text2} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.workoutType} numberOfLines={1}>{w.type}</Text>
                        <Text style={styles.workoutMeta}>{w.date}{w.duration ? ` · ${w.duration}` : ''}</Text>
                      </View>
                      <View style={styles.catTag}>
                        <Text style={styles.catTagText}>{w.category}</Text>
                      </View>
                      <TouchableOpacity onPress={() => delWorkout(w.id)} activeOpacity={0.7} style={styles.iconBtn}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowWorkoutModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Registrar treino</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB: CICLO
        ══════════════════════════════════════════ */}
        {tab === 'ciclo' && (
          <View style={styles.gap16}>
            {!cycleInfo ? (
              /* Empty state */
              <View style={styles.gap16}>
                <View style={styles.cicloEmpty}>
                  <Text style={styles.emptyEmoji}>🩸</Text>
                  <Text style={styles.cicloEmptyTitle}>Rastreie seu ciclo</Text>
                  <Text style={styles.cicloEmptyDesc}>
                    Marque o início da sua menstruação para receber previsões personalizadas das fases do ciclo.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => { setMarkDate(today); setShowMarkModal(true); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>🩸  Minha menstruação começou</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.gap16}>

                {/* Phase card */}
                <View style={[styles.phaseCard, { backgroundColor: cycleInfo.phase.color + '14', borderColor: cycleInfo.phase.color + '35' }]}>
                  <View style={styles.phaseCardTop}>
                    <View>
                      <Text style={styles.sectionLabel}>Fase atual</Text>
                      <View style={styles.phaseNameRow}>
                        <Text style={styles.phaseEmoji}>{cycleInfo.phase.emoji}</Text>
                        <Text style={styles.phaseName}>{cycleInfo.phase.name}</Text>
                      </View>
                    </View>
                    <View style={styles.cycleDayBox}>
                      <Text style={styles.cycleDayLabel}>Dia do ciclo</Text>
                      <Text style={[styles.cycleDayNum, { color: cycleInfo.phase.color }]}>{cycleInfo.cycleDayNum}</Text>
                      <Text style={styles.cycleAvgLen}>de {cycleInfo.avgLen}</Text>
                    </View>
                  </View>

                  {/* Progress bar segments */}
                  <View style={styles.progressSegsRow}>
                    {Array.from({ length: cycleInfo.avgLen }, (_, i) => {
                      const day = i + 1;
                      const pd  = cycleInfo.periodLen;
                      const ov  = cycleInfo.ovDay;
                      let segColor: string;
                      if (day <= pd)                            segColor = '#E53935';
                      else if (day >= ov - 4 && day <= ov + 2) segColor = '#43A047';
                      else if (day < ov - 4)                   segColor = '#FF7043';
                      else                                      segColor = '#7B1FA2';
                      const active  = day <= cycleInfo.cycleDayNum;
                      const current = day === cycleInfo.cycleDayNum;
                      return (
                        <View
                          key={i}
                          style={[
                            styles.progressSeg,
                            { backgroundColor: active ? segColor : colors.bg3 },
                            current && styles.progressSegCurrent,
                          ]}
                        />
                      );
                    })}
                  </View>

                  <Text style={styles.phaseDesc}>{cycleInfo.phase.desc}</Text>

                  <View style={styles.daysUntilRow}>
                    {cycleInfo.daysUntilNext > 0 && (
                      <Text style={styles.daysUntilText}>
                        Próxima menstruação em{' '}
                        <Text style={styles.daysUntilHighlight}>{cycleInfo.daysUntilNext} dias</Text>
                      </Text>
                    )}
                    {cycleInfo.daysUntilNext === 0 && (
                      <Text style={styles.daysUntilHighlight}>Sua menstruação pode começar hoje!</Text>
                    )}
                    {cycleInfo.daysUntilNext < 0 && (
                      <Text style={styles.daysUntilHighlight}>
                        Período esperado há {Math.abs(cycleInfo.daysUntilNext)} dias
                      </Text>
                    )}
                  </View>
                </View>

                {/* Mark today button */}
                <TouchableOpacity
                  style={[
                    styles.markTodayBtn,
                    cycleStarts.includes(today) && styles.markTodayBtnActive,
                  ]}
                  onPress={() => { setMarkDate(today); setShowMarkModal(true); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.markTodayBtnEmoji}>🩸</Text>
                  <Text style={[styles.markTodayBtnText, cycleStarts.includes(today) && styles.markTodayBtnTextActive]}>
                    {cycleStarts.includes(today) ? 'Menstruação marcada hoje ✓' : 'Minha menstruação começou'}
                  </Text>
                </TouchableOpacity>

                {/* Next dates card */}
                <View style={styles.card}>
                  <Text style={[styles.sectionLabel, { marginBottom: 12 }]}>Próximas datas</Text>
                  <View style={styles.gap12}>
                    <View style={styles.dateRow}>
                      <View style={styles.dateRowLeft}>
                        <View style={[styles.dateDot, { backgroundColor: '#E53935' }]} />
                        <Text style={styles.dateRowLabel}>Próxima menstruação</Text>
                      </View>
                      <Text style={[styles.dateRowValue, { color: '#E53935' }]}>{fmtShortDate(cycleInfo.nextPeriod)}</Text>
                    </View>
                    <View style={styles.dateRow}>
                      <View style={styles.dateRowLeft}>
                        <View style={[styles.dateDot, { backgroundColor: '#43A047' }]} />
                        <Text style={styles.dateRowLabel}>Janela fértil</Text>
                      </View>
                      <Text style={[styles.dateRowValue, { color: '#43A047' }]}>
                        {fmtShortDate(cycleInfo.fertileStart)} – {fmtShortDate(cycleInfo.fertileEnd)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fases do ciclo */}
                <View style={styles.card}>
                  <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Fases do ciclo</Text>
                  <View style={styles.gap6}>
                    {PHASES.map(ph => {
                      const active = cycleInfo.phase.id === ph.id;
                      return (
                        <View
                          key={ph.id}
                          style={[
                            styles.phaseRow,
                            active && { backgroundColor: ph.color + '12', borderColor: ph.color + '35' },
                          ]}
                        >
                          <Text style={styles.phaseRowEmoji}>{ph.emoji}</Text>
                          <View style={styles.flex1}>
                            <Text style={[styles.phaseRowName, { color: active ? ph.color : colors.text2 }]}>
                              {ph.name}{' '}
                              <Text style={styles.phaseRowRange}>· {ph.dayRange}</Text>
                            </Text>
                            {active && (
                              <Text style={styles.phaseRowDesc}>{ph.desc}</Text>
                            )}
                          </View>
                          {active && (
                            <View style={[styles.phaseActiveDot, { backgroundColor: ph.color }]} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Mini calendar */}
                <View style={styles.card}>
                  <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>
                    Calendário — {MONTH_NAMES[calMonth]}
                  </Text>

                  {/* Week headers */}
                  <View style={styles.calWeekRow}>
                    {['D','S','T','Q','Q','S','S'].map((d, i) => (
                      <View key={i} style={[styles.calCell, { width: cellW }]}>
                        <Text style={styles.calWeekHeader}>{d}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Day cells */}
                  <View style={styles.calGrid}>
                    {/* Empty cells for offset */}
                    {Array.from({ length: firstCalDay }, (_, i) => (
                      <View key={`e${i}`} style={{ width: cellW, height: cellW, margin: 1.5 }} />
                    ))}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isToday  = dateStr === today;
                      const isActual = cycleStarts.some(s => {
                        const diff = Math.round((new Date(dateStr).getTime() - new Date(s).getTime()) / 86400000);
                        return diff >= 0 && diff < periodLen;
                      });
                      const dayType = getDayType(dateStr, cycleInfo);
                      let bgColor = 'transparent';
                      let textColor: string = colors.text;
                      if (isActual)             { bgColor = '#E53935'; textColor = '#fff'; }
                      else if (dayType === 'period')  bgColor = '#E5393555';
                      else if (dayType === 'fertile') bgColor = '#43A04755';
                      return (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.calDayCell,
                            { width: cellW, height: cellW, backgroundColor: bgColor },
                            isToday && styles.calDayCellToday,
                          ]}
                          onPress={() => { setMarkDate(dateStr); setShowMarkModal(true); }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.calDayText,
                            { color: textColor },
                            isToday && { color: colors.accent, fontFamily: fonts.sansSemiBold },
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Legend */}
                  <View style={styles.calLegend}>
                    {[
                      { color: '#E53935',   label: 'Menstruação real' },
                      { color: '#E5393555', label: 'Previsto' },
                      { color: '#43A04755', label: 'Fértil' },
                    ].map(({ color, label }) => (
                      <View key={label} style={styles.calLegendItem}>
                        <View style={[styles.calLegendDot, { backgroundColor: color }]} />
                        <Text style={styles.calLegendText}>{label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* History chips */}
                {cycleStarts.length > 0 && (
                  <View style={styles.card}>
                    <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>Histórico de ciclos</Text>
                    <View style={styles.historyChips}>
                      {[...cycleStarts].sort().reverse().slice(0, 10).map(date => (
                        <View key={date} style={styles.historyChip}>
                          <Text style={styles.historyChipText}>🩸 {fmtShortDate(date)}</Text>
                          <TouchableOpacity
                            onPress={() => saveCycleStarts((cs: string[]) => cs.filter(d => d !== date))}
                            activeOpacity={0.7}
                            style={{ padding: 2 }}
                          >
                            <Icon name="x" size={10} color={colors.text3} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Period end button */}
                <TouchableOpacity
                  style={styles.periodEndBtn}
                  onPress={() => { setEndDate(today); setShowEndModal(true); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.periodEndBtnText}>✅  Minha menstruação terminou</Text>
                </TouchableOpacity>

                {/* Settings toggle */}
                <TouchableOpacity
                  style={styles.settingsToggle}
                  onPress={() => setShowCycleSettings(s => !s)}
                  activeOpacity={0.7}
                >
                  <Icon name={showCycleSettings ? 'chevronDown' : 'arrow'} size={12} color={colors.text3} />
                  <Text style={styles.settingsToggleText}>Configurações do ciclo</Text>
                </TouchableOpacity>

                {showCycleSettings && (
                  <View style={styles.card}>
                    <View style={styles.settingsRow}>
                      <View style={styles.flex1}>
                        <Text style={styles.fieldLabel}>Duração do ciclo</Text>
                        <View style={styles.settingsInputRow}>
                          <TextInput
                            style={[styles.input, styles.settingsInput]}
                            value={cycleLenInput}
                            onChangeText={setCycleLenInput}
                            onBlur={() => {
                              const v = Math.max(21, Math.min(45, parseInt(cycleLenInput) || 28));
                              saveCycleLen(v);
                              setCycleLenInput(String(v));
                            }}
                            keyboardType="numeric"
                            placeholderTextColor={colors.text3}
                          />
                          <Text style={styles.settingsUnit}>dias</Text>
                        </View>
                      </View>
                      <View style={styles.settingsGap} />
                      <View style={styles.flex1}>
                        <Text style={styles.fieldLabel}>Duração do período</Text>
                        <View style={styles.settingsInputRow}>
                          <TextInput
                            style={[styles.input, styles.settingsInput]}
                            value={periodLenInput}
                            onChangeText={setPeriodLenInput}
                            onBlur={() => {
                              const v = Math.max(2, Math.min(10, parseInt(periodLenInput) || 5));
                              savePeriodLen(v);
                              setPeriodLenInput(String(v));
                            }}
                            keyboardType="numeric"
                            placeholderTextColor={colors.text3}
                          />
                          <Text style={styles.settingsUnit}>dias</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Analysis */}
                {analysis && (
                  <View style={styles.card}>
                    <View style={styles.analysisHeader}>
                      <Text style={styles.sectionLabel}>Análise do seu ciclo</Text>
                      <View style={[styles.confidenceBadge, { backgroundColor: analysis.confColor + '18' }]}>
                        <Text style={[styles.confidenceBadgeText, { color: analysis.confColor }]}>
                          Confiança {analysis.confidence}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statsGrid}>
                      {[
                        { label: 'Ciclos registrados', value: String(analysis.count), unit: 'ciclos' },
                        { label: 'Duração média',      value: String(analysis.weighted), unit: 'dias' },
                        { label: 'Menor ciclo',        value: String(analysis.min), unit: 'dias' },
                        { label: 'Maior ciclo',        value: String(analysis.max), unit: 'dias' },
                        ...(analysis.avgPeriod ? [{ label: 'Período médio', value: String(analysis.avgPeriod), unit: 'dias' }] : []),
                      ].map(s => (
                        <View key={s.label} style={styles.statCell}>
                          <Text style={styles.statCellLabel}>{s.label}</Text>
                          <View style={styles.statCellValueRow}>
                            <Text style={styles.statCellValue}>{s.value}</Text>
                            <Text style={styles.statCellUnit}>{s.unit}</Text>
                          </View>
                        </View>
                      ))}
                      <View style={[styles.statCell, { backgroundColor: analysis.regColor + '14', borderWidth: 1, borderColor: analysis.regColor + '30' }]}>
                        <Text style={styles.statCellLabel}>Regularidade</Text>
                        <Text style={[styles.statCellRegularity, { color: analysis.regColor }]}>{analysis.regularity}</Text>
                        <Text style={styles.statCellStd}>±{analysis.std} dias</Text>
                      </View>
                    </View>

                    {analysis.trend && (
                      <View style={styles.trendBox}>
                        <Text style={styles.trendText}>
                          {analysis.trend === 'longer'  && '📈 Seus últimos ciclos estão sendo mais longos que o habitual.'}
                          {analysis.trend === 'shorter' && '📉 Seus últimos ciclos estão sendo mais curtos que o habitual.'}
                          {analysis.trend === 'stable'  && '✨ Seu ciclo está estável — sem variações significativas recentes.'}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.analysisNote}>
                      {analysis.count < 3
                        ? 'Registre mais ciclos para previsões mais precisas. Com 3+ ciclos, as estimativas ficam bem melhores.'
                        : analysis.count < 6
                        ? `Com ${analysis.count} ciclos registrados, as previsões já são personalizadas para você.`
                        : `Com ${analysis.count} ciclos, as previsões estão bem calibradas para o seu padrão.`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════
            TAB: MEDIDAS
        ══════════════════════════════════════════ */}
        {tab === 'medidas' && (
          <View style={styles.gap16}>
            {lastMedida ? (
              <View style={styles.gap16}>
                {/* Latest measures card */}
                <View style={styles.card}>
                  <View style={styles.medidasCardHeader}>
                    <Text style={styles.sectionLabel}>Últimas medidas</Text>
                    <Text style={styles.medidasDate}>{lastMedida.date}</Text>
                  </View>

                  {/* Peso + Altura highlight */}
                  {(lastMedida.peso || lastMedida.altura) && (
                    <View style={styles.medidasHighlight}>
                      {!!lastMedida.peso && (
                        <View style={[styles.medidasBigCell, { backgroundColor: colors.accentBg }]}>
                          <Text style={styles.medidasBigLabel}>Peso</Text>
                          <View style={styles.medidasBigValueRow}>
                            <Text style={[styles.medidasBigValue, { color: colors.accent }]}>{lastMedida.peso}</Text>
                            <Text style={styles.medidasBigUnit}>kg</Text>
                          </View>
                        </View>
                      )}
                      {!!lastMedida.altura && (
                        <View style={[styles.medidasBigCell, { backgroundColor: colors.bg2 }]}>
                          <Text style={styles.medidasBigLabel}>Altura</Text>
                          <View style={styles.medidasBigValueRow}>
                            <Text style={[styles.medidasBigValue, { color: colors.text }]}>{lastMedida.altura}</Text>
                            <Text style={styles.medidasBigUnit}>cm</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 3-col grid for other measurements */}
                  <View style={styles.medidasGrid}>
                    {MEDIDAS_FIELDS.filter(f => lastMedida[f.key as keyof Medida]).map(f => (
                      <View key={f.key} style={styles.medidasCell}>
                        <Text style={styles.medidasCellLabel}>{f.label}</Text>
                        <View style={styles.medidasCellValueRow}>
                          <Text style={styles.medidasCellValue}>{lastMedida[f.key as keyof Medida]}</Text>
                          <Text style={styles.medidasCellUnit}>cm</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* History */}
                {medidas.length > 1 && (
                  <View style={styles.gap8}>
                    <Text style={styles.sectionLabel}>Histórico</Text>
                    {medidas.slice(1, 10).map(m => (
                      <View key={m.id} style={[styles.card, styles.historyCard]}>
                        <View style={styles.flex1}>
                          <Text style={styles.historyDate}>{m.date}</Text>
                          <View style={styles.historyMeasures}>
                            {m.peso   && <Text style={styles.historyMeasure}>⚖️ {m.peso}kg</Text>}
                            {m.busto  && <Text style={styles.historyMeasure}>👙 {m.busto}cm</Text>}
                            {m.cintura && <Text style={styles.historyMeasure}>📏 {m.cintura}cm</Text>}
                            {m.quadril && <Text style={styles.historyMeasure}>{m.quadril}cm</Text>}
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => { saveMedidas((ms: Medida[]) => ms.filter(x => x.id !== m.id)); toast('Removido'); }}
                          activeOpacity={0.7}
                          style={styles.iconBtn}
                        >
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📏</Text>
                <Text style={styles.emptyTitle}>Nenhuma medida registrada</Text>
                <Text style={styles.emptySub}>Registre peso, altura e medidas corporais</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.btnAdd}
              onPress={() => {
                setMedidasForm({ date: today, peso: '', altura: '', busto: '', cintura: '', quadril: '', bracoe: '', bracod: '', coxa: '' });
                setShowMedidasModal(true);
              }}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Registrar medidas</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ═══════════════════════════════════════════
          MODAL: Marcar menstruação
      ═══════════════════════════════════════════ */}
      <Modal
        open={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        title="Marcar menstruação"
        footer={
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => markPeriod(markDate)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {cycleStarts.includes(markDate) ? '✕  Remover esta data' : '🩸  Marcar menstruação'}
            </Text>
          </TouchableOpacity>
        }
      >
        <Text style={styles.modalDesc}>Selecione a data de início da menstruação:</Text>
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.text3}
          value={markDate}
          onChangeText={setMarkDate}
          keyboardType="numeric"
        />
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL: Fim do período
      ═══════════════════════════════════════════ */}
      <Modal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Fim do período"
        footer={
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => markPeriodEnd(endDate)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>✅  Registrar fim</Text>
          </TouchableOpacity>
        }
      >
        <Text style={styles.modalDesc}>Quando sua menstruação terminou?</Text>
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.text3}
          value={endDate}
          onChangeText={setEndDate}
          keyboardType="numeric"
        />
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL: Novo remédio
      ═══════════════════════════════════════════ */}
      <Modal
        open={showMedModal}
        onClose={() => setShowMedModal(false)}
        title="Novo remédio/vitamina"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addMed} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome (ex: Vitamina D)"
          placeholderTextColor={colors.text3}
          value={newMed.name}
          onChangeText={v => setNewMed(m => ({ ...m, name: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Dose (ex: 500mg, 1 cápsula)"
          placeholderTextColor={colors.text3}
          value={newMed.dose}
          onChangeText={v => setNewMed(m => ({ ...m, dose: v }))}
        />
        <Text style={styles.fieldLabel}>Horário</Text>
        <TextInput
          style={styles.input}
          placeholder="HH:MM"
          placeholderTextColor={colors.text3}
          value={newMed.time}
          onChangeText={v => setNewMed(m => ({ ...m, time: v }))}
          keyboardType="numeric"
        />
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL: Novo treino
      ═══════════════════════════════════════════ */}
      <Modal
        open={showWorkoutModal}
        onClose={() => setShowWorkoutModal(false)}
        title="Novo treino"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addWorkout} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Tipo (ex: Peito + Ombro)"
          placeholderTextColor={colors.text3}
          value={newWorkout.type}
          onChangeText={v => setNewWorkout(w => ({ ...w, type: v }))}
          autoFocus
        />
        <Text style={styles.fieldLabel}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRowH}>
            {WORKOUT_CATS.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, newWorkout.category === cat && styles.chipActive]}
                onPress={() => setNewWorkout(w => ({ ...w, category: cat }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, newWorkout.category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.text3}
          value={newWorkout.date}
          onChangeText={v => setNewWorkout(w => ({ ...w, date: v }))}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Duração (ex: 45min)"
          placeholderTextColor={colors.text3}
          value={newWorkout.duration}
          onChangeText={v => setNewWorkout(w => ({ ...w, duration: v }))}
        />
      </Modal>

      {/* ═══════════════════════════════════════════
          MODAL: Registrar medidas
      ═══════════════════════════════════════════ */}
      <Modal
        open={showMedidasModal}
        onClose={() => setShowMedidasModal(false)}
        title="Registrar medidas"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addMedida} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar medidas</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.text3}
          value={medidasForm.date}
          onChangeText={v => setMedidasForm(f => ({ ...f, date: v }))}
          keyboardType="numeric"
        />

        {/* Peso + Altura */}
        <View style={styles.medidas2Col}>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="kg"
              placeholderTextColor={colors.text3}
              value={medidasForm.peso}
              onChangeText={v => setMedidasForm(f => ({ ...f, peso: v }))}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.medidas2ColGap} />
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Altura (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="cm"
              placeholderTextColor={colors.text3}
              value={medidasForm.altura}
              onChangeText={v => setMedidasForm(f => ({ ...f, altura: v }))}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Medidas corporais</Text>

        {/* 2-col grid for body measurements */}
        <View style={styles.medidas2Col}>
          {MEDIDAS_FIELDS.map((f, i) => (
            <React.Fragment key={f.key}>
              <View style={styles.flex1}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="cm"
                  placeholderTextColor={colors.text3}
                  value={medidasForm[f.key as keyof typeof medidasForm]}
                  onChangeText={v => setMedidasForm(fm => ({ ...fm, [f.key]: v }))}
                  keyboardType="decimal-pad"
                />
              </View>
              {/* gap between pairs */}
              {i % 2 === 0 && <View style={styles.medidas2ColGap} />}
              {/* new row after each pair */}
              {i % 2 === 1 && i < MEDIDAS_FIELDS.length - 1 && (
                <View style={styles.medidas2ColBreak} />
              )}
            </React.Fragment>
          ))}
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: any) => StyleSheet.create({
  flex:  { flex: 1, backgroundColor: colors.bg },
  flex1: { flex: 1 },

  // ── Tab chips ──
  tabBar:  { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow:  { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabChipActive:     { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabChipText:       { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  tabChipTextActive: { color: colors.accentDk, fontFamily: fonts.sansMedium },

  // ── Content ──
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap6:    { gap: 6 },
  gap8:    { gap: 8 },
  gap12:   { gap: 12 },
  gap16:   { gap: 16 },

  // ── Section label ──
  sectionLabel: {
    fontFamily: fonts.sansMedium, fontSize: 11, color: colors.text2,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // ── Empty states ──
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  emptySub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 6 },

  // ── Cards ──
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 14,
  },
  cardFlush:    { padding: 0, overflow: 'hidden' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.line },

  // ── Mood ──
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  moodBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 5,
    paddingVertical: 12, paddingHorizontal: 4,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  moodBtnSelected: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  moodEmoji:       { fontSize: 22 },
  moodLabel:       { fontFamily: fonts.sans, fontSize: 9, color: colors.text3, letterSpacing: 0.05 },
  moodDaySlot:     { flex: 1, alignItems: 'center' },
  moodDayEmoji:    { fontSize: 20, marginBottom: 4 },
  moodDayLabel:    { fontFamily: fonts.sansMedium, fontSize: 9, color: colors.text3 },

  // ── Meds ──
  medRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  pillToggle: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.bg2, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pillToggleTaken: { backgroundColor: colors.green, borderColor: colors.green },
  medName:    { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text },
  tagsRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  timeTag:    { backgroundColor: colors.accentBg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  timeTagText:{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.accent },
  medDose:    { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  takenBadge: { backgroundColor: colors.greenBg, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  takenBadgeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.green },
  iconBtn:    { padding: 4 },

  // ── Workouts ──
  workoutCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  workoutIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.bg2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  workoutType: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text },
  workoutMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 2 },
  catTag: { backgroundColor: colors.bg2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  catTagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },

  // ── Ciclo ──
  cicloEmpty: { alignItems: 'center', paddingVertical: 32 },
  cicloEmptyTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text, marginTop: 12, marginBottom: 8 },
  cicloEmptyDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, textAlign: 'center', lineHeight: 20 },

  phaseCard: {
    borderWidth: 1.5, borderRadius: radius.md, padding: 16,
  },
  phaseCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  phaseNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  phaseEmoji:    { fontSize: 22 },
  phaseName:     { fontFamily: fonts.serif, fontSize: 21, color: colors.text },
  cycleDayBox:   { alignItems: 'flex-end' },
  cycleDayLabel: { fontFamily: fonts.sans, fontSize: 10, color: colors.text3, marginBottom: 4 },
  cycleDayNum:   { fontFamily: fonts.serif, fontSize: 30, lineHeight: 32 },
  cycleAvgLen:   { fontFamily: fonts.sans, fontSize: 10, color: colors.text3 },

  progressSegsRow:   { flexDirection: 'row', gap: 2, marginBottom: 12, alignItems: 'flex-end' },
  progressSeg:       { flex: 1, height: 6, borderRadius: 3 },
  progressSegCurrent:{ height: 12, marginTop: -3 },

  phaseDesc: { fontFamily: fonts.sans, fontSize: 12, color: colors.text2, lineHeight: 20 },
  daysUntilRow: { marginTop: 10 },
  daysUntilText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  daysUntilHighlight: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#E53935' },

  markTodayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 13, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: '#E5393540',
    backgroundColor: colors.surface,
  },
  markTodayBtnActive:    { backgroundColor: '#E5393518' },
  markTodayBtnEmoji:     { fontSize: 16 },
  markTodayBtnText:      { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text2 },
  markTodayBtnTextActive:{ color: '#E53935' },

  dateRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateDot:      { width: 10, height: 10, borderRadius: 5 },
  dateRowLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  dateRowValue: { fontFamily: fonts.sansMedium, fontSize: 13 },

  phaseRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 8, borderRadius: 8,
    borderWidth: 1, borderColor: 'transparent',
  },
  phaseRowEmoji:   { fontSize: 15, marginTop: 1 },
  phaseRowName:    { fontFamily: fonts.sansMedium, fontSize: 12 },
  phaseRowRange:   { fontFamily: fonts.sans, color: colors.text3 },
  phaseRowDesc:    { fontFamily: fonts.sans, fontSize: 11, color: colors.text2, marginTop: 3, lineHeight: 16 },
  phaseActiveDot:  { width: 7, height: 7, borderRadius: 3.5, marginTop: 3, flexShrink: 0 },

  // Calendar
  calWeekRow: { flexDirection: 'row', marginBottom: 4 },
  calCell:    { alignItems: 'center' },
  calWeekHeader: { fontFamily: fonts.sansMedium, fontSize: 9, color: colors.text3, paddingBottom: 2 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDayCell: {
    margin: 1.5, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  calDayCellToday: { borderColor: colors.accent, borderWidth: 1.5 },
  calDayText: { fontFamily: fonts.sans, fontSize: 11, color: colors.text },
  calLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calLegendDot:  { width: 10, height: 10, borderRadius: 3 },
  calLegendText: { fontFamily: fonts.sans, fontSize: 10, color: colors.text2 },

  // History chips
  historyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  historyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line,
  },
  historyChipText: { fontFamily: fonts.sans, fontSize: 11, color: colors.text2 },

  // Period end button
  periodEndBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 13, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: '#9C27B040',
    backgroundColor: colors.surface,
  },
  periodEndBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text2 },

  // Cycle settings toggle
  settingsToggle: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  settingsToggleText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  settingsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  settingsGap: { width: 12 },
  settingsInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsInput: { flex: 1, textAlign: 'center' },
  settingsUnit: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },

  // Analysis
  analysisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  confidenceBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  confidenceBadgeText: { fontFamily: fonts.sansMedium, fontSize: 11 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statCell: {
    width: '47%', backgroundColor: colors.bg2,
    borderRadius: radius.sm, padding: 10,
  },
  statCellLabel:      { fontFamily: fonts.sans, fontSize: 10, color: colors.text3, marginBottom: 4 },
  statCellValueRow:   { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statCellValue:      { fontFamily: fonts.serif, fontSize: 22, color: colors.text, lineHeight: 26 },
  statCellUnit:       { fontFamily: fonts.sans, fontSize: 10, color: colors.text3 },
  statCellRegularity: { fontFamily: fonts.sansMedium, fontSize: 13 },
  statCellStd:        { fontFamily: fonts.sans, fontSize: 10, color: colors.text3, marginTop: 2 },
  trendBox:    { backgroundColor: colors.bg2, borderRadius: radius.sm, padding: 10, marginBottom: 10 },
  trendText:   { fontFamily: fonts.sans, fontSize: 12, color: colors.text2 },
  analysisNote:{ fontFamily: fonts.sans, fontSize: 11, color: colors.text3, lineHeight: 18 },

  // ── Medidas ──
  medidasCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  medidasDate:       { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  medidasHighlight:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
  medidasBigCell:    { flex: 1, borderRadius: radius.sm, padding: 12 },
  medidasBigLabel:   { fontFamily: fonts.sans, fontSize: 10, color: colors.text3, marginBottom: 4 },
  medidasBigValueRow:{ flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  medidasBigValue:   { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 },
  medidasBigUnit:    { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  medidasGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medidasCell:       { width: '30.5%', backgroundColor: colors.bg2, borderRadius: 8, padding: 8 },
  medidasCellLabel:  { fontFamily: fonts.sans, fontSize: 9, color: colors.text3, marginBottom: 2 },
  medidasCellValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  medidasCellValue:  { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.text },
  medidasCellUnit:   { fontFamily: fonts.sans, fontSize: 9, color: colors.text3 },

  historyCard:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyDate:     { fontFamily: fonts.sans, fontSize: 11, color: colors.text3, marginBottom: 4 },
  historyMeasures: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  historyMeasure:  { fontFamily: fonts.sans, fontSize: 12, color: colors.text2 },

  // ── Modals ──
  modalDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  input: {
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  fieldLabel: {
    fontFamily: fonts.sansMedium, fontSize: 12, color: colors.text2, marginBottom: 6,
  },
  chipRowH:      { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  chip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  chipActive:    { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText:      { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive:{ color: colors.accentDk, fontFamily: fonts.sansMedium },

  medidas2Col:     { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  medidas2ColGap:  { width: 10 },
  medidas2ColBreak:{ width: '100%', height: 0 },

  // Buttons
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 12, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },

  btnPrimary:     { flex: 1, backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
