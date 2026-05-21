import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, StyleSheet,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors as lightColors, fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

// ── constants ─────────────────────────────────────────────────────────────────

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const FUNCOES = ['limpeza', 'hidratação', 'nutrição', 'reconstrução', 'finalização'] as const;
type Funcao = typeof FUNCOES[number];

const FUNCAO_CORES: Record<Funcao, { bg: string; color: string }> = {
  limpeza:      { bg: lightColors.blueBg,  color: lightColors.blue    },
  hidratação:   { bg: lightColors.blueBg,  color: lightColors.blue    },
  nutrição:     { bg: lightColors.accentBg, color: lightColors.accentDk },
  reconstrução: { bg: lightColors.redBg,   color: lightColors.red     },
  finalização:  { bg: lightColors.greenBg, color: lightColors.green   },
};

const FUNCAO_LABELS: Record<Funcao, string> = {
  limpeza:      'Limpeza',
  hidratação:   'Hidratação',
  nutrição:     'Nutrição',
  reconstrução: 'Reconstrução',
  finalização:  'Finalização',
};

const newId = () => Date.now().toString();

const emptyForm: { nome: string; funcao: Funcao; dias: number[] } = {
  nome: '',
  funcao: 'hidratação',
  dias: [],
};

// ── helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Returns 7 date strings [6 days ago … today] for the 7-dot history row */
const last7Dates = (): string[] => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
};

// ── sub-components ────────────────────────────────────────────────────────────

interface FuncaoTagProps {
  funcao: Funcao;
  small?: boolean;
}

const FuncaoTag = ({ funcao, small }: FuncaoTagProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const c = FUNCAO_CORES[funcao] ?? { bg: colors.bg2, color: colors.text3 };
  return (
    <View style={[styles.tag, { backgroundColor: c.bg }, small && styles.tagSmall]}>
      <Text style={[styles.tagText, { color: c.color }]}>{FUNCAO_LABELS[funcao] ?? funcao}</Text>
    </View>
  );
};

interface DotRowProps {
  produtoId: string;
  logs: Record<string, boolean>;
  dates: string[];
}

const DotRow = ({ produtoId, logs, dates }: DotRowProps) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
  <View style={styles.dotRow}>
    {dates.map(date => {
      const done = !!logs[`${produtoId}:${date}`];
      return (
        <View
          key={date}
          style={[styles.dot, done ? styles.dotDone : styles.dotEmpty]}
        />
      );
    })}
  </View>
  );
};

// ── screen ────────────────────────────────────────────────────────────────────

