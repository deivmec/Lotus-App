import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors as lightColors, fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

const newId = () => Date.now().toString() + Math.random().toString(36).slice(2);
const today = new Date().toISOString().slice(0, 10);
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const FUNCAO_CORES: Record<string, { bg: string; color: string }> = {
  limpeza:      { bg: lightColors.blueBg,   color: lightColors.blue },
  hidratação:   { bg: lightColors.blueBg,   color: lightColors.blue },
  nutrição:     { bg: lightColors.accentBg, color: lightColors.accentDk },
  reconstrução: { bg: lightColors.redBg,    color: lightColors.red },
  finalização:  { bg: lightColors.greenBg,  color: lightColors.green },
};

const SK_TIPOS = ['limpeza', 'tônico', 'sérum', 'hidratante', 'protetor solar', 'esfoliante', 'máscara', 'óleo', 'contorno', 'outro'];
const SK_STEPS = ['manhã', 'noite', 'ambos', 'semanal'] as const;
const SK_STEP_META: Record<string, { emoji: string; bg: string; color: string }> = {
  manhã:   { emoji: '🌅', bg: '#FFF8EC', color: '#9A6A10' },
  noite:   { emoji: '🌙', bg: '#F0EEF9', color: '#6B5FA5' },
  ambos:   { emoji: '☀️', bg: lightColors.accentBg, color: lightColors.accentDk },
  semanal: { emoji: '📅', bg: lightColors.greenBg,  color: lightColors.green },
};

const TABS = ['capilar', 'skincare'] as const;

