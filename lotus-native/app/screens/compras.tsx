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
import { fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

const newId = () => Date.now().toString();

const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
  { code: 'USD', symbol: '$',  flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥',  flag: '🇯🇵' },
  { code: 'ARS', symbol: '$',  flag: '🇦🇷' },
];

const RATES_TO_BRL: Record<string, number> = {
  BRL: 1, USD: 5.25, EUR: 5.72, GBP: 6.68, AUD: 3.42, JPY: 0.035, ARS: 0.0058,
};

const toBRL  = (val: number, from: string) => val * (RATES_TO_BRL[from] || 1);
const fromBRL = (brl: number, to: string)  => brl / (RATES_TO_BRL[to]  || 1);

const fmt = (val: number, code: string) => {
  const cur = CURRENCIES.find(c => c.code === code);
  const sym = cur?.symbol || code;
  const num = code === 'JPY' ? Math.round(val) : val.toFixed(2);
  return `${sym} ${num}`;
};

const TABS = ['lista', 'recorrentes', 'wishlist'] as const;
const TAB_LABELS: Record<string, string> = { lista: 'Lista', recorrentes: 'Recorrentes', wishlist: 'Wishlist' };

const emptyItem = { nome: '', qty: '1un', price: '', currency: 'BRL' };
const emptyRec  = { nome: '', qty: '1un', price: '', currency: 'BRL' };
const emptyWish = { name: '', price: '', link: '', priority: 'media' };
const emptyList = { nome: '', emoji: '📋' };

export default function ComprasScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState<typeof TABS[number]>('lista');

  const [listas, saveListas]         = useStorage<any[]>('compras:listas', [
    { id: '1', nome: 'Mercado', emoji: '🛒', itens: [] },
  ]);
  const [recorrentes, saveRecorrentes] = useStorage<any[]>('compras:recorrentes', []);
  const [wishlist, saveWishlist]       = useStorage<any[]>('compras:wishlist', []);

  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showItemModal, setShowItemModal]   = useState(false);
  const [showListModal, setShowListModal]   = useState(false);
  const [showWishModal, setShowWishModal]   = useState(false);
  const [showRecModal, setShowRecModal]     = useState(false);

  const [newItem, setNewItem] = useState(emptyItem);
  const [newList, setNewList] = useState(emptyList);
  const [newWish, setNewWish] = useState(emptyWish);
  const [newRec, setNewRec]   = useState(emptyRec);
  const [displayCurr, setDisplayCurr]     = useState('BRL');
  const [recDisplayCurr, setRecDisplayCurr] = useState('BRL');

  const toast = useToast();

  const curList = listas.find(l => l.id === (activeListId || listas[0]?.id)) || listas[0];

  // ── Lista helpers ──
  const addItem = () => {
    if (!newItem.nome.trim()) return;
    saveListas((ls: any[]) => ls.map(l => l.id === curList.id
      ? { ...l, itens: [...l.itens, { id: newId(), ...newItem, done: false }] }
      : l
    ));
    setNewItem(emptyItem);
    setShowItemModal(false);
    toast('Item adicionado');
  };

  const toggleItem = (itemId: string) => {
    saveListas((ls: any[]) => ls.map(l => l.id === curList.id
      ? { ...l, itens: l.itens.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i) }
      : l
    ));
  };

  const removeChecked = () => {
    saveListas((ls: any[]) => ls.map(l => l.id === curList.id
      ? { ...l, itens: l.itens.filter((i: any) => !i.done) }
      : l
    ));
    toast('Marcados removidos');
  };

  const addList = () => {
    if (!newList.nome.trim()) return;
    saveListas((ls: any[]) => [...ls, { id: newId(), ...newList, itens: [] }]);
    setNewList(emptyList);
    setShowListModal(false);
    toast('Lista criada');
  };

  // ── Wishlist helpers ──
  const addWish = () => {
    if (!newWish.name.trim()) return;
    saveWishlist((ws: any[]) => [...ws, { id: newId(), ...newWish, status: 'quero' }]);
    setNewWish(emptyWish);
    setShowWishModal(false);
    toast('Adicionado à wishlist');
  };

  // ── Recorrentes helpers ──
  const addRecorrente = () => {
    if (!newRec.nome.trim()) return;
    saveRecorrentes((rs: any[]) => [...rs, { id: newId(), ...newRec }]);
    setNewRec(emptyRec);
    setShowRecModal(false);
    toast('Item recorrente salvo');
  };

  const addRecToList = (rec: any) => {
    saveListas((ls: any[]) => ls.map(l => l.id === curList.id
      ? { ...l, itens: [...l.itens, { id: newId(), nome: rec.nome, qty: rec.qty, price: rec.price || '', currency: rec.currency || 'BRL', done: false }] }
      : l
    ));
    toast(`"${rec.nome}" adicionado à lista`);
  };

  const checkedCount = curList?.itens.filter((i: any) => i.done).length || 0;

  // Lista total
  const listPriced = (curList?.itens || []).filter((i: any) => i.price && parseFloat(i.price) > 0 && !i.done);
  const listTotalBRL = listPriced.reduce((sum: number, i: any) => sum + toBRL(parseFloat(i.price), i.currency || 'BRL'), 0);

  // Recorrentes total
  const recPriced = recorrentes.filter((r: any) => r.price && parseFloat(r.price) > 0);
  const recTotalBRL = recPriced.reduce((sum: number, r: any) => sum + toBRL(parseFloat(r.price), r.currency || 'BRL'), 0);

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Compras"
        action={
          <TouchableOpacity onPress={() => setShowListModal(true)} activeOpacity={0.7}>
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Lista ── */}
        {tab === 'lista' && (
          <View style={styles.gap16}>
            {/* List selector */}
            {listas.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.listSelectorRow}>
                  {listas.map((l: any) => {
                    const isActive = (activeListId || listas[0]?.id) === l.id;
                    return (
                      <TouchableOpacity
                        key={l.id}
                        style={[styles.listChip, isActive && styles.listChipActive]}
                        onPress={() => setActiveListId(l.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.listChipText, isActive && styles.listChipTextActive]}>
                          {l.emoji} {l.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Current list header */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{curList?.emoji} {curList?.nome}</Text>
              {checkedCount > 0 && (
                <TouchableOpacity onPress={removeChecked} activeOpacity={0.7}>
                  <Text style={styles.removeCheckedBtn}>
                    Remover {checkedCount} marcado{checkedCount > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {curList?.itens.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🛒</Text>
                <Text style={styles.emptyText}>Lista vazia</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {(curList?.itens || []).map((item: any, i: number) => (
                  <View key={item.id} style={[i > 0 && styles.topBorder, item.done && styles.dimmed]}>
                    <View style={styles.itemRow}>
                      <View style={styles.itemBody}>
                        <Checkbox checked={item.done} onToggle={() => toggleItem(item.id)}>
                          <View style={styles.itemContent}>
                            <Text style={styles.itemName} numberOfLines={1}>{item.nome}</Text>
                            {!!item.qty && (
                              <View style={styles.qtyTag}>
                                <Text style={styles.qtyText}>{item.qty}</Text>
                              </View>
                            )}
                            {!!item.price && parseFloat(item.price) > 0 && (
                              <Text style={styles.itemPrice}>{fmt(parseFloat(item.price), item.currency || 'BRL')}</Text>
                            )}
                          </View>
                        </Checkbox>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Total block */}
            {listPriced.length > 0 && (
              <View style={styles.totalBlock}>
                <View style={styles.totalHeader}>
                  <Text style={styles.totalLabel}>Total da lista ({listPriced.length} item{listPriced.length !== 1 ? 's' : ''})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.currChips}>
                      {CURRENCIES.map(c => (
                        <TouchableOpacity
                          key={c.code}
                          style={[styles.currChip, displayCurr === c.code && styles.currChipActive]}
                          onPress={() => setDisplayCurr(c.code)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.currChipText, displayCurr === c.code && styles.currChipTextActive]}>
                            {c.flag} {c.code}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <Text style={styles.totalAmount}>{fmt(fromBRL(listTotalBRL, displayCurr), displayCurr)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowItemModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar item</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Recorrentes ── */}
        {tab === 'recorrentes' && (
          <View style={styles.gap16}>
            <Text style={styles.hint}>Itens que você compra sempre. Toque em "+" para adicionar à lista ativa.</Text>

            {recorrentes.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔁</Text>
                <Text style={styles.emptyText}>Nenhum item recorrente</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {recorrentes.map((rec: any, i: number) => (
                  <View key={rec.id} style={[i > 0 && styles.topBorder]}>
                    <View style={styles.recRow}>
                      <View style={styles.itemBody}>
                        <Text style={styles.recName}>{rec.nome}</Text>
                        <View style={styles.recMeta}>
                          {!!rec.qty && <Text style={styles.recQty}>{rec.qty}</Text>}
                          {!!rec.price && parseFloat(rec.price) > 0 && (
                            <Text style={styles.recPrice}>{fmt(parseFloat(rec.price), rec.currency || 'BRL')}</Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.addToListBtn}
                        onPress={() => addRecToList(rec)}
                        activeOpacity={0.7}
                      >
                        <Icon name="plus" size={13} color={colors.accentDk} />
                        <Text style={styles.addToListText}>Adicionar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { saveRecorrentes((rs: any[]) => rs.filter(r => r.id !== rec.id)); toast('Removido'); }} activeOpacity={0.7} style={styles.iconBtn}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {recPriced.length > 0 && (
              <View style={styles.totalBlock}>
                <View style={styles.totalHeader}>
                  <Text style={styles.totalLabel}>Total recorrentes ({recPriced.length} com preço)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.currChips}>
                      {CURRENCIES.map(c => (
                        <TouchableOpacity key={c.code} style={[styles.currChip, recDisplayCurr === c.code && styles.currChipActive]} onPress={() => setRecDisplayCurr(c.code)} activeOpacity={0.7}>
                          <Text style={[styles.currChipText, recDisplayCurr === c.code && styles.currChipTextActive]}>{c.flag} {c.code}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <Text style={styles.totalAmount}>{fmt(fromBRL(recTotalBRL, recDisplayCurr), recDisplayCurr)}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowRecModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Novo item recorrente</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Wishlist ── */}
        {tab === 'wishlist' && (
          <View style={styles.gap16}>
            {wishlist.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>⭐</Text>
                <Text style={styles.emptyText}>Wishlist vazia</Text>
              </View>
            ) : (
              wishlist.map((w: any) => (
                <View key={w.id} style={styles.wishCard}>
                  <View style={styles.wishBody}>
                    <Text style={styles.wishName}>{w.name}</Text>
                    {!!w.price && <Text style={styles.wishPrice}>{w.price}</Text>}
                    {!!w.link && (
                      <TouchableOpacity onPress={() => Linking.openURL(w.link)} activeOpacity={0.7}>
                        <Text style={styles.wishLink}>🔗 Link</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.wishActions}>
                    <View style={[styles.priorityTag, { backgroundColor: w.priority === 'alta' ? colors.accentBg : colors.bg2 }]}>
                      <Text style={[styles.priorityText, { color: w.priority === 'alta' ? colors.accentDk : colors.text3 }]}>
                        {w.priority}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => { saveWishlist((ws: any[]) => ws.filter(x => x.id !== w.id)); toast('Removido'); }} activeOpacity={0.7} style={styles.iconBtn}>
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowWishModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar à wishlist</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Modais ── */}
      <Modal open={showItemModal} onClose={() => setShowItemModal(false)} title="Novo item"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addItem} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Adicionar</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Nome do item" placeholderTextColor={colors.text3} value={newItem.nome} onChangeText={v => setNewItem(n => ({ ...n, nome: v }))} autoFocus />
        <TextInput style={styles.input} placeholder="Quantidade (ex: 2un, 1kg)" placeholderTextColor={colors.text3} value={newItem.qty} onChangeText={v => setNewItem(n => ({ ...n, qty: v }))} />
        <Text style={styles.fieldLabel}>Preço (opcional)</Text>
        <CurrencyInput value={newItem.price} currency={newItem.currency} onValueChange={v => setNewItem(n => ({ ...n, price: v }))} onCurrencyChange={c => setNewItem(n => ({ ...n, currency: c }))} />
      </Modal>

      <Modal open={showListModal} onClose={() => setShowListModal(false)} title="Nova lista"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addList} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Criar lista</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Nome da lista" placeholderTextColor={colors.text3} value={newList.nome} onChangeText={v => setNewList(n => ({ ...n, nome: v }))} autoFocus />
        <TextInput style={styles.input} placeholder="Emoji (ex: 🛒)" placeholderTextColor={colors.text3} value={newList.emoji} onChangeText={v => setNewList(n => ({ ...n, emoji: v }))} />
      </Modal>

      <Modal open={showRecModal} onClose={() => setShowRecModal(false)} title="Novo item recorrente"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addRecorrente} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Salvar</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Nome do item (ex: Leite)" placeholderTextColor={colors.text3} value={newRec.nome} onChangeText={v => setNewRec(r => ({ ...r, nome: v }))} autoFocus />
        <TextInput style={styles.input} placeholder="Quantidade (ex: 2un, 1kg)" placeholderTextColor={colors.text3} value={newRec.qty} onChangeText={v => setNewRec(r => ({ ...r, qty: v }))} />
        <Text style={styles.fieldLabel}>Preço (opcional)</Text>
        <CurrencyInput value={newRec.price} currency={newRec.currency} onValueChange={v => setNewRec(r => ({ ...r, price: v }))} onCurrencyChange={c => setNewRec(r => ({ ...r, currency: c }))} />
      </Modal>

      <Modal open={showWishModal} onClose={() => setShowWishModal(false)} title="Adicionar à wishlist"
        footer={<TouchableOpacity style={styles.btnPrimary} onPress={addWish} activeOpacity={0.85}><Text style={styles.btnPrimaryText}>Adicionar</Text></TouchableOpacity>}
      >
        <TextInput style={styles.input} placeholder="Nome do item" placeholderTextColor={colors.text3} value={newWish.name} onChangeText={v => setNewWish(n => ({ ...n, name: v }))} autoFocus />
        <TextInput style={styles.input} placeholder="Preço (ex: R$ 150)" placeholderTextColor={colors.text3} value={newWish.price} onChangeText={v => setNewWish(n => ({ ...n, price: v }))} />
        <TextInput style={styles.input} placeholder="Link (opcional)" placeholderTextColor={colors.text3} value={newWish.link} onChangeText={v => setNewWish(n => ({ ...n, link: v }))} autoCapitalize="none" keyboardType="url" />
        <Text style={styles.fieldLabel}>Prioridade</Text>
        <View style={styles.chipWrap}>
          {(['alta', 'media', 'baixa'] as const).map(p => (
            <TouchableOpacity key={p} style={[styles.chip, newWish.priority === p && styles.chipActive]} onPress={() => setNewWish(n => ({ ...n, priority: p }))} activeOpacity={0.7}>
              <Text style={[styles.chipText, newWish.priority === p && styles.chipTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

interface CurrencyInputProps {
  value: string;
  currency: string;
  onValueChange: (v: string) => void;
  onCurrencyChange: (c: string) => void;
}

const CurrencyInput = ({ value, currency, onValueChange, onCurrencyChange }: CurrencyInputProps) => (
  <View style={styles.currInputRow}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }}>
      <View style={styles.currChips}>
        {CURRENCIES.map(c => (
          <TouchableOpacity
            key={c.code}
            style={[styles.currChip, currency === c.code && styles.currChipActive]}
            onPress={() => onCurrencyChange(c.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.currChipText, currency === c.code && styles.currChipTextActive]}>
              {c.flag} {c.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    <TextInput
      style={[styles.input, { flex: 1 }]}
      placeholder="Preço (opcional)"
      placeholderTextColor={colors.text3}
      value={value}
      onChangeText={onValueChange}
      keyboardType="numeric"
    />
  </View>
);

const makeStyles = (colors: any) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  tabTextActive: { color: colors.accentDk },
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap16: { gap: 16 },
  listSelectorRow: { flexDirection: 'row', gap: 8 },
  listChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  listChipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  listChipText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  listChipTextActive: { color: colors.accentDk },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.text },
  removeCheckedBtn: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.red },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, overflow: 'hidden' },
  topBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  dimmed: { opacity: 0.55 },
  itemRow: { padding: 12 },
  itemBody: { flex: 1 },
  itemContent: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  itemName: { fontFamily: fonts.sans, fontSize: 14, color: colors.text, flex: 1 },
  qtyTag: { backgroundColor: colors.bg2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, flexShrink: 0 },
  qtyText: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  itemPrice: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.green, marginLeft: 'auto' as any, flexShrink: 0 },
  totalBlock: { backgroundColor: colors.accentBg, borderWidth: 1.5, borderColor: colors.accent, borderRadius: radius.md, padding: 14, gap: 8 },
  totalHeader: { gap: 6 },
  totalLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: colors.text2 },
  currChips: { flexDirection: 'row', gap: 4 },
  currChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  currChipActive: { borderColor: colors.accent, backgroundColor: colors.surface },
  currChipText: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  currChipTextActive: { color: colors.accentDk, fontWeight: '600' },
  totalAmount: { fontFamily: fonts.serif, fontSize: 28, color: colors.accent, lineHeight: 32 },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  recRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  recName: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text },
  recMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  recQty: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  recPrice: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: colors.green },
  addToListBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentBg, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  addToListText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.accentDk },
  iconBtn: { padding: 4 },
  wishCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  wishBody: { flex: 1 },
  wishName: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 4 },
  wishPrice: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.green },
  wishLink: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 4 },
  wishActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priorityTag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },
  input: {
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  fieldLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.text2, marginTop: 4, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },
  currInputRow: { gap: 8 },
  btnPrimary: { backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
