import { useState, useEffect, useRef } from 'react';
import { get } from 'idb-keyval';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';
import { useStorage } from '../hooks/useStorage';

const ACCENTS = [
  { id: 'terra',   label: 'Terra',   hue: 42  },
  { id: 'sage',    label: 'Sage',    hue: 140 },
  { id: 'ocean',   label: 'Oceano',  hue: 220 },
  { id: 'lavanda', label: 'Lavanda', hue: 275 },
  { id: 'coral',   label: 'Coral',   hue: 15  },
  { id: 'gold',    label: 'Ouro',    hue: 60  },
  { id: 'rosa',    label: 'Rosa',    hue: 345 },
  { id: 'teal',    label: 'Água',    hue: 175 },
];

const EMOJI_LIST = ['🌸','🌿','🌙','⭐','🔥','💎','🌊','🌺','🍀','🎯','🦋','🌈','🎨','✨','🌻','💫','🍃','🌙','🌸','🦊','🐚','🌸','🎭','🏔️','🌅','🍄','🌾','🌴','🌵','🌹','🏵️','🌝'];

const applyAccent = (hue) => {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const r = document.documentElement.style;
  r.setProperty('--accent',    `oklch(62% 0.09 ${hue})`);
  r.setProperty('--accent-bg', dark ? `oklch(26% 0.05 ${hue})` : `oklch(95% 0.025 ${hue})`);
  r.setProperty('--accent-dk', dark ? `oklch(72% 0.09 ${hue})` : `oklch(50% 0.09 ${hue})`);
};

const Row = ({ label, value, onPress }) => (
  <button
    onClick={onPress}
    style={{
      display: 'flex', alignItems: 'center', width: '100%', padding: '14px 0',
      background: 'none', border: 'none', cursor: 'pointer', gap: 12,
      borderBottom: '1px solid var(--line)',
    }}
  >
    <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, textAlign: 'left', fontFamily: 'var(--sans)' }}>{label}</span>
    <span style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
    <Icon name="arrow" size={14} color="var(--text3)" />
  </button>
);

