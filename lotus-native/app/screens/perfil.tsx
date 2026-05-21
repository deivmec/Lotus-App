import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ACCENT_PRESETS } from '../../context/ThemeContext';
import { fonts, radius, spacing } from '../../lib/theme';

const EMOJI_LIST = [
  '🌸','🌿','🌙','⭐','🔥','💎','🌊','🌺',
  '🍀','🎯','🦋','🌈','🎨','✨','🌻','💫',
  '🍃','🌙','🌸','🦊','🐚','🌸','🎭','🏔️',
  '🌅','🍄','🌾','🌴','🌵','🌹','🏵️','🌝',
];

// ── Row sub-component ─────────────────────────────────────────────────────────

interface RowProps {
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
}

const Row = ({ label, value, onPress, isLast = false }: RowProps) => {
  const { colors } = useTheme();
  const rowStyles = makeRowStyles(colors);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[rowStyles.row, !isLast && rowStyles.rowBorder]}
      activeOpacity={0.7}
    >
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={1}>{value || '—'}</Text>
      <Icon name="arrow" size={14} color={colors.text3} />
    </TouchableOpacity>
  );
};

const makeRowStyles = (colors: any) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  value: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
    maxWidth: 160,
  },
});

// ── screen ────────────────────────────────────────────────────────────────────

