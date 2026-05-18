import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const DIAS = [
  { id: 'seg', label: 'Segunda-feira', short: 'Seg' },
  { id: 'ter', label: 'Terça-feira',   short: 'Ter' },
  { id: 'qua', label: 'Quarta-feira',  short: 'Qua' },
  { id: 'qui', label: 'Quinta-feira',  short: 'Qui' },
  { id: 'sex', label: 'Sexta-feira',   short: 'Sex' },
  { id: 'sab', label: 'Sábado',        short: 'Sáb' },
  { id: 'dom', label: 'Domingo',       short: 'Dom' },
];

const REFEICOES = [
  { id: 'cafe',   label: 'Café da manhã', emoji: '☕', bg: '#FDF3E0', textColor: '#8B6534' },
  { id: 'almoco', label: 'Almoço',        emoji: '🥗', bg: colors.greenBg, textColor: colors.green },
  { id: 'lanche', label: 'Lanche',        emoji: '🍎', bg: colors.accentBg, textColor: colors.accentDk },
  { id: 'jantar', label: 'Jantar',        emoji: '🍽️', bg: colors.blueBg, textColor: colors.blue },
];

const TODAY_ID = (['dom','seg','ter','qua','qui','sex','sab'] as const)[new Date().getDay()];

type DayPlan = { cafe: string; almoco: string; lanche: string; jantar: string };
type Plan = Record<string, DayPlan>;
const EMPTY_DAY: DayPlan = { cafe: '', almoco: '', lanche: '', jantar: '' };
const DEFAULT_PLAN: Plan = Object.fromEntries(DIAS.map(d => [d.id, { ...EMPTY_DAY }]));

