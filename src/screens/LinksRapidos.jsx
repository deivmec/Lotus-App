import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const LinksRapidos = ({ onBack }) => {
  const [links, saveLinks] = useStorage('links:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nome: '', url: '', cat: 'trabalho', icon: 'link' });
  const toast = useToast();

  const addLink = () => {
    if (!form.nome.trim() || !form.url.trim()) return;
    let url = form.url;
    if (!url.startsWith('http')) url = 'https://' + url;
    saveLinks(ls => [...ls, { id: newId(), ...form, url }]);
    setForm({ nome: '', url: '', cat: 'trabalho', icon: 'link' });
    setShowModal(false);
    toast('Link adicionado');
  };
  const delLink = (id) => { saveLinks(ls => ls.filter(l => l.id !== id)); toast('Removido'); };

  const cats = [...new Set(['trabalho', 'finanças', 'aprendizado', 'referência', 'lazer', ...links.map(l => l.cat)])];
  const grouped = cats.reduce((acc, cat) => {
    const items = links.filter(l => l.cat === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="screen">
      <BackHeader title="Links Rápidos" onBack={onBack}
        action={<button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}><Icon name="plus" size={20} /></button>}
      />
      <div style={{ padding: '0 24px 32px' }}>
        {links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
            <div style={{ fontSize: 14 }}>Nenhum link ainda</div>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div className="section-label">{cat}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {items.map(link => (
                  <div key={link.id} style={{ position: 'relative' }}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'white', border: '1px solid var(--line)', borderRadius: 'var(--r)', textDecoration: 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ width: 32, height: 32, background: 'var(--bg2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon name={link.icon || 'link'} size={16} color="var(--text2)" />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.nome}</span>
                    </a>
                    <button onClick={() => delLink(link.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'white', border: '1px solid var(--line)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', padding: 3, display: 'none', lineHeight: 1 }}
                      onFocus={e => e.currentTarget.style.display = 'flex'}
                      className="del-btn"
                    >
                      <Icon name="x" size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <button className="btn-add" onClick={() => setShowModal(true)}>
          <Icon name="plus" size={16} />
          Adicionar link
        </button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo link"
        footer={<button className="btn-primary" onClick={addLink}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome (ex: Notion)" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          <input className="input" placeholder="URL (ex: notion.so)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <select className="input" value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}>
            <option value="trabalho">Trabalho</option>
            <option value="finanças">Finanças</option>
            <option value="aprendizado">Aprendizado</option>
            <option value="referência">Referência</option>
            <option value="lazer">Lazer</option>
          </select>
          <select className="input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
            <option value="link">Link</option>
            <option value="note">Nota</option>
            <option value="briefcase">Trabalho</option>
            <option value="book">Livro</option>
            <option value="laptop">Tech</option>
            <option value="film">Entretenimento</option>
            <option value="wallet">Finanças</option>
            <option value="mail">E-mail</option>
            <option value="layers">App</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default LinksRapidos;
