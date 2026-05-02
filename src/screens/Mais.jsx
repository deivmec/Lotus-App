import Icon from '../components/Icon';

const SECTIONS = [
  { id: 'perfil',       icon: 'user',       label: 'Perfil & Configurações',  desc: 'Conta, aparência e preferências' },
  { id: 'compras',      icon: 'cart',       label: 'Compras',              desc: 'Listas e wishlist' },
  { id: 'financas',     icon: 'wallet',     label: 'Finanças',             desc: 'Gastos e metas' },
  { id: 'calendario',   icon: 'calendar',   label: 'Calendário',           desc: 'Eventos e agenda' },
  { id: 'saude',        icon: 'heart',      label: 'Saúde & Bem-estar',    desc: 'Humor, ciclo, treinos' },
  { id: 'cofre',        icon: 'lock',       label: 'Cofre',                desc: 'Documentos e logins' },
  { id: 'viagem',       icon: 'plane',      label: 'Viagem',               desc: 'Bucket list e planos' },
  { id: 'conteudo',     icon: 'book',       label: 'Conteúdo',             desc: 'Livros, filmes, cursos' },
  { id: 'inspiracao',   icon: 'palette',    label: 'Inspiração',           desc: 'Moodboard, quadros e paletas' },
  { id: 'utilitarios',  icon: 'calculator', label: 'Utilitários',          desc: 'Calculadora e conversor' },
  { id: 'notificacoes', icon: 'bell',       label: 'Notificações',         desc: 'Avisos urgentes' },
  { id: 'receitas',     icon: 'utensils',   label: 'Receitas',             desc: 'Suas receitas favoritas' },
  { id: 'idiomas',      icon: 'globe',      label: 'Idiomas',              desc: 'Vocabulário e flashcards' },
  { id: 'links',        icon: 'link',       label: 'Links Rápidos',        desc: 'Favoritos organizados' },
  { id: 'capilar',      icon: 'leaf',       label: 'Cronograma Capilar',   desc: 'Cuidados com o cabelo' },
];

const Mais = ({ onNav }) => (
  <div className="screen" style={{ padding: '24px 24px 32px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', lineHeight: 1.2 }}>Mais</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Todas as seções</div>
      </div>
      <button
        onClick={() => onNav('busca')}
        style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}
        title="Pesquisar"
      >
        <Icon name="search" size={18} color="var(--text2)" />
      </button>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onNav(s.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r)',
            cursor: 'pointer',
            fontFamily: 'var(--sans)',
            textAlign: 'left',
            transition: 'background 0.15s',
            width: '100%',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          <div style={{ width: 38, height: 38, background: 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name={s.icon} size={18} color="var(--text2)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{s.desc}</div>
          </div>
          <Icon name="arrow" size={16} color="var(--text3)" />
        </button>
      ))}
    </div>
  </div>
);

export default Mais;
