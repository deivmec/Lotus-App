import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Linking, Alert,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const newId = () => Date.now().toString();

const CATS = ['trabalho', 'finanças', 'aprendizado', 'referência', 'lazer'];
const ICONS = [
  { value: 'link', label: 'Link' },
  { value: 'note', label: 'Nota' },
  { value: 'briefcase', label: 'Trabalho' },
  { value: 'book', label: 'Livro' },
  { value: 'laptop', label: 'Tech' },
  { value: 'film', label: 'Entretenimento' },
  { value: 'wallet', label: 'Finanças' },
  { value: 'mail', label: 'E-mail' },
  { value: 'layers', label: 'App' },
];

const emptyForm = { nome: '', url: '', cat: 'trabalho', icon: 'link' };

export default function LinksScreen() {
  const [links, saveLinks] = useStorage<any[]>('links:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const addLink = () => {
    if (!form.nome.trim() || !form.url.trim()) return;
    let url = form.url;
    if (!url.startsWith('http')) url = 'https://' + url;
    saveLinks((ls: any[]) => [...ls, { id: newId(), ...form, url }]);
    setForm(emptyForm);
    setShowModal(false);
    toast('Link adicionado');
  };

  const openLink = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link.'));
  const delLink = (id: string) => { saveLinks((ls: any[]) => ls.filter(l => l.id !== id)); toast('Removido'); };

  const extraCats = links.map((l: any) => l.cat).filter((c: string) => !CATS.includes(c));
  const allCats = [...CATS, ...new Set(extraCats)];
  const grouped: Record<string, any[]> = {};
  allCats.forEach(cat => {
    const items = links.filter((l: any) => l.cat === cat);
    if (items.length) grouped[cat] = items;
  });

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Links Rápidos"
        action={
          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7}>
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {links.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔗</Text>
            <Text style={styles.emptyText}>Nenhum link ainda</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <View key={cat} style={styles.section}>
              <Text style={styles.sectionLabel}>{cat}</Text>
              <View style={styles.grid}>
                {items.map((link: any) => (
                  <View key={link.id} style={styles.gridItem}>
                    <TouchableOpacity
                      style={styles.linkCard}
                      onPress={() => openLink(link.url)}
                      onLongPress={() => Alert.alert('Remover', `Remover "${link.nome}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Remover', style: 'destructive', onPress: () => delLink(link.id) },
                      ])}
                      activeOpacity={0.75}
                    >
                      <View style={styles.linkIcon}>
                        <Icon name={link.icon || 'link'} size={16} color={colors.text2} />
                      </View>
                      <Text style={styles.linkName} numberOfLines={1}>{link.nome}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.btnAdd} onPress={() => setShowModal(true)} activeOpacity={0.7}>
          <Icon name="plus" size={16} color={colors.text2} />
          <Text style={styles.btnAddText}>Adicionar link</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo link"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addLink} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome (ex: Notion)"
          placeholderTextColor={colors.text3}
          value={form.nome}
          onChangeText={v => setForm(f => ({ ...f, nome: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="URL (ex: notion.so)"
          placeholderTextColor={colors.text3}
          value={form.url}
          onChangeText={v => setForm(f => ({ ...f, url: v }))}
          autoCapitalize="none"
          keyboardType="url"
        />

        <Text style={styles.fieldLabel}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {CATS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.cat === c && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, cat: c }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, form.cat === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.fieldLabel}>Ícone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {ICONS.map(ic => (
              <TouchableOpacity
                key={ic.value}
                style={[styles.chip, form.icon === ic.value && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, icon: ic.value }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, form.icon === ic.value && styles.chipTextActive]}>{ic.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screenPad, paddingBottom: 40, gap: 24 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  section: { gap: 8 },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    letterSpacing: 0.05 * 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '48%' },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
  },
  linkIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.bg2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkName: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
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
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },
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
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
    marginTop: 4,
    marginBottom: 4,
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
  },
  chipTextActive: { color: colors.accentDk },
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
});
