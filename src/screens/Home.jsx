import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import LotusLogo from '../components/LotusLogo';
import Modal from '../components/Modal';
import { useStorage } from '../hooks/useStorage';

// ── Constants ──
const DAYS   = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const TODAY  = new Date().toISOString().slice(0, 10);
const THIS_MONTH = TODAY.slice(0, 7);
const TODAY_DAY_ID = ['dom','seg','ter','qua','qui','sex','sab'][new Date().getDay()];

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

const CONTENT_TYPES = { livro: '📖', filme: '🎬', série: '📺', podcast: '🎧', artigo: '📰', tutorial: '💻' };

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

// ── Widget definitions ──
const WIDGET_DEFS = [
  { id: 'mood',      emoji: '😊', label: 'Como você está',     desc: 'Registro de humor do dia' },
  { id: 'quicknote', emoji: '📝', label: 'Nota rápida',        desc: 'Anotações rápidas' },
  { id: 'stats',     emoji: '📊', label: 'Resumo do dia',      desc: 'Tarefas, hábitos e eventos' },
  { id: 'tarefas',   emoji: '✅', label: 'Tarefas do dia',     desc: 'Lista de pendências' },
  { id: 'habitos',   emoji: '🏃', label: 'Hábitos',            desc: 'Progresso dos hábitos' },
  { id: 'cardapio',  emoji: '🍽️', label: 'Cardápio de hoje',   desc: 'Refeições planejadas' },
  { id: 'contagem',  emoji: '⏳', label: 'Contagem regressiva', desc: 'Próximo evento com contagem' },
  { id: 'urgentes',  emoji: '⚡', label: 'Prazos urgentes',    desc: 'Tarefas com prazo próximo' },
  { id: 'agenda',    emoji: '📅', label: 'Hoje na agenda',     desc: 'Eventos do dia' },
  { id: 'financas',  emoji: '💸', label: 'Finanças',           desc: 'Resumo financeiro do mês' },
  { id: 'compras',   emoji: '🛒', label: 'Lista de compras',   desc: 'Itens da lista ativa' },
  { id: 'conteudo',  emoji: '📚', label: 'Conteúdo',           desc: 'O que está consumindo' },
  { id: 'notas',     emoji: '📓', label: 'Notas recentes',     desc: 'Últimas notas criadas' },
  { id: 'diario',    emoji: '✍️', label: 'Diário',             desc: 'Entrada de hoje' },
  { id: 'saude',     emoji: '💊', label: 'Saúde',              desc: 'Remédios e treinos' },
  { id: 'viagem',    emoji: '✈️', label: 'Próxima viagem',     desc: 'Destino planejado' },
  { id: 'inspiracao',emoji: '🎨', label: 'Inspiração',         desc: 'Paleta de cores' },
  { id: 'acesso',    emoji: '🔗', label: 'Acesso rápido',      desc: 'Atalhos para seções' },
];

const DEFAULT_CONFIG = [
  { id: 'mood',     size: 'medium' },
  { id: 'stats',    size: 'medium' },
  { id: 'tarefas',  size: 'medium' },
  { id: 'cardapio', size: 'medium' },
  { id: 'agenda',   size: 'medium' },
  { id: 'acesso',   size: 'medium' },
];

const SIZE_LABELS = { small: 'C', medium: 'N', large: 'G' };
const normalize = (w) => typeof w === 'string' ? { id: w, size: 'medium' } : w;

// ── Shared UI ──
const Toggle = ({ on, onToggle }) => (
  <button onClick={onToggle} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: on ? 'var(--accent)' : 'var(--line)', position: 'relative', transition: 'background 0.2s', flexShrink: 0, padding: 0 }}>
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
  </button>
);

const GripDots = () => (
  <div style={{ cursor: 'grab', padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{ display: 'flex', gap: 3 }}>
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)' }} />
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text3)' }} />
      </div>
    ))}
  </div>
);

const Widget = ({ emoji, title, linkLabel, onLink, size, children }) => (
  <div style={{ marginBottom: size === 'small' ? 16 : 24 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <div className="section-label" style={{ marginBottom: 0 }}>{emoji} {title}</div>
      {onLink && (
        <button onClick={onLink} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500 }}>
          {linkLabel || 'Ver tudo'}
        </button>
      )}
    </div>
    {children}
  </div>
);

// ── Countdown (task deadlines) ──
const useCountdown = (deadline) => {
  const calc = () => {
    const diff = new Date(deadline) - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, expired: true };
    return { h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), expired: false };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => { const id = setInterval(() => setTime(calc()), 1000); return () => clearInterval(id); }, [deadline]);
  return time;
};

