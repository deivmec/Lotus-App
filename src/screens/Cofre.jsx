import { useState, useRef } from 'react';
import BackHeader from '../components/BackHeader';
import TabSwitcher from '../components/TabSwitcher';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const compressImage = (file) => new Promise(res => {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.80));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});

const newId = () => Date.now().toString();

const TABS = [
  { id: 'docs', label: 'Documentos' },
  { id: 'logins', label: 'Logins' },
  { id: 'contatos', label: 'Contatos' },
];

/* ── PIN components (same pattern as Pessoal.jsx) ── */
const PinDots = ({ value, error }) => (
  <div style={{ display: 'flex', gap: 14, marginBottom: 32 }}>
    {[0,1,2,3].map(i => (
      <div key={i} style={{
        width: 14, height: 14, borderRadius: '50%',
        background: value.length > i ? (error ? 'var(--red)' : 'var(--accent)') : 'var(--line)',
        transition: 'background 0.18s, transform 0.18s',
        transform: value.length > i ? 'scale(1.15)' : 'scale(1)',
      }} />
    ))}
  </div>
);

const PinPad = ({ value, onChange }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 230, margin: '0 auto' }}>
      {keys.map((k, i) => (
        <button key={i}
          onClick={() => {
            if (!k) return;
            if (k === '⌫') onChange(value.slice(0, -1));
            else if (value.length < 4) onChange(value + k);
          }}
          style={{
            height: 58, borderRadius: 'var(--r)',
            background: k ? 'var(--bg2)' : 'transparent',
            border: 'none', cursor: k ? 'pointer' : 'default',
            fontSize: k === '⌫' ? 18 : 22,
            fontFamily: 'var(--sans)', color: 'var(--text)',
            transition: 'background 0.12s',
          }}
          onMouseDown={e => k && (e.currentTarget.style.background = 'var(--bg3)')}
          onMouseUp={e => k && (e.currentTarget.style.background = 'var(--bg2)')}
        >
          {k}
        </button>
      ))}
    </div>
  );
};

const FullPage = ({ children }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
    {children}
  </div>
);

