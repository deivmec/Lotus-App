import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Linking,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import Checkbox from '../../components/Checkbox';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const newId = () => Date.now().toString();
const TABS = ['bucket', 'docs', 'destinos'] as const;
const TAB_LABELS: Record<string, string> = { bucket: 'Bucket List', docs: 'Documentos', destinos: 'Destinos' };

const TIPOS = ['cidade', 'praia', 'montanha', 'mochilão', 'aventura', 'cultural', 'outro'] as const;
const TIPO_EMOJI: Record<string, string> = { cidade: '🏙️', praia: '🏖️', montanha: '⛰️', mochilão: '🎒', aventura: '🧭', cultural: '🏛️', outro: '✈️' };

export default function ViagemScreen() {
  const [tab, setTab] = useState<typeof TABS[number]>('bucket');
  const [bucket, saveBucket]     = useStorage<any[]>('viagem:bucket', []);
  const [docs, saveDocs]         = useStorage<any[]>('viagem:docs', []);
  const [destinos, saveDestinos] = useStorage<any[]>('viagem:destinos', []);
  const [events, saveEvents]     = useStorage<any[]>('events:items', []);

  const [openDest, setOpenDest] = useState<string | null>(null);
  const [itemTexts, setItemTexts] = useState<Record<string, string>>({});
  const [linkTexts, setLinkTexts] = useState<Record<string, { label: string; url: string }>>({});

  const [showBucketModal, setShowBucketModal]   = useState(false);
  const [showDocModal, setShowDocModal]         = useState(false);
  const [showDestinoModal, setShowDestinoModal] = useState(false);

  const [newBucket, setNewBucket]   = useState({ place: '', note: '' });
  const [newDoc, setNewDoc]         = useState({ name: '', expiry: '' });
  const [newDestino, setNewDestino] = useState({ name: '', emoji: '✈️', type: 'cidade', dateStart: '', dateEnd: '', notes: '' });

  const toast = useToast();

  const today = new Date();
  const daysUntil = (exp: string) => exp ? Math.round((new Date(exp).getTime() - today.getTime()) / 86400000) : null;

  // Bucket
  const addBucket = () => {
    if (!newBucket.place.trim()) return;
    saveBucket((b: any[]) => [...b, { id: newId(), ...newBucket, visited: false }]);
    setNewBucket({ place: '', note: '' });
    setShowBucketModal(false);
    toast('Destino adicionado');
  };
  const toggleVisited = (id: string) =>
    saveBucket((b: any[]) => b.map(x => x.id === id ? { ...x, visited: !x.visited } : x));

  // Docs
  const addDoc = () => {
    if (!newDoc.name.trim()) return;
    saveDocs((d: any[]) => [...d, { id: newId(), ...newDoc }]);
    setNewDoc({ name: '', expiry: '' });
    setShowDocModal(false);
    toast('Documento adicionado');
  };

  // Destinos
  const addDestino = () => {
    if (!newDestino.name.trim()) return;
    const id = newId();
    saveDestinos((d: any[]) => [...d, { id, ...newDestino, checklist: [], links: [] }]);
    const title = `${newDestino.emoji || '✈️'} ${newDestino.name}`;
    const calEvents: any[] = [];
    if (newDestino.dateStart) calEvents.push({ id: newId(), title: `${title} · ida`, date: newDestino.dateStart, time: '00:00', category: 'viagem', sourceId: id });
    if (newDestino.dateEnd && newDestino.dateEnd !== newDestino.dateStart) calEvents.push({ id: newId(), title: `${title} · volta`, date: newDestino.dateEnd, time: '23:59', category: 'viagem', sourceId: id });
    if (calEvents.length) saveEvents((evs: any[]) => [...evs, ...calEvents]);
    setNewDestino({ name: '', emoji: '✈️', type: 'cidade', dateStart: '', dateEnd: '', notes: '' });
    setShowDestinoModal(false);
    toast('Destino criado');
  };

  const delDestino = (id: string) => {
    saveDestinos((ds: any[]) => ds.filter(d => d.id !== id));
    saveEvents((evs: any[]) => evs.filter((e: any) => e.sourceId !== id));
    if (openDest === id) setOpenDest(null);
    toast('Removido');
  };

  const toggleDestinoItem = (destId: string, itemId: string) => {
    saveDestinos((ds: any[]) => ds.map(d => d.id === destId
      ? { ...d, checklist: d.checklist.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i) }
      : d
    ));
  };

  const addDestinoItem = (destId: string) => {
    const text = (itemTexts[destId] || '').trim();
    if (!text) return;
    saveDestinos((ds: any[]) => ds.map(d => d.id === destId
      ? { ...d, checklist: [...d.checklist, { id: newId(), text, done: false }] }
      : d
    ));
    setItemTexts(t => ({ ...t, [destId]: '' }));
  };

  const addDestinoLink = (destId: string) => {
    const { label = '', url = '' } = linkTexts[destId] || {};
    if (!url.trim()) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    saveDestinos((ds: any[]) => ds.map(d => d.id === destId
      ? { ...d, links: [...(d.links || []), { id: newId(), label: label.trim() || url.trim(), url: fullUrl }] }
      : d
    ));
    setLinkTexts(t => ({ ...t, [destId]: { label: '', url: '' } }));
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Viagem"
        action={
          <TouchableOpacity
            onPress={() => {
              if (tab === 'bucket') setShowBucketModal(true);
              else if (tab === 'docs') setShowDocModal(true);
              else setShowDestinoModal(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Bucket List ── */}
        {tab === 'bucket' && (
          <View style={styles.gap12}>
            {bucket.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyEmoji}>✈️</Text><Text style={styles.emptyText}>Bucket list vazia</Text></View>
            ) : (
              bucket.map((item: any) => (
                <View key={item.id} style={styles.card}>
                  <TouchableOpacity
                    style={[styles.checkBox, item.visited && styles.checkBoxDone]}
                    onPress={() => toggleVisited(item.id)}
                    activeOpacity={0.75}
                  >
                    {item.visited && <Icon name="check" size={10} color={colors.bg} />}
                  </TouchableOpacity>
                  <View style={styles.flex}>
                    <Text style={[styles.itemTitle, item.visited && styles.itemTitleDone]}>{item.place}</Text>
                    {!!item.note && <Text style={styles.itemNote}>{item.note}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => { saveBucket((b: any[]) => b.filter(x => x.id !== item.id)); toast('Removido'); }} activeOpacity={0.7}>
                    <Icon name="trash" size={14} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowBucketModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar destino</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Documentos ── */}
        {tab === 'docs' && (
          <View style={styles.gap12}>
            {docs.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyEmoji}>🛂</Text><Text style={styles.emptyText}>Nenhum documento</Text></View>
            ) : (
              docs.map((doc: any) => {
                const days = daysUntil(doc.expiry);
                const warning = days !== null && days < 90;
                return (
                  <View key={doc.id} style={[styles.card, warning && styles.cardWarning]}>
                    <Icon name="compass" size={18} color={warning ? colors.red : colors.text2} />
                    <View style={styles.flex}>
                      <Text style={styles.itemTitle}>{doc.name}</Text>
                      {!!doc.expiry && (
                        <Text style={[styles.itemNote, warning && { color: colors.red }]}>
                          Vence: {doc.expiry}{warning ? ` ⚠️ ${days}d` : ''}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => { saveDocs((d: any[]) => d.filter(x => x.id !== doc.id)); toast('Removido'); }} activeOpacity={0.7}>
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowDocModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar documento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Destinos ── */}
        {tab === 'destinos' && (
          <View style={styles.gap12}>
            {destinos.length === 0 ? (
              <View style={styles.empty}><Text style={styles.emptyEmoji}>🗺️</Text><Text style={styles.emptyText}>Nenhum destino planejado</Text></View>
            ) : (
              destinos.map((dest: any) => {
                const isOpen = openDest === dest.id;
                const doneCount = (dest.checklist || []).filter((i: any) => i.done).length;
                return (
                  <View key={dest.id} style={styles.destinoCard}>
                    {/* Header */}
                    <TouchableOpacity
                      style={styles.destinoHeader}
                      onPress={() => setOpenDest(isOpen ? null : dest.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.destinoEmoji}>{dest.emoji || TIPO_EMOJI[dest.type] || '✈️'}</Text>
                      <View style={styles.flex}>
                        <Text style={styles.destinoName} numberOfLines={1}>{dest.name}</Text>
                        <Text style={styles.destinoMeta}>
                          {dest.type}
                          {dest.dateStart ? ` · ${dest.dateStart}` : ''}
                          {dest.dateEnd ? ` → ${dest.dateEnd}` : ''}
                          {dest.checklist?.length > 0 ? ` · ${doneCount}/${dest.checklist.length} itens` : ''}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => delDestino(dest.id)} activeOpacity={0.7} style={{ padding: 4 }}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                      <Icon name={isOpen ? 'chevronDown' : 'arrow'} size={14} color={colors.text3} />
                    </TouchableOpacity>

                    {/* Expanded */}
                    {isOpen && (
                      <View style={styles.destinoBody}>
                        {!!dest.notes && <Text style={styles.destinoNotes}>{dest.notes}</Text>}

                        {/* Checklist */}
                        {(dest.checklist || []).length > 0 && (
                          <View style={styles.gap8}>
                            <Text style={styles.subLabel}>CHECKLIST</Text>
                            {dest.checklist.map((item: any) => (
                              <View key={item.id} style={styles.checkRow}>
                                <View style={styles.flex}>
                                  <Checkbox checked={item.done} onToggle={() => toggleDestinoItem(dest.id, item.id)} strikethrough>
                                    {item.text}
                                  </Checkbox>
                                </View>
                                <TouchableOpacity
                                  onPress={() => saveDestinos((ds: any[]) => ds.map(d => d.id === dest.id ? { ...d, checklist: d.checklist.filter((i: any) => i.id !== item.id) } : d))}
                                  activeOpacity={0.7} style={{ padding: 2 }}
                                >
                                  <Icon name="x" size={12} color={colors.text3} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Add checklist item */}
                        <View style={styles.addRow}>
                          <TextInput
                            style={[styles.input, styles.addInput]}
                            placeholder="Adicionar item ao checklist…"
                            placeholderTextColor={colors.text3}
                            value={itemTexts[dest.id] || ''}
                            onChangeText={v => setItemTexts(t => ({ ...t, [dest.id]: v }))}
                            onSubmitEditing={() => addDestinoItem(dest.id)}
                          />
                          <TouchableOpacity style={styles.addBtn} onPress={() => addDestinoItem(dest.id)} activeOpacity={0.8}>
                            <Icon name="plus" size={14} color={colors.bg} />
                          </TouchableOpacity>
                        </View>

                        {/* Links */}
                        <View style={[styles.gap8, { marginTop: 12 }]}>
                          <Text style={styles.subLabel}>LINKS ÚTEIS</Text>
                          {(dest.links || []).map((link: any) => (
                            <View key={link.id} style={styles.linkRow}>
                              <Icon name="link" size={12} color={colors.text3} />
                              <TouchableOpacity style={styles.flex} onPress={() => Linking.openURL(link.url)} activeOpacity={0.7}>
                                <Text style={styles.linkLabel} numberOfLines={1}>{link.label}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => saveDestinos((ds: any[]) => ds.map(d => d.id === dest.id ? { ...d, links: d.links.filter((l: any) => l.id !== link.id) } : d))}
                                activeOpacity={0.7} style={{ padding: 2 }}
                              >
                                <Icon name="x" size={12} color={colors.text3} />
                              </TouchableOpacity>
                            </View>
                          ))}
                          <View style={styles.addLinkRow}>
                            <TextInput
                              style={[styles.input, styles.addInputSm]}
                              placeholder="Nome"
                              placeholderTextColor={colors.text3}
                              value={(linkTexts[dest.id] || {}).label || ''}
                              onChangeText={v => setLinkTexts(t => ({ ...t, [dest.id]: { ...(t[dest.id] || { label: '', url: '' }), label: v } }))}
                            />
                            <TextInput
                              style={[styles.input, styles.addInputSm]}
                              placeholder="URL"
                              placeholderTextColor={colors.text3}
                              value={(linkTexts[dest.id] || {}).url || ''}
                              onChangeText={v => setLinkTexts(t => ({ ...t, [dest.id]: { ...(t[dest.id] || { label: '', url: '' }), url: v } }))}
                              autoCapitalize="none"
                              keyboardType="url"
                            />
                            <TouchableOpacity style={styles.addBtnSm} onPress={() => addDestinoLink(dest.id)} activeOpacity={0.8}>
                              <Icon name="plus" size={14} color={colors.text2} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowDestinoModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Novo destino</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal Bucket */}
      <Modal open={showBucketModal} onClose={() => setShowBucketModal(false)} title="Novo destino"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addBucket} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Adicionar</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Destino (ex: Japão)" placeholderTextColor={colors.text3} value={newBucket.place} onChangeText={v => setNewBucket(b => ({ ...b, place: v }))} autoFocus />
        <TextInput style={styles.input} placeholder="Nota (opcional)" placeholderTextColor={colors.text3} value={newBucket.note} onChangeText={v => setNewBucket(b => ({ ...b, note: v }))} />
      </Modal>

      {/* Modal Documento */}
      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Novo documento de viagem"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addDoc} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Adicionar</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Documento (ex: Passaporte)" placeholderTextColor={colors.text3} value={newDoc.name} onChangeText={v => setNewDoc(d => ({ ...d, name: v }))} autoFocus />
        <Text style={styles.fieldLabel}>Data de validade (AAAA-MM-DD)</Text>
        <TextInput style={styles.input} placeholder="2030-01-01" placeholderTextColor={colors.text3} value={newDoc.expiry} onChangeText={v => setNewDoc(d => ({ ...d, expiry: v }))} keyboardType="numeric" />
      </Modal>

      {/* Modal Destino */}
      <Modal open={showDestinoModal} onClose={() => setShowDestinoModal(false)} title="Nova viagem"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addDestino} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Criar destino</Text></TouchableOpacity>}
      >
        <View style={styles.emojiRow}>
          <TextInput style={[styles.input, styles.emojiInput]} value={newDestino.emoji} onChangeText={v => setNewDestino(d => ({ ...d, emoji: v }))} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Nome da viagem (ex: Japão 2027)" placeholderTextColor={colors.text3} value={newDestino.name} onChangeText={v => setNewDestino(d => ({ ...d, name: v }))} autoFocus />
        </View>
        <Text style={styles.fieldLabel}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {TIPOS.map(t => (
              <TouchableOpacity key={t} style={[styles.chip, newDestino.type === t && styles.chipActive]} onPress={() => setNewDestino(d => ({ ...d, type: t }))} activeOpacity={0.7}>
                <Text style={[styles.chipText, newDestino.type === t && styles.chipTextActive]}>{TIPO_EMOJI[t]} {t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={styles.dateRow}>
          <View style={styles.flex}>
            <Text style={styles.fieldLabel}>Data início</Text>
            <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor={colors.text3} value={newDestino.dateStart} onChangeText={v => setNewDestino(d => ({ ...d, dateStart: v }))} keyboardType="numeric" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.fieldLabel}>Data fim</Text>
            <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor={colors.text3} value={newDestino.dateEnd} onChangeText={v => setNewDestino(d => ({ ...d, dateEnd: v }))} keyboardType="numeric" />
          </View>
        </View>
        <TextInput style={[styles.input, styles.textarea]} placeholder="Notas (opcional)" placeholderTextColor={colors.text3} value={newDestino.notes} onChangeText={v => setNewDestino(d => ({ ...d, notes: v }))} multiline numberOfLines={2} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  tabTextActive: { color: colors.accentDk },
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap12: { gap: 12 },
  gap8: { gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 14,
  },
  cardWarning: { borderColor: colors.red, backgroundColor: colors.redBg },
  checkBox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  checkBoxDone: { backgroundColor: colors.green, borderColor: colors.green },
  itemTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text },
  itemTitleDone: { color: colors.text3, textDecorationLine: 'line-through' },
  itemNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 3 },
  destinoCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  destinoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  destinoEmoji: { fontSize: 24, flexShrink: 0 },
  destinoName: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '500', color: colors.text },
  destinoMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3, marginTop: 2 },
  destinoBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14, gap: 8 } as any,
  destinoNotes: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, fontStyle: 'italic' },
  subLabel: { fontFamily: fonts.sans, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.text3, textTransform: 'uppercase' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: { flex: 1, paddingVertical: 8, fontSize: 13 },
  addBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, width: 38, alignItems: 'center', justifyContent: 'center' },
  addLinkRow: { flexDirection: 'row', gap: 6 },
  addInputSm: { flex: 1, paddingVertical: 7, fontSize: 12 },
  addBtnSm: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, width: 36, alignItems: 'center', justifyContent: 'center' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.accent },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },
  input: {
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  textarea: { textAlignVertical: 'top', minHeight: 64 },
  fieldLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.text2, marginTop: 4, marginBottom: 6 },
  emojiRow: { flexDirection: 'row', gap: 10 },
  emojiInput: { width: 64, textAlign: 'center', fontSize: 20 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },
  dateRow: { flexDirection: 'row', gap: 12 },
  btnPrimary: { backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
