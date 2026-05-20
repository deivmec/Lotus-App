import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import Modal from '../../components/Modal';
import { useStorage } from '../../hooks/useStorage';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY        = new Date().toISOString().slice(0, 10);
const THIS_MONTH   = TODAY.slice(0, 7);
const TODAY_DAY_ID = (['dom','seg','ter','qua','qui','sex','sab'] as const)[new Date().getDay()];

const DAYS   = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

const MOODS = [
  { level: 1, emoji: '😔', label: 'Difícil' },
  { level: 2, emoji: '😕', label: 'Regular' },
  { level: 3, emoji: '😊', label: 'Ok' },
  { level: 4, emoji: '😄', label: 'Bem' },
  { level: 5, emoji: '🌟', label: 'Ótimo' },
];

const REFEICOES_MAP = [
  { id: 'cafe',   label: 'Café',   emoji: '☕' },
  { id: 'almoco', label: 'Almoço', emoji: '🥗' },
  { id: 'lanche', label: 'Lanche', emoji: '🍎' },
  { id: 'jantar', label: 'Jantar', emoji: '🍽️' },
];

const CONTENT_TYPES: Record<string, string> = {
  livro: '📖', filme: '🎬', série: '📺', podcast: '🎧', artigo: '📰', tutorial: '💻',
};

const QUICK_ACCESS = [
  { icon: 'cart',     label: 'Compras',    screen: 'compras' },
  { icon: 'wallet',   label: 'Finanças',   screen: 'financas' },
  { icon: 'calendar', label: 'Agenda',     screen: 'calendario' },
  { icon: 'heart',    label: 'Saúde',      screen: 'saude' },
  { icon: 'lock',     label: 'Cofre',      screen: 'cofre' },
  { icon: 'plane',    label: 'Viagem',     screen: 'viagem' },
  { icon: 'book',     label: 'Conteúdo',   screen: 'conteudo' },
  { icon: 'palette',  label: 'Inspiração', screen: 'inspiracao' },
];

const WIDGET_DEFS = [
  { id: 'mood',      emoji: '😊', label: 'Como você está',      desc: 'Registro de humor do dia' },
  { id: 'quicknote', emoji: '📝', label: 'Nota rápida',         desc: 'Anotações rápidas' },
  { id: 'stats',     emoji: '📊', label: 'Resumo do dia',       desc: 'Tarefas, hábitos e eventos' },
  { id: 'tarefas',   emoji: '✅', label: 'Tarefas do dia',      desc: 'Lista de pendências' },
  { id: 'habitos',   emoji: '🏃', label: 'Hábitos',             desc: 'Progresso dos hábitos' },
  { id: 'cardapio',  emoji: '🍽️', label: 'Cardápio de hoje',    desc: 'Refeições planejadas' },
  { id: 'contagem',  emoji: '⏳', label: 'Contagem regressiva', desc: 'Próximo evento com contagem' },
  { id: 'urgentes',  emoji: '⚡', label: 'Prazos urgentes',     desc: 'Tarefas com prazo próximo' },
  { id: 'agenda',    emoji: '📅', label: 'Hoje na agenda',      desc: 'Eventos do dia' },
  { id: 'financas',  emoji: '💸', label: 'Finanças',            desc: 'Resumo financeiro do mês' },
  { id: 'compras',   emoji: '🛒', label: 'Lista de compras',    desc: 'Itens da lista ativa' },
  { id: 'conteudo',  emoji: '📚', label: 'Conteúdo',            desc: 'O que está consumindo' },
  { id: 'notas',     emoji: '📓', label: 'Notas recentes',      desc: 'Últimas notas criadas' },
  { id: 'diario',    emoji: '✍️', label: 'Diário',              desc: 'Entrada de hoje' },
  { id: 'saude',     emoji: '💊', label: 'Saúde',               desc: 'Remédios e treinos' },
  { id: 'viagem',    emoji: '✈️', label: 'Próxima viagem',      desc: 'Destino planejado' },
  { id: 'inspiracao',emoji: '🎨', label: 'Inspiração',          desc: 'Paleta de cores' },
  { id: 'acesso',    emoji: '🔗', label: 'Acesso rápido',       desc: 'Atalhos para seções' },
];

const DEFAULT_CONFIG = [
  { id: 'mood',     size: 'medium' },
  { id: 'diario',   size: 'medium' },
  { id: 'stats',    size: 'medium' },
  { id: 'tarefas',  size: 'medium' },
  { id: 'cardapio', size: 'medium' },
  { id: 'agenda',   size: 'medium' },
  { id: 'acesso',   size: 'medium' },
];

const SIZE_LABELS: Record<string, string> = { small: 'C', medium: 'N', large: 'G' };
const normalize = (w: any) => typeof w === 'string' ? { id: w, size: 'medium' } : w;
const stripHtml = (html: string) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const TAB_ROUTES: Record<string, string> = { tasks: '/(tabs)/tasks', pessoal: '/(tabs)/pessoal' };
const navTo = (screen: string) => {
  const route = TAB_ROUTES[screen] ?? `/screens/${screen}`;
  router.push(route as any);
};

// ─── Note colors ──────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  { id: 'cream',  light: '#FAF8F5', dot: '#D4C9B8' },
  { id: 'yellow', light: '#FFFBDC', dot: '#D4A820' },
  { id: 'pink',   light: '#FFF0F3', dot: '#E08098' },
  { id: 'green',  light: '#EDFAF2', dot: '#60B478' },
  { id: 'blue',   light: '#EEF5FF', dot: '#6898D8' },
  { id: 'lilac',  light: '#F4EEFF', dot: '#9878C8' },
  { id: 'peach',  light: '#FFF3EC', dot: '#D89060' },
  { id: 'sage',   light: '#EEF3EA', dot: '#80A070' },
];

const getNoteBg = (colorVal?: string) => {
  const c = NOTE_COLORS.find(n => n.id === colorVal || n.light === colorVal);
  return c?.light ?? '#FAF8F5';
};

// ─── Widget wrapper ───────────────────────────────────────────────────────────

const Widget = ({ emoji, title, linkLabel, onLink, children }: {
  emoji: string; title: string; linkLabel?: string; onLink?: () => void; children: any;
}) => (
  <View style={s.widgetWrap}>
    <View style={s.widgetHeader}>
      <Text style={s.sectionLabel}>{emoji} {title}</Text>
      {onLink && (
        <TouchableOpacity onPress={onLink} activeOpacity={0.7}>
          <Text style={s.linkBtn}>{linkLabel || 'Ver tudo'}</Text>
        </TouchableOpacity>
      )}
    </View>
    {children}
  </View>
);

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
  <View style={s.progressTrack}>
    <View style={[s.progressFill, { width: `${Math.min(pct * 100, 100)}%` as any, backgroundColor: color }]} />
  </View>
);

