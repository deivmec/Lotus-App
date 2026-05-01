import Icon from './Icon';

const NAV_ITEMS = [
  { id: 'home',    label: 'Início',  icon: 'home' },
  { id: 'tasks',   label: 'Tarefas', icon: 'tasks' },
  { id: 'pessoal', label: 'Pessoal', icon: 'person' },
  { id: 'mais',    label: 'Mais',    icon: 'more' },
];

const BottomNav = ({ active, onChange }) => (
  <nav className="bottom-nav">
    {NAV_ITEMS.map(item => (
      <button
        key={item.id}
        className={`nav-item${active === item.id ? ' active' : ''}`}
        onClick={() => onChange(item.id)}
      >
        <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={item.icon} size={20} />
        </div>
        {item.label}
      </button>
    ))}
  </nav>
);

export default BottomNav;