const Cofre = ({ onBack }) => {
  const [tab, setTab] = useState('docs');
  const [docs, saveDocs] = useStorage('cofre:docs', []);
  const [logins, saveLogins] = useStorage('cofre:logins', []);
  const [contacts, saveContacts] = useStorage('cofre:contatos', []);
  const [cofrePin, , pinReady] = useStorage('cofre:pin', null);
  const [showPassMap, setShowPassMap] = useState({});
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', number: '', expiry: '', photo: null });
  const [newLogin, setNewLogin] = useState({ service: '', user: '', pass: '' });
  const [newContact, setNewContact] = useState({ name: '', type: '', phone: '', email: '', note: '' });
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [photoTarget, setPhotoTarget] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const docPhotoRef = useRef();
  const toast = useToast();

  /* ── PIN gate ── */
  if (pinReady && cofrePin && !unlocked) {
    return (
      <FullPage>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Cofre</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 32 }}>Digite o PIN para acessar</div>
          <PinDots value={pinInput} error={!!pinError} />
          {pinError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 16, animation: 'shake 0.4s ease' }}>{pinError}</div>}
          <PinPad value={pinInput} onChange={v => {
            setPinInput(v);
            if (v.length === 4) {
              if (v === cofrePin) {
                setUnlocked(true); setPinInput(''); setPinError('');
              } else {
                setPinError('PIN incorreto');
                setPinInput('');
              }
            }
          }} />
        </div>
        <div style={{ padding: '16px 24px', textAlign: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--sans)' }}>
            Voltar
          </button>
        </div>
      </FullPage>
    );
  }

  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    saveDocs(ds => [...ds, { id: newId(), ...newDoc }]);
    setNewDoc({ name: '', number: '', expiry: '', photo: null });
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

      <div style={{ margin: '0 24px 20px', padding: '12px 16px', background: 'oklch(97% 0.02 42)', border: '1px solid oklch(88% 0.05 42)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="shield" size={16} color="oklch(50% 0.09 42)" />
        <div style={{ fontSize: 12, color: 'oklch(42% 0.08 42)', lineHeight: 1.5 }}>
          Dados protegidos e sincronizados com sua conta. Defina um PIN em Perfil → Segurança.
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
                  <div key={doc.id} className="card" style={{ display: 'flex', gap: 12 }}>
                    <div
                      style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: 'hidden', cursor: doc.photo ? 'pointer' : 'default', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => doc.photo && setViewPhoto(doc.photo)}
                    >
                      {doc.photo
                        ? <img src={doc.photo} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <Icon name="idCard" size={22} color="var(--text2)" />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{doc.name}</div>
                      {doc.number && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{doc.number}</div>}
                      {doc.expiry && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Vence: {doc.expiry}</div>}
                      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                        <button style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
                          onClick={() => { setPhotoTarget(doc.id); docPhotoRef.current.click(); }}>
                          {doc.photo ? 'Trocar foto' : '+ Foto'}
                        </button>
                        {doc.photo && (
                          <button style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
                            onClick={() => { saveDocs(ds => ds.map(d => d.id === doc.id ? { ...d, photo: null } : d)); toast('Foto removida'); }}>
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                    <button onClick={() => { saveDocs(ds => ds.filter(d => d.id !== doc.id)); toast('Removido'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, alignSelf: 'flex-start' }}>
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

      {/* Hidden file input for document photos */}
      <input ref={docPhotoRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files[0]; if (!file) return; e.target.value = '';
          const dataUrl = await compressImage(file);
          if (photoTarget === 'new') {
            setNewDoc(d => ({ ...d, photo: dataUrl }));
          } else {
            saveDocs(ds => ds.map(d => d.id === photoTarget ? { ...d, photo: dataUrl } : d));
            toast('Foto adicionada');
          }
          setPhotoTarget(null);
        }}
      />

      <Modal open={showDocModal} onClose={() => { setShowDocModal(false); setNewDoc({ name: '', number: '', expiry: '', photo: null }); }} title="Novo documento"
        footer={<button className="btn-primary" onClick={addDoc}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome (ex: RG)" value={newDoc.name} onChange={e => setNewDoc(d => ({ ...d, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Número" value={newDoc.number} onChange={e => setNewDoc(d => ({ ...d, number: e.target.value }))} />
          <input className="input" placeholder="Validade (ex: mar 2028)" value={newDoc.expiry} onChange={e => setNewDoc(d => ({ ...d, expiry: e.target.value }))} />
          {newDoc.photo ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={newDoc.photo} alt="preview" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <button style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0, display: 'block', marginBottom: 4 }}
                  onClick={() => { setPhotoTarget('new'); docPhotoRef.current.click(); }}>
                  Trocar foto
                </button>
                <button style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
                  onClick={() => setNewDoc(d => ({ ...d, photo: null }))}>
                  Remover
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-add" onClick={() => { setPhotoTarget('new'); docPhotoRef.current.click(); }}>
              <Icon name="camera" size={16} /> Adicionar foto (opcional)
            </button>
          )}
        </div>
      </Modal>

      <Modal open={showLoginModal} onClose={() => setShowLoginModal(false)} title="Novo login"
        footer={<button className="btn-primary" onClick={addLogin}>Salvar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Serviço (ex: Gmail)" value={newLogin.service} onChange={e => setNewLogin(l => ({ ...l, service: e.target.value }))} autoFocus />
          <input className="input" placeholder="Usuário / e-mail" value={newLogin.user} onChange={e => setNewLogin(l => ({ ...l, user: e.target.value }))} />
          <input className="input" type="password" placeholder="Senha" value={newLogin.pass} onChange={e => setNewLogin(l => ({ ...l, pass: e.target.value }))} />
        </div>
      </Modal>

      <Modal open={showContactModal} onClose={() => setShowContactModal(false)} title="Novo contato"
        footer={<button className="btn-primary" onClick={addContact}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome" value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Tipo (ex: médico)" value={newContact.type} onChange={e => setNewContact(c => ({ ...c, type: e.target.value }))} />
          <input className="input" placeholder="Telefone" value={newContact.phone} onChange={e => setNewContact(c => ({ ...c, phone: e.target.value }))} />
          <input className="input" placeholder="E-mail" value={newContact.email} onChange={e => setNewContact(c => ({ ...c, email: e.target.value }))} />
          <input className="input" placeholder="Nota (opcional)" value={newContact.note} onChange={e => setNewContact(c => ({ ...c, note: e.target.value }))} />
        </div>
      </Modal>

      {/* Full-screen photo viewer */}
      {viewPhoto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} alt="documento" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setViewPhoto(null)}>×</button>
        </div>
      )}
    </div>
  );
};

export default Cofre;
