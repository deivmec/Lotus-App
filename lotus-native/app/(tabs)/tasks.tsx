import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import Checkbox from '../../components/Checkbox';
import ProgressBar from '../../components/ProgressBar';
import { PriorityTag } from '../../components/Tag';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const today = new Date().toISOString().slice(0, 10);
const newId = () => Date.now().toString();

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Beber água', icon: '💧' },
  { id: 'h2', name: 'Exercitar', icon: '🏃' },
  { id: 'h3', name: 'Meditação', icon: '🧘' },
  { id: 'h4', name: 'Leitura', icon: '📚' },
];

const PRIORITIES = ['alta', 'media', 'baixa'] as const;

const getWeekDays = () => {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

type C = { bg: string; bg2: string; bg3: string; line: string; surface: string; text: string; text2: string; text3: string; accent: string; accentBg: string; accentDk: string; green: string; greenBg: string; blue: string; blueBg: string; red: string; redBg: string; };
const makeStyles = (c: C) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPad,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heading: { fontFamily: fonts.serif, fontSize: 28, color: c.text, lineHeight: 34 },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: c.text2, marginTop: 4 },
  addBtn: { marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPad,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.sm, backgroundColor: c.bg2 },
  tabBtnActive: { backgroundColor: c.text },
  tabText: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: c.text2 },
  tabTextActive: { color: c.bg },
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap16: { gap: 16 },
  progressWrap: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontFamily: fonts.sans, fontSize: 11, color: c.text3 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: c.text3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: c.line, marginHorizontal: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 8 },
  taskBody: { flex: 1 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 32 },
  taskDate: { fontFamily: fonts.sans, fontSize: 11, color: c.text3, marginTop: 1 },
  catTag: { backgroundColor: c.bg2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  catTagText: { fontFamily: fonts.sans, fontSize: 11, color: c.text3 },
  iconBtn: { padding: 4 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  weekDayLabels: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  weekDayLabel: { fontFamily: fonts.sans, fontSize: 10, color: c.text3, textAlign: 'center', flex: 1 },
  weekDayLabelToday: { color: c.accent, fontWeight: '600' },
  habitRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  habitEmoji: { fontSize: 18, flexShrink: 0 },
  habitBody: { flex: 1, minWidth: 0 },
  habitName: { fontFamily: fonts.sans, fontSize: 14, color: c.text, marginBottom: 8 },
  habitDots: { flexDirection: 'row', justifyContent: 'space-between' },
  habitDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: c.line,
    backgroundColor: c.bg2, alignItems: 'center', justifyContent: 'center',
  },
  habitDotDone: { backgroundColor: c.accent, borderColor: c.accent },
  habitDotToday: { borderColor: c.accent, borderStyle: 'dashed' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: c.text3 },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderWidth: 1.5, borderColor: c.line, borderRadius: radius.md, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: c.text2 },
  input: {
    backgroundColor: c.bg2, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm,
    paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.sans, fontSize: 15, color: c.text,
  },
  fieldLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: c.text2, marginTop: 4, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface },
  chipActive: { borderColor: c.accent, backgroundColor: c.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: c.text2 },
  chipTextActive: { color: c.accentDk },
  btnPrimary: { backgroundColor: c.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: c.bg },
});

