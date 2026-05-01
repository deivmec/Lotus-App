import { useState } from 'react';
import LotusLogo from '../components/LotusLogo';
import Icon from '../components/Icon';

const Login = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!user || !pass) { setError('Preencha todos os campos.'); return; }
    setError('');
    setLoading(true);
    const ok = await onLogin(user, pass);
    setLoading(false);
    if (!ok) {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="screen" style={{ padding: '48px 28px 32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ marginBottom: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
        <LotusLogo size={40} />
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 34, color: 'var(--text)', lineHeight: 1 }}>Lotus</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.06em', marginTop: 3 }}>seu espaço pessoal</div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ marginBottom: 14, fontSize: 22, fontFamily: 'var(--serif)', color: 'var(--text)', lineHeight: 1.3 }}>
          Bem-vindo<br />de volta.
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 36 }}>
          Entre para continuar de onde parou.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
              Usuário
            </label>
            <input
              className="input"
              placeholder="seu nome de usuário"
              value={user}
              onChange={e => setUser(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="username"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, display: 'flex' }}
              >
                <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'oklch(55% 0.14 15)', padding: '8px 12px', background: 'oklch(97% 0.02 15)', borderRadius: 8, border: '1px solid oklch(88% 0.05 15)' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 24 }}>
        Dados armazenados somente neste dispositivo.
      </div>
    </div>
  );
};

export default Login;
