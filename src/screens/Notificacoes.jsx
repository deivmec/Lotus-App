import BackHeader from '../components/BackHeader';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

const diffDays = (dateStr) => {
  const d = new Date(dateStr);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
};

const UrgencyBadge = ({ days }) => {
  if (days <= 0) return <span className="tag" style={{ background: 'oklch(97% 0.03 15)', color: 'oklch(55% 0.12 15)' }}>Hoje</span>;
  if (days === 1) return <span className="tag" style={{ background: 'oklch(97% 0.03 15)', color: 'oklch(55% 0.12 15)' }}>Amanhã</span>;
  return <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>em {days}d</span>;
};

const NotifItem = ({ icon, title, sub, urgency, color = 'var(--text2)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
    <div style={{ width: 36, height: 36, background: 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={18} color={color} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
    </div>
    {urgency}
  </div>
);

const Notificacoes = ({ onBack }) => {
  const [tasks] = useStorage('tasks:items', []);
  const [events] = useStorage('events:items', []);
  const [travelDocs] = useStorage('viagem:docs', []);
  const [meds] = useStorage('saude:meds', []);
  const [medLogs] = useStorage('saude:medlogs', {});

  // Tarefas com prazo nos próximos 3 dias
  const urgentTasks = tasks.filter(t => !t.done && t.date).map(t => ({ ...t, days: diffDays(t.date) })).filter(t => t.days >= 0 && t.days <= 3).sort((a, b) => a.days - b.days);

  // Eventos nos próximos 7 dias
  const upcomingEvents = events.filter(e => {
    const d = diffDays(e.date);
    return d >= 0 && d <= 7;
  }).map(e => ({ ...e, days: diffDays(e.date) })).sort((a, b) => a.days - b.days);

  // Documentos vencendo em < 90 dias
  const expiringDocs = travelDocs.filter(d => d.expiry).map(d => ({ ...d, days: diffDays(d.expiry) })).filter(d => d.days >= 0 && d.days < 90).sort((a, b) => a.days - b.days);

  // Remédios não tomados hoje
  const unTakenMeds = meds.filter(m => !medLogs[`${m.id}:${todayStr}`]);

  const total = urgentTasks.length + upcomingEvents.length + expiringDocs.length + unTakenMeds.length;

  return (
    <div className="screen">
      <BackHeader title="Notificações" subtitle={`${total} iten${total !== 1 ? 's' : ''} pendente${total !== 1 ? 's' : ''}`} onBack={onBack} />
      <div style={{ padding: '0 0 32px' }}>

        {total === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontFamily: 'var(--serif)', color: 'var(--text)', marginBottom: 8 }}>Tudo em dia!</div>
            <div style={{ fontSize: 14 }}>Nenhuma notificação urgente</div>
          </div>
        )}

        {urgentTasks.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div className="section-label" style={{ padding: '0 24px' }}>Tarefas urgentes</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 24px', borderRadius: 'var(--r)' }}>
              {urgentTasks.map(t => (
                <NotifItem key={t.id} icon="tasks" title={t.text} sub={`Prazo: ${t.date}`} urgency={<UrgencyBadge days={t.days} />} color={t.days === 0 ? 'var(--red)' : 'var(--text2)'} />
              ))}
            </div>
          </div>
        )}

        {upcomingEvents.length > 0 && (
          <div style={{ marginBottom: 8, marginTop: 20 }}>
            <div className="section-label" style={{ padding: '0 24px' }}>Próximos eventos</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 24px' }}>
              {upcomingEvents.map(e => (
                <NotifItem key={e.id} icon="calendar" title={e.title} sub={`${e.date} às ${e.time}`} urgency={<UrgencyBadge days={e.days} />} color="var(--blue)" />
              ))}
            </div>
          </div>
        )}

        {expiringDocs.length > 0 && (
          <div style={{ marginBottom: 8, marginTop: 20 }}>
            <div className="section-label" style={{ padding: '0 24px' }}>Documentos vencendo</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 24px' }}>
              {expiringDocs.map(d => (
                <NotifItem key={d.id} icon="compass" title={d.name} sub={`Vence: ${d.expiry}`} urgency={<UrgencyBadge days={d.days} />} color="oklch(55% 0.12 15)" />
              ))}
            </div>
          </div>
        )}

        {unTakenMeds.length > 0 && (
          <div style={{ marginBottom: 8, marginTop: 20 }}>
            <div className="section-label" style={{ padding: '0 24px' }}>Remédios de hoje</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden', margin: '0 24px' }}>
              {unTakenMeds.map(m => (
                <NotifItem key={m.id} icon="pill" title={m.name} sub={`${m.dose} · ${m.time}`} urgency={<span className="tag" style={{ background: 'oklch(96% 0.04 42)', color: 'var(--accent-dk)' }}>Pendente</span>} color="var(--accent)" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notificacoes;
