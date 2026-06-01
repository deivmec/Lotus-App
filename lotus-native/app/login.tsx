import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Icon from '../components/Icon';
import LotusLogo from '../components/LotusLogo';
import { fonts, radius, spacing } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

type Mode = 'login' | 'signup' | 'forgot';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { authed, loading: authLoading, login, signup } = useAuth();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (authLoading) return null;
  if (authed) return <Redirect href="/(tabs)" />;

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSuccess(''); };

  const handleSubmit = async () => {
    setError('');
    if (!email) { setError('Digite seu email.'); return; }
    if (mode !== 'forgot' && !pass) { setError('Digite sua senha.'); return; }
    setLoading(true);

    if (mode === 'login') {
      const result = await login(email, pass);
      if (!result.ok) setError(result.error || 'Email ou senha incorretos.');
    } else if (mode === 'signup') {
      const result = await signup(email, pass, name);
      if (!result.ok) setError(result.error || 'Erro ao criar conta.');
      else if (result.needsConfirm) setSuccess('Conta criada! Confirme seu email para entrar.');
    } else {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email);
      if (err) setError(err.message);
      else setSuccess('Link de recuperação enviado para seu email.');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <LotusLogo size={36} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.appName}>Lotus</Text>
            <Text style={styles.appSub}>seu espaço pessoal</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.heading}>
            {mode === 'login'  ? 'Bem-vindo\nde volta.' : ''}
            {mode === 'signup' ? 'Criar\nconta.' : ''}
            {mode === 'forgot' ? 'Recuperar\nsenha.' : ''}
          </Text>
          <Text style={styles.sub}>
            {mode === 'login'  && 'Entre para continuar de onde parou.'}
            {mode === 'signup' && 'Seus dados ficam sincronizados entre dispositivos.'}
            {mode === 'forgot' && 'Enviaremos um link de recuperação para seu email.'}
          </Text>

          <View style={styles.fields}>
            {mode === 'signup' && (
              <View>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu nome"
                  placeholderTextColor={colors.text3}
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
            )}

            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={colors.text3}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType={mode === 'forgot' ? 'send' : 'next'}
                onSubmitEditing={mode === 'forgot' ? handleSubmit : undefined}
              />
            </View>

            {mode !== 'forgot' && (
              <View>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passWrap}>
                  <TextInput
                    style={[styles.input, styles.passInput]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.text3}
                    value={pass}
                    onChangeText={setPass}
                    secureTextEntry={!showPass}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(p => !p)}
                    activeOpacity={0.7}
                  >
                    <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!!success && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'login' && (
              <TouchableOpacity onPress={() => switchMode('forgot')} activeOpacity={0.7}>
                <Text style={styles.linkBtn}>Esqueci a senha</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {mode === 'login' ? (
            <Text style={styles.footerText}>
              Não tem conta?{' '}
              <Text style={styles.footerLink} onPress={() => switchMode('signup')}>
                Criar agora
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={() => switchMode('login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Voltar para o login</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.footerNote}>Dados sincronizados na nuvem com segurança.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 56,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  appName: {
    fontFamily: fonts.serif,
    fontSize: 34,
    color: colors.text,
    lineHeight: 36,
  },
  appSub: {
    fontSize: 12,
    color: colors.text3,
    fontFamily: fonts.sans,
    letterSpacing: 0.06 * 12,
    marginTop: 3,
  },
  body: {
    flex: 1,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    lineHeight: 34,
    marginBottom: 10,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
    marginBottom: 36,
  },
  fields: {
    gap: 12,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text2,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.02 * 12,
  },
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  passWrap: {
    position: 'relative',
  },
  passInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: colors.redBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.red,
    padding: 10,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
  successBox: {
    backgroundColor: colors.greenBg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.green,
    padding: 10,
  },
  successText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.green,
  },
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.bg,
  },
  linkBtn: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text3,
    textAlign: 'center',
    paddingVertical: 4,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text3,
  },
  footerLink: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  footerNote: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text3,
  },
});
