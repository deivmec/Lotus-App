import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const Portfolio = ({ onBack }) => {
  const [projects, saveProjects] = useStorage('portfolio:items', []);
  const [showModal, setShowModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '💼', desc: '', link: '', tags: '', status: 'em desenvolvimento' });
  const [newItemText, setNewItemText] = useState('');
  const toast = useToast();

  const addProject = () => {
    if (!form.name.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    saveProjects(ps => [...ps, { id: newId(), ...form, tags, items: [] }]);
    setForm({ name: '', emoji: '💼', desc: '', link: '', tags: '', status: 'em desenvolvimento' });
    setShowModal(false);
    toast('Projeto adicionado');
  };
  const delProject = (id) => { saveProjects(ps => ps.filter(p => p.id !== id)); toast('Removido'); };

  const addItem = (projectId) => {
    if (!newItemText.trim()) return;
    saveProjects(ps => ps.map(p => p.id === projectId ? { ...p, items: [...(p.items || []), { id: newId(), text: newItemText, done: false }] } : p));
    setNewItemText('');
    toast('Item adicionado');
  };
  const toggleItem = (projectId, itemId) => {
    saveProjects(ps => ps.map(p => p.id === projectId ? { ...p, items: p.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : p));
  };

  const STATUS_CONFIG = {
    'em desenvolvimento': { bg: 'var(--blue-bg)',  color: 'var(--blue)' },
    'concluído':           { bg: 'var(--green-bg)', color: 'var(--green)' },
    'pausado':             { bg: 'var(--bg2)',       color: 'var(--text3)' },
  };

  return (
    <div className="screen">
      <BackHeader title="Portfólio" onBack={onBack}
        action={<button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}><Icon name="plus" size={20} /></button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
            <div style={{ fontSize: 14 }}>Nenhum projeto ainda</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projects.map(proj => {
              const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG['em desenvolvimento'];
              return (
                <div key={proj.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 28 }}>{proj.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontFamily: 'var(--serif)', color: 'var(--text)' }}>{proj.name}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: sc.bg, color: sc.color }}>{proj.status}</span>
                        {proj.tags?.map((t, i) => <span key={i} className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>{t}</span>)}
                      </div>
                    </div>
                    <button onClick={() => delProject(proj.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>

                  {proj.desc && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>{proj.desc}</div>}

                  {(proj.items || []).length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      {proj.items.map(item => (
                        <div key={item.id} onClick={() => toggleItem(proj.id, item.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', cursor: 'pointer' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid', borderColor: item.done ? 'var(--green)' : 'var(--line)', background: item.done ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {item.done && <Icon name="check" size={8} />}
                          </div>
                          <span style={{ fontSize: 13, color: item.done ? 'var(--text3)' : 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showItemModal === proj.id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" placeholder="Adicionar item..." value={newItemText} onChange={e => setNewItemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(proj.id)} autoFocus style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} />
                      <button onClick={() => addItem(proj.id)} style={{ background: 'var(--text)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13 }}>+</button>
                      <button onClick={() => { setShowItemModal(null); setNewItemText(''); }} style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text2)', fontFamily: 'var(--sans)', fontSize: 13 }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowItemModal(proj.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="plus" size={13} color="var(--text3)" />
                      Adicionar item
                    </button>
                  )}

                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                      <Icon name="link" size={13} color="var(--accent)" /> Ver projeto
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo projeto"
        footer={<button className="btn-primary" onClick={addProject}>Criar projeto</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="Emoji" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ width: 64 }} />
            <input className="input" placeholder="Nome do projeto" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus style={{ flex: 1 }} />
          </div>
          <textarea className="input" placeholder="Descrição" value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} style={{ resize: 'none' }} />
          <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="em desenvolvimento">Em desenvolvimento</option>
            <option value="concluído">Concluído</option>
            <option value="pausado">Pausado</option>
          </select>
          <input className="input" placeholder="Link (opcional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          <input className="input" placeholder="Tags (vírgula p/ separar)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
};

export default Portfolio;
