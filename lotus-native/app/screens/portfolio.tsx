import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Linking,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const newId = () => Date.now().toString();

const STATUS_OPTIONS = ['em desenvolvimento', 'concluído', 'pausado'] as const;
const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  'em desenvolvimento': { bg: colors.blueBg,  color: colors.blue  },
  'concluído':          { bg: colors.greenBg, color: colors.green },
  'pausado':            { bg: colors.bg2,      color: colors.text3 },
};

const emptyForm = { name: '', emoji: '💼', desc: '', link: '', tags: '', status: 'em desenvolvimento' };

export default function PortfolioScreen() {
  const [projects, saveProjects] = useStorage<any[]>('portfolio:items', []);
  const [showModal, setShowModal] = useState(false);
  const [showItemInput, setShowItemInput] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newItemText, setNewItemText] = useState('');
  const toast = useToast();

  const addProject = () => {
    if (!form.name.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    saveProjects((ps: any[]) => [...ps, { id: newId(), ...form, tags, items: [] }]);
    setForm(emptyForm);
    setShowModal(false);
    toast('Projeto adicionado');
  };

  const delProject = (id: string) => {
    saveProjects((ps: any[]) => ps.filter(p => p.id !== id));
    toast('Removido');
  };

  const addItem = (projectId: string) => {
    if (!newItemText.trim()) return;
    saveProjects((ps: any[]) =>
      ps.map(p => p.id === projectId
        ? { ...p, items: [...(p.items || []), { id: newId(), text: newItemText, done: false }] }
        : p
      )
    );
    setNewItemText('');
    toast('Item adicionado');
  };

  const toggleItem = (projectId: string, itemId: string) => {
    saveProjects((ps: any[]) =>
      ps.map(p => p.id === projectId
        ? { ...p, items: p.items.map((i: any) => i.id === itemId ? { ...i, done: !i.done } : i) }
        : p
      )
    );
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Portfólio"
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
        {projects.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🖼️</Text>
            <Text style={styles.emptyText}>Nenhum projeto ainda</Text>
          </View>
        ) : (
          projects.map(proj => {
            const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG['em desenvolvimento'];
            return (
              <View key={proj.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.projEmoji}>{proj.emoji}</Text>
                  <View style={styles.projInfo}>
                    <Text style={styles.projName}>{proj.name}</Text>
                    <View style={styles.tagsRow}>
                      <View style={[styles.tag, { backgroundColor: sc.bg }]}>
                        <Text style={[styles.tagText, { color: sc.color }]}>{proj.status}</Text>
                      </View>
                      {(proj.tags || []).map((t: string, i: number) => (
                        <View key={i} style={[styles.tag, { backgroundColor: colors.bg2 }]}>
                          <Text style={[styles.tagText, { color: colors.text3 }]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => delProject(proj.id)} activeOpacity={0.7} style={styles.delBtn}>
                    <Icon name="trash" size={14} color={colors.text3} />
                  </TouchableOpacity>
                </View>

                {!!proj.desc && (
                  <Text style={styles.projDesc}>{proj.desc}</Text>
                )}

                {(proj.items || []).length > 0 && (
                  <View style={styles.items}>
                    {proj.items.map((item: any) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.itemRow}
                        onPress={() => toggleItem(proj.id, item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkBox, item.done && styles.checkBoxDone]}>
                          {item.done && <Icon name="check" size={8} color={colors.bg} />}
                        </View>
                        <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {showItemInput === proj.id ? (
                  <View style={styles.addItemRow}>
                    <TextInput
                      style={[styles.input, styles.addItemInput]}
                      placeholder="Adicionar item..."
                      placeholderTextColor={colors.text3}
                      value={newItemText}
                      onChangeText={setNewItemText}
                      onSubmitEditing={() => addItem(proj.id)}
                      autoFocus
                    />
                    <TouchableOpacity
                      style={styles.addItemBtn}
                      onPress={() => addItem(proj.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addItemBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addItemCancel}
                      onPress={() => { setShowItemInput(null); setNewItemText(''); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.addItemCancelText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addItemLink}
                    onPress={() => setShowItemInput(proj.id)}
                    activeOpacity={0.7}
                  >
                    <Icon name="plus" size={13} color={colors.text3} />
                    <Text style={styles.addItemLinkText}>Adicionar item</Text>
                  </TouchableOpacity>
                )}

                {!!proj.link && (
                  <TouchableOpacity
                    style={styles.projLink}
                    onPress={() => Linking.openURL(proj.link)}
                    activeOpacity={0.7}
                  >
                    <Icon name="link" size={13} color={colors.accent} />
                    <Text style={styles.projLinkText}>Ver projeto</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo projeto"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addProject} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Criar projeto</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.emojiRow}>
          <TextInput
            style={[styles.input, styles.emojiInput]}
            value={form.emoji}
            onChangeText={v => setForm(f => ({ ...f, emoji: v }))}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Nome do projeto"
            placeholderTextColor={colors.text3}
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
            autoFocus
          />
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Descrição"
          placeholderTextColor={colors.text3}
          value={form.desc}
          onChangeText={v => setForm(f => ({ ...f, desc: v }))}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, form.status === s && styles.chipActive]}
              onPress={() => setForm(f => ({ ...f, status: s }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, form.status === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Link (opcional)"
          placeholderTextColor={colors.text3}
          value={form.link}
          onChangeText={v => setForm(f => ({ ...f, link: v }))}
          autoCapitalize="none"
          keyboardType="url"
        />
        <TextInput
          style={styles.input}
          placeholder="Tags (vírgula p/ separar)"
          placeholderTextColor={colors.text3}
          value={form.tags}
          onChangeText={v => setForm(f => ({ ...f, tags: v }))}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.screenPad, paddingBottom: 40, gap: 16 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  projEmoji: { fontSize: 28 },
  projInfo: { flex: 1 },
  projName: { fontFamily: fonts.serif, fontSize: 16, color: colors.text, marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500' },
  delBtn: { padding: 4 },
  projDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 20 },
  items: { gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBoxDone: { backgroundColor: colors.green, borderColor: colors.green },
  itemText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text, flex: 1 },
  itemTextDone: { color: colors.text3, textDecorationLine: 'line-through' },
  addItemRow: { flexDirection: 'row', gap: 8 },
  addItemInput: { flex: 1, paddingVertical: 8, fontSize: 13 },
  addItemBtn: {
    backgroundColor: colors.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemBtnText: { color: colors.bg, fontSize: 18 },
  addItemCancel: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItemCancelText: { color: colors.text2, fontSize: 18 },
  addItemLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemLinkText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  projLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  projLinkText: { fontFamily: fonts.sans, fontSize: 12, color: colors.accent },
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
  textarea: { textAlignVertical: 'top', minHeight: 80 },
  emojiRow: { flexDirection: 'row', gap: 10 },
  emojiInput: { width: 64, textAlign: 'center', fontSize: 20 },
  nameInput: { flex: 1 },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
    marginTop: 4,
    marginBottom: 6,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
