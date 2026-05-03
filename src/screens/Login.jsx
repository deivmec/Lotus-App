import { useState } from 'react';
import LotusLogo from '../components/LotusLogo';
import Icon from '../components/Icon';
import { supabase } from '../lib/supabase';

const Login = ({ onLogin, onSignup }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async () => {
    setError('');
    if (!email) { setError('Digite seu email.'); return; }
    if (mode !== 'forgot' && !pass) { setError('Digite sua senha.'); return; }
    setLoading(true);

    if (mode === 'login') {
      const result = await onLogin(email, pass);
      if (!result.ok) setError(result.error || 'Email ou senha incorretos.');
    } else if (mode === 'signup') {
      const result = await onSignup(email, pass, name);
      if (!result.ok) setError(result.error || 'Erro ao criar conta.');
      else if (result.needsConfirm) setSuccess('Conta criada! Confirme seu email para entrar.');
    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email);
      if (err) setError(err.message);
      else setSuccess('Link de recuperação enviado para seu email.');
    }

    setLoading(false);
  };

  const inputStyle = { width: '100%' };

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
          {mode === 'login'  && <>Bem-vindo<br />de volta.</>}
          {mode === 'signup' && <>Criar<br />conta.</>}
          {mode === 'forgot' && <>Recuperar<br />senha.</>}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 36 }}>
          {mode === 'login'  && 'Entre para continuar de onde parou.'}
          {mode === 'signup' && 'Seus dados ficam sincronizados entre dispositivos.'}
          {mode === 'forgot' && 'Enviaremos um link de recuperação para seu email.'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'signup' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>Nome</label>
              <input
                className="input"
                placeholder="seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="name"
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>Email</label>
            <input
              className="input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, display: 'block', marginBottom: 6, letterSpacing: '0.02em' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ paddingRight: 44, width: '100%' }}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, display: 'flex' }}
                >
                  <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: 'oklch(55% 0.14 15)', padding: '8px 12px', background: 'oklch(97% 0.02 15)', borderRadius: 8, border: '1px solid oklch(88% 0.05 15)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ fontSize: 12, color: 'oklch(40% 0.12 145)', padding: '8px 12px', background: 'oklch(97% 0.02 145)', borderRadius: 8, border: '1px solid oklch(88% 0.05 145)' }}>
              {success}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? '…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
            </button>
          </div>

          {mode === 'login' && (
            <button
              onClick={() => switchMode('forgot')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '4px 0' }}
            >
              Esqueci a senha
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 24 }}>
        {mode === 'login' ? (
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Não tem conta?{' '}
            <button
              onClick={() => switchMode('signup')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 500, fontSize: 12, padding: 0 }}
            >
              Criar agora
            </button>
          </div>
        ) : (
          <button
            onClick={() => switchMode('login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 500, fontSize: 12, padding: 0 }}
          >
            Voltar para o login
          </button>
        )}
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
          Dados sincronizados na nuvem com segurança.
        </div>
      </div>
    </div>
  );
};

export default Login;
