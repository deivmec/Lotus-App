import { useState } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const newId = () => Date.now().toString();

const TABS = [
  { id: 'docs', label: 'Documentos' },
  { id: 'logins', label: 'Logins' },
  { id: 'contatos', label: 'Contatos' },
];

const Cofre = ({ onBack }) => {
  const [tab, setTab] = useState('docs');
  const [docs, saveDocs] = useStorage('cofre:docs', []);
  const [logins, saveLogins] = useStorage('cofre:logins', []);
  const [contacts, saveContacts] = useStorage('cofre:contatos', []);
  const [showPassMap, setShowPassMap] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', number: '', expiry: '' });
  const [newLogin, setNewLogin] = useState({ service: '', user: '', pass: '' });
  const [newContact, setNewContact] = useState({ name: '', type: '', phone: '', email: '', note: '' });
  const toast = useToast();

  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    saveDocs(ds => [...ds, { id: newId(), ...newDoc }]);
    setNewDoc({ name: '', number: '', expiry: '' });
    setShowDocModal(false);
    toast('Documento adicionado');
  };
  const addLogin = () => {
    if (!newLogin.service.trim()) return;
    saveLogins(ls => [...ls, { id: newId(), ...newLogin }]);
    setNewLogin({ service: '', user: '', pass: '' });
    setShowLoginModal(false);
    toast('Login adicionado');
  };
  const addContact = () => {
    if (!newContact.name.trim()) return;
    saveContacts(cs => [...cs, { id: newId(), ...newContact }]);
    setNewContact({ name: '', type: '', phone: '', email: '', note: '' });
    setShowContactModal(false);
    toast('Contato adicionado');
  };

  const copyText = (text) => {
    navigator.clipboard?.writeText(text).then(() => toast('Copiado!'));
  };

  return (
    <div className="screen">
      <BackHeader title="Cofre" subtitle="Dados protegidos" onBack={onBack} />

      {/* aviso privacidade */}
      <div style={{ margin: '0 24px 20px', padding: '12px 16px', background: 'oklch(97% 0.02 42)', border: '1px solid oklch(88% 0.05 42)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="shield" size={16} color="oklch(50% 0.09 42)" />
        <div style={{ fontSize: 12, color: 'oklch(42% 0.08 42)', lineHeight: 1.5 }}>
          Estes dados são armazenados somente neste dispositivo. Nenhuma informação é enviada para a internet.
        </div>
      </div>

      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {tab === 'docs' && (
          <div>
            {docs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🪪</div>
                <div style={{ fontSize: 14 }}>Nenhum documento</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {docs.map(doc => (
                  <div key={doc.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon name="idCard" size={20} color="var(--text2)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{doc.name}</div>
                      {doc.number && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{doc.number}</div>}
                      {doc.expiry && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Vence: {doc.expiry}</div>}
                    </div>
                    <button onClick={() => { saveDocs(ds => ds.filter(d => d.id !== doc.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowDocModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar documento
            </button>
          </div>
        )}

        {tab === 'logins' && (
          <div>
            {logins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔑</div>
                <div style={{ fontSize: 14 }}>Nenhum login salvo</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {logins.map(login => (
                  <div key={login.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Icon name="key" size={18} color="var(--text2)" />
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{login.service}</div>
                      <button onClick={() => { saveLogins(ls => ls.filter(l => l.id !== login.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>👤 {login.user}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text3)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                        {showPassMap[login.id] ? login.pass : '••••••••'}
                      </div>
                      <button onClick={() => setShowPassMap(m => ({ ...m, [login.id]: !m[login.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name={showPassMap[login.id] ? 'eyeOff' : 'eye'} size={14} />
                      </button>
                      <button onClick={() => copyText(login.pass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="copy" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowLoginModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar login
            </button>
          </div>
        )}

        {tab === 'contatos' && (
          <div>
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
                <div style={{ fontSize: 14 }}>Nenhum contato</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {contacts.map(c => (
                  <div key={c.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{c.name}</div>
                        {c.type && <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)', marginTop: 4, display: 'inline-block' }}>{c.type}</span>}
                        {c.phone && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>📱 {c.phone} <button onClick={() => copyText(c.phone)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}><Icon name="copy" size={12} /></button></div>}
                        {c.email && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>✉️ {c.email}</div>}
                        {c.note && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>{c.note}</div>}
                      </div>
                      <button onClick={() => { saveContacts(cs => cs.filter(x => x.id !== c.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-add" onClick={() => setShowContactModal(true)}>
              <Icon name="plus" size={16} />
              Adicionar contato
            </button>
          </div>
        )}
      </div>

      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Novo documento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome (ex: RG)" value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Número" value={newDoc.number} onChange={e => setNewDoc(d => ({ ...d, number: e.target.value }))} />
          <input className="input" placeholder="Validade (ex: mar 2028)" value={newDoc.expiry} onChange={e => setNewDoc(d => ({ ...d, expiry: e.target.value }))} />
          <button className="btn-primary" onClick={addDoc}>Adicionar</button>
        </div>
      </Modal>

      <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)} title="Novo login">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Serviço (ex: Gmail)" value={newLogin.service} onChange={e => setNewLogin(l => ({ ...l, service: e.target.value }))} autoFocus />
          <input className="input" placeholder="Usuário / e-mail" value={newLogin.user} onChange={e => setNewLogin(l => ({ ...l, user: e.target.value }))} />
          <input className="input" type="password" placeholder="Senha" value={newLogin.pass} onChange={e => setNewLogin(l => ({ ...l, pass: e.target.value }))} />
          <button className="btn-primary" onClick={addLogin}>Salvar</button>
        </div>
      </Modal>

      <Modal open={showContactModal} onClose={() => setShowContactModal(false)} title="Novo contato">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome" value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Tipo (ex: médico)" value={newContact.type} onChange={e => setNewContact(c => ({ ...c, type: e.target.value }))} />
          <input className="input" placeholder="Telefone" value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} />
          <input className="input" placeholder="E-mail" value={newContact.email} onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))} />
          <input className="input" placeholder="Nota (opcional)" value={newContact.note} onChange={e => setNewContact(c => ({ ...c, note: e.target.value }))} />
          <button className="btn-primary" onClick={addContact}>Adicionar</button>
        </div>
      </Modal>
    </div>
  );
};

export default Cofre;
