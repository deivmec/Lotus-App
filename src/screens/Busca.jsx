import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';

// ── Screen/topic directory — searched by keywords ────────────────────────────
const TOPICS = [
  { nav: 'receitas',     icon: 'utensils', label: 'Receitas',            desc: 'Suas receitas favoritas',           keywords: ['receita','cozinha','comida','prato','ingrediente'] },
  { nav: 'financas',     icon: 'wallet',   label: 'Finanças',            desc: 'Gastos, renda e metas',             keywords: ['financ','dinheiro','gasto','despesa','renda','orcamento','orçamento','conta','poupança','poupanca'] },
  { nav: 'saude',        icon: 'heart',    label: 'Saúde & Bem-estar',   desc: 'Humor, ciclo, remédios, treinos',   keywords: ['saude','saúde','bem estar','bemestar','remedio','remédio','treino','ciclo','menstrua','humor','vitamina','medicamento'] },
  { nav: 'viagem',       icon: 'plane',    label: 'Viagem',              desc: 'Destinos e bucket list',            keywords: ['viagem','destino','mochilão','mochilao','turismo','passagem','viajar','férias','ferias'] },
  { nav: 'calendario',   icon: 'calendar', label: 'Calendário',          desc: 'Eventos e agenda',                  keywords: ['calendario','calendário','agenda','evento','compromisso','data'] },
  { nav: 'tasks',        icon: 'tasks',    label: 'Tarefas & Hábitos',   desc: 'Pendências e rotina',               keywords: ['tarefa','habito','hábito','pendencia','pendência','rotina','checklist','lista de tarefas'] },
  { nav: 'pessoal',      icon: 'person',   label: 'Pessoal',             desc: 'Diário e notas',                    keywords: ['pessoal','diario','diário','nota','anotacao','anotação','caderno'] },
  { nav: 'compras',      icon: 'cart',     label: 'Compras',             desc: 'Lista e recorrentes',               keywords: ['compra','mercado','lista','supermercado','recorrente','wishlist'] },
  { nav: 'inspiracao',   icon: 'palette',  label: 'Inspiração',          desc: 'Moodboard, quadros e paletas',      keywords: ['inspiracao','inspiração','moodboard','quadro','paleta','cores','visão','visao'] },
  { nav: 'inspiracao',   icon: 'portfolio',label: 'Portfólio',           desc: 'Projetos e trabalhos',              keywords: ['portfolio','portfólio','projeto','trabalho','profissional'] },
  { nav: 'cofre',        icon: 'lock',     label: 'Cofre',               desc: 'Senhas e documentos',               keywords: ['cofre','senha','documento','login','segredo','privado'] },
  { nav: 'conteudo',     icon: 'book',     label: 'Conteúdo',            desc: 'Livros, filmes, cursos',            keywords: ['conteudo','conteúdo','livro','filme','serie','série','podcast','curso','leitura','assistir'] },
  { nav: 'utilitarios',  icon: 'calculator',label:'Utilitários',         desc: 'Calculadora, moedas e contagens',   keywords: ['utilitario','utilitário','calculadora','moeda','cambio','câmbio','contagem','regressiva','conversor'] },
  { nav: 'idiomas',      icon: 'globe',    label: 'Idiomas',             desc: 'Vocabulário e flashcards',          keywords: ['idioma','lingua','língua','vocabulario','vocabulário','flashcard','ingles','inglês','espanhol','francês','frances'] },
  { nav: 'links',        icon: 'link',     label: 'Links Rápidos',       desc: 'Favoritos organizados',             keywords: ['link','favorito','atalho','url','site','pagina','página'] },
  { nav: 'capilar',      icon: 'leaf',     label: 'Cronograma Capilar',  desc: 'Cuidados com o cabelo',             keywords: ['capilar','cabelo','cronograma','hidratacao','hidratação','nutrição','nutricao'] },
  { nav: 'notificacoes', icon: 'bell',     label: 'Notificações',        desc: 'Avisos e lembretes',                keywords: ['notificacao','notificação','aviso','lembrete','alerta'] },
];