export default function CronogramaAlimentar() {
  const [plano, savePlano] = useStorage<Plan>('cronograma:refeicoes', DEFAULT_PLAN);
  const [editModal, setEditModal] = useState<{ dia: string; ref: string; label: string; emoji: string } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [openDay, setOpenDay] = useState<string | null>(TODAY_ID);
  const toast = useToast();

  const openEdit = (dia: string, ref: string) => {
    const refeicao = REFEICOES.find(r => r.id === ref)!;
    setEditVal(plano[dia]?.[ref as keyof DayPlan] || '');
    setEditModal({ dia, ref, label: refeicao.label, emoji: refeicao.emoji });
  };

  const saveEdit = () => {
    if (!editModal) return;
    const { dia, ref } = editModal;
    savePlano(p => ({ ...p, [dia]: { ...(p[dia] || EMPTY_DAY), [ref]: editVal.trim() } }));
    setEditModal(null);
    toast('Salvo');
  };

  const clearDay = (diaId: string) => {
    savePlano(p => ({ ...p, [diaId]: { ...EMPTY_DAY } }));
    toast('Dia limpo');
  };

  const clearMeal = () => {
    if (!editModal) return;
    const { dia, ref } = editModal;
    savePlano(p => ({ ...p, [dia]: { ...(p[dia] || EMPTY_DAY), [ref]: '' } }));
    setEditModal(null);
    toast('Limpo');
  };

  const copyDay = (fromId: string, toId: string) => {
    const source = plano[fromId] || EMPTY_DAY;
    savePlano(p => ({ ...p, [toId]: { ...source } }));
    toast('Dia copiado');
  };

  const filledCount = (diaId: string) => {
    const d = plano[diaId] || EMPTY_DAY;
    return REFEICOES.filter(r => d[r.id as keyof DayPlan]).length;
  };

  const activeDia = DIAS.find(d => d.id === openDay);

  return (
    <View style={styles.screen}>
      <BackHeader title="Cronograma Alimentar" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Week summary chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayChips}
          style={{ marginBottom: 24 }}
        >
          {DIAS.map(dia => {
            const count = filledCount(dia.id);
            const isToday = dia.id === TODAY_ID;
            const isOpen = openDay === dia.id;
            return (
              <TouchableOpacity
                key={dia.id}
                onPress={() => setOpenDay(isOpen ? null : dia.id)}
                style={[
                  styles.dayChip,
                  isOpen && styles.dayChipOpen,
                  isToday && !isOpen && styles.dayChipToday,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayChipLabel,
                  isOpen && styles.dayChipLabelOpen,
                  isToday && !isOpen && { color: colors.accent },
                ]}>
                  {dia.short}
                </Text>
                <View style={styles.dotsRow}>
                  {REFEICOES.map((r) => (
                    <View
                      key={r.id}
                      style={[
                        styles.dot,
                        { backgroundColor: plano[dia.id]?.[r.id as keyof DayPlan] ? colors.accent : colors.line },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.dayChipCount, isOpen && { color: colors.accentDk }]}>
                  {count}/4
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Expanded day */}
        {openDay && activeDia && (
          <View>
            <View style={styles.dayHeader}>
              <View style={styles.dayHeaderLeft}>
                <Text style={styles.dayTitle}>{activeDia.label}</Text>
                {activeDia.id === TODAY_ID && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>HOJE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => clearDay(activeDia.id)}>
                <Text style={styles.clearBtn}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {REFEICOES.map(ref => {
                const valor = plano[activeDia.id]?.[ref.id as keyof DayPlan] || '';
                const hasValue = !!valor;
                return (
                  <TouchableOpacity
                    key={ref.id}
                    onPress={() => openEdit(activeDia.id, ref.id)}
                    style={[
                      styles.mealCard,
                      { backgroundColor: hasValue ? ref.bg : colors.surface },
                      hasValue && styles.mealCardFilled,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mealEmoji}>{ref.emoji}</Text>
                    <View style={styles.mealInfo}>
                      <Text style={[
                        styles.mealLabel,
                        { color: hasValue ? ref.textColor : colors.text3 },
                      ]}>
                        {ref.label.toUpperCase()}
                      </Text>
                      {hasValue ? (
                        <Text style={styles.mealValue} numberOfLines={1}>{valor}</Text>
                      ) : (
                        <Text style={styles.mealEmpty}>Toque para adicionar…</Text>
                      )}
                    </View>
                    <Icon
                      name={hasValue ? 'edit' : 'plus'}
                      size={14}
                      color={hasValue ? ref.textColor : colors.text3}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Copy to another day */}
            {filledCount(activeDia.id) > 0 && (
              <View style={styles.copySection}>
                <Text style={styles.copyLabel}>Copiar este dia para:</Text>
                <View style={styles.copyChips}>
                  {DIAS.filter(d => d.id !== activeDia.id).map(d => (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => copyDay(activeDia.id, d.id)}
                      style={styles.copyChip}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.copyChipText}>{d.short}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Show full week when no day selected */}
        {!openDay && DIAS.map(dia => {
          const count = filledCount(dia.id);
          if (count === 0) return null;
          const diaPlano = plano[dia.id] || EMPTY_DAY;
          return (
            <View key={dia.id} style={{ marginBottom: 20 }}>
              <View style={styles.dayHeader}>
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayTitle}>{dia.label}</Text>
                  {dia.id === TODAY_ID && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>HOJE</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ gap: 4 }}>
                {REFEICOES.filter(r => diaPlano[r.id as keyof DayPlan]).map(ref => (
                  <View key={ref.id} style={[styles.mealCard, { backgroundColor: ref.bg }]}>
                    <Text style={styles.mealEmoji}>{ref.emoji}</Text>
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealLabel, { color: ref.textColor }]}>{ref.label.toUpperCase()}</Text>
                      <Text style={styles.mealValue} numberOfLines={1}>{diaPlano[ref.id as keyof DayPlan]}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Expand button when day is selected */}
        {openDay && (
          <TouchableOpacity
            onPress={() => setOpenDay(null)}
            style={styles.weekBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.weekBtnText}>Ver semana completa</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal ? `${editModal.emoji} ${editModal.label}` : ''}
        footer={
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={clearMeal} activeOpacity={0.7}>
              <Text style={styles.btnSecondaryText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveEdit} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          placeholder={`O que vai comer no ${editModal?.label?.toLowerCase() ?? ''}?`}
          placeholderTextColor={colors.text3}
          value={editVal}
          onChangeText={setEditVal}
          multiline
          autoFocus
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.screenPad,
    paddingBottom: 40,
  },
  dayChips: {
    gap: 4,
    paddingRight: spacing.screenPad,
  },
  dayChip: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayChipOpen: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  dayChipToday: {
    borderColor: colors.line,
    backgroundColor: colors.bg2,
  },
  dayChipLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    color: colors.text3,
    letterSpacing: 0.4,
  },
  dayChipLabelOpen: {
    color: colors.accentDk,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 99,
  },
  dayChipCount: {
    fontSize: 9,
    fontFamily: fonts.sans,
    color: colors.text3,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
  },
  todayBadge: {
    backgroundColor: colors.accentBg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    color: colors.accentDk,
    letterSpacing: 0.4,
  },
  clearBtn: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text3,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mealCardFilled: {
    borderColor: 'transparent',
  },
  mealEmoji: {
    fontSize: 18,
  },
  mealInfo: {
    flex: 1,
    minWidth: 0,
  },
  mealLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.6,
  },
  mealValue: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: 18,
    marginTop: 2,
  },
  mealEmpty: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
  },
  copySection: {
    marginTop: 10,
  },
  copyLabel: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginBottom: 6,
  },
  copyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  copyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  copyChipText: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  weekBtn: {
    padding: 12,
    marginTop: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  weekBtnText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSecondary: {
    flex: 1,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.text2,
  },
  btnPrimary: {
    flex: 2,
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.bg,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
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
});
