import Icon from './Icon';
import LotusLogo from './LotusLogo';

const NAV_ITEMS = [
  { id: 'home',    label: 'Início',    icon: 'home' },
  { id: 'tasks',   label: 'Tarefas',   icon: 'tasks' },
  { id: 'pessoal', label: 'Pessoal',   icon: 'person' },
  { id: 'mais',    label: 'Mais',      icon: 'more' },
];

const SUB_ITEMS = [
  { id: 'compras',      label: 'Compras',     icon: 'cart' },
  { id: 'financas',     label: 'Finanças',    icon: 'wallet' },
  { id: 'calendario',   label: 'Calendário',  icon: 'calendar' },
  { id: 'saude',        label: 'Saúde',       icon: 'heart' },
  { id: 'cofre',        label: 'Cofre',       icon: 'lock' },
  { id: 'viagem',       label: 'Viagem',      icon: 'plane' },
  { id: 'conteudo',     label: 'Conteúdo',    icon: 'book' },
  { id: 'portfolio',    label: 'Portfólio',   icon: 'portfolio' },
  { id: 'inspiracao',   label: 'Inspiração',  icon: 'palette' },
  { id: 'utilitarios',  label: 'Utilitários', icon: 'calculator' },
  { id: 'notificacoes', label: 'Avisos',      icon: 'bell' },
  { id: 'receitas',     label: 'Receitas',    icon: 'utensils' },
  { id: 'idiomas',      label: 'Idiomas',     icon: 'globe' },
  { id: 'links',        label: 'Links',       icon: 'link' },
  { id: 'capilar',      label: 'Capilar',     icon: 'leaf' },
];

const Sidebar = ({ active, onChange, userName }) => {
  const initials = userName ? userName.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <aside className="sidebar">
      <div style={{ padding: '0 24px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <LotusLogo size={28} />
        <span style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', lineHeight: 1 }}>Lotus</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {NAV_ITEMS.map(item => (
          <SidebarItem key={item.id} item={item} active={active} onChange={onChange} />
        ))}

        <div style={{ height: 1, background: 'var(--line)', margin: '10px 8px' }} />

        {SUB_ITEMS.map(item => (
          <SidebarItem key={item.id} item={item} active={active} onChange={onChange} small />
        ))}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--line)' }}>
        <button
          onClick={() => onChange('perfil')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
            background: active === 'perfil' ? 'var(--accent-bg)' : 'transparent',
            width: '100%', textAlign: 'left', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (active !== 'perfil') e.currentTarget.style.background = 'var(--bg2)'; }}
          onMouseLeave={e => { if (active !== 'perfil') e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--accent-dk)', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: active === 'perfil' ? 'var(--accent-dk)' : 'var(--text)' }}>{userName || 'Usuário'}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Perfil</div>
          </div>
        </button>
      </div>
    </aside>
  );
};

const SidebarItem = ({ item, active, onChange, small }) => {
  const isActive = active === item.id;
  return (
    <button
      onClick={() => onChange(item.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: small ? '8px 12px' : '10px 12px',
        borderRadius: 'var(--r-sm)',
        border: 'none',
        cursor: 'pointer',
        background: isActive ? 'var(--accent-bg)' : 'transparent',
        color: isActive ? 'var(--accent-dk)' : 'var(--text2)',
        fontFamily: 'var(--sans)',
        fontSize: small ? 13 : 14,
        fontWeight: 500,
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg2)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon name={item.icon} size={small ? 16 : 18} color={isActive ? 'var(--accent)' : 'var(--text3)'} />
      {item.label}
    </button>
  );
};

export default Sidebar;