const FieldModal = ({ title, children, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
      <div className="modal-handle" />
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  </div>
);

const Perfil = ({ onBack, onLogout, onUpdateUser }) => {
  const toast = useToast();
  const fileRef = useRef();
  const [cofrePin, saveCofrePin] = useStorage('cofre:pin', null);
  const [pinModal, setPinModal] = useState(null);
  const [pinStep, setPinStep] = useState('enter');
  const [pinA, setPinA] = useState('');
  const [pinB, setPinB] = useState('');
  const [pinError, setPinError] = useState('');

  const [user, setUser] = useState({ name: '', email: '', phone: '', password: '', photo: '', emoji: '' });
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [accentId, setAccentId] = useState(() => {
    try { return JSON.parse(localStorage.getItem('settings:accent'))?.id || 'terra'; } catch { return 'terra'; }
  });

  const [modal, setModal] = useState(null);
  const [fieldVal, setFieldVal] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  useEffect(() => {
    get('auth:user').then(u => {
      if (u) setUser(prev => ({ ...prev, ...u }));
    });
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('settings:theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('settings:theme', 'light');
    }
    // Re-aplica accent com luminosidade correta para o novo tema
    try {
      const stored = JSON.parse(localStorage.getItem('settings:accent'));
      if (stored?.hue) {
        const r = document.documentElement.style;
        r.setProperty('--accent-bg', next ? `oklch(26% 0.05 ${stored.hue})` : `oklch(95% 0.025 ${stored.hue})`);
        r.setProperty('--accent-dk', next ? `oklch(72% 0.09 ${stored.hue})` : `oklch(50% 0.09 ${stored.hue})`);
      }
    } catch {}
  };

  const selectAccent = (preset) => {
    setAccentId(preset.id);
    applyAccent(preset.hue);
    localStorage.setItem('settings:accent', JSON.stringify(preset));
  };

  const openField = (field, currentVal) => {
    setFieldVal(currentVal || '');
    setModal(field);
  };

  const saveField = async (field) => {
    const trimmed = fieldVal.trim();
    const updates = { [field]: trimmed };
    const next = await onUpdateUser(updates);
    setUser(prev => ({ ...prev, ...next }));
    setModal(null);
    toast('Salvo com sucesso');
  };

  const savePassword = async () => {
    if (newPass !== confPass) { toast('As senhas não coincidem'); return; }
    if (newPass.length < 6) { toast('Senha muito curta (mínimo 6 caracteres)'); return; }
    await onUpdateUser({ password: newPass });
    setCurPass(''); setNewPass(''); setConfPass('');
    setModal(null);
    toast('Senha alterada');
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const photo = ev.target.result;
      const next = await onUpdateUser({ photo, emoji: '' });
      setUser(prev => ({ ...prev, ...next }));
      setShowAvatarModal(false);
    };
    reader.readAsDataURL(file);
  };

  const selectEmoji = async (emoji) => {
    const next = await onUpdateUser({ emoji, photo: '' });
    setUser(prev => ({ ...prev, ...next }));
    setShowAvatarModal(false);
  };

  const initials = user.name
    ? user.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user.username || '?')[0].toUpperCase();

  return (
    <div className="screen" style={{ minHeight: '100%', background: 'var(--bg)', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 0' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', padding: 4, marginLeft: -4, borderRadius: 8 }}
        >
          <Icon name="arrowLeft" size={22} color="var(--text2)" />
        </button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--text)' }}>Perfil</span>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 24px' }}>
        <button
          onClick={() => setShowAvatarModal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
        >
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: user.photo ? 'transparent' : 'var(--accent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {user.photo
              ? <img src={user.photo} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.emoji
                ? <span style={{ fontSize: 42 }}>{user.emoji}</span>
                : <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent-dk)' }}>{initials}</span>
            }
          </div>
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>
            <Icon name="camera" size={12} color="var(--bg)" />
          </div>
        </button>
        <div style={{ marginTop: 12, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{user.name || user.username || 'Usuário'}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>@{user.username || 'admin'}</div>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* Conta */}
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>Conta</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '0 16px', marginBottom: 24 }}>
          <Row label="Nome" value={user.name} onPress={() => openField('name', user.name)} />
          <Row label="E-mail" value={user.email} onPress={() => openField('email', user.email)} />
          <Row label="Telefone" value={user.phone} onPress={() => openField('phone', user.phone)} />
          <button
            onClick={() => { setCurPass(''); setNewPass(''); setConfPass(''); setModal('password'); }}
            style={{
              display: 'flex', alignItems: 'center', width: '100%', padding: '14px 0',
              background: 'none', border: 'none', cursor: 'pointer', gap: 12,
            }}
          >
            <span style={{ fontSize: 14, color: 'var(--text)', flex: 1, textAlign: 'left', fontFamily: 'var(--sans)' }}>Senha</span>
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>••••••</span>
            <Icon name="arrow" size={14} color="var(--text3)" />
          </button>
        </div>

        {/* Aparência */}
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>Aparência</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '0 16px', marginBottom: 24 }}>
          {/* Dark mode toggle */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>Modo escuro</span>
            <button
              onClick={toggleDark}
              style={{
                width: 44, height: 26, borderRadius: 13,
                background: darkMode ? 'var(--accent)' : 'var(--bg3)',
                border: 'none', cursor: 'pointer',
                position: 'relative', transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: darkMode ? 21 : 3,
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Accent colors */}
          <div style={{ padding: '14px 0' }}>
            <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 14 }}>Cor do app</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {ACCENTS.map(preset => {
                const isSelected = accentId === preset.id;
                const swatch = `oklch(62% 0.09 ${preset.hue})`;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectAccent(preset)}
                    title={preset.label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: swatch,
                      border: isSelected ? `3px solid var(--text)` : '3px solid transparent',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }} />
                    <span style={{ fontSize: 10, color: isSelected ? 'var(--text)' : 'var(--text3)', fontWeight: isSelected ? 600 : 400 }}>
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="section-label" style={{ marginBottom: 8 }}>Segurança</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r)', padding: '0 16px', marginBottom: 24 }}>
          <Row
            label="PIN do Cofre"
            value={cofrePin ? 'Definido ••••' : 'Não definido'}
            onPress={() => {
              setPinA(''); setPinB(''); setPinError('');
              setPinModal(cofrePin ? 'change' : 'set');
              setPinStep(cofrePin ? 'current' : 'enter');
            }}
          />
        </div>

        {/* Logout */}
        <button
          onClick={async () => { await onLogout(); }}
          style={{
            width: '100%', padding: 15, background: 'none',
            border: '1px solid var(--line)', borderRadius: 'var(--r-sm)',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 500,
            color: 'var(--red)', cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          Sair da conta
        </button>
      </div>

      {/* Field modals */}
      {modal === 'name' && (
        <FieldModal title="Nome" onClose={() => setModal(null)}>
          <input className="input" placeholder="Seu nome" value={fieldVal} onChange={e => setFieldVal(e.target.value)} autoFocus />
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => saveField('name')}>Salvar</button>
        </FieldModal>
      )}
      {modal === 'email' && (
        <FieldModal title="E-mail" onClose={() => setModal(null)}>
          <input className="input" type="email" placeholder="seu@email.com" value={fieldVal} onChange={e => setFieldVal(e.target.value)} autoFocus />
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => saveField('email')}>Salvar</button>
        </FieldModal>
      )}
      {modal === 'phone' && (
        <FieldModal title="Telefone" onClose={() => setModal(null)}>
          <input className="input" type="tel" placeholder="(11) 99999-9999" value={fieldVal} onChange={e => setFieldVal(e.target.value)} autoFocus />
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => saveField('phone')}>Salvar</button>
        </FieldModal>
      )}
      {modal === 'password' && (
        <FieldModal title="Alterar senha" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input className="input" type="password" placeholder="Senha atual" value={curPass} onChange={e => setCurPass(e.target.value)} autoFocus />
            <input className="input" type="password" placeholder="Nova senha" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <input className="input" type="password" placeholder="Confirmar nova senha" value={confPass} onChange={e => setConfPass(e.target.value)} />
          </div>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={savePassword}>Salvar</button>
        </FieldModal>
      )}

      {/* PIN do Cofre modal */}
      {pinModal && (
        <FieldModal
          title={pinModal === 'set' ? 'Criar PIN do Cofre' : pinModal === 'change' ? 'Alterar PIN do Cofre' : 'Remover PIN do Cofre'}
          onClose={() => { setPinModal(null); setPinA(''); setPinB(''); setPinError(''); }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* set: enter */}
            {pinModal === 'set' && pinStep === 'enter' && (<>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Digite um PIN de 4 dígitos</div>
              <input className="input" type="number" inputMode="numeric" placeholder="• • • •" value={pinA}
                onChange={e => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus
                style={{ letterSpacing: '0.4em', fontSize: 22, textAlign: 'center' }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{pinError}</div>}
              <button className="btn-primary" onClick={() => {
                if (pinA.length < 4) { setPinError('O PIN deve ter 4 dígitos'); return; }
                setPinError(''); setPinStep('confirm');
              }}>Continuar</button>
            </>)}

            {/* set: confirm */}
            {pinModal === 'set' && pinStep === 'confirm' && (<>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Confirme o PIN</div>
              <input className="input" type="number" inputMode="numeric" placeholder="• • • •" value={pinB}
                onChange={e => setPinB(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus
                style={{ letterSpacing: '0.4em', fontSize: 22, textAlign: 'center' }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{pinError}</div>}
              <button className="btn-primary" onClick={() => {
                if (pinB !== pinA) { setPinError('Os PINs não coincidem'); setPinB(''); return; }
                saveCofrePin(pinA); setPinModal(null); toast('PIN do Cofre criado');
              }}>Salvar PIN</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--sans)' }}
                onClick={() => { setPinStep('enter'); setPinB(''); setPinError(''); }}>Voltar</button>
            </>)}

            {/* change: verify current */}
            {pinModal === 'change' && pinStep === 'current' && (<>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>PIN atual</div>
              <input className="input" type="number" inputMode="numeric" placeholder="• • • •" value={pinA}
                onChange={e => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus
                style={{ letterSpacing: '0.4em', fontSize: 22, textAlign: 'center' }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{pinError}</div>}
              <button className="btn-primary" onClick={() => {
                if (pinA !== cofrePin) { setPinError('PIN incorreto'); setPinA(''); return; }
                setPinError(''); setPinStep('enter'); setPinA('');
              }}>Continuar</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 13, fontFamily: 'var(--sans)' }}
                onClick={() => { setPinModal('remove'); setPinStep('current'); setPinA(''); setPinError(''); }}>
                Remover PIN
              </button>
            </>)}

            {/* change: new pin */}
            {pinModal === 'change' && pinStep === 'enter' && (<>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Novo PIN</div>
              <input className="input" type="number" inputMode="numeric" placeholder="• • • •" value={pinB}
                onChange={e => setPinB(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus
                style={{ letterSpacing: '0.4em', fontSize: 22, textAlign: 'center' }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{pinError}</div>}
              <button className="btn-primary" onClick={() => {
                if (pinB.length < 4) { setPinError('O PIN deve ter 4 dígitos'); return; }
                saveCofrePin(pinB); setPinModal(null); toast('PIN alterado');
              }}>Salvar novo PIN</button>
            </>)}

            {/* remove: verify current */}
            {pinModal === 'remove' && pinStep === 'current' && (<>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>Digite o PIN atual para remover</div>
              <input className="input" type="number" inputMode="numeric" placeholder="• • • •" value={pinA}
                onChange={e => setPinA(e.target.value.replace(/\D/g, '').slice(0, 4))} autoFocus
                style={{ letterSpacing: '0.4em', fontSize: 22, textAlign: 'center' }} />
              {pinError && <div style={{ fontSize: 12, color: 'var(--red)' }}>{pinError}</div>}
              <button style={{ width: '100%', padding: 15, background: 'var(--red)', color: 'white', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}
                onClick={() => {
                  if (pinA !== cofrePin) { setPinError('PIN incorreto'); setPinA(''); return; }
                  saveCofrePin(null); setPinModal(null); toast('PIN removido');
                }}>Remover PIN</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: 13, fontFamily: 'var(--sans)' }}
                onClick={() => setPinModal(null)}>Cancelar</button>
            </>)}
          </div>
        </FieldModal>
      )}

      {/* Avatar modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Foto do perfil</div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
            <button
              className="btn-add"
              style={{ marginBottom: 20 }}
              onClick={() => fileRef.current.click()}
            >
              <Icon name="camera" size={16} color="var(--text3)" />
              Enviar foto
            </button>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Escolher emoji</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => selectEmoji(emoji)}
                  style={{
                    background: user.emoji === emoji ? 'var(--accent-bg)' : 'var(--bg2)',
                    border: user.emoji === emoji ? '2px solid var(--accent)' : '2px solid transparent',
                    borderRadius: 8, padding: 6, fontSize: 22, cursor: 'pointer',
                    lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