export default function CapilarScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [produtos, saveProdutos] = useStorage<any[]>('capilar:produtos', []);
  const [logs, saveLogs]         = useStorage<Record<string, boolean>>('capilar:logs', {});
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]          = useState(emptyForm);
  const toast                    = useToast();

  const dates   = useMemo(() => last7Dates(), []);
  const today   = todayStr();
  const todayDow = new Date().getDay(); // 0 = Dom … 6 = Sáb

  // Products scheduled for today (include in count even if not done)
  const todayProdutos = produtos.filter((p: any) => (p.dias ?? []).includes(todayDow));
  const doneToday     = todayProdutos.filter((p: any) => !!logs[`${p.id}:${today}`]).length;

  const toggleLog = (produtoId: string) => {
    const key = `${produtoId}:${today}`;
    saveLogs((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }));
  };

  const addProduto = () => {
    if (!form.nome.trim()) return;
    saveProdutos((ps: any[]) => [...ps, { id: newId(), ...form }]);
    setForm(emptyForm);
    setShowModal(false);
    toast('Produto adicionado');
  };

  const delProduto = (id: string) => {
    saveProdutos((ps: any[]) => ps.filter((p: any) => p.id !== id));
    toast('Removido');
  };

  const toggleDia = (dow: number) => {
    setForm(f => ({
      ...f,
      dias: f.dias.includes(dow) ? f.dias.filter(d => d !== dow) : [...f.dias, dow],
    }));
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Capilar"
        subtitle="Rotina de cabelo"
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
        {/* ── Progress card ─────────────────────────────────────────────── */}
        {todayProdutos.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Icon name="leaf" size={16} color={colors.green} />
              <Text style={styles.progressLabel}>Hoje</Text>
            </View>
            <Text style={styles.progressCount}>
              {doneToday}/{todayProdutos.length}
            </Text>
            <Text style={styles.progressSub}>
              {doneToday === todayProdutos.length
                ? 'Rotina completa!'
                : `${todayProdutos.length - doneToday} produto(s) pendente(s)`}
            </Text>
            {/* simple bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: todayProdutos.length > 0
                      ? `${Math.round((doneToday / todayProdutos.length) * 100)}%`
                      : '0%',
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ── Product list ──────────────────────────────────────────────── */}
        {produtos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyText}>Nenhum produto ainda</Text>
          </View>
        ) : (
          <>
            {/* Today's products first */}
            {todayProdutos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Para hoje</Text>
                {todayProdutos.map((p: any) => {
                  const done = !!logs[`${p.id}:${today}`];
                  return (
                    <ProductRow
                      key={p.id}
                      produto={p}
                      done={done}
                      logs={logs}
                      dates={dates}
                      onToggle={() => toggleLog(p.id)}
                      onDelete={() => delProduto(p.id)}
                    />
                  );
                })}
              </View>
            )}

            {/* Remaining products not scheduled today */}
            {(() => {
              const rest = produtos.filter((p: any) => !(p.dias ?? []).includes(todayDow));
              if (rest.length === 0) return null;
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Outros dias</Text>
                  {rest.map((p: any) => {
                    const done = !!logs[`${p.id}:${today}`];
                    return (
                      <ProductRow
                        key={p.id}
                        produto={p}
                        done={done}
                        logs={logs}
                        dates={dates}
                        onToggle={() => toggleLog(p.id)}
                        onDelete={() => delProduto(p.id)}
                      />
                    );
                  })}
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      {/* ── Add product modal ─────────────────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo produto"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addProduto} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome do produto"
          placeholderTextColor={colors.text3}
          value={form.nome}
          onChangeText={v => setForm(f => ({ ...f, nome: v }))}
          autoFocus
        />

        <Text style={styles.fieldLabel}>Função</Text>
        <View style={styles.chipWrap}>
          {FUNCOES.map(f => {
            const active = form.funcao === f;
            const c = FUNCAO_CORES[f];
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.chip,
                  active && { borderColor: c.color, backgroundColor: c.bg },
                ]}
                onPress={() => setForm(prev => ({ ...prev, funcao: f }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && { color: c.color }]}>
                  {FUNCAO_LABELS[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Dias da semana</Text>
        <View style={styles.dayRow}>
          {DIAS.map((label, dow) => {
            const active = form.dias.includes(dow);
            return (
              <TouchableOpacity
                key={dow}
                style={[styles.dayBtn, active && styles.dayBtnActive]}
                onPress={() => toggleDia(dow)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

// ── ProductRow ────────────────────────────────────────────────────────────────

interface ProductRowProps {
  produto: any;
  done: boolean;
  logs: Record<string, boolean>;
  dates: string[];
  onToggle: () => void;
  onDelete: () => void;
}

const ProductRow = ({ produto, done, logs, dates, onToggle, onDelete }: ProductRowProps) => (
  <View style={[styles.productCard, done && styles.productCardDone]}>
    <View style={styles.productRow}>
      {/* Toggle button */}
      <TouchableOpacity
        style={[styles.leafBtn, done && styles.leafBtnDone]}
        onPress={onToggle}
        activeOpacity={0.75}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Icon name="leaf" size={16} color={done ? colors.surface : colors.text3} />
      </TouchableOpacity>

      {/* Name + tags */}
      <View style={styles.productBody}>
        <Text
          style={[styles.productName, done && styles.productNameDone]}
          numberOfLines={1}
        >
          {produto.nome}
        </Text>
        <View style={styles.productMeta}>
          <FuncaoTag funcao={produto.funcao} small />
          {(produto.dias ?? []).length > 0 && (
            <View style={[styles.tag, styles.tagSmall, { backgroundColor: colors.bg2 }]}>
              <Text style={[styles.tagText, { color: colors.text3 }]}>
                {(produto.dias as number[])
                  .sort((a, b) => a - b)
                  .map(d => ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d])
                  .join(' ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.delBtn}>
        <Icon name="trash" size={14} color={colors.text3} />
      </TouchableOpacity>
    </View>

    {/* 7-day history dots */}
    <DotRow produtoId={produto.id} logs={logs} dates={dates} />
  </View>
);

// ── styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: any) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screenPad,
    paddingBottom: 40,
    gap: 20,
  },

  // progress card
  progressCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  progressLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    color: colors.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCount: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
    lineHeight: 34,
  },
  progressSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.bg2,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 99,
  },

  // empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text3,
  },

  // section
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

  // product card
  productCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
  },
  productCardDone: {
    borderColor: colors.greenBg,
    backgroundColor: colors.greenBg,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leafBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  leafBtnDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  productBody: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  productName: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  productNameDone: {
    color: colors.text3,
    textDecorationLine: 'line-through',
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  delBtn: {
    padding: 4,
    flexShrink: 0,
  },

  // 7-day dots
  dotRow: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  dotDone: {
    backgroundColor: colors.green,
  },
  dotEmpty: {
    backgroundColor: colors.bg3,
  },

  // tag
  tag: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '500',
  },

  // modal form
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text2,
  },

  // day buttons (7-day selector)
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    minWidth: 44,
    alignItems: 'center',
  },
  dayBtnActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenBg,
  },
  dayText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
  },
  dayTextActive: {
    color: colors.green,
  },

  // save button
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