export default function Perfil() {
  const toast = useToast();
  const { updateUser, logout } = useAuth();

  const { dark, toggleDark, accentId, setAccent, colors } = useTheme();
  const styles = makeStyles(colors);
  const [cofrePin, saveCofrePin] = useStorage<string | null>('cofre:pin', null);

  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    emoji: '',
  });

  // Load user from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('auth:user').then(stored => {
      if (stored) {
        try { setUser(prev => ({ ...prev, ...JSON.parse(stored) })); } catch {}
      }
    });
  }, []);

  // ── field modal state ──────────────────────────────────────────────────────
  const [modal, setModal] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);
  const [fieldVal, setFieldVal] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confPass, setConfPass] = useState('');

  // ── avatar modal ──────────────────────────────────────────────────────────
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // ── PIN modal state ────────────────────────────────────────────────────────
  const [pinModal, setPinModal] = useState<'set' | 'change' | 'remove' | null>(null);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm' | 'current'>('enter');
  const [pinA, setPinA] = useState('');
  const [pinB, setPinB] = useState('');
  const [pinError, setPinError] = useState('');

  // ── helpers ────────────────────────────────────────────────────────────────

  const initials = user.name.trim()
    ? user.name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const openField = (field: 'name' | 'email' | 'phone', currentVal: string) => {
    setFieldVal(currentVal || '');
    setModal(field);
  };

  const saveField = async (field: 'name' | 'email' | 'phone') => {
    const trimmed = fieldVal.trim();
    const next = await updateUser({ [field]: trimmed });
    setUser(prev => ({ ...prev, ...next }));
    setModal(null);
    toast('Salvo com sucesso');
  };

  const savePassword = async () => {
    if (newPass !== confPass) { toast('As senhas não coincidem'); return; }
    if (newPass.length < 6) { toast('Senha muito curta (mínimo 6 caracteres)'); return; }
    await updateUser({ password: newPass });
    setCurPass(''); setNewPass(''); setConfPass('');
    setModal(null);
    toast('Senha alterada');
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const next = await updateUser({ photo: dataUrl, emoji: '' });
      setUser(prev => ({ ...prev, ...next }));
      setShowAvatarModal(false);
    }
  };

  const selectEmoji = async (emoji: string) => {
    const next = await updateUser({ emoji, photo: '' });
    setUser(prev => ({ ...prev, ...next }));
    setShowAvatarModal(false);
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const openPinModal = () => {
    setPinA(''); setPinB(''); setPinError('');
    if (cofrePin) {
      setPinModal('change');
      setPinStep('current');
    } else {
      setPinModal('set');
      setPinStep('enter');
    }
  };

  const closePinModal = () => {
    setPinModal(null);
    setPinA(''); setPinB(''); setPinError('');
  };

  const pinTitle =
    pinModal === 'set'    ? 'Criar PIN do Cofre'   :
    pinModal === 'change' ? 'Alterar PIN do Cofre'  :
                            'Remover PIN do Cofre';

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <BackHeader title="Perfil" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ─────────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={() => setShowAvatarModal(true)}
            activeOpacity={0.8}
            style={styles.avatarWrap}
          >
            <View style={styles.avatarCircle}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImage} />
              ) : user.emoji ? (
                <Text style={styles.avatarEmoji}>{user.emoji}</Text>
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={12} color={colors.bg} />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{user.name || 'Usuário'}</Text>
          {user.email ? (
            <Text style={styles.userEmail}>{user.email}</Text>
          ) : null}
        </View>

        {/* ── Conta ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conta</Text>
          <View style={styles.card}>
            <Row
              label="Nome"
              value={user.name}
              onPress={() => openField('name', user.name)}
            />
            <Row
              label="E-mail"
              value={user.email}
              onPress={() => openField('email', user.email)}
            />
            <Row
              label="Telefone"
              value={user.phone}
              onPress={() => openField('phone', user.phone)}
            />
            <Row
              label="Senha"
              value="••••••"
              isLast
              onPress={() => {
                setCurPass(''); setNewPass(''); setConfPass('');
                setModal('password');
              }}
            />
          </View>
        </View>

        {/* ── Aparência ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Aparência</Text>
          <View style={styles.card}>
            {/* Dark mode */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Modo escuro</Text>
              <Switch
                value={dark}
                onValueChange={() => toggleDark()}
                trackColor={{ false: colors.bg3, true: colors.accent }}
                thumbColor={colors.surface}
              />
            </View>

            {/* Accent colors */}
            <View style={styles.accentSection}>
              <Text style={styles.accentTitle}>Cor do app</Text>
              <View style={styles.swatchRow}>
                {ACCENT_PRESETS.map(preset => {
                  const isSelected = accentId === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => setAccent(preset.id)}
                      activeOpacity={0.7}
                      style={styles.swatchWrap}
                    >
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: preset.color },
                          isSelected
                            ? { borderWidth: 3, borderColor: colors.text }
                            : { borderWidth: 3, borderColor: 'transparent' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.swatchLabel,
                          isSelected && styles.swatchLabelSelected,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* ── Segurança ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Segurança</Text>
          <View style={styles.card}>
            <Row
              label="PIN do Cofre"
              value={cofrePin ? 'Definido ••••' : 'Não definido'}
              isLast
              onPress={openPinModal}
            />
          </View>
        </View>

        {/* ── Logout ─────────────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Name modal ────────────────────────────────────────────────────── */}
      <Modal
        open={modal === 'name'}
        onClose={() => setModal(null)}
        title="Nome"
        footer={
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => saveField('name')}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Seu nome"
          placeholderTextColor={colors.text3}
          value={fieldVal}
          onChangeText={setFieldVal}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => saveField('name')}
        />
      </Modal>

      {/* ── Email modal ───────────────────────────────────────────────────── */}
      <Modal
        open={modal === 'email'}
        onClose={() => setModal(null)}
        title="E-mail"
        footer={
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => saveField('email')}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="seu@email.com"
          placeholderTextColor={colors.text3}
          value={fieldVal}
          onChangeText={setFieldVal}
          autoFocus
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => saveField('email')}
        />
      </Modal>

      {/* ── Phone modal ───────────────────────────────────────────────────── */}
      <Modal
        open={modal === 'phone'}
        onClose={() => setModal(null)}
        title="Telefone"
        footer={
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => saveField('phone')}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="(11) 99999-9999"
          placeholderTextColor={colors.text3}
          value={fieldVal}
          onChangeText={setFieldVal}
          autoFocus
          keyboardType="phone-pad"
          returnKeyType="done"
          onSubmitEditing={() => saveField('phone')}
        />
      </Modal>

      {/* ── Password modal ────────────────────────────────────────────────── */}
      <Modal
        open={modal === 'password'}
        onClose={() => setModal(null)}
        title="Alterar senha"
        footer={
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={savePassword}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Senha atual"
          placeholderTextColor={colors.text3}
          value={curPass}
          onChangeText={setCurPass}
          secureTextEntry
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Nova senha"
          placeholderTextColor={colors.text3}
          value={newPass}
          onChangeText={setNewPass}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar nova senha"
          placeholderTextColor={colors.text3}
          value={confPass}
          onChangeText={setConfPass}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={savePassword}
        />
      </Modal>

      {/* ── Avatar modal ──────────────────────────────────────────────────── */}
      <Modal
        open={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Foto do perfil"
      >
        {/* Upload photo button */}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handlePickPhoto}
          activeOpacity={0.7}
        >
          <Icon name="camera" size={16} color={colors.text2} />
          <Text style={styles.uploadBtnText}>Enviar foto</Text>
        </TouchableOpacity>

        {/* Emoji grid label */}
        <Text style={styles.emojiGridLabel}>Escolher emoji</Text>

        {/* Emoji grid */}
        <View style={styles.emojiGrid}>
          {EMOJI_LIST.map((emoji, i) => {
            const isSelected = user.emoji === emoji;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => selectEmoji(emoji)}
                activeOpacity={0.7}
                style={[
                  styles.emojiCell,
                  isSelected && styles.emojiCellSelected,
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      {/* ── PIN modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={pinModal !== null}
        onClose={closePinModal}
        title={pinTitle}
      >
        {/* set → enter */}
        {pinModal === 'set' && pinStep === 'enter' && (
          <View style={styles.pinContent}>
            <Text style={styles.pinHint}>Digite um PIN de 4 dígitos</Text>
            <TextInput
              style={styles.pinInput}
              value={pinA}
              onChangeText={v => setPinA(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              textAlign="center"
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (pinA.length < 4) { setPinError('O PIN deve ter 4 dígitos'); return; }
                setPinError(''); setPinStep('confirm');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* set → confirm */}
        {pinModal === 'set' && pinStep === 'confirm' && (
          <View style={styles.pinContent}>
            <Text style={styles.pinHint}>Confirme o PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pinB}
              onChangeText={v => setPinB(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              textAlign="center"
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (pinB !== pinA) { setPinError('Os PINs não coincidem'); setPinB(''); return; }
                saveCofrePin(pinA); closePinModal(); toast('PIN do Cofre criado');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Salvar PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setPinStep('enter'); setPinB(''); setPinError(''); }}
              style={styles.pinLink}
            >
              <Text style={styles.pinLinkText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* change → current */}
        {pinModal === 'change' && pinStep === 'current' && (
          <View style={styles.pinContent}>
            <Text style={styles.pinHint}>PIN atual</Text>
            <TextInput
              style={styles.pinInput}
              value={pinA}
              onChangeText={v => setPinA(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              textAlign="center"
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (pinA !== cofrePin) { setPinError('PIN incorreto'); setPinA(''); return; }
                setPinError(''); setPinStep('enter'); setPinA('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setPinModal('remove'); setPinStep('current'); setPinA(''); setPinError(''); }}
              style={styles.pinLink}
            >
              <Text style={[styles.pinLinkText, { color: colors.red }]}>Remover PIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* change → enter new */}
        {pinModal === 'change' && pinStep === 'enter' && (
          <View style={styles.pinContent}>
            <Text style={styles.pinHint}>Novo PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pinB}
              onChangeText={v => setPinB(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              textAlign="center"
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                if (pinB.length < 4) { setPinError('O PIN deve ter 4 dígitos'); return; }
                saveCofrePin(pinB); closePinModal(); toast('PIN alterado');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Salvar novo PIN</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* remove → current */}
        {pinModal === 'remove' && pinStep === 'current' && (
          <View style={styles.pinContent}>
            <Text style={styles.pinHint}>Digite o PIN atual para remover</Text>
            <TextInput
              style={styles.pinInput}
              value={pinA}
              onChangeText={v => setPinA(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              textAlign="center"
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <TouchableOpacity
              style={styles.removePinBtn}
              onPress={() => {
                if (pinA !== cofrePin) { setPinError('PIN incorreto'); setPinA(''); return; }
                saveCofrePin(null); closePinModal(); toast('PIN removido');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.removePinBtnText}>Remover PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closePinModal} style={styles.pinLink}>
              <Text style={styles.pinLinkText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: any) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: 48,
    gap: 24,
  },

  // ── avatar
  avatarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarEmoji: {
    fontSize: 42,
    lineHeight: 50,
  },
  avatarInitials: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 32,
    color: colors.accentDk,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  userName: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
  },

  // ── section
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },

  // ── dark mode switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  switchLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },

  // ── accent colors
  accentSection: {
    paddingVertical: 14,
  },
  accentTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    marginBottom: 14,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  swatchLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.text3,
  },
  swatchLabelSelected: {
    color: colors.text,
    fontWeight: '600',
  },

  // ── logout button
  logoutBtn: {
    width: '100%',
    paddingVertical: 15,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.red,
  },

  // ── save button (used in modals)
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
  },

  // ── text input
  input: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },

  // ── avatar modal internals
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    marginBottom: 20,
  },
  uploadBtnText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text2,
  },
  emojiGridLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiCellSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  emojiText: {
    fontSize: 22,
    lineHeight: 28,
  },

  // ── PIN modal internals
  pinContent: {
    gap: 12,
  },
  pinHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
  },
  pinInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 22,
    color: colors.text,
    letterSpacing: 8,
    textAlign: 'center',
  },
  pinError: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
  pinLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pinLinkText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
  },
  removePinBtn: {
    backgroundColor: colors.red,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  removePinBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: '#fff',
  },
});
