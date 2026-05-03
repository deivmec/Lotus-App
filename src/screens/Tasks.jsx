import { useState } from 'react';
import Checkbox from '../components/Checkbox';
import TabSwitcher from '../components/TabSwitcher';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { PriorityTag } from '../components/Tag';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../components/Toast';

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const today = new Date().toISOString().slice(0, 10);

const TABS = [
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'habitos', label: 'Hábitos' },
];

const newId = () => Date.now().toString();

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Beber água', icon: '💧' },
  { id: 'h2', name: 'Exercitar', icon: '🏃' },
  { id: 'h3', name: 'Meditação', icon: '🧘' },
  { id: 'h4', name: 'Leitura', icon: '📚' },
];

const Tasks = () => {
  const [tab, setTab] = useState('tarefas');
  const [tasks, saveTasks] = useStorage('tasks:items', []);
  const [habits, saveHabits] = useStorage('habits:items', DEFAULT_HABITS);
  const [habitLogs, saveHabitLogs] = useStorage('habits:logs', {});
  const toast = useToast();

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: '', date: today, priority: 'media', category: '' });
  const [newHabit, setNewHabit] = useState({ name: '', icon: '⭐' });

  const toggleTask = (id) => saveTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const addTask = () => {
    if (!newTask.text.trim()) return;
    saveTasks(ts => [{ id: newId(), ...newTask, done: false }, ...ts]);
    setNewTask({ text: '', date: today, priority: 'media', category: '' });
    setShowTaskModal(false);
    toast('Tarefa adicionada');
  };
  const deleteTask = (id) => { saveTasks(ts => ts.filter(t => t.id !== id)); toast('Tarefa removida'); };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;
    saveHabits(hs => [...hs, { id: newId(), ...newHabit }]);
    setNewHabit({ name: '', icon: '⭐' });
    setShowHabitModal(false);
    toast('Hábito adicionado');
  };
  const deleteHabit = (id) => { saveHabits(hs => hs.filter(h => h.id !== id)); toast('Hábito removido'); };

  const toggleHabitLog = (habitId) => {
    const key = `${habitId}:${today}`;
    saveHabitLogs(logs => ({ ...logs, [key]: !logs[key] }));
  };

  const pendingTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);
  const total = tasks.length;
  const done = doneTasks.length;

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
  const weekDays = getWeekDays();

  return (
    <div className="screen" style={{ padding: '24px 24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--text)', lineHeight: 1.2 }}>Tarefas & Hábitos</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{done} de {total} concluídas</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <TabSwitcher tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'tarefas' && (
        <div>
          {total > 0 && (
            <div style={{ marginBottom: 24 }}>
              <ProgressBar value={total ? (done / total) * 100 : 0} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{done} feitas</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{total - done} restantes</span>
              </div>
            </div>
          )}

          {pendingTasks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-label">Pendentes</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {pendingTasks.map((task, i) => (
                  <div key={task.id}>
                    {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Checkbox checked={task.done} onToggle={() => toggleTask(task.id)}>{task.text}</Checkbox>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 32, flexWrap: 'wrap' }}>
                          <PriorityTag level={task.priority} />
                          {task.date && <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{task.date}</span>}
                          {task.category && <span className="tag" style={{ background: 'var(--bg2)', color: 'var(--text3)' }}>{task.category}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, flexShrink: 0 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doneTasks.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="section-label">Concluídas</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.7 }}>
                {doneTasks.map((task, i) => (
                  <div key={task.id}>
                    {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
                    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <Checkbox checked={task.done} onToggle={() => toggleTask(task.id)}>{task.text}</Checkbox>
                      </div>
                      <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 14 }}>Nenhuma tarefa ainda</div>
            </div>
          )}

          <button className="btn-add" onClick={() => setShowTaskModal(true)}>
            <Icon name="plus" size={16} />
            Adicionar tarefa
          </button>
        </div>
      )}

      {tab === 'habitos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, flex: 1, textAlign: 'center' }}>
              {weekDays.map((d, i) => (
                <div key={i} style={{ fontSize: 10, color: d === today ? 'var(--accent)' : 'var(--text3)', fontWeight: d === today ? 600 : 400 }}>
                  {WEEK_DAYS[new Date(d + 'T12:00:00').getDay()]}
                </div>
              ))}
            </div>
          </div>

          {habits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔥</div>
              <div style={{ fontSize: 14 }}>Nenhum hábito ainda</div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              {habits.map((habit, i) => (
                <div key={habit.id}>
                  {i > 0 && <div className="divider" style={{ margin: '0 16px' }} />}
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{habit.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {weekDays.map((d, di) => {
                          const key = `${habit.id}:${d}`;
                          const done = habitLogs[key];
                          const isToday = d === today;
                          return (
                            <div
                              key={di}
                              onClick={isToday ? () => toggleHabitLog(habit.id) : undefined}
                              className={`habit-dot${done ? ' filled' : ''}${isToday && !done ? ' today' : ''}`}
                              style={{ cursor: isToday ? 'pointer' : 'default', margin: '0 auto' }}
                            >
                              {done && <Icon name="check" size={10} />}
                              {!done && isToday && <span style={{ fontSize: 9 }}>•</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, flexShrink: 0 }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="btn-add" onClick={() => setShowHabitModal(true)}>
            <Icon name="plus" size={16} />
            Adicionar hábito
          </button>
        </div>
      )}

      {/* Modal: Nova tarefa */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title="Nova tarefa"
        footer={<button className="btn-primary" onClick={addTask}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="O que precisa ser feito?" value={newTask.text} onChange={e => setNewTask(t => ({ ...t, text: e.target.value }))} autoFocus />
          <input className="input" type="date" value={newTask.date} onChange={e => setNewTask(t => ({ ...t, date: e.target.value }))} />
          <select className="input" value={newTask.priority} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}>
            <option value="alta">Alta prioridade</option>
            <option value="media">Média prioridade</option>
            <option value="baixa">Baixa prioridade</option>
          </select>
          <input className="input" placeholder="Categoria (opcional)" value={newTask.category} onChange={e => setNewTask(t => ({ ...t, category: e.target.value }))} />
        </div>
      </Modal>

      {/* Modal: Novo hábito */}
      <Modal open={showHabitModal} onClose={() => setShowHabitModal(false)} title="Novo hábito"
        footer={<button className="btn-primary" onClick={addHabit}>Adicionar</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Nome do hábito" value={newHabit.name} onChange={e => setNewHabit(h => ({ ...h, name: e.target.value }))} autoFocus />
          <input className="input" placeholder="Emoji (ex: 🏃‍♂️)" value={newHabit.icon} onChange={e => setNewHabit(h => ({ ...h, icon: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