const CountdownItem = ({ task }) => {
  const t = useCountdown(task.deadline);
  const isUrgent = !t.expired && t.h < 3;
  const fmt2 = n => String(n).padStart(2, '0');
  const label = t.expired ? 'expirou' : t.h >= 24 ? `${Math.floor(t.h / 24)}d ${t.h % 24}h` : `${fmt2(t.h)}:${fmt2(t.m)}:${fmt2(t.s)}`;
  const urgColor = t.expired ? 'var(--text3)' : isUrgent ? 'oklch(55% 0.12 15)' : 'var(--text2)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: isUrgent && !t.expired ? 'var(--red-bg)' : 'var(--surface)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: t.expired ? 'var(--text3)' : 'var(--text)', textDecoration: t.expired ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.text}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isUrgent && !t.expired && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'oklch(62% 0.12 15)' }} />}
        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: urgColor }}>{label}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════
// WIDGET COMPONENTS
// ═══════════════════════════════

// ── Humor ──
const MoodWidget = ({ size }) => {
  const [moods, saveMoods] = useStorage('saude:moods', []);
  const todayMood = moods.find(m => m.date === TODAY);
  const setMood = (level) => saveMoods(ms => [...ms.filter(m => m.date !== TODAY), { date: TODAY, level }]);
  const m = MOODS.find(x => x.level === todayMood?.level);

  if (size === 'small') {
    return (
      <Widget emoji="😊" title="Humor" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontSize: 28 }}>{m?.emoji || '—'}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{m?.label || 'Não registrado'}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>humor de hoje</div>
          </div>
        </div>
      </Widget>
    );
  }

  const last7 = size === 'large' ? Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    return { ds, mood: MOODS.find(x => x.level === moods.find(e => e.date === ds)?.level), isToday: ds === TODAY, day: ['D','S','T','Q','Q','S','S'][d.getDay()] };
  }) : null;

  return (
    <Widget emoji="😊" title="Como você está hoje?" size={size}>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
        {MOODS.map(mood => {
          const sel = todayMood?.level === mood.level;
          return (
            <button key={mood.level} onClick={() => setMood(mood.level)} style={{ flex: 1, padding: '10px 4px', borderRadius: 'var(--r)', border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--line)'}`, background: sel ? 'var(--accent-bg)' : 'var(--surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
              <span style={{ fontSize: 20 }}>{mood.emoji}</span>
              <span style={{ fontSize: 9, color: sel ? 'var(--accent-dk)' : 'var(--text3)', fontFamily: 'var(--sans)', fontWeight: 500 }}>{mood.label}</span>
            </button>
          );
        })}
      </div>
      {size === 'large' && last7 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 6, justifyContent: 'space-between' }}>
          {last7.map(({ ds, mood, isToday, day }) => (
            <div key={ds} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 16 }}>{mood?.emoji || '·'}</span>
              <div style={{ fontSize: 9, color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 700 : 400 }}>{day}</div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
};

// ── Nota rápida ──
const QuickNoteWidget = ({ size }) => {
  const [nota, setNota] = useState('');
  const [quickNotes, saveQuickNotes] = useStorage('home:quicknotes', []);
  const salvar = () => {
    if (!nota.trim()) return;
    const now = new Date();
    const h = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    saveQuickNotes(n => [{ id: Date.now(), texto: nota.trim(), hora: h }, ...n]);
    setNota('');
  };
  const maxNotes = size === 'small' ? 1 : size === 'large' ? 5 : 2;
  return (
    <Widget emoji="📝" title="Nota rápida" size={size}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 14px', borderBottom: quickNotes.length ? '1px solid var(--line)' : 'none' }}>
          <textarea value={nota} onChange={e => setNota(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); salvar(); } }} placeholder="Escreva algo rápido…" rows={size === 'small' ? 1 : 2}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text)', lineHeight: 1.5, padding: 0 }} />
          {nota.trim() && <button onClick={salvar} style={{ background: 'var(--text)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: 'var(--bg)', fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500, flexShrink: 0 }}>Salvar</button>}
        </div>
        {quickNotes.slice(0, maxNotes).map((n, i) => (
          <div key={n.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, borderBottom: i < Math.min(quickNotes.length, maxNotes) - 1 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
            <div style={{ flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{n.texto}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{n.hora}</span>
              <button onClick={() => saveQuickNotes(ns => ns.filter(x => x.id !== n.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, display: 'flex' }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
};

// ── Resumo do dia ──
const StatsWidget = ({ size }) => {
  const [tasks]     = useStorage('tasks:items', []);
  const [habits]    = useStorage('habits:items', []);
  const [events]    = useStorage('events:items', []);
  const [habitLogs] = useStorage('habits:logs', {});
  const doneHabits = habits.filter(h => habitLogs[`${h.id}:${TODAY}`]).length;
  const todayEvents = events.filter(e => e.date === TODAY);
  const doneTasks   = tasks.filter(t => t.done && t.date === TODAY).length;
  const totalTasks  = tasks.filter(t => t.date === TODAY || !t.date).length;

  const stats = [
    { label: 'Tarefas', value: `${doneTasks}/${totalTasks}`, pct: totalTasks ? doneTasks / totalTasks : 0, color: 'var(--accent)' },
    { label: 'Hábitos', value: `${doneHabits}/${habits.length}`, pct: habits.length ? doneHabits / habits.length : 0, color: 'var(--green)' },
    { label: 'Eventos', value: String(todayEvents.length), pct: null, color: 'var(--blue)' },
  ];

  return (
    <Widget emoji="📊" title="Resumo do dia" size={size}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {stats.map((c, i) => (
          <div key={i} className="card" style={{ padding: size === 'small' ? '10px 8px' : '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: size === 'small' ? 20 : 24, color: 'var(--text)', lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{c.label}</div>
            {size === 'large' && c.pct !== null && (
              <div style={{ marginTop: 6, height: 3, background: 'var(--bg3)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${c.pct * 100}%`, background: c.color, borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
};

// ── Tarefas do dia ──
const TarefasWidget = ({ onNav, size }) => {
  const [tasks, saveTasks] = useStorage('tasks:items', []);
  const toggleTask = (id) => saveTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const maxItems = size === 'small' ? 0 : size === 'large' ? 8 : 4;
  const pending = tasks.filter(t => !t.done && (t.date === TODAY || !t.date));

  if (size === 'small') {
    return (
      <Widget emoji="✅" title="Tarefas" onLink={() => onNav('tasks')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: pending.length === 0 ? 'var(--green)' : 'var(--text)' }}>{pending.length}</span>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{pending.length === 0 ? 'Tudo em dia!' : `pendente${pending.length !== 1 ? 's' : ''}`}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>tarefas</div>
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="✅" title="Tarefas do dia" onLink={() => onNav('tasks')} linkLabel="Ver todas" size={size}>
      {pending.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--green)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>✓ Tudo em dia!</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {pending.slice(0, maxItems).map((t, i) => {
            const dotColor = t.priority === 'alta' ? 'var(--red)' : t.priority === 'baixa' ? 'var(--text3)' : 'var(--accent)';
            return (
            <div key={t.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < Math.min(pending.length, maxItems) - 1 ? '1px solid var(--line)' : 'none' }}>
              <div
                onClick={() => toggleTask(t.id)}
                style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${dotColor}`, background: 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = dotColor + '22'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</div>
              {t.date && <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{t.date.slice(5)}</span>}
            </div>
            );
          })}
          {pending.length > maxItems && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>+{pending.length - maxItems} mais</div>
          )}
        </div>
      )}
    </Widget>
  );
};

// ── Hábitos ──
const HabitosWidget = ({ onNav, size }) => {
  const [habits] = useStorage('habits:items', []);
  const [habitLogs, saveHabitLogs] = useStorage('habits:logs', {});
  const doneCount = habits.filter(h => habitLogs[`${h.id}:${TODAY}`]).length;
  const maxItems = size === 'large' ? habits.length : 4;

  const toggleHabit = (id) => saveHabitLogs(logs => {
    const key = `${id}:${TODAY}`;
    const updated = { ...logs };
    if (updated[key]) delete updated[key]; else updated[key] = true;
    return updated;
  });

  if (size === 'small') {
    const pct = habits.length ? doneCount / habits.length : 0;
    return (
      <Widget emoji="🏃" title="Hábitos" onLink={() => onNav('tasks')} linkLabel="Ver" size={size}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--text)' }}>{doneCount}/{habits.length}</span>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>hábitos feitos</div>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${pct * 100}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="🏃" title="Hábitos" onLink={() => onNav('tasks')} linkLabel="Ver todos" size={size}>
      {habits.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhum hábito criado</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {habits.slice(0, maxItems).map((habit, i) => {
            const done = !!habitLogs[`${habit.id}:${TODAY}`];
            return (
              <div key={habit.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < Math.min(habits.length, maxItems) - 1 ? '1px solid var(--line)' : 'none' }}>
                <button onClick={() => toggleHabit(habit.id)} style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${done ? 'var(--green)' : 'var(--line)'}`, background: done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s', padding: 0 }}>
                  {done && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                </button>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{habit.icon || '⭐'}</span>
                <div style={{ flex: 1, fontSize: 13, color: done ? 'var(--text3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{habit.name}</div>
              </div>
            );
          })}
          {habits.length > maxItems && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>+{habits.length - maxItems} mais</div>
          )}
        </div>
      )}
    </Widget>
  );
};

// ── Cardápio de hoje ──
const CardapioWidget = ({ onNav, size }) => {
  const [plano] = useStorage('cronograma:refeicoes', {});
  const hoje = plano[TODAY_DAY_ID] || {};
  const filled = REFEICOES_MAP.filter(r => hoje[r.id]);

  if (size === 'small') {
    return (
      <Widget emoji="🍽️" title="Cardápio" onLink={() => onNav('receitas')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{filled.length}/4</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>refeições planejadas</div>
        </div>
      </Widget>
    );
  }

  const items = size === 'large' ? REFEICOES_MAP : filled;

  return (
    <Widget emoji="🍽️" title="Cardápio de hoje" onLink={() => onNav('receitas')} linkLabel="Ver cardápio" size={size}>
      {items.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma refeição planejada</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((r, i) => (
            <div key={r.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none', opacity: !hoje[r.id] && size === 'large' ? 0.4 : 1 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{r.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hoje[r.id] || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
};

// ── Contagem regressiva ──
const ContagemWidget = ({ onNav, size }) => {
  const [countdowns] = useStorage('utilitarios:countdowns', []);
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const upcoming = countdowns
    .map(c => ({ ...c, days: Math.round((new Date(c.date + 'T00:00:00') - base) / 86400000) }))
    .filter(c => c.days >= 0)
    .sort((a, b) => a.days - b.days);
  const next = upcoming[0];

  if (size === 'small') {
    return (
      <Widget emoji="⏳" title="Contagem" onLink={() => onNav('utilitarios')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          {!next ? (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma contagem</div>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: next.days === 0 ? 'var(--green)' : 'var(--text)' }}>{next.days === 0 ? '🎉' : next.days}</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{next.days === 0 ? 'Hoje!' : 'dias'}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{next.label}</div>
              </div>
            </>
          )}
        </div>
      </Widget>
    );
  }

  if (size === 'large') {
    return (
      <Widget emoji="⏳" title="Contagem regressiva" onLink={() => onNav('utilitarios')} linkLabel="Gerenciar" size={size}>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma contagem</div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {upcoming.slice(0, 3).map((c, i) => (
              <div key={c.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i < Math.min(upcoming.length, 3) - 1 ? '1px solid var(--line)' : 'none' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: c.days === 0 ? 'var(--green)' : 'var(--text)', lineHeight: 1, width: 44, textAlign: 'center' }}>{c.days === 0 ? '🎉' : c.days}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.days === 0 ? 'Hoje!' : `${c.days} dia${c.days !== 1 ? 's' : ''}`} — {c.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Widget>
    );
  }

  return (
    <Widget emoji="⏳" title="Contagem regressiva" onLink={() => onNav('utilitarios')} linkLabel="Gerenciar" size={size}>
      {!next ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma contagem</div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 52, color: next.days === 0 ? 'var(--green)' : 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{next.days === 0 ? '🎉' : next.days}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{next.days === 0 ? 'Hoje!' : `dia${next.days !== 1 ? 's' : ''} restante${next.days !== 1 ? 's' : ''}`}</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{next.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{next.date}</div>
        </div>
      )}
    </Widget>
  );
};

// ── Prazos urgentes ──
const UrgentesWidget = ({ onNav, size }) => {
  const [tasks] = useStorage('tasks:items', []);
  const now = new Date();
  const maxItems = size === 'large' ? 5 : 3;
  const urgent = tasks
    .filter(t => !t.done && t.date)
    .filter(t => { const diff = new Date(t.date) - now; return diff >= 0 && diff < 3 * 24 * 3600000; })
    .slice(0, maxItems)
    .map(t => ({ ...t, deadline: new Date(t.date + 'T23:59:00') }));

  if (urgent.length === 0) return null;

  if (size === 'small') {
    return (
      <Widget emoji="⚡" title="Urgentes" onLink={() => onNav('tasks')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'oklch(55% 0.12 15)' }}>{urgent.length}</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>tarefa{urgent.length !== 1 ? 's' : ''} urgente{urgent.length !== 1 ? 's' : ''}</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="⚡" title="Prazos urgentes" onLink={() => onNav('tasks')} linkLabel="Ver tarefas" size={size}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {urgent.map((task, i) => (
          <div key={task.id} style={{ borderBottom: i < urgent.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <CountdownItem task={task} />
          </div>
        ))}
      </div>
    </Widget>
  );
};

// ── Agenda ──
const AgendaWidget = ({ onNav, size }) => {
  const [events] = useStorage('events:items', []);
  const maxItems = size === 'large' ? 6 : 3;
  const todayEvents = events.filter(e => e.date === TODAY).sort((a, b) => a.time > b.time ? 1 : -1);

  if (size === 'small') {
    return (
      <Widget emoji="📅" title="Agenda" onLink={() => onNav('calendario')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{todayEvents.length}</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>evento{todayEvents.length !== 1 ? 's' : ''} hoje</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="📅" title="Hoje na agenda" onLink={() => onNav('calendario')} size={size}>
      {todayEvents.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '20px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhum evento hoje</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {todayEvents.slice(0, maxItems).map(ev => (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', minWidth: 36 }}>{ev.time}</div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{ev.title}</div>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color || 'var(--accent)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
};

// ── Finanças ──
const FinancasWidget = ({ onNav, size }) => {
  const [transactions] = useStorage('financas:transacoes', []);
  const [cats] = useStorage('financas:categorias', []);
  const monthTx = transactions.filter(t => t.date?.startsWith(THIS_MONTH));
  const totalExpense = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  if (size === 'small') {
    return (
      <Widget emoji="💸" title="Finanças" onLink={() => onNav('financas')} linkLabel="Ver" size={size}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>gasto este mês</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)' }}>R$ {totalExpense.toFixed(2)}</div>
        </div>
      </Widget>
    );
  }

  const maxCats = size === 'large' ? 6 : 3;
  const catsWithSpend = cats.slice(0, maxCats).map(cat => {
    const spent = monthTx.filter(t => t.amount < 0 && t.category === cat.id).reduce((s, t) => s + Math.abs(t.amount), 0);
    const pct = cat.limit ? Math.min(spent / cat.limit, 1) : 0;
    return { ...cat, spent, pct };
  }).filter(c => c.spent > 0 || size === 'large');

  return (
    <Widget emoji="💸" title="Finanças" onLink={() => onNav('financas')} linkLabel="Ver tudo" size={size}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: catsWithSpend.length ? '1px solid var(--line)' : 'none' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>total gasto este mês</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', marginTop: 2 }}>R$ {totalExpense.toFixed(2)}</div>
        </div>
        {catsWithSpend.map((cat, i) => (
          <div key={cat.id || i} style={{ padding: '10px 14px', borderBottom: i < catsWithSpend.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: cat.limit ? 5 : 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{cat.icon || ''} {cat.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>R$ {cat.spent.toFixed(0)}{cat.limit ? ` / ${cat.limit}` : ''}</div>
            </div>
            {cat.limit > 0 && (
              <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${cat.pct * 100}%`, background: cat.pct > 0.8 ? 'var(--red)' : cat.color || 'var(--accent)', borderRadius: 99, transition: 'width 0.4s' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
};

// ── Compras ──
const ComprasWidget = ({ onNav, size }) => {
  const [listas] = useStorage('compras:listas', []);
  const curList = listas[0];
  const pending = curList?.itens?.filter(i => !i.done) || [];
  const maxItems = size === 'large' ? 8 : 4;

  if (size === 'small') {
    return (
      <Widget emoji="🛒" title="Compras" onLink={() => onNav('compras')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{pending.length}</span>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>ite{pending.length !== 1 ? 'ns' : 'm'} na lista</div>
            {curList && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{curList.emoji} {curList.nome}</div>}
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="🛒" title={curList ? `${curList.emoji} ${curList.nome}` : 'Compras'} onLink={() => onNav('compras')} linkLabel="Ver lista" size={size}>
      {pending.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--green)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>✓ Lista vazia</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {pending.slice(0, maxItems).map((item, i) => (
            <div key={item.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < Math.min(pending.length, maxItems) - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--line)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.nome}</div>
              {item.qty && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{item.qty}</span>}
            </div>
          ))}
          {pending.length > maxItems && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>+{pending.length - maxItems} mais</div>
          )}
        </div>
      )}
    </Widget>
  );
};

// ── Conteúdo ──
const ConteudoWidget = ({ onNav, size }) => {
  const [content] = useStorage('conteudo:items', []);
  const inProgress = content.filter(c => c.status === 'consumindo');
  const maxItems = size === 'large' ? 6 : 3;

  if (size === 'small') {
    return (
      <Widget emoji="📚" title="Conteúdo" onLink={() => onNav('conteudo')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{inProgress.length}</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>em andamento</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="📚" title="Conteúdo" onLink={() => onNav('conteudo')} linkLabel="Ver tudo" size={size}>
      {inProgress.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nada em andamento</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {inProgress.slice(0, maxItems).map((item, i) => (
            <div key={item.id} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < Math.min(inProgress.length, maxItems) - 1 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{CONTENT_TYPES[item.type] || '📄'}</span>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
            </div>
          ))}
          {inProgress.length > maxItems && (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>+{inProgress.length - maxItems} mais</div>
          )}
        </div>
      )}
    </Widget>
  );
};

// ── Notas recentes ──
const NotasWidget = ({ onNav, size }) => {
  const [notes] = useStorage('notes:items', []);
  const maxItems = size === 'small' ? 1 : size === 'large' ? 4 : 2;

  if (size === 'small') {
    const last = notes[0];
    return (
      <Widget emoji="📓" title="Notas" onLink={() => onNav('pessoal')} linkLabel="Ver" size={size}>
        <div className="card" style={{ padding: '12px 14px' }}>
          {last ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{last.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma nota</div>
          )}
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="📓" title="Notas recentes" onLink={() => onNav('pessoal')} linkLabel="Ver todas" size={size}>
      {notes.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma nota</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: size === 'large' ? '1fr 1fr' : '1fr', gap: 8 }}>
          {notes.slice(0, maxItems).map(note => (
            <div key={note.id} style={{ background: note.color || '#FAF8F5', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--r)', padding: '12px 12px 10px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{note.title}</div>
              {note.body && <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.body}</div>}
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 6 }}>{note.date}</div>
            </div>
          ))}
        </div>
      )}
    </Widget>
  );
};

// ── Diário ──
const DiarioWidget = ({ onNav, size }) => {
  const [journal] = useStorage('journal:items', []);
  const todayEntry = journal.find(j => j.date === TODAY);
  const maxChars = size === 'large' ? 400 : 140;

  if (size === 'small') {
    return (
      <Widget emoji="✍️" title="Diário" onLink={() => onNav('pessoal')} linkLabel="Escrever" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontSize: 22 }}>{todayEntry ? '✓' : '📖'}</span>
          <div style={{ fontSize: 13, color: todayEntry ? 'var(--green)' : 'var(--text2)' }}>
            {todayEntry ? 'Entrada escrita hoje' : 'Escreva no diário'}
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="✍️" title="Diário" onLink={() => onNav('pessoal')} linkLabel="Abrir" size={size}>
      <div className="card" style={{ padding: '14px' }}>
        {todayEntry ? (
          <>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 500 }}>Hoje — {TODAY}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              {todayEntry.text.length > maxChars ? todayEntry.text.slice(0, maxChars) + '…' : todayEntry.text}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>
            📖 Nenhuma entrada hoje. <span style={{ color: 'var(--accent)' }}>Escreva algo!</span>
          </div>
        )}
      </div>
    </Widget>
  );
};

// ── Saúde ──
const SaudeWidget = ({ onNav, size }) => {
  const [meds] = useStorage('saude:meds', []);
  const [medLogs] = useStorage('saude:medlogs', {});
  const [treinos] = useStorage('saude:treinos', []);
  const takenCount = meds.filter(m => medLogs[`${m.id}:${TODAY}`]).length;
  const todayWorkout = treinos.find(t => t.date === TODAY);
  const maxMeds = size === 'large' ? meds.length : 3;

  if (size === 'small') {
    return (
      <Widget emoji="💊" title="Saúde" onLink={() => onNav('saude')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{takenCount}/{meds.length}</span>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>remédios tomados</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="💊" title="Saúde" onLink={() => onNav('saude')} linkLabel="Ver" size={size}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {meds.length > 0 ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid var(--line)' }}>Remédios</div>
            {meds.slice(0, maxMeds).map((med, i) => {
              const taken = !!medLogs[`${med.id}:${TODAY}`];
              return (
                <div key={med.id} style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < Math.min(meds.length, maxMeds) - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: taken ? 'var(--green)' : 'var(--line)', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 13, color: taken ? 'var(--text3)' : 'var(--text)' }}>{med.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{med.time}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhum remédio cadastrado</div>
        )}
        {size === 'large' && todayWorkout && (
          <div className="card" style={{ display: 'flex', gap: 10, padding: '12px 14px', alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>🏋️</span>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{todayWorkout.type || todayWorkout.category}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{todayWorkout.duration ? `${todayWorkout.duration} min` : 'hoje'}</div>
            </div>
          </div>
        )}
      </div>
    </Widget>
  );
};

// ── Viagem ──
const ViagemWidget = ({ onNav, size }) => {
  const [destinos] = useStorage('viagem:destinos', []);
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const upcoming = destinos
    .filter(d => d.dateStart)
    .map(d => ({ ...d, days: Math.round((new Date(d.dateStart + 'T00:00:00') - base) / 86400000) }))
    .filter(d => d.days >= 0)
    .sort((a, b) => a.days - b.days);
  const next = upcoming[0];

  if (size === 'small') {
    return (
      <Widget emoji="✈️" title="Viagem" onLink={() => onNav('viagem')} linkLabel="Ver" size={size}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
          {!next ? (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma viagem</div>
          ) : (
            <>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)' }}>{next.days}</span>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>dias para</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{next.emoji} {next.name}</div>
              </div>
            </>
          )}
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="✈️" title="Próxima viagem" onLink={() => onNav('viagem')} linkLabel="Ver viagens" size={size}>
      {!next ? (
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma viagem planejada</div>
      ) : (
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: size === 'large' && next.notes ? 10 : 0 }}>
            <span style={{ fontSize: 28 }}>{next.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{next.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{next.dateStart}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', lineHeight: 1 }}>{next.days}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>dias</div>
            </div>
          </div>
          {size === 'large' && next.notes && (
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, borderTop: '1px solid var(--line)', paddingTop: 10 }}>{next.notes}</div>
          )}
        </div>
      )}
    </Widget>
  );
};

// ── Inspiração ──
const InspiracaoWidget = ({ size }) => {
  const [paletas] = useStorage('inspiracao:paletas', []);
  const normColor = c => typeof c === 'string' ? { hex: c, name: '' } : c;

  if (paletas.length === 0) {
    return (
      <Widget emoji="🎨" title="Inspiração" size={size}>
        <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)' }}>Nenhuma paleta salva</div>
      </Widget>
    );
  }

  const showPalettes = size === 'large' ? paletas.slice(0, 3) : [paletas[0]];

  if (size === 'small') {
    const colors = (paletas[0].colors || []).map(normColor);
    return (
      <Widget emoji="🎨" title="Inspiração" size={size}>
        <div className="card" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8 }}>{paletas[0].name}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {colors.slice(0, 5).map((c, i) => (
              <div key={i} style={{ flex: 1, height: 20, borderRadius: 4, background: c.hex, border: '1px solid rgba(0,0,0,0.06)' }} />
            ))}
          </div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget emoji="🎨" title="Inspiração" size={size}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {showPalettes.map(p => {
          const pColors = (p.colors || []).map(normColor);
          return (
            <div key={p.id} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{p.name}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {pColors.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ flex: 1, height: size === 'large' ? 32 : 24, borderRadius: 4, background: c.hex, border: '1px solid rgba(0,0,0,0.06)' }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Widget>
  );
};

// ── Acesso rápido ──
const AcessoWidget = ({ onNav, size }) => {
  const items = size === 'small' ? QUICK_ACCESS.slice(0, 4) : QUICK_ACCESS;
  return (
    <Widget emoji="🔗" title="Acesso rápido" size={size}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {items.map((item, i) => (
          <button key={i} onClick={() => onNav(item.screen)} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: size === 'small' ? '10px 4px 8px' : '14px 6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'var(--sans)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            <Icon name={item.icon} size={size === 'small' ? 16 : 18} color="var(--text2)" />
            <span style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.02em', lineHeight: 1.2, textAlign: 'center' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </Widget>
  );
};

// ═══════════════════════════════
// HOME
// ═══════════════════════════════
const Home = ({ onNav, userName }) => {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS[now.getMonth()]}`;
  const hour = now.getHours();
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const [userProfile] = useStorage('auth:user', {});
  const rawName = userName || userProfile?.name || userProfile?.username || '';
  const firstName = rawName ? rawName.trim().split(/\s+/)[0] : '';
  const name = firstName || 'você';

  const [rawConfig, saveConfig] = useStorage('home:widgets', DEFAULT_CONFIG);
  const config = rawConfig.map(normalize);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);

  const activeIds = config.map(w => w.id);
  const inactiveWidgets = WIDGET_DEFS.filter(d => !activeIds.includes(d.id));

  const reorder = (from, to) => {
    const next = [...config];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    saveConfig(next);
  };

  const addWidget = (id) => saveConfig(c => [...c.map(normalize), { id, size: 'medium' }]);
  const removeWidget = (id) => saveConfig(c => c.map(normalize).filter(w => w.id !== id));
  const setWidgetSize = (id, size) => saveConfig(c => c.map(normalize).map(w => w.id === id ? { ...w, size } : w));

  const renderWidget = (id, size) => {
    switch (id) {
      case 'mood':       return <MoodWidget      key={id} size={size} />;
      case 'quicknote':  return <QuickNoteWidget key={id} size={size} />;
      case 'stats':      return <StatsWidget     key={id} size={size} />;
      case 'tarefas':    return <TarefasWidget   key={id} size={size} onNav={onNav} />;
      case 'habitos':    return <HabitosWidget   key={id} size={size} onNav={onNav} />;
      case 'cardapio':   return <CardapioWidget  key={id} size={size} onNav={onNav} />;
      case 'contagem':   return <ContagemWidget  key={id} size={size} onNav={onNav} />;
      case 'urgentes':   return <UrgentesWidget  key={id} size={size} onNav={onNav} />;
      case 'agenda':     return <AgendaWidget    key={id} size={size} onNav={onNav} />;
      case 'financas':   return <FinancasWidget  key={id} size={size} onNav={onNav} />;
      case 'compras':    return <ComprasWidget   key={id} size={size} onNav={onNav} />;
      case 'conteudo':   return <ConteudoWidget  key={id} size={size} onNav={onNav} />;
      case 'notas':      return <NotasWidget     key={id} size={size} onNav={onNav} />;
      case 'diario':     return <DiarioWidget    key={id} size={size} onNav={onNav} />;
      case 'saude':      return <SaudeWidget     key={id} size={size} onNav={onNav} />;
      case 'viagem':     return <ViagemWidget    key={id} size={size} onNav={onNav} />;
      case 'inspiracao': return <InspiracaoWidget key={id} size={size} />;
      case 'acesso':     return <AcessoWidget    key={id} size={size} onNav={onNav} />;
      default: return null;
    }
  };

  return (
    <div className="screen" style={{ padding: '24px 24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'capitalize' }}>{dateStr}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 26, color: 'var(--text)', lineHeight: 1.15 }}>
            {greet}, <em>{name}.</em>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <button
            onClick={() => onNav('busca')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Buscar"
          >
            <Icon name="search" size={17} color="var(--text2)" />
          </button>
          <button
            onClick={() => setShowPersonalize(true)}
            style={{ background: 'var(--bg2)', border: 'none', borderRadius: 'var(--r-sm)', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500 }}
          >
            <Icon name="edit" size={14} color="var(--text2)" />
            Widgets
          </button>
          <LotusLogo size={26} color="var(--text3)" />
        </div>
      </div>

      {/* Active widgets */}
      {config.map(w => renderWidget(w.id, w.size))}

      {/* Personalization modal */}
      <Modal open={showPersonalize} onClose={() => setShowPersonalize(false)} title="Personalizar widgets">
        {/* Active list */}
        {config.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div className="section-label">Ativos — arraste para reordenar</div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              {config.map((w, i) => {
                const def = WIDGET_DEFS.find(d => d.id === w.id);
                if (!def) return null;
                const isDragging = dragIdx === i;
                const isDropTarget = dropIdx === i && dragIdx !== i;
                return (
                  <div
                    key={w.id}
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragOver={e => { e.preventDefault(); setDropIdx(i); }}
                    onDragEnd={() => {
                      if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) reorder(dragIdx, dropIdx);
                      setDragIdx(null); setDropIdx(null);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                      borderBottom: i < config.length - 1 ? '1px solid var(--line)' : 'none',
                      background: isDropTarget ? 'var(--accent-bg)' : 'var(--surface)',
                      opacity: isDragging ? 0.4 : 1,
                      transition: 'background 0.12s',
                      userSelect: 'none',
                    }}
                  >
                    <GripDots />
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{def.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{def.label}</div>
                    </div>
                    {/* Size pills */}
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      {['small', 'medium', 'large'].map(s => (
                        <button
                          key={s}
                          onClick={() => setWidgetSize(w.id, s)}
                          style={{
                            width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: w.size === s ? 'var(--text)' : 'var(--bg2)',
                            color: w.size === s ? 'var(--bg)' : 'var(--text3)',
                            fontSize: 10, fontFamily: 'var(--sans)', fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                        >
                          {SIZE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeWidget(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '4px', display: 'flex', flexShrink: 0 }}>
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available widgets */}
        {inactiveWidgets.length > 0 && (
          <div>
            <div className="section-label">Disponíveis</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {inactiveWidgets.map(def => (
                <button
                  key={def.id}
                  onClick={() => addWidget(def.id)}
                  style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)', display: 'flex', flexDirection: 'column', gap: 4, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
                >
                  <span style={{ fontSize: 20 }}>{def.emoji}</span>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{def.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.3 }}>{def.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}>
                    + Adicionar
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {inactiveWidgets.length === 0 && config.length > 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
            Todos os widgets estão ativos 🎉
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Home;
