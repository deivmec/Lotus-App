import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import ProgressBar from '../../components/ProgressBar';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const curMonth = today.slice(0, 7);
const newId = () => Date.now().toString();

const fmtMoney = (v: number) =>
  `R$ ${(v || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const CATS_DEFAULT = [
  { id: 'moradia',     name: 'Moradia',     icon: 'home',     limit: 2000, color: colors.accent },
  { id: 'alimentacao', name: 'Alimentação', icon: 'utensils', limit: 800,  color: colors.green },
  { id: 'transporte',  name: 'Transporte',  icon: 'car',      limit: 400,  color: colors.blue },
  { id: 'saude',       name: 'Saúde',       icon: 'heart',    limit: 500,  color: '#C45C4F' },
  { id: 'lazer',       name: 'Lazer',       icon: 'film',     limit: 300,  color: '#7A6EC4' },
  { id: 'educacao',    name: 'Educação',    icon: 'book',     limit: 300,  color: '#5A9EA0' },
  { id: 'outros',      name: 'Outros',      icon: 'layers',   limit: 300,  color: colors.text3 },
];

const GOAL_COLORS = [
  '#4CAF85', '#5B9BD5', '#C4704A', '#9B76C4', '#E06060', '#E0A840',
];

const TABS = [
  { id: 'resumo',     label: 'Resumo' },
  { id: 'economias',  label: 'Economias' },
  { id: 'planejados', label: 'Planejados' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  category: string;
  date: string;
  icon?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  limit: number;
  color: string;
}

interface Deposit {
  id: string;
  valor: number;
  data: string;
  nota: string;
}

interface Objetivo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  target: number;
  current: number;
  deposits: Deposit[];
}

interface Planejado {
  id: string;
  desc: string;
  amount: number;
  dueDate: string;
  category: string;
  paid: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Financas() {
  const [tab, setTab] = useState('resumo');

  const [transactions, saveTransactions] = useStorage<Transaction[]>('financas:transacoes', []);
  const [cats] = useStorage<Category[]>('financas:categorias', CATS_DEFAULT);
  const [planejados, savePlanejados] = useStorage<Planejado[]>('financas:planejados', []);
  const [objetivos, saveObjetivos] = useStorage<Objetivo[]>('financas:objetivos', []);

  const [showModal, setShowModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalDepModal, setGoalDepModal] = useState<string | null>(null);
  const [openGoal, setOpenGoal] = useState<string | null>(null);

  const [form, setForm] = useState({
    desc: '', amount: '', category: 'alimentacao', date: today, type: 'expense',
  });
  const [planForm, setPlanForm] = useState({
    desc: '', amount: '', dueDate: '', category: 'outros',
  });
  const [goalForm, setGoalForm] = useState({
    name: '', emoji: '💰', color: '#4CAF85', target: '',
  });
  const [goalDepForm, setGoalDepForm] = useState({
    valor: '', data: today, nota: '',
  });

  const toast = useToast();

  // ─── Computed ──────────────────────────────────────────────────────────────

  const monthTx = transactions.filter(t => t.date?.startsWith(curMonth));
  const totalExpense = monthTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = monthTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const catSpend = (catId: string) =>
    monthTx.filter(t => t.amount < 0 && t.category === catId).reduce((s, t) => s + Math.abs(t.amount), 0);

  const pendingTotal = planejados.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
  const totalEconomizado = objetivos.reduce((s, o) => s + (o.current || 0), 0);
  const activeGoal = objetivos.find(o => o.id === goalDepModal);

  // ─── Transaction handlers ──────────────────────────────────────────────────

  const addTransaction = () => {
    if (!form.desc || !form.amount) return;
    const amount = form.type === 'expense'
      ? -Math.abs(parseFloat(form.amount))
      : Math.abs(parseFloat(form.amount));
    saveTransactions(ts => [
      { id: newId(), desc: form.desc, amount, category: form.category, date: form.date, icon: form.category },
      ...ts,
    ]);
    setForm({ desc: '', amount: '', category: 'alimentacao', date: today, type: 'expense' });
    setShowModal(false);
    toast('Lançamento adicionado');
  };

  const delTx = (id: string) => {
    Alert.alert('Remover lançamento', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { saveTransactions(ts => ts.filter(t => t.id !== id)); toast('Removido'); },
      },
    ]);
  };

  // ─── Goal handlers ─────────────────────────────────────────────────────────

  const addObjetivo = () => {
    if (!goalForm.name.trim() || !goalForm.target) return;
    saveObjetivos(os => [...os, {
      id: newId(),
      name: goalForm.name,
      emoji: goalForm.emoji,
      color: goalForm.color,
      target: parseFloat(goalForm.target),
      current: 0,
      deposits: [],
    }]);
    setGoalForm({ name: '', emoji: '💰', color: '#4CAF85', target: '' });
    setShowGoalModal(false);
    toast('Objetivo criado');
  };

  const addGoalDeposit = (goalId: string) => {
    if (!goalDepForm.valor) return;
    const valor = parseFloat(goalDepForm.valor);
    saveObjetivos(os => os.map(o =>
      o.id === goalId
        ? {
            ...o,
            current: (o.current || 0) + valor,
            deposits: [{ id: newId(), valor, data: goalDepForm.data, nota: goalDepForm.nota }, ...(o.deposits || [])],
          }
        : o
    ));
    setGoalDepForm({ valor: '', data: today, nota: '' });
    setGoalDepModal(null);
    toast('Depósito registrado');
  };

  const delGoalDeposit = (goalId: string, depId: string, valor: number) => {
    Alert.alert('Remover depósito', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => {
          saveObjetivos(os => os.map(o =>
            o.id === goalId
              ? {
                  ...o,
                  current: Math.max(0, (o.current || 0) - valor),
                  deposits: (o.deposits || []).filter(d => d.id !== depId),
                }
              : o
          ));
          toast('Removido');
        },
      },
    ]);
  };

  const delObjetivo = (id: string) => {
    Alert.alert('Remover objetivo', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => {
          saveObjetivos(os => os.filter(o => o.id !== id));
          setOpenGoal(null);
          toast('Objetivo removido');
        },
      },
    ]);
  };

  // ─── Planned handlers ──────────────────────────────────────────────────────

  const addPlanned = () => {
    if (!planForm.desc || !planForm.amount) return;
    savePlanejados(p => [...p, {
      id: newId(),
      desc: planForm.desc,
      amount: parseFloat(planForm.amount),
      dueDate: planForm.dueDate,
      category: planForm.category,
      paid: false,
    }]);
    setPlanForm({ desc: '', amount: '', dueDate: '', category: 'outros' });
    setShowPlanModal(false);
    toast('Gasto planejado adicionado');
  };

  const togglePaid = (id: string) =>
    savePlanejados(p => p.map(x => x.id === id ? { ...x, paid: !x.paid } : x));

  const delPlanned = (id: string) => {
    Alert.alert('Remover gasto planejado', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { savePlanejados(p => p.filter(x => x.id !== id)); toast('Removido'); },
      },
    ]);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Finanças"
        subtitle={curMonth}
        action={
          <TouchableOpacity
            onPress={() => {
              if (tab === 'resumo') setShowModal(true);
              else if (tab === 'economias') setShowGoalModal(true);
              else setShowPlanModal(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Resumo ── */}
        {tab === 'resumo' && (
          <View style={styles.gap16}>
            {/* Income / Expense summary row */}
            <View style={styles.summaryRow}>
              <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.summaryLabel}>Receitas</Text>
                <Text style={[styles.summaryAmount, { color: colors.green }]}>{fmtMoney(totalIncome)}</Text>
              </View>
              <View style={[styles.card, styles.summaryCard]}>
                <Text style={styles.summaryLabel}>Gastos</Text>
                <Text style={[styles.summaryAmount, { color: colors.red }]}>{fmtMoney(totalExpense)}</Text>
              </View>
            </View>

            {/* Balance card */}
            <View style={[styles.card, styles.balanceCard]}>
              <Text style={styles.summaryLabel}>Saldo do mês</Text>
              <Text style={[styles.balanceAmount, { color: balance >= 0 ? colors.green : colors.red }]}>
                {fmtMoney(balance)}
              </Text>
            </View>

            {/* Categories */}
            <View>
              <Text style={styles.sectionLabel}>Categorias</Text>
              <View style={[styles.card, styles.cardFlush]}>
                {cats.map((cat, i) => {
                  const spent = catSpend(cat.id);
                  const pct = cat.limit ? Math.min(100, (spent / cat.limit) * 100) : 0;
                  const over = spent > cat.limit;
                  return (
                    <View
                      key={cat.id}
                      style={[styles.catRow, i < cats.length - 1 && styles.bottomBorder]}
                    >
                      <View style={styles.catHeader}>
                        <Icon name={cat.icon} size={16} color={cat.color} />
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text style={[styles.catAmount, over && { color: colors.red }]}>
                          {fmtMoney(spent)} / {fmtMoney(cat.limit)}
                        </Text>
                      </View>
                      <ProgressBar value={pct} color={over ? colors.red : cat.color} height={4} />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Recent transactions */}
            <View>
              <Text style={styles.sectionLabel}>Lançamentos do mês</Text>
              {monthTx.length === 0 ? (
                <View style={styles.emptyInline}>
                  <Text style={styles.emptyText}>Nenhum lançamento este mês</Text>
                </View>
              ) : (
                <View style={[styles.card, styles.cardFlush]}>
                  {monthTx.slice(0, 15).map((tx, i) => (
                    <View
                      key={tx.id}
                      style={[styles.txRow, i < Math.min(monthTx.length, 15) - 1 && styles.bottomBorder]}
                    >
                      <View style={styles.txIcon}>
                        <Icon name={tx.icon || 'wallet'} size={16} color={colors.text2} />
                      </View>
                      <View style={styles.txBody}>
                        <Text style={styles.txDesc} numberOfLines={1}>{tx.desc}</Text>
                        <Text style={styles.txDate}>{tx.date}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.amount >= 0 ? colors.green : colors.red }]}>
                        {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
                      </Text>
                      <TouchableOpacity onPress={() => delTx(tx.id)} activeOpacity={0.7} style={styles.iconBtn}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar lançamento</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Economias ── */}
        {tab === 'economias' && (
          <View style={styles.gap16}>
            {objetivos.length > 0 && (
              <View style={[styles.card, styles.totalCard]}>
                <Text style={styles.summaryLabel}>Total economizado</Text>
                <Text style={[styles.balanceAmount, { color: colors.green }]}>{fmtMoney(totalEconomizado)}</Text>
                <Text style={styles.totalSub}>
                  {objetivos.length} objetivo{objetivos.length !== 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {objetivos.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={styles.emptyTitle}>Nenhum objetivo ainda</Text>
                <Text style={styles.emptyText}>Crie metas para guardar dinheiro</Text>
              </View>
            ) : (
              <View style={styles.gap10}>
                {objetivos.map(obj => {
                  const isOpen = openGoal === obj.id;
                  const pct = obj.target ? Math.min(100, ((obj.current || 0) / obj.target) * 100) : 0;
                  const falta = Math.max(0, obj.target - (obj.current || 0));
                  return (
                    <View key={obj.id} style={[styles.card, styles.cardFlush]}>
                      {/* Goal header — tappable to toggle accordion */}
                      <TouchableOpacity
                        onPress={() => setOpenGoal(isOpen ? null : obj.id)}
                        activeOpacity={0.8}
                        style={styles.goalHeader}
                      >
                        <View style={styles.goalHeaderRow}>
                          <View style={[styles.goalEmojiBg, { backgroundColor: obj.color + '22' }]}>
                            <Text style={styles.goalEmoji}>{obj.emoji}</Text>
                          </View>
                          <View style={styles.goalInfo}>
                            <Text style={styles.goalName} numberOfLines={1}>{obj.name}</Text>
                            <Text style={styles.goalSub}>
                              {fmtMoney(obj.current || 0)} de {fmtMoney(obj.target)}
                              {pct >= 100 ? ' · ✅ Concluído!' : ` · faltam ${fmtMoney(falta)}`}
                            </Text>
                          </View>
                          <Text style={[styles.goalPct, { color: obj.color }]}>{Math.round(pct)}%</Text>
                        </View>
                        <ProgressBar value={pct} color={obj.color} height={5} />
                      </TouchableOpacity>

                      {/* Expanded deposit section */}
                      {isOpen && (
                        <View style={[styles.goalExpanded, styles.topBorder]}>
                          <TouchableOpacity
                            style={[styles.depositBtn, { borderColor: obj.color, backgroundColor: obj.color + '15' }]}
                            onPress={() => { setGoalDepModal(obj.id); setGoalDepForm({ valor: '', data: today, nota: '' }); }}
                            activeOpacity={0.7}
                          >
                            <Icon name="plus" size={14} color={obj.color} />
                            <Text style={[styles.depositBtnText, { color: obj.color }]}>Registrar depósito</Text>
                          </TouchableOpacity>

                          {(obj.deposits || []).length > 0 && (
                            <View style={styles.depositList}>
                              {(obj.deposits || []).slice(0, 5).map(dep => (
                                <View key={dep.id} style={[styles.depRow, styles.bottomBorder]}>
                                  <View style={styles.flex}>
                                    <Text style={styles.depNota}>{dep.nota || 'Depósito'}</Text>
                                    <Text style={styles.depData}>{dep.data}</Text>
                                  </View>
                                  <Text style={styles.depValor}>+{fmtMoney(dep.valor)}</Text>
                                  <TouchableOpacity
                                    onPress={() => delGoalDeposit(obj.id, dep.id, dep.valor)}
                                    activeOpacity={0.7}
                                    style={styles.iconBtnSm}
                                  >
                                    <Icon name="trash" size={12} color={colors.text3} />
                                  </TouchableOpacity>
                                </View>
                              ))}
                            </View>
                          )}

                          <TouchableOpacity
                            onPress={() => delObjetivo(obj.id)}
                            activeOpacity={0.7}
                            style={styles.delGoalBtn}
                          >
                            <Icon name="trash" size={12} color={colors.red} />
                            <Text style={styles.delGoalText}>Remover objetivo</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowGoalModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Novo objetivo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Planejados ── */}
        {tab === 'planejados' && (
          <View style={styles.gap16}>
            {planejados.length > 0 && (
              <View style={[styles.card, styles.totalCard]}>
                <Text style={styles.summaryLabel}>Total pendente</Text>
                <Text style={[styles.summaryAmount, { color: colors.red }]}>{fmtMoney(pendingTotal)}</Text>
              </View>
            )}

            {planejados.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>Nenhum gasto planejado</Text>
              </View>
            ) : (
              <View style={styles.gap8}>
                {[...planejados]
                  .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
                  .map(item => (
                    <View key={item.id} style={[styles.card, item.paid && styles.dimmed]}>
                      <View style={styles.planRow}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          onPress={() => togglePaid(item.id)}
                          activeOpacity={0.7}
                          style={[
                            styles.checkbox,
                            {
                              borderColor: item.paid ? colors.green : colors.line,
                              backgroundColor: item.paid ? colors.green : 'transparent',
                            },
                          ]}
                        >
                          {item.paid && <Icon name="check" size={12} color="white" />}
                        </TouchableOpacity>

                        <View style={styles.planBody}>
                          <Text
                            style={[styles.planDesc, item.paid && styles.strikethrough]}
                            numberOfLines={1}
                          >
                            {item.desc}
                          </Text>
                          <Text style={styles.planMeta}>
                            {item.dueDate ? `Vence: ${item.dueDate}` : ''}
                            {item.dueDate && item.category ? ' · ' : ''}
                            {item.category
                              ? cats.find(c => c.id === item.category)?.name || item.category
                              : ''}
                          </Text>
                        </View>

                        <Text style={[styles.planAmount, { color: item.paid ? colors.text3 : colors.red }]}>
                          {fmtMoney(item.amount)}
                        </Text>

                        <TouchableOpacity onPress={() => delPlanned(item.id)} activeOpacity={0.7} style={styles.iconBtn}>
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowPlanModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar gasto planejado</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Modal: novo lançamento ── */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo lançamento"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addTransaction} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        {/* Expense / Income toggle */}
        <View style={styles.typeRow}>
          {(['expense', 'income'] as const).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, form.type === type && styles.typeBtnActive]}
              onPress={() => setForm(f => ({ ...f, type }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.typeBtnText, form.type === type && styles.typeBtnTextActive]}>
                {type === 'expense' ? '↓ Gasto' : '↑ Receita'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Descrição"
          placeholderTextColor={colors.text3}
          value={form.desc}
          onChangeText={v => setForm(f => ({ ...f, desc: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          placeholderTextColor={colors.text3}
          value={form.amount}
          onChangeText={v => setForm(f => ({ ...f, amount: v }))}
          keyboardType="numeric"
        />

        {/* Category picker */}
        <Text style={styles.fieldLabel}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {cats.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, form.category === c.id && styles.chipActive]}
                onPress={() => setForm(f => ({ ...f, category: c.id }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, form.category === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Data (AAAA-MM-DD)"
          placeholderTextColor={colors.text3}
          value={form.date}
          onChangeText={v => setForm(f => ({ ...f, date: v }))}
          keyboardType="numeric"
        />
      </Modal>

      {/* ── Modal: novo objetivo ── */}
      <Modal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Novo objetivo de poupança"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addObjetivo} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Criar objetivo</Text>
          </TouchableOpacity>
        }
      >
        <View style={styles.goalNameRow}>
          <TextInput
            style={[styles.input, styles.emojiInput]}
            placeholder="💰"
            placeholderTextColor={colors.text3}
            value={goalForm.emoji}
            onChangeText={v => setGoalForm(f => ({ ...f, emoji: v }))}
          />
          <TextInput
            style={[styles.input, styles.flex]}
            placeholder="Ex: Viagem para Europa"
            placeholderTextColor={colors.text3}
            value={goalForm.name}
            onChangeText={v => setGoalForm(f => ({ ...f, name: v }))}
            autoFocus
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Valor da meta (R$)"
          placeholderTextColor={colors.text3}
          value={goalForm.target}
          onChangeText={v => setGoalForm(f => ({ ...f, target: v }))}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Cor</Text>
        <View style={styles.colorRow}>
          {GOAL_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              onPress={() => setGoalForm(f => ({ ...f, color }))}
              activeOpacity={0.7}
              style={[
                styles.colorDot,
                { backgroundColor: color, borderColor: goalForm.color === color ? colors.text : 'transparent' },
              ]}
            />
          ))}
        </View>

        {!!goalForm.name && (
          <View style={[styles.goalPreview, { backgroundColor: goalForm.color + '15' }]}>
            <Text style={styles.goalPreviewEmoji}>{goalForm.emoji}</Text>
            <View>
              <Text style={styles.goalPreviewName}>{goalForm.name}</Text>
              <Text style={styles.goalPreviewTarget}>
                Meta: {goalForm.target ? fmtMoney(parseFloat(goalForm.target)) : '—'}
              </Text>
            </View>
          </View>
        )}
      </Modal>

      {/* ── Modal: depósito em objetivo ── */}
      <Modal
        open={!!goalDepModal}
        onClose={() => setGoalDepModal(null)}
        title={activeGoal ? `Depositar em "${activeGoal.name}"` : 'Depositar'}
        footer={
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => goalDepModal && addGoalDeposit(goalDepModal)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Registrar depósito</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          placeholderTextColor={colors.text3}
          value={goalDepForm.valor}
          onChangeText={v => setGoalDepForm(f => ({ ...f, valor: v }))}
          keyboardType="numeric"
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Data (AAAA-MM-DD)"
          placeholderTextColor={colors.text3}
          value={goalDepForm.data}
          onChangeText={v => setGoalDepForm(f => ({ ...f, data: v }))}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Nota (opcional)"
          placeholderTextColor={colors.text3}
          value={goalDepForm.nota}
          onChangeText={v => setGoalDepForm(f => ({ ...f, nota: v }))}
        />
      </Modal>

      {/* ── Modal: gasto planejado ── */}
      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Gasto planejado"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addPlanned} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Descrição (ex: Aluguel)"
          placeholderTextColor={colors.text3}
          value={planForm.desc}
          onChangeText={v => setPlanForm(f => ({ ...f, desc: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          placeholderTextColor={colors.text3}
          value={planForm.amount}
          onChangeText={v => setPlanForm(f => ({ ...f, amount: v }))}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Vencimento (AAAA-MM-DD)"
          placeholderTextColor={colors.text3}
          value={planForm.dueDate}
          onChangeText={v => setPlanForm(f => ({ ...f, dueDate: v }))}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {cats.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, planForm.category === c.id && styles.chipActive]}
                onPress={() => setPlanForm(f => ({ ...f, category: c.id }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, planForm.category === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },

  // Tab bar
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  tabTextActive: { color: colors.accentDk },

  // Screen content
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap16: { gap: 16 },
  gap10: { gap: 10 },
  gap8: { gap: 8 },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
  },
  cardFlush: { padding: 0, overflow: 'hidden' },
  topBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  bottomBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  dimmed: { opacity: 0.6 },

  // Summary / balance
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryLabel: {
    fontFamily: fonts.sans, fontSize: 11, fontWeight: '600',
    color: colors.text3, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6,
  },
  summaryAmount: { fontFamily: fonts.serif, fontSize: 20 },
  balanceCard: { alignItems: 'center' },
  balanceAmount: { fontFamily: fonts.serif, fontSize: 28 },
  totalCard: { alignItems: 'center' },
  totalSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 4 },

  // Section label
  sectionLabel: {
    fontFamily: fonts.sans, fontSize: 11, fontWeight: '600',
    color: colors.text3, letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Category rows
  catRow: { padding: 14 },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  catName: { flex: 1, fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text },
  catAmount: { fontFamily: fonts.sans, fontSize: 12, color: colors.text2 },

  // Transaction rows
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  txIcon: {
    width: 36, height: 36, backgroundColor: colors.bg2, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  txBody: { flex: 1, minWidth: 0 },
  txDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.text },
  txDate: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3, marginTop: 2 },
  txAmount: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', flexShrink: 0 },

  // Empty states
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyTitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3, marginBottom: 4 },
  emptyText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  emptyInline: { alignItems: 'center', paddingVertical: 32 },

  // Add button
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderWidth: 1.5, borderColor: colors.line,
    borderRadius: radius.md, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },

  // Icon button
  iconBtn: { padding: 4 },
  iconBtnSm: { padding: 2 },

  // Goal accordion
  goalHeader: { padding: 14 },
  goalHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  goalEmojiBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  goalEmoji: { fontSize: 20 },
  goalInfo: { flex: 1, minWidth: 0 },
  goalName: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text },
  goalSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginTop: 2 },
  goalPct: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '600', flexShrink: 0 },
  goalExpanded: { padding: 12, paddingTop: 12 },
  depositBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1.5, marginBottom: 12,
  },
  depositBtnText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '600' },
  depositList: { marginBottom: 12 },
  depRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  depNota: { fontFamily: fonts.sans, fontSize: 12, color: colors.text2 },
  depData: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  depValor: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.green },
  delGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  delGoalText: { fontFamily: fonts.sans, fontSize: 12, color: colors.red },

  // Planned
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planBody: { flex: 1, minWidth: 0 },
  planDesc: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text },
  strikethrough: { textDecorationLine: 'line-through', color: colors.text3 },
  planMeta: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3, marginTop: 2 },
  planAmount: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', flexShrink: 0 },

  // Modals — inputs
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 16, paddingVertical: 13,
    fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  fieldLabel: {
    fontFamily: fonts.sans, fontSize: 12, fontWeight: '500',
    color: colors.text2, marginTop: 4, marginBottom: 6,
  },

  // Type toggle (Gasto / Receita)
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  typeBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  typeBtnText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  typeBtnTextActive: { color: colors.accentDk },

  // Category / chip row
  chipRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },

  // Goal modal
  goalNameRow: { flexDirection: 'row', gap: 10 },
  emojiInput: { width: 64 },
  colorRow: { flexDirection: 'row', gap: 8 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3 },
  goalPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.sm, padding: 14 },
  goalPreviewEmoji: { fontSize: 22 },
  goalPreviewName: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text },
  goalPreviewTarget: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },

  // Primary button
  btnPrimary: { backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