// ── Data sections — searched by stored items ─────────────────────────────────
const DATA_SECTIONS = [
  { key: 'viagem:destinos',        nav: 'viagem',       icon: 'plane',       label: 'Viagem',          getItems: items => items.map(d => ({ id: d.id, title: `${d.emoji||'✈️'} ${d.name}`, sub: [d.type, d.dateStart].filter(Boolean).join(' · ') })), search: (d, q) => d.name?.toLowerCase().includes(q) },
  { key: 'inspiracao:boards',      nav: 'inspiracao',   icon: 'palette',     label: 'Quadros',         getItems: items => items.map(b => ({ id: b.id, title: b.name, sub: `${b.items?.length||0} foto${b.items?.length!==1?'s':''}` })), search: (b, q) => b.name?.toLowerCase().includes(q) },
  { key: 'portfolio:items',        nav: 'inspiracao',   icon: 'portfolio',   label: 'Portfólio',       getItems: items => items.map(p => ({ id: p.id, title: `${p.emoji||'💼'} ${p.name}`, sub: p.status })), search: (p, q) => p.name?.toLowerCase().includes(q) || p.desc?.toLowerCase().includes(q) },
  { key: 'tasks:items',            nav: 'tasks',        icon: 'tasks',       label: 'Tarefas',         getItems: items => items.map(t => ({ id: t.id, title: t.text, sub: t.category || t.date || '' })), search: (t, q) => t.text?.toLowerCase().includes(q) },
  { key: 'notes:items',            nav: 'pessoal',      icon: 'person',      label: 'Notas',           getItems: items => items.map(n => ({ id: n.id, title: n.title || 'Sem título', sub: n.body?.slice(0, 50) })), search: (n, q) => n.title?.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q) },
  { key: 'receitas:items',         nav: 'receitas',     icon: 'utensils',    label: 'Receitas',        getItems: items => items.map(r => ({ id: r.id, title: r.nome, sub: r.cat })), search: (r, q) => r.nome?.toLowerCase().includes(q) || r.cat?.toLowerCase().includes(q) },
  { key: 'conteudo:items',         nav: 'conteudo',     icon: 'book',        label: 'Conteúdo',        getItems: items => items.map(c => ({ id: c.id, title: c.title, sub: [c.type, c.author].filter(Boolean).join(' · ') })), search: (c, q) => c.title?.toLowerCase().includes(q) || c.author?.toLowerCase().includes(q) },
  { key: 'utilitarios:countdowns', nav: 'utilitarios',  icon: 'calculator',  label: 'Contagens',       getItems: items => items.map(c => ({ id: c.id, title: c.label, sub: c.date })), search: (c, q) => c.label?.toLowerCase().includes(q) },
];

const Busca = ({ onBack, onNav }) => {
  const [query, setQuery] = useState('');

  const [v]  = useStorage('viagem:destinos', []);
  const [b]  = useStorage('inspiracao:boards', []);
  const [p]  = useStorage('portfolio:items', []);
  const [t]  = useStorage('tasks:items', []);
  const [n]  = useStorage('notes:items', []);
  const [r]  = useStorage('receitas:items', []);
  const [c]  = useStorage('conteudo:items', []);
  const [cd] = useStorage('utilitarios:countdowns', []);

  const DATA = { 'viagem:destinos': v, 'inspiracao:boards': b, 'portfolio:items': p, 'tasks:items': t, 'notes:items': n, 'receitas:items': r, 'conteudo:items': c, 'utilitarios:countdowns': cd };

  const q = query.toLowerCase().trim();

  // Section/topic matches (by keyword)
  const topicMatches = q
    ? TOPICS.filter(t => t.label.toLowerCase().includes(q) || t.keywords.some(k => k.includes(q) || q.includes(k)))
    : [];

  // Deduplicate topics by nav
  const seenNavs = new Set();
  const uniqueTopics = topicMatches.filter(t => {
    const key = t.nav + t.label;
    if (seenNavs.has(key)) return false;
    seenNavs.add(key); return true;
  });

  // Data item matches (by stored content)
  const dataGroups = q
    ? DATA_SECTIONS.map(sec => {
        const matches = (DATA[sec.key] || []).filter(item => sec.search(item, q));
        if (!matches.length) return null;
        return { ...sec, results: sec.getItems(matches) };
      }).filter(Boolean)
    : [];

  const totalResults = uniqueTopics.length + dataGroups.reduce((acc, g) => acc + g.results.length, 0);

  return (
    <div className="screen">
      <BackHeader title="Busca" onBack={onBack} />
      <div style={{ padding: '0 24px 40px' }}>

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon name="search" size={16} color="var(--text3)" />
          </div>
          <input
            className="input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Receitas, finanças, saúde, viagens..."
            autoFocus
            style={{ paddingLeft: 38 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 4 }}>×</button>
          )}
        </div>

        {/* Empty state */}
        {!q && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Pesquise em tudo</div>
            <div style={{ fontSize: 12 }}>Seções, viagens, notas, receitas, tarefas…</div>
          </div>
        )}

        {/* No results */}
        {q && totalResults === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Nenhum resultado</div>
            <div style={{ fontSize: 12 }}>Tente outras palavras</div>
          </div>
        )}

        {q && totalResults > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}
            </div>

            {/* ── Topic/section results ── */}
            {uniqueTopics.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name="more" size={13} color="var(--text3)" />
                  <div className="section-label" style={{ margin: 0 }}>Seções</div>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {uniqueTopics.map((topic, i) => (
                    <button
                      key={topic.nav + topic.label}
                      onClick={() => onNav(topic.nav)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', borderBottom: i < uniqueTopics.length - 1 ? '1px solid var(--line)' : 'none', fontFamily: 'var(--sans)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={topic.icon} size={16} color="var(--accent)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{topic.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{topic.desc}</div>
                      </div>
                      <Icon name="arrow" size={14} color="var(--text3)" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Data item results ── */}
            {dataGroups.map(group => (
              <div key={group.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Icon name={group.icon} size={13} color="var(--text3)" />
                  <div className="section-label" style={{ margin: 0 }}>{group.label}</div>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {group.results.map((item, i) => (
                    <button
                      key={item.id}
                      onClick={() => onNav(group.nav)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', borderBottom: i < group.results.length - 1 ? '1px solid var(--line)' : 'none', fontFamily: 'var(--sans)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        {item.sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>}
                      </div>
                      <Icon name="arrow" size={14} color="var(--text3)" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Busca;