export default function AutocuidadosScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [tab, setTab] = useState<'capilar' | 'skincare'>('capilar');

  const [produtos, saveProdutos]   = useStorage<any[]>('capilar:produtos', []);
  const [logs, saveLogs]           = useStorage<Record<string, boolean>>('capilar:logs', {});
  const [showCapModal, setShowCapModal] = useState(false);
  const [capForm, setCapForm]      = useState({ nome: '', funcao: 'hidratação', dias: [] as number[] });

  const [skincare, saveSkincare]   = useStorage<any[]>('skincare:produtos', []);
  const [showSkModal, setShowSkModal] = useState(false);
  const [skForm, setSkForm]        = useState({ nome: '', tipo: 'hidratante', step: 'manhã', paraQue: '', comoUsar: '' });
  const [expandedSk, setExpandedSk] = useState<string | null>(null);

  const toast = useToast();

  const getWeekDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), isToday: i === 0 });
    }
    return days;
  };
  const weekDays = getWeekDays();
  const todayDow = new Date().getDay();
  const todayProds = produtos.filter(p => !p.dias?.length || p.dias.includes(todayDow));
  const doneTodayCount = todayProds.filter(p => logs[`${p.id}:${today}`]).length;

  const addCapilar = () => {
    if (!capForm.nome.trim()) return;
    saveProdutos((ps: any[]) => [...ps, { id: newId(), ...capForm }]);
    setCapForm({ nome: '', funcao: 'hidratação', dias: [] });
    setShowCapModal(false);
    toast('Produto adicionado');
  };

  const toggleLog = (prodId: string) => {
    const key = `${prodId}:${today}`;
    saveLogs((l: any) => ({ ...l, [key]: !l[key] }));
  };

  const addSkincare = () => {
    if (!skForm.nome.trim()) return;
    saveSkincare((sk: any[]) => [...sk, { id: newId(), ...skForm }]);
    setSkForm({ nome: '', tipo: 'hidratante', step: 'manhã', paraQue: '', comoUsar: '' });
    setShowSkModal(false);
    toast('Produto adicionado');
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Autocuidados"
        action={
          <TouchableOpacity
            onPress={() => tab === 'capilar' ? setShowCapModal(true) : setShowSkModal(true)}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Capilar Tab ── */}
        {tab === 'capilar' && (
          <View style={styles.gap16}>
            {todayProds.length > 0 && (
              <View style={styles.progressCard}>
                <Text style={styles.progressNum}>{doneTodayCount}/{todayProds.length}</Text>
                <Text style={styles.progressLabel}>PRODUTOS DE HOJE APLICADOS</Text>
              </View>
            )}

            {produtos.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🌿</Text>
                <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
                <Text style={styles.emptySub}>Adicione seus produtos capilares e rotina</Text>
              </View>
            ) : (
              produtos.map(prod => {
                const fc = FUNCAO_CORES[prod.funcao] ?? { bg: colors.bg2, color: colors.text3 };
                const done = logs[`${prod.id}:${today}`];
                const isToday = !prod.dias?.length || prod.dias.includes(todayDow);
                return (
                  <View key={prod.id} style={[styles.card, !isToday && styles.cardDim]}>
                    <TouchableOpacity
                      style={[styles.checkLeaf, { borderColor: done ? colors.green : colors.line, backgroundColor: done ? colors.green : colors.bg2 }]}
                      onPress={isToday ? () => toggleLog(prod.id) : undefined}
                      activeOpacity={0.75}
                    >
                      <Icon name="leaf" size={16} color={done ? colors.bg : colors.text3} />
                    </TouchableOpacity>
                    <View style={styles.prodInfo}>
                      <Text style={styles.prodName} numberOfLines={1}>{prod.nome}</Text>
                      <View style={styles.tagsRow}>
                        <View style={[styles.tag, { backgroundColor: fc.bg }]}>
                          <Text style={[styles.tagText, { color: fc.color }]}>{prod.funcao}</Text>
                        </View>
                        {isToday && (
                          <View style={[styles.tag, { backgroundColor: colors.greenBg }]}>
                            <Text style={[styles.tagText, { color: colors.green }]}>Hoje</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.dots}>
                      {weekDays.map((d, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: logs[`${prod.id}:${d.date}`] ? colors.green : d.isToday ? colors.line : colors.bg3 }]} />
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => { saveProdutos((ps: any[]) => ps.filter(p => p.id !== prod.id)); toast('Removido'); }} activeOpacity={0.7}>
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowCapModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar produto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Skincare Tab ── */}
        {tab === 'skincare' && (
          <View style={styles.gap16}>
            {skincare.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyTitle}>Nenhum produto adicionado</Text>
                <Text style={styles.emptySub}>Registre seus produtos e rotina de skincare</Text>
              </View>
            ) : (
              SK_STEPS.map(step => {
                const stepProds = skincare.filter(p => p.step === step);
                if (!stepProds.length) return null;
                const meta = SK_STEP_META[step];
                return (
                  <View key={step} style={styles.gap8}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepEmoji}>{meta.emoji}</Text>
                      <Text style={styles.sectionLabel}>Rotina {step}</Text>
                    </View>
                    {stepProds.map(prod => {
                      const expanded = expandedSk === prod.id;
                      return (
                        <View key={prod.id} style={styles.card}>
                          <View style={styles.skRow}>
                            <View style={[styles.skIcon, { backgroundColor: meta.bg }]}>
                              <Text style={{ fontSize: 16 }}>✨</Text>
                            </View>
                            <View style={styles.prodInfo}>
                              <Text style={styles.prodName}>{prod.nome}</Text>
                              <View style={styles.tagsRow}>
                                <View style={[styles.tag, { backgroundColor: meta.bg }]}>
                                  <Text style={[styles.tagText, { color: meta.color }]}>{prod.step}</Text>
                                </View>
                                <View style={[styles.tag, { backgroundColor: colors.bg2 }]}>
                                  <Text style={[styles.tagText, { color: colors.text3 }]}>{prod.tipo}</Text>
                                </View>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => setExpandedSk(expanded ? null : prod.id)} activeOpacity={0.7} style={styles.iconBtn}>
                              <Icon name="chevronDown" size={16} color={colors.text3} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { saveSkincare((sk: any[]) => sk.filter(s => s.id !== prod.id)); toast('Removido'); }} activeOpacity={0.7} style={styles.iconBtn}>
                              <Icon name="trash" size={14} color={colors.text3} />
                            </TouchableOpacity>
                          </View>
                          {expanded && (prod.paraQue || prod.comoUsar) && (
                            <View style={styles.expandedBody}>
                              {!!prod.paraQue && (
                                <View style={{ marginBottom: 10 }}>
                                  <Text style={styles.expandLabel}>PARA QUE SERVE</Text>
                                  <Text style={styles.expandText}>{prod.paraQue}</Text>
                                </View>
                              )}
                              {!!prod.comoUsar && (
                                <View>
                                  <Text style={styles.expandLabel}>COMO USAR</Text>
                                  <Text style={styles.expandText}>{prod.comoUsar}</Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowSkModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar produto</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal Capilar */}
      <Modal open={showCapModal} onClose={() => setShowCapModal(false)} title="Novo produto capilar"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addCapilar} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome do produto"
          placeholderTextColor={colors.text3}
          value={capForm.nome}
          onChangeText={v => setCapForm(f => ({ ...f, nome: v }))}
          autoFocus
        />
        <Text style={styles.fieldLabel}>Função</Text>
        <View style={styles.chipWrap}>
          {Object.keys(FUNCAO_CORES).map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.chip, capForm.funcao === k && styles.chipActive]}
              onPress={() => setCapForm(f => ({ ...f, funcao: k }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, capForm.funcao === k && styles.chipTextActive]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Dias de uso (opcional)</Text>
        <View style={styles.dayRow}>
          {DIAS.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayBtn, capForm.dias.includes(i) && styles.dayBtnActive]}
              onPress={() => setCapForm(f => ({
                ...f,
                dias: f.dias.includes(i) ? f.dias.filter(x => x !== i) : [...f.dias, i],
              }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayText, capForm.dias.includes(i) && styles.dayTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Modal Skincare */}
      <Modal open={showSkModal} onClose={() => setShowSkModal(false)} title="Novo produto skincare"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addSkincare} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome do produto"
          placeholderTextColor={colors.text3}
          value={skForm.nome}
          onChangeText={v => setSkForm(f => ({ ...f, nome: v }))}
          autoFocus
        />
        <Text style={styles.fieldLabel}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRowH}>
            {SK_TIPOS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, skForm.tipo === t && styles.chipActive]}
                onPress={() => setSkForm(f => ({ ...f, tipo: t }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, skForm.tipo === t && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.fieldLabel}>Momento</Text>
        <View style={styles.chipWrap}>
          {SK_STEPS.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, skForm.step === s && styles.chipActive]}
              onPress={() => setSkForm(f => ({ ...f, step: s }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, skForm.step === s && styles.chipTextActive]}>
                {SK_STEP_META[s].emoji} {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Para que serve? (benefícios, tipo de pele…)"
          placeholderTextColor={colors.text3}
          value={skForm.paraQue}
          onChangeText={v => setSkForm(f => ({ ...f, paraQue: v }))}
          multiline
          numberOfLines={3}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Como usar? (quantidade, frequência…)"
          placeholderTextColor={colors.text3}
          value={skForm.comoUsar}
          onChangeText={v => setSkForm(f => ({ ...f, comoUsar: v }))}
          multiline
          numberOfLines={3}
        />
      </Modal>
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg2,
  },
  tabBtnActive: { backgroundColor: colors.text },
  tabText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text2 },
  tabTextActive: { color: colors.bg },
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap16: { gap: 16 },
  gap8: { gap: 8 },
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 20,
    alignItems: 'center',
  },
  progressNum: { fontFamily: fonts.serif, fontSize: 28, color: colors.text, marginBottom: 4 },
  progressLabel: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3, letterSpacing: 0.7, textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  emptySub: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 6 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
  },
  cardDim: { opacity: 0.5 },
  checkLeaf: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prodInfo: { flex: 1, minWidth: 0 },
  prodName: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '500' },
  dots: { flexDirection: 'row', gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconBtn: { padding: 4 },
  skRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  expandedBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  expandLabel: { fontFamily: fonts.sans, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 5 },
  expandText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, lineHeight: 20 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepEmoji: { fontSize: 15 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3, letterSpacing: 0.6, textTransform: 'uppercase' },
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
  textarea: { textAlignVertical: 'top', minHeight: 76 },
  fieldLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.text2, marginTop: 4, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipRowH: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dayBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  dayText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3 },
  dayTextActive: { color: colors.accentDk },
  btnPrimary: { backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