export default function TasksTab() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [tab, setTab] = useState<'tarefas' | 'habitos'>('tarefas');

  const [tasks, saveTasks]           = useStorage<any[]>('tasks:items', []);
  const [habits, saveHabits]         = useStorage<any[]>('habits:items', DEFAULT_HABITS);
  const [habitLogs, saveHabitLogs]   = useStorage<Record<string, boolean>>('habits:logs', {});
  const toast = useToast();

  const [showTaskModal, setShowTaskModal]   = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newTask, setNewTask]   = useState({ text: '', date: today, priority: 'media', category: '' });
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐' });

  const weekDays = getWeekDays();

  const toggleTask = (id: string) =>
    saveTasks((ts: any[]) => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = () => {
    if (!newTask.text.trim()) return;
    saveTasks((ts: any[]) => [{ id: newId(), ...newTask, done: false }, ...ts]);
    setNewTask({ text: '', date: today, priority: 'media', category: '' });
    setShowTaskModal(false);
    toast('Tarefa adicionada');
  };

  const deleteTask = (id: string) => {
    saveTasks((ts: any[]) => ts.filter(t => t.id !== id));
    toast('Tarefa removida');
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    saveHabits((hs: any[]) => [...hs, { id: newId(), ...newHabit }]);
    setNewHabit({ name: '', icon: '⭐' });
    setShowHabitModal(false);
    toast('Hábito adicionado');
  };

  const deleteHabit = (id: string) => {
    saveHabits((hs: any[]) => hs.filter(h => h.id !== id));
    toast('Hábito removido');
  };

  const toggleHabitLog = (habitId: string) => {
    const key = `${habitId}:${today}`;
    saveHabitLogs((logs: any) => ({ ...logs, [key]: !logs[key] }));
  };

  const pendingTasks = tasks.filter(t => !t.done);
  const doneTasks    = tasks.filter(t => t.done);
  const total = tasks.length;
  const done  = doneTasks.length;

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Tarefas & Hábitos</Text>
          <Text style={styles.sub}>{done} de {total} concluídas</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => tab === 'tarefas' ? setShowTaskModal(true) : setShowHabitModal(true)}
          activeOpacity={0.7}
        >
          <Icon name="plus" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['tarefas', 'habitos'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'tarefas' ? 'Tarefas' : 'Hábitos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Tarefas ── */}
        {tab === 'tarefas' && (
          <View style={styles.gap16}>
            {total > 0 && (
              <View style={styles.progressWrap}>
                <ProgressBar value={total ? (done / total) * 100 : 0} />
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>{done} feitas</Text>
                  <Text style={styles.progressText}>{total - done} restantes</Text>
                </View>
              </View>
            )}

            {pendingTasks.length > 0 && (
              <View>
                <Text style={styles.sectionLabel}>Pendentes</Text>
                <View style={styles.card}>
                  {pendingTasks.map((task, i) => (
                    <View key={task.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.taskRow}>
                        <View style={styles.taskBody}>
                          <Checkbox checked={task.done} onToggle={() => toggleTask(task.id)}>
                            {task.text}
                          </Checkbox>
                          <View style={styles.taskMeta}>
                            <PriorityTag level={task.priority} />
                            {!!task.date && <Text style={styles.taskDate}>{task.date}</Text>}
                            {!!task.category && (
                              <View style={styles.catTag}>
                                <Text style={styles.catTagText}>{task.category}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity onPress={() => deleteTask(task.id)} activeOpacity={0.7} style={styles.iconBtn}>
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {doneTasks.length > 0 && (
              <View style={{ opacity: 0.7 }}>
                <Text style={styles.sectionLabel}>Concluídas</Text>
                <View style={styles.card}>
                  {doneTasks.map((task, i) => (
                    <View key={task.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.taskRow}>
                        <View style={styles.taskBody}>
                          <Checkbox checked={task.done} onToggle={() => toggleTask(task.id)}>
                            {task.text}
                          </Checkbox>
                        </View>
                        <TouchableOpacity onPress={() => deleteTask(task.id)} activeOpacity={0.7} style={styles.iconBtn}>
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {tasks.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>✅</Text>
                <Text style={styles.emptyText}>Nenhuma tarefa ainda</Text>
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowTaskModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar tarefa</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Hábitos ── */}
        {tab === 'habitos' && (
          <View style={styles.gap16}>
            {/* Week day header */}
            <View style={styles.weekHeader}>
              <View style={{ width: 18 + 12 + 18 }} />
              <View style={styles.weekDayLabels}>
                {weekDays.map((d, i) => (
                  <Text key={i} style={[styles.weekDayLabel, d === today && styles.weekDayLabelToday]}>
                    {WEEK_DAYS[new Date(d + 'T12:00:00').getDay()]}
                  </Text>
                ))}
              </View>
            </View>

            {habits.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔥</Text>
                <Text style={styles.emptyText}>Nenhum hábito ainda</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {habits.map((habit, i) => (
                  <View key={habit.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.habitRow}>
                      <Text style={styles.habitEmoji}>{habit.icon}</Text>
                      <View style={styles.habitBody}>
                        <Text style={styles.habitName} numberOfLines={1}>{habit.name}</Text>
                        <View style={styles.habitDots}>
                          {weekDays.map((d, di) => {
                            const key = `${habit.id}:${d}`;
                            const checked = habitLogs[key];
                            const isToday = d === today;
                            return (
                              <TouchableOpacity
                                key={di}
                                style={[
                                  styles.habitDot,
                                  checked && styles.habitDotDone,
                                  isToday && !checked && styles.habitDotToday,
                                ]}
                                onPress={isToday ? () => toggleHabitLog(habit.id) : undefined}
                                activeOpacity={0.75}
                              >
                                {checked && <Icon name="check" size={10} color={colors.bg} />}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => deleteHabit(habit.id)} activeOpacity={0.7} style={styles.iconBtn}>
                        <Icon name="trash" size={14} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowHabitModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Adicionar hábito</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal: Nova tarefa */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nova tarefa"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addTask} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="O que precisa ser feito?"
          placeholderTextColor={colors.text3}
          value={newTask.text}
          onChangeText={v => setNewTask(t => ({ ...t, text: v }))}
          autoFocus
        />
        <Text style={styles.fieldLabel}>Data (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder={today}
          placeholderTextColor={colors.text3}
          value={newTask.date}
          onChangeText={v => setNewTask(t => ({ ...t, date: v }))}
          keyboardType="numeric"
        />
        <Text style={styles.fieldLabel}>Prioridade</Text>
        <View style={styles.chipWrap}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, newTask.priority === p && styles.chipActive]}
              onPress={() => setNewTask(t => ({ ...t, priority: p }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, newTask.priority === p && styles.chipTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Categoria (opcional)"
          placeholderTextColor={colors.text3}
          value={newTask.category}
          onChangeText={v => setNewTask(t => ({ ...t, category: v }))}
        />
      </Modal>

      {/* Modal: Novo hábito */}
      <Modal open={showHabitModal} onClose={() => setShowHabitModal(false)} title="Novo hábito"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addHabit} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Nome do hábito"
          placeholderTextColor={colors.text3}
          value={newHabit.name}
          onChangeText={v => setNewHabit(h => ({ ...h, name: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Emoji (ex: 🏃)"
          placeholderTextColor={colors.text3}
          value={newHabit.icon}
          onChangeText={v => setNewHabit(h => ({ ...h, icon: v }))}
        />
      </Modal>
    </View>
  );
}
