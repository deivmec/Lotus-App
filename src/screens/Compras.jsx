import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import Checkbox from '../components/Checkbox';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const TABS = [
  { id: 'lista',       label: 'Lista' },
  { id: 'recorrentes', label: 'Recorrentes' },
  { id: 'wishlist',    label: 'Wishlist' },
];

const Compras = ({ onBack }) => {
  const [tab, setTab] = useState('lista');
  const [listas, saveListas] = useStorage('compras:listas', [
    { id: '1', nome: 'Mercado', cor: 'var(--green)', emoji: '🛒', itens: [] }
  ]);
  const [recorrentes, saveRecorrentes] = useStorage('compras:recorrentes', []);
  const [wishlist, saveWishlist] = useStorage('compras:wishlist', []);
  const [activeList, setActiveList] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showWishModal, setShowWishModal] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [newItem, setNewItem] = useState({ nome: '', qty: '1un' });
  const [newList, setNewList] = useState({ nome: '', emoji: '📋', cor: 'var(--accent)' });
  const [newWish, setNewWish] = useState({ name: '', price: '', link: '', priority: 'media' });
  const [newRec, setNewRec] = useState({ nome: '', qty: '1un' });
  const toast = useToast();

  const curList = listas.find(l => l.id === activeList) || listas[0];

  const addItem = () => {
    if (!newItem.nome.trim()) return;
    saveListas(ls => ls.map(l => l.id === curList.id ? { ...l, itens: [...l.itens, { id: newId(), ...newItem, done: false }] } : l));
    setNewItem({ nome: '', qty: '1un' });
    setShowItemModal(false);
    toast('Item adicionado');
  };
  const toggleItem = (itemId) => {
    saveListas(ls => ls.map(l => l.id === curList.id ? { ...l, itens: l.itens.map(i => i.id === itemId ? { ...i, done: !i.done } : i) } : l));
  };
  const removeChecked = () => {
    saveListas(ls => ls.map(l => l.id === curList.id ? { ...l, itens: l.itens.filter(i => !i.done) } : l));
    toast('Marcados removidos');
  };
  const addList = () => {
    if (!newList.nome.trim()) return;
    saveListas(ls => [...ls, { id: newId(), ...newList, itens: [] }]);
    setNewList({ nome: '', emoji: '📋', cor: 'var(--accent)' });
    setShowListModal(false);
    toast('Lista criada');
  };

  const addWish = () => {
    if (!newWish.name.trim()) return;
    saveWishlist(ws => [...ws, { id: newId(), ...newWish, status: 'quero' }]);
    setNewWish({ name: '', price: '', link: '', priority: 'media' });
    setShowWishModal(false);
    toast('Adicionado à wishlist');
  };
  const delWish = (id) => { saveWishlist(ws => ws.filter(w => w.id !== id)); toast('Removido'); };

  const addRecorrente = () => {
    if (!newRec.nome.trim()) return;
    saveRecorrentes(rs => [...rs, { id: newId(), ...newRec }]);
    setNewRec({ nome: '', qty: '1un' });
    setShowRecModal(false);
    toast('Item recorrente salvo');
  };
  const delRecorrente = (id) => { saveRecorrentes(rs => rs.filter(r => r.id !== id)); toast('Removido'); };
  const addRecToList = (rec) => {
    saveListas(ls => ls.map(l => l.id === curList.id
      ? { ...l, itens: [...l.itens, { id: newId(), nome: rec.nome, qty: rec.qty, done: false }] }
      : l
    ));
    toast(`"${rec.nome}" adicionado à lista`);
  };

  const checkedCount = curList?.itens.filter(i => i.done).length || 0;

  return (
    <div className="screen">
      <BackHeader
        title="Compras"
        onBack={onBack}
        action={
          <button onClick={() => setShowListModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4 }}>
            <Icon name="plus" size={20} />
          </button>
        }
      />
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 20 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === 'lista' && (
          <div>
            {/* seletor de listas */}
            {listas.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                {listas.map(l => (
                  <button key={l.id} onClick={() => setActiveList(l.id)} style={{
                    padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${(activeList || listas[0]?.id) === l.id ? l.cor : 'var(--line)'}`,
                    background: (activeList || listas[0]?.id) === l.id ? l.cor + '22' : 'white',
                    color: (activeList || listas[0]?.id) === l.id ? l.cor : 'var(--text2)',
                    cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                  }}>
                    {l.emoji} {l.nome}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--serif)', color: 'var(--text)' }}>
                {curList?.emoji} {curList?.nome}
              </div>
              {checkedCount > 0 && (
                <button onClick={removeChecked} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500 }}>
                  Remover {checkedCount} marcado{checkedCount > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {curList?.itens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
                <div style={{ fontSize: 14 }}>Lista vazia</div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                {curList?.itens.map((item, i) => (
                  <div key={item.id} style={{ padding: '12px 16px', borderBottom: i < curList.itens.length - 1 ? '1px solid var(--line)' : 'none', opacity: item.done ? 0.55 : 1 }}>
                    <Checkbox checked={item.done} onToggle={() => toggleItem(item.id)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{item.nome}</span>
                        {item.qty && <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)', marginLeft: 4 }}>{item.qty}</span>}
                      </div>
                    </Checkbox>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-add" onClick={() => setShowItemModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar item
            </button>
          </div>
        )}

        {/* ── Recorrentes ── */}
        {tab === 'recorrentes' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              Itens que você compra sempre. Toque em "+" para adicionar à lista ativa.
            </div>
            {recorrentes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔁</div>
                <div style={{ fontSize: 14 }}>Nenhum item recorrente</div>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                {recorrentes.map((rec, i) => (
                  <div key={rec.id} style={{ padding: '12px 16px', borderBottom: i < recorrentes.length - 1 ? '1px solid var(--line)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{rec.nome}</div>
                      {rec.qty && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{rec.qty}</div>}
                    </div>
                    <button
                      onClick={() => addRecToList(rec)}
                      style={{ background: 'var(--accent-bg)', border: 'none', borderRadius: 'var(--r-sm)', padding: '6px 10px', cursor: 'pointer', color: 'var(--accent-dk)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'var(--sans)', fontWeight: 500 }}
                    >
                      <Icon name="plus" size={13} color="var(--accent)" /> Adicionar
                    </button>
                    <button onClick={() => delRecorrente(rec.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowRecModal(true)}>
              <Icon name="plus" size={16} /> Novo item recorrente
            </button>
          </div>
        )}

        {tab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
                <div style={{ fontSize: 14 }}>Wishlist vazia</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {wishlist.map(w => (
                  <div key={w.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>{w.name}</div>
                        {w.price && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>{w.price}</div>}
                        {w.link && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>🔗 Link</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span className="tag" style={{ background: w.priority === 'alta' ? 'oklch(96% 0.04 42)' : 'var(--bg2)', color: w.priority === 'alta' ? 'oklch(48% 0.12 42)' : 'var(--text3)' }}>
                          {w.priority}
                        </span>
                        <button onClick={() => delWish(w.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowWishModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar à wishlist
            </button>
          </div>
        )}
      </div>

      <Modal open={showItemModal} onClose={() => setShowItemModal(false)} title="Novo item">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do item" value={newItem.nome} onChange={e => setNewItem(n => ({ ...n, nome: e.target.value }))} autoFocus />
          <input className="input" placeholder="Quantidade (ex: 2un, 1kg)" value={newItem.qty} onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
          <button className="btn-primary" onClick={addItem}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showListModal} onClose={() => setShowListModal(false)} title="Nova lista">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome da lista" value={newList.nome} onChange={e => setNewList(n => ({ ...n, nome: e.target.value }))} autoFocus />
          <input className="input" placeholder="Emoji (ex: 🛒)" value={newList.emoji} onChange={e => setNewList(n => ({ ...n, emoji: e.target.value }))} />
          <button className="btn-primary" onClick={addList}>Criar lista</button>
        </div>
      </Modal>

      <Modal open={showRecModal} onClose={() => setShowRecModal(false)} title="Novo item recorrente">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do item (ex: Leite)" value={newRec.nome} onChange={e => setNewRec(r => ({ ...r, nome: e.target.value }))} autoFocus />
          <input className="input" placeholder="Quantidade (ex: 2un, 1kg)" value={newRec.qty} onChange={e => setNewRec(r => ({ ...r, qty: e.target.value }))} />
          <button className="btn-primary" onClick={addRecorrente}>Salvar</button>
        </div>
      </Modal>

      <Modal open={showWishModal} onClose={() => setShowWishModal(false)} title="Adicionar à wishlist">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do item" value={newWish.name} onChange={e => setNewWish(n => ({ ...n, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Preço (ex: R$ 150)" value={newWish.price} onChange={e => setNewWish(n => ({ ...n, price: e.target.value }))} />
          <input className="input" placeholder="Link (opcional)" value={newWish.link} onChange={e => setNewWish(n => ({ ...n, link: e.target.value }))} />
          <select className="input" value={newWish.priority} onChange={e => setNewWish(n => ({ ...n, priority: e.target.value }))}>
            <option value="alta">Alta prioridade</option>
            <option value="media">Média prioridade</option>
            <option value="baixa">Baixa prioridade</option>
          </select>
          <button className="btn-primary" onClick={addWish}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Compras;
