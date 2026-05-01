import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const TYPES = [
  { id: 'todos', label: 'Todos' },
  { id: 'livro', label: 'Livros' },
  { id: 'curso', label: 'Cursos' },
  { id: 'podcast', label: 'Pods' },
  { id: 'filme', label: 'Filmes' },
];

const STATUS_CONFIG = {
  'quero ler':  { label: 'Quero',    bg: 'var(--bg2)',      color: 'var(--text3)' },
  'lendo':       { label: 'Em curso', bg: 'var(--blue-bg)',  color: 'var(--blue)' },
  'pausado':     { label: 'Pausado',  bg: 'var(--bg2)',      color: 'var(--text3)' },
  'concluído':   { label: 'Feito',    bg: 'var(--green-bg)', color: 'var(--green)' },
};

const Conteudo = ({ onBack }) => {
  const [typeFilter, setTypeFilter] = useState('todos');
  const [content, saveContent] = useStorage('conteudo:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', type: 'livro', status: 'quero ler', progress: 0, link: '' });
  const toast = useToast();

  const filtered = content.filter(c => typeFilter === 'todos' || c.type === typeFilter);

  const addItem = () => {
    if (!form.title.trim()) return;
    saveContent(cs => [...cs, { id: newId(), ...form }]);
    setForm({ title: '', author: '', type: 'livro', status: 'quero ler', progress: 0, link: '' });
    setShowModal(false);
    toast('Adicionado');
  };
  const updateStatus = (id, status) => saveContent(cs => cs.map(c => c.id === id ? { ...c, status } : c));
  const delItem = (id) => { saveContent(cs => cs.filter(c => c.id !== id)); toast('Removido'); };

  const TYPE_ICONS = { livro: 'book', curso: 'laptop', podcast: 'mic', filme: 'film', artigo: 'note', tutorial: 'laptop' };

  return (
    <div className="screen">
      <BackHeader title="Conteúdo" subtitle="Livros, cursos e mais" onBack={onBack}
        action={<button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}><Icon name="plus" size={20} /></button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ overflowX: 'auto', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6, paddingBottom: 4 }}>
            {TYPES.map(t => (
              <button key={t.id} onClick={() => setTypeFilter(t.id)} style={{
                padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${typeFilter === t.id ? 'var(--accent)' : 'var(--line)'}`,
                background: typeFilter === t.id ? 'var(--accent-bg)' : 'white',
                color: typeFilter === t.id ? 'var(--accent-dk)' : 'var(--text2)',
                cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 14 }}>Nenhum item ainda</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(item => {
              const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['quero ler'];
              return (
                <div key={item.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: 'var(--bg2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name={TYPE_ICONS[item.type] || 'book'} size={18} color="var(--text2)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{item.title}</div>
                      {item.author && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>{item.author}</div>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: item.status === 'lendo' ? 8 : 0 }}>
                        <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>{item.type}</span>
                        <select
                          value={item.status}
                          onChange={e => updateStatus(item.id, e.target.value)}
                          style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, border: `1px solid ${sc.color}`, background: sc.bg, color: sc.color, cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500 }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      {item.status === 'lendo' && item.progress > 0 && (
                        <ProgressBar value={item.progress} height={3} />
                      )}
                    </div>
                    <button onClick={() => delItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo item">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          <input className="input" placeholder="Autor / Canal" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
          <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="livro">Livro</option>
            <option value="curso">Curso</option>
            <option value="podcast">Podcast</option>
            <option value="filme">Filme / Série</option>
            <option value="artigo">Artigo</option>
            <option value="tutorial">Tutorial</option>
          </select>
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="quero ler">Quero consumir</option>
            <option value="lendo">Em curso</option>
            <option value="pausado">Pausado</option>
            <option value="concluído">Concluído</option>
          </select>
          <input className="input" placeholder="Link (opcional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          <button className="btn-primary" onClick={addItem}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Conteudo;
