import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const newId = () => Date.now().toString();

const TYPES = [
  { id: 'todos', label: 'Todos' },
  { id: 'livro', label: 'Livros' },
  { id: 'curso', label: 'Cursos' },
  { id: 'podcast', label: 'Pods' },
  { id: 'filme', label: 'Filmes' },
];

const TYPE_ICONS: Record<string, any> = {
  livro: 'book', curso: 'laptop', podcast: 'mic',
  filme: 'film', artigo: 'note', tutorial: 'laptop',
};

const STATUS_OPTIONS = ['quero ler', 'lendo', 'pausado', 'concluído'] as const;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  'quero ler': { label: 'Quero',    bg: colors.bg2,     color: colors.text3 },
  'lendo':     { label: 'Em curso', bg: colors.blueBg,  color: colors.blue  },
  'pausado':   { label: 'Pausado',  bg: colors.bg2,     color: colors.text3 },
  'concluído': { label: 'Feito',    bg: colors.greenBg, color: colors.green },
};

const TYPE_LABELS: Record<string, string> = {
  livro: 'Livro', curso: 'Curso', podcast: 'Podcast',
  filme: 'Filme / Série', artigo: 'Artigo', tutorial: 'Tutorial',
};

const emptyForm = { title: '', author: '', type: 'livro', status: 'quero ler', progress: 0, link: '' };

export default function ConteudoScreen() {
  const [typeFilter, setTypeFilter] = useState('todos');
  const [content, saveContent] = useStorage<any[]>('conteudo:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const toast = useToast();

  const filtered = content.filter(c => typeFilter === 'todos' || c.type === typeFilter);

  const addItem = () => {
    if (!form.title.trim()) return;
    saveContent((cs: any[]) => [...cs, { id: newId(), ...form }]);
    setForm(emptyForm);
    setShowModal(false);
    toast('Adicionado');
  };

  const cycleStatus = (id: string, current: string) => {
    const idx = STATUS_OPTIONS.indexOf(current as any);
    const next = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
    saveContent((cs: any[]) => cs.map(c => c.id === id ? { ...c, status: next } : c));
  };

  const delItem = (id: string) => {
    saveContent((cs: any[]) => cs.filter(c => c.id !== id));
    toast('Removido');
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Conteúdo"
        subtitle="Livros, cursos e mais"
        action={
          <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.7}>
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterRow}
      >
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.filterChip, typeFilter === t.id && styles.filterChipActive]}
            onPress={() => setTypeFilter(t.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, typeFilter === t.id && styles.filterTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyText}>Nenhum item ainda</Text>
          </View>
        ) : (
          filtered.map(item => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['quero ler'];
            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.typeIcon}>
                    <Icon name={TYPE_ICONS[item.type] || 'book'} size={18} color={colors.text2} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!!item.author && <Text style={styles.cardAuthor}>{item.author}</Text>}
                    <View style={styles.tagsRow}>
                      <View style={[styles.tag, { backgroundColor: colors.bg2 }]}>
                        <Text style={[styles.tagText, { color: colors.text3 }]}>{TYPE_LABELS[item.type] || item.type}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.tag, { backgroundColor: sc.bg }]}
                        onPress={() => cycleStatus(item.id, item.status)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.tagText, { color: sc.color }]}>{sc.label}</Text>
                      </TouchableOpacity>
                    </View>
                    {item.status === 'lendo' && item.progress > 0 && (
                      <View style={{ marginTop: 8 }}>
                        <ProgressBar value={item.progress} height={3} />
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => delItem(item.id)} activeOpacity={0.7} style={styles.delBtn}>
                    <Icon name="trash" size={14} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo item"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addItem} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Título"
          placeholderTextColor={colors.text3}
          value={form.title}
          onChangeText={v => setForm(f => ({ ...f, title: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Autor / Canal"
          placeholderTextColor={colors.text3}
          value={form.author}
          onChangeText={v => setForm(f => ({ ...f, author: v }))}
        />

        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.chipWrap}>
          {(['livro', 'curso', 'podcast', 'filme', 'artigo', 'tutorial'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, form.type === t && styles.chipActive]}
              onPress={() => setForm(f => ({ ...f, type: t }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, form.type === t && styles.chipTextActive]}>{TYPE_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Status</Text>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, form.status === s && styles.chipActive]}
              onPress={() => setForm(f => ({ ...f, status: s }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, form.status === s && styles.chipTextActive]}>
                {STATUS_CONFIG[s].label}
              </Text>
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
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  filterBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  filterRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterChipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  filterText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  filterTextActive: { color: colors.accentDk },
  content: { padding: spacing.screenPad, paddingBottom: 40, gap: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  typeIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.bg2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 2 },
  cardAuthor: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginBottom: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500' },
  delBtn: { padding: 4 },
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
