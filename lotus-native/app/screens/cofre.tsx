import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal as RNModal,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

/* ── Constants ── */

const TABS = [
  { id: 'docs', label: 'Documentos' },
  { id: 'logins', label: 'Logins' },
  { id: 'contatos', label: 'Contatos' },
];

const newId = () => Date.now().toString();

/* ── PinDots ── */

interface PinDotsProps {
  value: string;
  error: boolean;
}

const PinDots = ({ value, error }: PinDotsProps) => (
  <View style={pinStyles.dotsRow}>
    {[0, 1, 2, 3].map(i => (
      <View
        key={i}
        style={[
          pinStyles.dot,
          value.length > i
            ? { backgroundColor: error ? colors.red : colors.accent }
            : { backgroundColor: colors.line },
        ]}
      />
    ))}
  </View>
);

/* ── PinPad ── */

interface PinPadProps {
  value: string;
  onChange: (v: string) => void;
}

const PinPad = ({ value, onChange }: PinPadProps) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View style={pinStyles.pad}>
      {keys.map((k, i) => {
        if (!k) {
          return <View key={i} style={pinStyles.keyEmpty} />;
        }
        return (
          <TouchableOpacity
            key={i}
            style={pinStyles.key}
            activeOpacity={0.65}
            onPress={() => {
              if (k === '⌫') {
                onChange(value.slice(0, -1));
              } else if (value.length < 4) {
                onChange(value + k);
              }
            }}
          >
            <Text style={k === '⌫' ? pinStyles.keyTextBackspace : pinStyles.keyText}>
              {k}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/* ── Main screen ── */

export default function Cofre() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  /* Storage */
  const [docs, saveDocs] = useStorage<any[]>('cofre:docs', []);
  const [logins, saveLogins] = useStorage<any[]>('cofre:logins', []);
  const [contacts, saveContacts] = useStorage<any[]>('cofre:contatos', []);
  const [cofrePin, , pinReady] = useStorage<string | null>('cofre:pin', null);

  /* Tab */
  const [tab, setTab] = useState('docs');

  /* PIN gate */
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  /* Modals */
  const [showDocModal, setShowDocModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  /* New item forms */
  const [newDoc, setNewDoc] = useState({ name: '', number: '', expiry: '', photo: null as string | null });
  const [newLogin, setNewLogin] = useState({ service: '', user: '', pass: '' });
  const [newContact, setNewContact] = useState({ name: '', type: '', phone: '', email: '', note: '' });

  /* Login password visibility map */
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  /* Full-screen photo viewer */
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  /* ── PIN gate logic ── */

  if (!pinReady) return null;

  if (cofrePin && !unlocked) {
    const handlePinChange = (v: string) => {
      setPinInput(v);
      if (v.length === 4) {
        if (v === cofrePin) {
          setUnlocked(true);
          setPinInput('');
          setPinError(false);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPinInput('');
            setPinError(false);
          }, 800);
        }
      }
    };

    return (
      <View style={[pinStyles.fullScreen, { paddingTop: insets.top }]}>
        <View style={pinStyles.pinContent}>
          <Text style={pinStyles.lockEmoji}>🔒</Text>
          <Text style={pinStyles.pinTitle}>Cofre</Text>
          <Text style={pinStyles.pinSubtitle}>Digite o PIN para acessar</Text>
          <PinDots value={pinInput} error={pinError} />
          {pinError && (
            <Text style={pinStyles.pinErrorText}>PIN incorreto</Text>
          )}
          <PinPad value={pinInput} onChange={handlePinChange} />
        </View>
        <TouchableOpacity
          style={[pinStyles.backBtn, { paddingBottom: Math.max(insets.bottom, 20) }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={pinStyles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── Image picker ── */

  const pickPhoto = async (target: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (target === 'new') {
        setNewDoc(d => ({ ...d, photo: dataUrl }));
      } else {
        saveDocs((ds: any[]) =>
          ds.map(d => (d.id === target ? { ...d, photo: dataUrl } : d))
        );
        toast('Foto adicionada');
      }
    }
  };

  /* ── CRUD handlers ── */

  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    saveDocs((ds: any[]) => [...ds, { id: newId(), ...newDoc }]);
    setNewDoc({ name: '', number: '', expiry: '', photo: null });
    setShowDocModal(false);
    toast('Documento adicionado');
  };

  const addLogin = () => {
    if (!newLogin.service.trim()) return;
    saveLogins((ls: any[]) => [...ls, { id: newId(), ...newLogin }]);
    setNewLogin({ service: '', user: '', pass: '' });
    setShowLoginModal(false);
    toast('Login adicionado');
  };

  const addContact = () => {
    if (!newContact.name.trim()) return;
    saveContacts((cs: any[]) => [...cs, { id: newId(), ...newContact }]);
    setNewContact({ name: '', type: '', phone: '', email: '', note: '' });
    setShowContactModal(false);
    toast('Contato adicionado');
  };

  /* ── Main render ── */

  return (
    <View style={styles.flex}>
      <BackHeader title="Cofre" subtitle="Dados protegidos" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Icon name="shield" size={16} color="#7A5A3A" />
          <Text style={styles.infoText}>
            Dados protegidos e sincronizados com sua conta. Defina um PIN em Perfil → Segurança.
          </Text>
        </View>

        {/* Tab chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabChip, tab === t.id && styles.tabChipActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabChipText, tab === t.id && styles.tabChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── DOCS TAB ── */}
        {tab === 'docs' && (
          <View style={styles.tabContent}>
            {docs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🪪</Text>
                <Text style={styles.emptyText}>Nenhum documento</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {docs.map((doc: any) => (
                  <View key={doc.id} style={styles.card}>
                    <TouchableOpacity
                      style={styles.docThumb}
                      activeOpacity={doc.photo ? 0.75 : 1}
                      onPress={() => doc.photo && setViewPhoto(doc.photo)}
                    >
                      {doc.photo ? (
                        <Image
                          source={{ uri: doc.photo }}
                          style={styles.docThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Icon name="idCard" size={22} color={colors.text2} />
                      )}
                    </TouchableOpacity>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle}>{doc.name}</Text>
                      {!!doc.number && (
                        <Text style={styles.cardSub}>{doc.number}</Text>
                      )}
                      {!!doc.expiry && (
                        <Text style={styles.cardMeta}>Vence: {doc.expiry}</Text>
                      )}
                      <View style={styles.docActions}>
                        <TouchableOpacity
                          onPress={() => pickPhoto(doc.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.docActionAccent}>
                            {doc.photo ? 'Trocar foto' : '+ Foto'}
                          </Text>
                        </TouchableOpacity>
                        {!!doc.photo && (
                          <TouchableOpacity
                            onPress={() => {
                              saveDocs((ds: any[]) =>
                                ds.map(d => (d.id === doc.id ? { ...d, photo: null } : d))
                              );
                              toast('Foto removida');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.docActionRed}>Remover</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.trashBtn}
                      onPress={() => {
                        saveDocs((ds: any[]) => ds.filter(d => d.id !== doc.id));
                        toast('Removido');
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.btnAdd}
              onPress={() => setShowDocModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar documento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── LOGINS TAB ── */}
        {tab === 'logins' && (
          <View style={styles.tabContent}>
            {logins.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔑</Text>
                <Text style={styles.emptyText}>Nenhum login salvo</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {logins.map((login: any) => (
                  <View key={login.id} style={styles.cardColumn}>
                    <View style={styles.loginHeader}>
                      <Icon name="key" size={18} color={colors.text2} />
                      <Text style={styles.loginService}>{login.service}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          saveLogins((ls: any[]) => ls.filter(l => l.id !== login.id));
                          toast('Removido');
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.loginUser}>👤 {login.user}</Text>

                    <View style={styles.loginPassRow}>
                      <Text style={styles.loginPass}>
                        {showPassMap[login.id] ? login.pass : '••••••••'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setShowPassMap(m => ({ ...m, [login.id]: !m[login.id] }))
                        }
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={showPassMap[login.id] ? 'eyeOff' : 'eye'}
                          size={14}
                          color={colors.text3}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => {
                          Share.share({ message: login.pass });
                          toast('Copiado!');
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="copy" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.btnAdd}
              onPress={() => setShowLoginModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── CONTACTS TAB ── */}
        {tab === 'contatos' && (
          <View style={styles.tabContent}>
            {contacts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📞</Text>
                <Text style={styles.emptyText}>Nenhum contato</Text>
              </View>
            ) : (
              <View style={styles.cardList}>
                {contacts.map((c: any) => (
                  <View key={c.id} style={styles.cardColumn}>
                    <View style={styles.contactRow}>
                      <View style={styles.contactBody}>
                        <Text style={styles.contactName}>{c.name}</Text>
                        {!!c.type && (
                          <View style={styles.typeTag}>
                            <Text style={styles.typeTagText}>{c.type}</Text>
                          </View>
                        )}
                        {!!c.phone && (
                          <View style={styles.contactPhoneRow}>
                            <Text style={styles.contactDetail}>📱 {c.phone}</Text>
                            <TouchableOpacity
                              onPress={async () => {
                                Share.share({ message: c.phone });
                                toast('Copiado!');
                              }}
                              activeOpacity={0.7}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Icon name="copy" size={12} color={colors.text3} />
                            </TouchableOpacity>
                          </View>
                        )}
                        {!!c.email && (
                          <Text style={styles.contactDetail}>✉️ {c.email}</Text>
                        )}
                        {!!c.note && (
                          <Text style={styles.contactNote}>{c.note}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.trashBtn}
                        onPress={() => {
                          saveContacts((cs: any[]) => cs.filter(x => x.id !== c.id));
                          toast('Removido');
                        }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.btnAdd}
              onPress={() => setShowContactModal(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar contato</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── DOC MODAL ── */}
      <Modal
        open={showDocModal}
        onClose={() => {
          setShowDocModal(false);
          setNewDoc({ name: '', number: '', expiry: '', photo: null });
        }}
        title="Novo documento"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addDoc} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome (ex: RG)"
          placeholderTextColor={colors.text3}
          value={newDoc.name}
          onChangeText={v => setNewDoc(d => ({ ...d, name: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Número"
          placeholderTextColor={colors.text3}
          value={newDoc.number}
          onChangeText={v => setNewDoc(d => ({ ...d, number: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Validade (ex: mar 2028)"
          placeholderTextColor={colors.text3}
          value={newDoc.expiry}
          onChangeText={v => setNewDoc(d => ({ ...d, expiry: v }))}
        />

        {newDoc.photo ? (
          <View style={styles.photoPreviewRow}>
            <Image
              source={{ uri: newDoc.photo }}
              style={styles.photoPreview}
              resizeMode="cover"
            />
            <View style={styles.photoPreviewActions}>
              <TouchableOpacity onPress={() => pickPhoto('new')} activeOpacity={0.7}>
                <Text style={styles.docActionAccent}>Trocar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewDoc(d => ({ ...d, photo: null }))}
                activeOpacity={0.7}
              >
                <Text style={styles.docActionRed}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.btnAdd}
            onPress={() => pickPhoto('new')}
            activeOpacity={0.7}
          >
            <Icon name="camera" size={16} color={colors.text2} />
            <Text style={styles.btnAddText}>Adicionar foto (opcional)</Text>
          </TouchableOpacity>
        )}
      </Modal>

      {/* ── LOGIN MODAL ── */}
      <Modal
        open={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setNewLogin({ service: '', user: '', pass: '' });
        }}
        title="Novo login"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addLogin} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Serviço (ex: Gmail)"
          placeholderTextColor={colors.text3}
          value={newLogin.service}
          onChangeText={v => setNewLogin(l => ({ ...l, service: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Usuário / e-mail"
          placeholderTextColor={colors.text3}
          value={newLogin.user}
          onChangeText={v => setNewLogin(l => ({ ...l, user: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.text3}
          value={newLogin.pass}
          onChangeText={v => setNewLogin(l => ({ ...l, pass: v }))}
          secureTextEntry
        />
      </Modal>

      {/* ── CONTACT MODAL ── */}
      <Modal
        open={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setNewContact({ name: '', type: '', phone: '', email: '', note: '' });
        }}
        title="Novo contato"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addContact} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor={colors.text3}
          value={newContact.name}
          onChangeText={v => setNewContact(c => ({ ...c, name: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Tipo (ex: médico)"
          placeholderTextColor={colors.text3}
          value={newContact.type}
          onChangeText={v => setNewContact(c => ({ ...c, type: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Telefone"
          placeholderTextColor={colors.text3}
          value={newContact.phone}
          onChangeText={v => setNewContact(c => ({ ...c, phone: v }))}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.text3}
          value={newContact.email}
          onChangeText={v => setNewContact(c => ({ ...c, email: v }))}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Nota (opcional)"
          placeholderTextColor={colors.text3}
          value={newContact.note}
          onChangeText={v => setNewContact(c => ({ ...c, note: v }))}
        />
      </Modal>

      {/* ── FULL-SCREEN PHOTO VIEWER ── */}
      <RNModal
        visible={!!viewPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setViewPhoto(null)}
      >
        <TouchableOpacity
          style={styles.photoViewer}
          onPress={() => setViewPhoto(null)}
          activeOpacity={1}
        >
          <Image
            source={{ uri: viewPhoto! }}
            style={styles.photoViewerImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.photoViewerClose}
            onPress={() => setViewPhoto(null)}
            activeOpacity={0.8}
          >
            <Text style={styles.photoViewerCloseText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </RNModal>
    </View>
  );
}

/* ── PIN styles ── */

const pinStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  pinContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  lockEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  pinTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
    marginBottom: 4,
  },
  pinSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
    marginBottom: spacing.xxl,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: spacing.xxl,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pinErrorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
    marginBottom: spacing.lg,
    marginTop: -spacing.lg,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    maxWidth: 230,
    gap: 10,
  },
  key: {
    width: 66,
    height: 58,
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyEmpty: {
    width: 66,
    height: 58,
    backgroundColor: 'transparent',
  },
  keyText: {
    fontFamily: fonts.sans,
    fontSize: 22,
    color: colors.text,
  },
  keyTextBackspace: {
    fontFamily: fonts.sans,
    fontSize: 18,
    color: colors.text,
  },
  backBtn: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: spacing.xl,
  },
  backBtnText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
  },
});

/* ── Main styles ── */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: 48,
  },

  /* Info banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    margin: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: '#F5EDE6',
    borderWidth: 1,
    borderColor: '#E2C9B0',
    borderRadius: radius.sm,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: '#7A5A3A',
    lineHeight: 18,
  },

  /* Tabs */
  tabScroll: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: spacing.xl,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  tabChipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
  },
  tabChipTextActive: {
    color: colors.accentDk,
    fontFamily: fonts.sansMedium,
  },

  /* Tab content */
  tabContent: {
    paddingHorizontal: spacing.xl,
    gap: 8,
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text3,
  },

  /* Card list */
  cardList: {
    gap: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardColumn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'column',
    gap: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  cardSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  cardMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text3,
    marginTop: 2,
  },
  trashBtn: {
    padding: 4,
    alignSelf: 'flex-start',
  },

  /* Docs */
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  docThumbImage: {
    width: 52,
    height: 52,
  },
  docActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  docActionAccent: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.accent,
  },
  docActionRed: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.red,
  },

  /* Logins */
  loginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    flex: 1,
  },
  loginService: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  loginUser: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text2,
    marginBottom: 6,
  },
  loginPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginPass: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text3,
    letterSpacing: 1,
  },

  /* Contacts */
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  contactBody: {
    flex: 1,
    gap: 4,
  },
  contactName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  typeTagText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text3,
  },
  contactPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactDetail: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text2,
  },
  contactNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text3,
    fontStyle: 'italic',
  },

  /* Add button */
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  btnAddText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text2,
  },

  /* Input */
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

  /* Primary button */
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.bg,
  },

  /* Photo preview in modal */
  photoPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoPreview: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    flexShrink: 0,
  },
  photoPreviewActions: {
    gap: 6,
  },

  /* Full-screen photo viewer */
  photoViewer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  photoViewerImage: {
    width: '100%',
    height: '90%',
    borderRadius: radius.md,
  },
  photoViewerClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoViewerCloseText: {
    fontSize: 18,
    color: '#fff',
  },
});