// ─── Countdown hook ───────────────────────────────────────────────────────────

const useCountdown = (deadline: string) => {
  const calc = () => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return time;
};

const CountdownItem = ({ task }: { task: any }) => {
  const t = useCountdown(task.deadline);
  const isUrgent = !t.expired && t.h < 3;
  const fmt2 = (n: number) => String(n).padStart(2, '0');
  const label = t.expired
    ? 'expirou'
    : t.h >= 24
    ? `${Math.floor(t.h / 24)}d ${t.h % 24}h`
    : `${fmt2(t.h)}:${fmt2(t.m)}:${fmt2(t.s)}`;
  return (
    <View style={[s.countdownRow, { backgroundColor: isUrgent && !t.expired ? colors.redBg : colors.surface }]}>
      <Text style={[s.countdownText, { textDecorationLine: t.expired ? 'line-through' : 'none', color: t.expired ? colors.text3 : colors.text }]} numberOfLines={1}>{task.text}</Text>
      <View style={s.countdownTime}>
        {isUrgent && !t.expired && <View style={s.urgentDot} />}
        <Text style={[s.countdownLabel, { color: t.expired ? colors.text3 : isUrgent ? colors.red : colors.text2 }]}>{label}</Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// WIDGET COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Humor ──
const MoodWidget = ({ size }: { size: string }) => {
  const [moods, saveMoods] = useStorage<any[]>('saude:moods', []);
  const todayMood = moods.find(m => m.date === TODAY);
  const setMood = (level: number) => saveMoods(ms => [...ms.filter(m => m.date !== TODAY), { date: TODAY, level }]);
  const m = MOODS.find(x => x.level === todayMood?.level);

  if (size === 'small') {
    return (
      <Widget emoji="😊" title="Humor">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigEmoji}>{m?.emoji || '—'}</Text>
          <View>
            <Text style={s.cardTitle}>{m?.label || 'Não registrado'}</Text>
            <Text style={s.cardSub}>humor de hoje</Text>
          </View>
        </View>
      </Widget>
    );
  }

  const last7 = size === 'large' ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const mood = MOODS.find(x => x.level === moods.find(e => e.date === ds)?.level);
    return { ds, mood, isToday: ds === TODAY, day: ['D','S','T','Q','Q','S','S'][d.getDay()] };
  }) : null;

  return (
    <Widget emoji="😊" title="Como você está hoje?">
      <View style={s.moodRow}>
        {MOODS.map(mood => {
          const sel = todayMood?.level === mood.level;
          return (
            <TouchableOpacity
              key={mood.level}
              onPress={() => setMood(mood.level)}
              style={[s.moodBtn, sel && s.moodBtnSel]}
              activeOpacity={0.7}
            >
              <Text style={s.moodEmoji}>{mood.emoji}</Text>
              <Text style={[s.moodLabel, sel && { color: colors.accentDk }]}>{mood.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {size === 'large' && last7 && (
        <View style={[s.moodRow, { marginTop: 12 }]}>
          {last7.map(({ ds, mood, isToday, day }) => (
            <View key={ds} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
              <Text style={{ fontSize: 16 }}>{mood?.emoji || '·'}</Text>
              <Text style={{ fontSize: 9, color: isToday ? colors.accent : colors.text3, fontFamily: fonts.sansMedium }}>{day}</Text>
            </View>
          ))}
        </View>
      )}
    </Widget>
  );
};

// ── Nota rápida ──
const QuickNoteWidget = ({ size }: { size: string }) => {
  const [nota, setNota] = useState('');
  const [quickNotes, saveQuickNotes] = useStorage<any[]>('home:quicknotes', []);
  const salvar = () => {
    if (!nota.trim()) return;
    const now = new Date();
    const h = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    saveQuickNotes(n => [{ id: Date.now(), texto: nota.trim(), hora: h }, ...n]);
    setNota('');
  };
  const maxNotes = size === 'small' ? 1 : size === 'large' ? 5 : 2;

  return (
    <Widget emoji="📝" title="Nota rápida">
      <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
        <View style={[s.quickNoteInput, quickNotes.length > 0 && s.quickNoteInputBorder]}>
          <TextInput
            value={nota}
            onChangeText={setNota}
            placeholder="Escreva algo rápido…"
            placeholderTextColor={colors.text3}
            style={s.quickNoteField}
            multiline={size !== 'small'}
            returnKeyType="done"
            onSubmitEditing={salvar}
          />
          {!!nota.trim() && (
            <TouchableOpacity onPress={salvar} style={s.quickNoteSaveBtn} activeOpacity={0.8}>
              <Text style={s.quickNoteSaveText}>Salvar</Text>
            </TouchableOpacity>
          )}
        </View>
        {quickNotes.slice(0, maxNotes).map((n, i) => (
          <View key={n.id} style={[s.quickNoteItem, i < Math.min(quickNotes.length, maxNotes) - 1 && s.itemBorder]}>
            <View style={s.quickNoteDot} />
            <Text style={[s.itemText, { flex: 1 }]} numberOfLines={2}>{n.texto}</Text>
            <Text style={s.itemSub}>{n.hora}</Text>
            <TouchableOpacity onPress={() => saveQuickNotes(ns => ns.filter(x => x.id !== n.id))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="x" size={14} color={colors.text3} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Widget>
  );
};

// ── Resumo do dia ──
const StatsWidget = ({ size }: { size: string }) => {
  const [tasks]     = useStorage<any[]>('tasks:items', []);
  const [habits]    = useStorage<any[]>('habits:items', []);
  const [events]    = useStorage<any[]>('events:items', []);
  const [habitLogs] = useStorage<Record<string, boolean>>('habits:logs', {});
  const doneHabits  = habits.filter(h => habitLogs[`${h.id}:${TODAY}`]).length;
  const todayEvents = events.filter(e => e.date === TODAY);
  const doneTasks   = tasks.filter(t => t.done && t.date === TODAY).length;
  const totalTasks  = tasks.filter(t => t.date === TODAY || !t.date).length;

  const stats = [
    { label: 'Tarefas', value: `${doneTasks}/${totalTasks}`, pct: totalTasks ? doneTasks / totalTasks : 0, color: colors.accent },
    { label: 'Hábitos', value: `${doneHabits}/${habits.length}`, pct: habits.length ? doneHabits / habits.length : 0, color: colors.green },
    { label: 'Eventos', value: String(todayEvents.length), pct: null as any, color: colors.blue },
  ];

  const pad = size === 'small' ? 10 : 12;
  return (
    <Widget emoji="📊" title="Resumo do dia">
      <View style={s.statsRow}>
        {stats.map((c, i) => (
          <View key={i} style={[s.statCard, { padding: pad }]}>
            <Text style={s.statValue}>{c.value}</Text>
            <Text style={s.statLabel}>{c.label}</Text>
            {size === 'large' && c.pct !== null && <ProgressBar pct={c.pct} color={c.color} />}
          </View>
        ))}
      </View>
    </Widget>
  );
};

// ── Tarefas do dia ──
const TarefasWidget = ({ size }: { size: string }) => {
  const [tasks, saveTasks] = useStorage<any[]>('tasks:items', []);
  const toggle = (id: string) => saveTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const maxItems = size === 'large' ? 8 : 4;
  const pending = tasks.filter(t => !t.done && (t.date === TODAY || !t.date));

  if (size === 'small') {
    return (
      <Widget emoji="✅" title="Tarefas" onLink={() => navTo('tasks')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={[s.bigNumber, { color: pending.length === 0 ? colors.green : colors.text }]}>{pending.length}</Text>
          <View>
            <Text style={s.cardSub}>{pending.length === 0 ? 'Tudo em dia!' : `pendente${pending.length !== 1 ? 's' : ''}`}</Text>
            <Text style={s.cardSub}>tarefas</Text>
          </View>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="✅" title="Tarefas do dia" onLink={() => navTo('tasks')} linkLabel="Ver todas">
      {pending.length === 0 ? (
        <View style={s.emptyCard}><Text style={s.emptyCardText}>✓ Tudo em dia!</Text></View>
      ) : (
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          {pending.slice(0, maxItems).map((t, i) => {
            const dotColor = t.priority === 'alta' ? colors.red : t.priority === 'baixa' ? colors.text3 : colors.accent;
            return (
              <View key={t.id} style={[s.listRow, i < Math.min(pending.length, maxItems) - 1 && s.itemBorder]}>
                <TouchableOpacity onPress={() => toggle(t.id)} style={[s.checkCircle, { borderColor: dotColor }]} />
                <Text style={s.itemText} numberOfLines={1}>{t.text}</Text>
                {t.date && <Text style={s.itemSub}>{t.date.slice(5)}</Text>}
              </View>
            );
          })}
          {pending.length > maxItems && (
            <View style={s.moreRow}><Text style={s.moreTxt}>+{pending.length - maxItems} mais</Text></View>
          )}
        </View>
      )}
    </Widget>
  );
};

// ── Hábitos ──
const HabitosWidget = ({ size }: { size: string }) => {
  const [habits] = useStorage<any[]>('habits:items', []);
  const [habitLogs, saveHabitLogs] = useStorage<Record<string, boolean>>('habits:logs', {});
  const doneCount = habits.filter(h => habitLogs[`${h.id}:${TODAY}`]).length;
  const maxItems = size === 'large' ? habits.length : 4;
  const toggle = (id: string) => saveHabitLogs(logs => {
    const key = `${id}:${TODAY}`;
    const upd = { ...logs };
    if (upd[key]) delete upd[key]; else upd[key] = true;
    return upd;
  });

  if (size === 'small') {
    const pct = habits.length ? doneCount / habits.length : 0;
    return (
      <Widget emoji="🏃" title="Hábitos" onLink={() => navTo('tasks')} linkLabel="Ver">
        <View style={s.card}>
          <View style={[s.cardRow, { marginBottom: 8 }]}>
            <Text style={s.bigNumber}>{doneCount}/{habits.length}</Text>
            <Text style={s.cardSub}>hábitos feitos</Text>
          </View>
          <ProgressBar pct={pct} color={colors.green} />
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="🏃" title="Hábitos" onLink={() => navTo('tasks')} linkLabel="Ver todos">
      {habits.length === 0 ? (
        <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhum hábito criado</Text></View>
      ) : (
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          {habits.slice(0, maxItems).map((habit, i) => {
            const done = !!habitLogs[`${habit.id}:${TODAY}`];
            return (
              <View key={habit.id} style={[s.listRow, i < Math.min(habits.length, maxItems) - 1 && s.itemBorder]}>
                <TouchableOpacity
                  onPress={() => toggle(habit.id)}
                  style={[s.habitCircle, { borderColor: done ? colors.green : colors.line, backgroundColor: done ? colors.green : 'transparent' }]}
                >
                  {done && <View style={s.habitDot} />}
                </TouchableOpacity>
                <Text style={{ fontSize: 16, flexShrink: 0 }}>{habit.icon || '⭐'}</Text>
                <Text style={[s.itemText, done && { textDecorationLine: 'line-through', color: colors.text3 }]}>{habit.name}</Text>
              </View>
            );
          })}
          {habits.length > maxItems && (
            <View style={s.moreRow}><Text style={s.moreTxt}>+{habits.length - maxItems} mais</Text></View>
          )}
        </View>
      )}
    </Widget>
  );
};

// ── Cardápio de hoje ──
const CardapioWidget = ({ size }: { size: string }) => {
  const [plano] = useStorage<Record<string, any>>('cronograma:refeicoes', {});
  const hoje   = plano[TODAY_DAY_ID] || {};
  const filled = REFEICOES_MAP.filter(r => hoje[r.id]);
  const items  = size === 'large' ? REFEICOES_MAP : filled;

  if (size === 'small') {
    return (
      <Widget emoji="🍽️" title="Cardápio" onLink={() => navTo('receitas')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigNumber}>{filled.length}/4</Text>
          <Text style={s.cardSub}>refeições planejadas</Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="🍽️" title="Cardápio de hoje" onLink={() => navTo('receitas')} linkLabel="Ver cardápio">
      {items.length === 0 ? (
        <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma refeição planejada</Text></View>
      ) : (
        <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
          {items.map((r, i) => (
            <View key={r.id} style={[s.listRow, i < items.length - 1 && s.itemBorder, { opacity: !hoje[r.id] && size === 'large' ? 0.4 : 1 }]}>
              <Text style={{ fontSize: 15, flexShrink: 0 }}>{r.emoji}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.refLabel}>{r.label.toUpperCase()}</Text>
                <Text style={s.itemText} numberOfLines={1}>{hoje[r.id] || '—'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Widget>
  );
};

// ── Contagem regressiva ──
const ContagemWidget = ({ size }: { size: string }) => {
  const [countdowns] = useStorage<any[]>('utilitarios:countdowns', []);
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const upcoming = countdowns
    .map(c => ({ ...c, days: Math.round((new Date(c.date + 'T00:00:00').getTime() - base.getTime()) / 86400000) }))
    .filter(c => c.days >= 0)
    .sort((a, b) => a.days - b.days);
  const next = upcoming[0];

  if (size === 'small') {
    return (
      <Widget emoji="⏳" title="Contagem" onLink={() => navTo('utilitarios')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          {!next
            ? <Text style={s.cardSub}>Nenhuma contagem</Text>
            : <>
                <Text style={[s.bigNumber, { color: next.days === 0 ? colors.green : colors.text }]}>{next.days === 0 ? '🎉' : next.days}</Text>
                <View>
                  <Text style={s.cardSub}>{next.days === 0 ? 'Hoje!' : 'dias'}</Text>
                  <Text style={[s.cardSub, { maxWidth: 120 }]} numberOfLines={1}>{next.label}</Text>
                </View>
              </>
          }
        </View>
      </Widget>
    );
  }

  if (size === 'large') {
    return (
      <Widget emoji="⏳" title="Contagem regressiva" onLink={() => navTo('utilitarios')} linkLabel="Gerenciar">
        {upcoming.length === 0
          ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma contagem</Text></View>
          : (
            <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
              {upcoming.slice(0, 3).map((c, i) => (
                <View key={c.id} style={[s.listRow, i < Math.min(upcoming.length, 3) - 1 && s.itemBorder]}>
                  <Text style={[s.bigNumber, { width: 44, textAlign: 'center', color: c.days === 0 ? colors.green : colors.text }]}>
                    {c.days === 0 ? '🎉' : c.days}
                  </Text>
                  <View>
                    <Text style={s.cardTitle}>{c.label}</Text>
                    <Text style={s.cardSub}>{c.days === 0 ? 'Hoje!' : `${c.days} dia${c.days !== 1 ? 's' : ''}`} — {c.date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )
        }
      </Widget>
    );
  }

  return (
    <Widget emoji="⏳" title="Contagem regressiva" onLink={() => navTo('utilitarios')} linkLabel="Gerenciar">
      {!next
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma contagem</Text></View>
        : (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 20 }]}>
            <Text style={[s.countdown, { color: next.days === 0 ? colors.green : colors.text }]}>
              {next.days === 0 ? '🎉' : next.days}
            </Text>
            <Text style={s.cardSub}>{next.days === 0 ? 'Hoje!' : `dia${next.days !== 1 ? 's' : ''} restante${next.days !== 1 ? 's' : ''}`}</Text>
            <Text style={[s.cardTitle, { marginTop: 6 }]}>{next.label}</Text>
            <Text style={s.cardSub}>{next.date}</Text>
          </View>
        )
      }
    </Widget>
  );
};

// ── Prazos urgentes ──
const UrgentesWidget = ({ size }: { size: string }) => {
  const [tasks] = useStorage<any[]>('tasks:items', []);
  const now = new Date();
  const maxItems = size === 'large' ? 5 : 3;
  const urgent = tasks
    .filter(t => !t.done && t.date)
    .filter(t => {
      const diff = new Date(t.date).getTime() - now.getTime();
      return diff >= 0 && diff < 3 * 24 * 3600000;
    })
    .slice(0, maxItems)
    .map(t => ({ ...t, deadline: t.date + 'T23:59:00' }));

  if (urgent.length === 0) return null;

  if (size === 'small') {
    return (
      <Widget emoji="⚡" title="Urgentes" onLink={() => navTo('tasks')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={[s.bigNumber, { color: colors.red }]}>{urgent.length}</Text>
          <Text style={s.cardSub}>tarefa{urgent.length !== 1 ? 's' : ''} urgente{urgent.length !== 1 ? 's' : ''}</Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="⚡" title="Prazos urgentes" onLink={() => navTo('tasks')} linkLabel="Ver tarefas">
      <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
        {urgent.map((task, i) => (
          <View key={task.id} style={i < urgent.length - 1 ? s.itemBorder : undefined}>
            <CountdownItem task={task} />
          </View>
        ))}
      </View>
    </Widget>
  );
};

// ── Agenda ──
const AgendaWidget = ({ size }: { size: string }) => {
  const [events] = useStorage<any[]>('events:items', []);
  const maxItems = size === 'large' ? 6 : 3;
  const todayEvents = events.filter(e => e.date === TODAY).sort((a, b) => a.time > b.time ? 1 : -1);

  if (size === 'small') {
    return (
      <Widget emoji="📅" title="Agenda" onLink={() => navTo('calendario')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigNumber}>{todayEvents.length}</Text>
          <Text style={s.cardSub}>evento{todayEvents.length !== 1 ? 's' : ''} hoje</Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="📅" title="Hoje na agenda" onLink={() => navTo('calendario')}>
      {todayEvents.length === 0
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhum evento hoje</Text></View>
        : (
          <View style={{ gap: 6 }}>
            {todayEvents.slice(0, maxItems).map(ev => (
              <View key={ev.id} style={s.eventRow}>
                <Text style={s.eventTime}>{ev.time}</Text>
                <Text style={[s.itemText, { flex: 1 }]}>{ev.title}</Text>
                <View style={[s.eventDot, { backgroundColor: ev.color || colors.accent }]} />
              </View>
            ))}
          </View>
        )
      }
    </Widget>
  );
};

// ── Finanças ──
const FinancasWidget = ({ size }: { size: string }) => {
  const [transactions] = useStorage<any[]>('financas:transacoes', []);
  const [cats]         = useStorage<any[]>('financas:categorias', []);
  const monthTx        = transactions.filter(t => t.date?.startsWith(THIS_MONTH));
  const totalExpense   = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  if (size === 'small') {
    return (
      <Widget emoji="💸" title="Finanças" onLink={() => navTo('financas')} linkLabel="Ver">
        <View style={s.card}>
          <Text style={s.cardSub}>gasto este mês</Text>
          <Text style={s.bigNumber}>R$ {totalExpense.toFixed(2)}</Text>
        </View>
      </Widget>
    );
  }

  const maxCats = size === 'large' ? 6 : 3;
  const catsWithSpend = cats.slice(0, maxCats).map(cat => {
    const spent = monthTx.filter(t => t.amount < 0 && t.category === cat.id).reduce((s, t) => s + Math.abs(t.amount), 0);
    const pct   = cat.limit ? Math.min(spent / cat.limit, 1) : 0;
    return { ...cat, spent, pct };
  }).filter(c => c.spent > 0 || size === 'large');

  return (
    <Widget emoji="💸" title="Finanças" onLink={() => navTo('financas')} linkLabel="Ver tudo">
      <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
        <View style={[s.listRow, catsWithSpend.length > 0 && s.itemBorder, { flexDirection: 'column', alignItems: 'flex-start', padding: 14 }]}>
          <Text style={s.cardSub}>total gasto este mês</Text>
          <Text style={[s.bigNumber, { marginTop: 2 }]}>R$ {totalExpense.toFixed(2)}</Text>
        </View>
        {catsWithSpend.map((cat, i) => (
          <View key={cat.id || i} style={[{ padding: '10px 14px' as any, paddingHorizontal: 14, paddingVertical: 10 }, i < catsWithSpend.length - 1 && s.itemBorder]}>
            <View style={s.finRow}>
              <Text style={s.itemText}>{cat.icon || ''} {cat.name}</Text>
              <Text style={s.cardSub}>R$ {cat.spent.toFixed(0)}{cat.limit ? ` / ${cat.limit}` : ''}</Text>
            </View>
            {cat.limit > 0 && <ProgressBar pct={cat.pct} color={cat.pct > 0.8 ? colors.red : cat.color || colors.accent} />}
          </View>
        ))}
      </View>
    </Widget>
  );
};

// ── Compras ──
const ComprasWidget = ({ size }: { size: string }) => {
  const [listas]  = useStorage<any[]>('compras:listas', []);
  const curList   = listas[0];
  const pending   = curList?.itens?.filter((i: any) => !i.done) || [];
  const maxItems  = size === 'large' ? 8 : 4;

  if (size === 'small') {
    return (
      <Widget emoji="🛒" title="Compras" onLink={() => navTo('compras')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigNumber}>{pending.length}</Text>
          <View>
            <Text style={s.cardSub}>ite{pending.length !== 1 ? 'ns' : 'm'} na lista</Text>
            {curList && <Text style={s.cardSub} numberOfLines={1}>{curList.emoji} {curList.nome}</Text>}
          </View>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="🛒" title={curList ? `${curList.emoji} ${curList.nome}` : 'Compras'} onLink={() => navTo('compras')} linkLabel="Ver lista">
      {pending.length === 0
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.green }]}>✓ Lista vazia</Text></View>
        : (
          <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
            {pending.slice(0, maxItems).map((item: any, i: number) => (
              <View key={item.id} style={[s.listRow, i < Math.min(pending.length, maxItems) - 1 && s.itemBorder]}>
                <View style={s.comprasDot} />
                <Text style={[s.itemText, { flex: 1 }]}>{item.nome}</Text>
                {item.qty && <Text style={s.itemSub}>{item.qty}</Text>}
              </View>
            ))}
            {pending.length > maxItems && (
              <View style={s.moreRow}><Text style={s.moreTxt}>+{pending.length - maxItems} mais</Text></View>
            )}
          </View>
        )
      }
    </Widget>
  );
};

// ── Conteúdo ──
const ConteudoWidget = ({ size }: { size: string }) => {
  const [content] = useStorage<any[]>('conteudo:items', []);
  const inProgress = content.filter(c => c.status === 'consumindo');
  const maxItems = size === 'large' ? 6 : 3;

  if (size === 'small') {
    return (
      <Widget emoji="📚" title="Conteúdo" onLink={() => navTo('conteudo')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigNumber}>{inProgress.length}</Text>
          <Text style={s.cardSub}>em andamento</Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="📚" title="Conteúdo" onLink={() => navTo('conteudo')} linkLabel="Ver tudo">
      {inProgress.length === 0
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nada em andamento</Text></View>
        : (
          <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
            {inProgress.slice(0, maxItems).map((item, i) => (
              <View key={item.id} style={[s.listRow, i < Math.min(inProgress.length, maxItems) - 1 && s.itemBorder]}>
                <Text style={{ fontSize: 16, flexShrink: 0 }}>{CONTENT_TYPES[item.type] || '📄'}</Text>
                <Text style={[s.itemText, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
              </View>
            ))}
            {inProgress.length > maxItems && (
              <View style={s.moreRow}><Text style={s.moreTxt}>+{inProgress.length - maxItems} mais</Text></View>
            )}
          </View>
        )
      }
    </Widget>
  );
};

// ── Notas recentes ──
const NotasWidget = ({ size }: { size: string }) => {
  const [notes] = useStorage<any[]>('notes:items', []);
  const maxItems = size === 'small' ? 1 : size === 'large' ? 4 : 2;

  if (size === 'small') {
    const last = notes[0];
    return (
      <Widget emoji="📓" title="Notas" onLink={() => navTo('pessoal')} linkLabel="Ver">
        <View style={s.card}>
          {last
            ? <>
                <Text style={s.cardTitle} numberOfLines={1}>{last.title}</Text>
                <Text style={s.cardSub}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</Text>
              </>
            : <Text style={[s.cardSub, { color: colors.text3 }]}>Nenhuma nota</Text>
          }
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="📓" title="Notas recentes" onLink={() => navTo('pessoal')} linkLabel="Ver todas">
      {notes.length === 0
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma nota</Text></View>
        : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {notes.slice(0, maxItems).map(note => (
              <View key={note.id} style={[s.noteCard, { backgroundColor: getNoteBg(note.color) }]}>
                <Text style={s.noteTitle} numberOfLines={1}>{note.title}</Text>
                {note.body && <Text style={s.noteBody} numberOfLines={2}>{stripHtml(note.body)}</Text>}
                <Text style={s.noteDate}>{note.date}</Text>
              </View>
            ))}
          </View>
        )
      }
    </Widget>
  );
};

// ── Diário ──
const DiarioWidget = ({ size }: { size: string }) => {
  const [journal] = useStorage<any[]>('journal:items', []);
  const todayEntry = journal.find(j => j.date === TODAY);
  const maxChars = size === 'large' ? 400 : 140;

  if (size === 'small') {
    return (
      <Widget emoji="✍️" title="Diário" onLink={() => navTo('pessoal')} linkLabel="Escrever">
        <View style={[s.card, s.cardRow]}>
          <Text style={{ fontSize: 22 }}>{todayEntry ? '✓' : '📖'}</Text>
          <Text style={[s.cardSub, { color: todayEntry ? colors.green : colors.text2 }]}>
            {todayEntry ? 'Entrada escrita hoje' : 'Escreva no diário'}
          </Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="✍️" title="Diário" onLink={() => navTo('pessoal')} linkLabel="Abrir">
      <View style={s.card}>
        {todayEntry
          ? <>
              <Text style={[s.cardSub, { marginBottom: 8 }]}>Hoje — {TODAY}</Text>
              <Text style={[s.itemText, { opacity: 0.5, lineHeight: 22 }]} numberOfLines={6}>
                {(() => { const t = stripHtml(todayEntry.text); return t.length > maxChars ? t.slice(0, maxChars) + '…' : t; })()}
              </Text>
            </>
          : <Text style={[s.cardSub, { textAlign: 'center', paddingVertical: 8 }]}>
              📖 Nenhuma entrada hoje. <Text style={{ color: colors.accent }}>Escreva algo!</Text>
            </Text>
        }
      </View>
    </Widget>
  );
};

// ── Saúde ──
const SaudeWidget = ({ size }: { size: string }) => {
  const [meds]    = useStorage<any[]>('saude:meds', []);
  const [medLogs] = useStorage<Record<string, boolean>>('saude:medlogs', {});
  const [treinos] = useStorage<any[]>('saude:treinos', []);
  const takenCount   = meds.filter(m => medLogs[`${m.id}:${TODAY}`]).length;
  const todayWorkout = treinos.find(t => t.date === TODAY);
  const maxMeds = size === 'large' ? meds.length : 3;

  if (size === 'small') {
    return (
      <Widget emoji="💊" title="Saúde" onLink={() => navTo('saude')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          <Text style={s.bigNumber}>{takenCount}/{meds.length}</Text>
          <Text style={s.cardSub}>remédios tomados</Text>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="💊" title="Saúde" onLink={() => navTo('saude')} linkLabel="Ver">
      <View style={{ gap: 8 }}>
        {meds.length > 0
          ? (
            <View style={[s.card, { padding: 0, overflow: 'hidden' }]}>
              <View style={[s.medHeader, s.itemBorder]}>
                <Text style={s.refLabel}>REMÉDIOS</Text>
              </View>
              {meds.slice(0, maxMeds).map((med, i) => {
                const taken = !!medLogs[`${med.id}:${TODAY}`];
                return (
                  <View key={med.id} style={[s.listRow, i < Math.min(meds.length, maxMeds) - 1 && s.itemBorder]}>
                    <View style={[s.medDot, { backgroundColor: taken ? colors.green : colors.line }]} />
                    <Text style={[s.itemText, { flex: 1, color: taken ? colors.text3 : colors.text }]}>{med.name}</Text>
                    <Text style={s.itemSub}>{med.time}</Text>
                  </View>
                );
              })}
            </View>
          )
          : <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhum remédio cadastrado</Text></View>
        }
        {size === 'large' && todayWorkout && (
          <View style={[s.card, s.cardRow]}>
            <Text style={{ fontSize: 18 }}>🏋️</Text>
            <View>
              <Text style={s.cardTitle}>{todayWorkout.type || todayWorkout.category}</Text>
              <Text style={s.cardSub}>{todayWorkout.duration ? `${todayWorkout.duration} min` : 'hoje'}</Text>
            </View>
          </View>
        )}
      </View>
    </Widget>
  );
};

// ── Viagem ──
const ViagemWidget = ({ size }: { size: string }) => {
  const [destinos] = useStorage<any[]>('viagem:destinos', []);
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const upcoming = destinos
    .filter(d => d.dateStart)
    .map(d => ({ ...d, days: Math.round((new Date(d.dateStart + 'T00:00:00').getTime() - base.getTime()) / 86400000) }))
    .filter(d => d.days >= 0)
    .sort((a, b) => a.days - b.days);
  const next = upcoming[0];

  if (size === 'small') {
    return (
      <Widget emoji="✈️" title="Viagem" onLink={() => navTo('viagem')} linkLabel="Ver">
        <View style={[s.card, s.cardRow]}>
          {!next
            ? <Text style={s.cardSub}>Nenhuma viagem</Text>
            : <>
                <Text style={s.bigNumber}>{next.days}</Text>
                <View>
                  <Text style={s.cardSub}>dias para</Text>
                  <Text style={s.cardSub} numberOfLines={1}>{next.emoji} {next.name}</Text>
                </View>
              </>
          }
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="✈️" title="Próxima viagem" onLink={() => navTo('viagem')} linkLabel="Ver viagens">
      {!next
        ? <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma viagem planejada</Text></View>
        : (
          <View style={s.card}>
            <View style={s.viagemRow}>
              <Text style={{ fontSize: 28 }}>{next.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{next.name}</Text>
                <Text style={s.cardSub}>{next.dateStart}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.bigNumber, { lineHeight: 32 }]}>{next.days}</Text>
                <Text style={s.cardSub}>dias</Text>
              </View>
            </View>
            {size === 'large' && next.notes && (
              <Text style={[s.cardSub, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line }]}>{next.notes}</Text>
            )}
          </View>
        )
      }
    </Widget>
  );
};

// ── Inspiração ──
const InspiracaoWidget = ({ size }: { size: string }) => {
  const [paletas] = useStorage<any[]>('inspiracao:paletas', []);
  const normColor = (c: any) => typeof c === 'string' ? { hex: c, name: '' } : c;

  if (paletas.length === 0) {
    return (
      <Widget emoji="🎨" title="Inspiração">
        <View style={s.emptyCard}><Text style={[s.emptyCardText, { color: colors.text3 }]}>Nenhuma paleta salva</Text></View>
      </Widget>
    );
  }

  const showPalettes = size === 'large' ? paletas.slice(0, 3) : [paletas[0]];

  if (size === 'small') {
    const cols = (paletas[0].colors || []).map(normColor);
    return (
      <Widget emoji="🎨" title="Inspiração">
        <View style={s.card}>
          <Text style={[s.cardSub, { marginBottom: 8 }]}>{paletas[0].name}</Text>
          <View style={s.swatchRow}>
            {cols.slice(0, 5).map((c: any, i: number) => (
              <View key={i} style={[s.swatchSmall, { backgroundColor: c.hex }]} />
            ))}
          </View>
        </View>
      </Widget>
    );
  }

  return (
    <Widget emoji="🎨" title="Inspiração">
      <View style={{ gap: 8 }}>
        {showPalettes.map((p: any) => {
          const pColors = (p.colors || []).map(normColor);
          return (
            <View key={p.id} style={s.card}>
              <Text style={[s.cardTitle, { marginBottom: 8 }]}>{p.name}</Text>
              <View style={s.swatchRow}>
                {pColors.slice(0, 5).map((c: any, i: number) => (
                  <View key={i} style={[s.swatch, { height: size === 'large' ? 32 : 24, backgroundColor: c.hex }]} />
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </Widget>
  );
};

// ── Acesso rápido ──
const AcessoWidget = ({ size }: { size: string }) => {
  const items = size === 'small' ? QUICK_ACCESS.slice(0, 4) : QUICK_ACCESS;
  return (
    <Widget emoji="🔗" title="Acesso rápido">
      <View style={s.accessGrid}>
        {items.map((item, i) => (
          <TouchableOpacity key={i} onPress={() => navTo(item.screen)} style={s.accessBtn} activeOpacity={0.7}>
            <Icon name={item.icon as any} size={size === 'small' ? 16 : 18} color={colors.text2} />
            <Text style={s.accessLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Widget>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOME
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const insets = useSafeAreaInsets();
  const now    = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  const hour   = now.getHours();
  const greet  = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const [userProfile] = useStorage<any>('auth:user', {});
  const firstName = (userProfile?.name || userProfile?.username || '').trim().split(/\s+/)[0] || 'você';

  const [rawConfig, saveConfig] = useStorage<any[]>('home:widgets', DEFAULT_CONFIG);
  const config = (() => {
    const c = rawConfig.map(normalize);
    if (!c.some((w: any) => w.id === 'diario')) {
      c.splice(1, 0, { id: 'diario', size: 'medium' });
    }
    return c;
  })();

  const [showPersonalize, setShowPersonalize] = useState(false);

  const activeIds     = config.map((w: any) => w.id);
  const inactiveWidgets = WIDGET_DEFS.filter(d => !activeIds.includes(d.id));

  const addWidget    = (id: string) => saveConfig((c: any[]) => [...c.map(normalize), { id, size: 'medium' }]);
  const removeWidget = (id: string) => saveConfig((c: any[]) => c.map(normalize).filter((w: any) => w.id !== id));
  const setWidgetSize = (id: string, size: string) =>
    saveConfig((c: any[]) => c.map(normalize).map((w: any) => w.id === id ? { ...w, size } : w));
  const moveWidget = (idx: number, dir: -1 | 1) => {
    const next   = [...config];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveConfig(next);
  };

  const renderWidget = (id: string, size: string) => {
    switch (id) {
      case 'mood':       return <MoodWidget      key={id} size={size} />;
      case 'quicknote':  return <QuickNoteWidget key={id} size={size} />;
      case 'stats':      return <StatsWidget     key={id} size={size} />;
      case 'tarefas':    return <TarefasWidget   key={id} size={size} />;
      case 'habitos':    return <HabitosWidget   key={id} size={size} />;
      case 'cardapio':   return <CardapioWidget  key={id} size={size} />;
      case 'contagem':   return <ContagemWidget  key={id} size={size} />;
      case 'urgentes':   return <UrgentesWidget  key={id} size={size} />;
      case 'agenda':     return <AgendaWidget    key={id} size={size} />;
      case 'financas':   return <FinancasWidget  key={id} size={size} />;
      case 'compras':    return <ComprasWidget   key={id} size={size} />;
      case 'conteudo':   return <ConteudoWidget  key={id} size={size} />;
      case 'notas':      return <NotasWidget     key={id} size={size} />;
      case 'diario':     return <DiarioWidget    key={id} size={size} />;
      case 'saude':      return <SaudeWidget     key={id} size={size} />;
      case 'viagem':     return <ViagemWidget    key={id} size={size} />;
      case 'inspiracao': return <InspiracaoWidget key={id} size={size} />;
      case 'acesso':     return <AcessoWidget    key={id} size={size} />;
      default: return null;
    }
  };

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.dateText}>{dateStr}</Text>
            <Text style={s.greetText}>
              {greet},{' '}
              <Text style={s.greetName}>{firstName}.</Text>
            </Text>
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/screens/busca' as any)}
              style={s.searchBtn}
              activeOpacity={0.7}
            >
              <Icon name="search" size={17} color={colors.text2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPersonalize(true)}
              style={s.widgetsBtn}
              activeOpacity={0.7}
            >
              <Icon name="edit" size={14} color={colors.text2} />
              <Text style={s.widgetsBtnText}>Widgets</Text>
            </TouchableOpacity>
            <Text style={s.logo}>🪷</Text>
          </View>
        </View>

        {/* Active widgets */}
        {config.map((w: any) => renderWidget(w.id, w.size))}
      </ScrollView>

      {/* Personalize modal */}
      <Modal open={showPersonalize} onClose={() => setShowPersonalize(false)} title="Personalizar widgets">
        {config.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.sectionLabel}>Ativos</Text>
            <View style={s.personList}>
              {config.map((w: any, i: number) => {
                const def = WIDGET_DEFS.find(d => d.id === w.id);
                if (!def) return null;
                return (
                  <View key={w.id} style={[s.personRow, i < config.length - 1 && s.itemBorder]}>
                    <Text style={s.personEmoji}>{def.emoji}</Text>
                    <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={1}>{def.label}</Text>
                    <TouchableOpacity onPress={() => moveWidget(i, -1)} style={s.arrowBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={s.arrowText}>↑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => moveWidget(i, 1)} style={s.arrowBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={s.arrowText}>↓</Text>
                    </TouchableOpacity>
                    {(['small','medium','large'] as const).map(sz => (
                      <TouchableOpacity
                        key={sz}
                        onPress={() => setWidgetSize(w.id, sz)}
                        style={[s.sizePill, w.size === sz && s.sizePillActive]}
                      >
                        <Text style={[s.sizePillText, w.size === sz && s.sizePillTextActive]}>{SIZE_LABELS[sz]}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => removeWidget(w.id)} style={{ padding: 4 }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Icon name="x" size={15} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {inactiveWidgets.length > 0 && (
          <View>
            <Text style={s.sectionLabel}>Disponíveis</Text>
            <View style={s.availableGrid}>
              {inactiveWidgets.map(def => (
                <TouchableOpacity
                  key={def.id}
                  onPress={() => addWidget(def.id)}
                  style={s.availableBtn}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{def.emoji}</Text>
                  <Text style={s.cardTitle}>{def.label}</Text>
                  <Text style={[s.cardSub, { lineHeight: 16, marginBottom: 4 }]}>{def.desc}</Text>
                  <Text style={s.addLabel}>+ Adicionar</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {inactiveWidgets.length === 0 && (
          <Text style={[s.cardSub, { textAlign: 'center', paddingVertical: 16 }]}>Todos os widgets estão ativos 🎉</Text>
        )}
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.bg },
  scroll:  { paddingHorizontal: spacing.screenPad, paddingBottom: 60 },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  dateText:      { fontSize: 11, color: colors.text3, marginBottom: 4, letterSpacing: 0.5, textTransform: 'capitalize', fontFamily: fonts.sans },
  greetText:     { fontFamily: fonts.serif, fontSize: 26, color: colors.text, lineHeight: 30 },
  greetName:     { fontStyle: 'italic' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  searchBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  widgetsBtn:    { backgroundColor: colors.bg2, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  widgetsBtnText:{ fontSize: 12, color: colors.text2, fontFamily: fonts.sansMedium },
  logo:          { fontSize: 26 },

  // Widget
  widgetWrap:  { marginBottom: 24 },
  widgetHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel:{ fontSize: 11, fontFamily: fonts.sansMedium, color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.8 },
  linkBtn:     { fontSize: 12, color: colors.accent, fontFamily: fonts.sansMedium },

  // Cards
  card:      { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  cardRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.text },
  cardSub:   { fontSize: 11, color: colors.text3, fontFamily: fonts.sans },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 16, alignItems: 'center' },
  emptyCardText: { fontSize: 13, color: colors.green, fontFamily: fonts.sans },

  bigNumber:  { fontFamily: fonts.serif, fontSize: 24, color: colors.text, lineHeight: 28 },
  bigEmoji:   { fontSize: 28 },
  countdown:  { fontFamily: fonts.serif, fontSize: 52, color: colors.text, lineHeight: 56, marginBottom: 4 },

  // List rows
  listRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  itemText:   { fontSize: 13, color: colors.text, fontFamily: fonts.sans },
  itemSub:    { fontSize: 10, color: colors.text3, fontFamily: fonts.sans, flexShrink: 0 },
  moreRow:    { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  moreTxt:    { fontSize: 12, color: colors.text3, fontFamily: fonts.sans },

  // Mood
  moodRow:     { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  moodBtn:     { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', gap: 4 },
  moodBtnSel:  { borderColor: colors.accent, backgroundColor: colors.accentBg },
  moodEmoji:   { fontSize: 20 },
  moodLabel:   { fontSize: 9, color: colors.text3, fontFamily: fonts.sansMedium, letterSpacing: 0.5 },

  // Stats
  statsRow:  { flexDirection: 'row', gap: 8 },
  statCard:  { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, alignItems: 'center' },
  statValue: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, lineHeight: 26 },
  statLabel: { fontSize: 9, color: colors.text3, fontFamily: fonts.sansMedium, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3 },

  // Progress bar
  progressTrack: { height: 3, backgroundColor: colors.bg3, borderRadius: 99, marginTop: 6 },
  progressFill:  { height: '100%' as any, borderRadius: 99 },

  // Habit
  habitCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  habitDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },

  // Check circle (tasks)
  checkCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, backgroundColor: 'transparent', flexShrink: 0 },

  // Countdown
  countdownRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  countdownText: { flex: 1, fontSize: 13, fontFamily: fonts.sans },
  countdownTime: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  countdownLabel:{ fontFamily: 'monospace', fontSize: 12, fontWeight: '600' },
  urgentDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },

  // Event
  eventRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm },
  eventTime: { fontSize: 12, fontFamily: fonts.sansMedium, color: colors.accent, minWidth: 36 },
  eventDot:  { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },

  // Finances
  finRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },

  // Compras dot
  comprasDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line, flexShrink: 0 },

  // Note cards
  noteCard:  { width: '47%', borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  noteTitle: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.text, marginBottom: 4 },
  noteBody:  { fontSize: 11, color: colors.text2, lineHeight: 16 },
  noteDate:  { fontSize: 9, color: colors.text3, marginTop: 6, fontFamily: fonts.sans },

  // Viagem
  viagemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Quick note widget
  quickNoteInput:       { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12 },
  quickNoteInputBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  quickNoteField:       { flex: 1, backgroundColor: 'transparent', fontFamily: fonts.sans, fontSize: 14, color: colors.text, padding: 0, lineHeight: 20 },
  quickNoteSaveBtn:     { backgroundColor: colors.text, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6, flexShrink: 0 },
  quickNoteSaveText:    { color: colors.bg, fontSize: 12, fontFamily: fonts.sansMedium },
  quickNoteItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  quickNoteDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, flexShrink: 0, marginTop: 6 },

  // Refeições label
  refLabel: { fontSize: 10, fontFamily: fonts.sansMedium, color: colors.text3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 2 },

  // Saude widget
  medHeader: { paddingHorizontal: 14, paddingVertical: 8 },
  medDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },

  // Inspiração
  swatchRow:   { flexDirection: 'row', gap: 6 },
  swatchSmall: { flex: 1, height: 20, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  swatch:      { flex: 1, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },

  // Access
  accessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accessBtn:  { width: '22%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 6 },
  accessLabel:{ fontSize: 9, color: colors.text2, fontFamily: fonts.sansMedium, letterSpacing: 0.2, lineHeight: 12, textAlign: 'center' },

  // Personalize modal
  personList:  { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  personRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.surface },
  personEmoji: { fontSize: 18, width: 24 },
  arrowBtn:    { padding: 4 },
  arrowText:   { fontSize: 14, color: colors.text3 },
  sizePill:    { width: 24, height: 24, borderRadius: 6, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  sizePillActive: { backgroundColor: colors.text },
  sizePillText:   { fontSize: 10, fontFamily: fonts.sansMedium, color: colors.text3 },
  sizePillTextActive: { color: colors.bg },
  availableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableBtn:  { width: '47%', backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12 },
  addLabel:      { fontSize: 12, color: colors.accent, fontFamily: fonts.sansMedium },
});
