import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ─── Helpers ────────────────────────────────────────────────────────────────
const newId = () => Date.now().toString() + Math.random().toString(36).slice(2, 7);

// ─── Post-it palette (light mode only) ──────────────────────────────────────
const POSTIT = [
  { id: 'yellow', bg: '#FEF9C3', border: '#FCD34D' },
  { id: 'green',  bg: '#DCFCE7', border: '#6EE7B7' },
  { id: 'blue',   bg: '#DBEAFE', border: '#93C5FD' },
  { id: 'pink',   bg: '#FCE7F3', border: '#F9A8D4' },
  { id: 'purple', bg: '#EDE9FE', border: '#C4B5FD' },
  { id: 'peach',  bg: '#FFEDD5', border: '#FDBA74' },
  { id: 'mint',   bg: '#CCFBF1', border: '#5EEAD4' },
];
const getPostit = (id: string) => POSTIT.find(p => p.id === id) ?? POSTIT[0];

const DEFAULT_COLOR = 'yellow';

// ─── Cardápio constants ──────────────────────────────────────────────────────
const DIAS = [
  { id: 'seg', label: 'Segunda-feira', short: 'Seg' },
  { id: 'ter', label: 'Terça-feira',   short: 'Ter' },
  { id: 'qua', label: 'Quarta-feira',  short: 'Qua' },
  { id: 'qui', label: 'Quinta-feira',  short: 'Qui' },
  { id: 'sex', label: 'Sexta-feira',   short: 'Sex' },
  { id: 'sab', label: 'Sábado',        short: 'Sáb' },
  { id: 'dom', label: 'Domingo',       short: 'Dom' },
];

const REFEICOES_PLAN = [
  { id: 'cafe',   label: 'Café da manhã', emoji: '☕',  colorId: 'yellow' },
  { id: 'almoco', label: 'Almoço',        emoji: '🥗',  colorId: 'green'  },
  { id: 'lanche', label: 'Lanche',        emoji: '🍎',  colorId: 'peach'  },
  { id: 'jantar', label: 'Jantar',        emoji: '🍽️', colorId: 'blue'   },
];

const TODAY_ID = (['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const)[new Date().getDay()];

type SlotValue = string | { texto: string; calorias: string } | '';
type DayPlan = { cafe: SlotValue; almoco: SlotValue; lanche: SlotValue; jantar: SlotValue };
type Plan = Record<string, DayPlan>;
const EMPTY_DAY: DayPlan = { cafe: '', almoco: '', lanche: '', jantar: '' };
const DEFAULT_PLAN: Plan = Object.fromEntries(DIAS.map(d => [d.id, { ...EMPTY_DAY }]));

const getSlotText = (slot: SlotValue): string =>
  typeof slot === 'object' ? slot?.texto || '' : slot || '';
const getSlotCal = (slot: SlotValue): string =>
  typeof slot === 'object' ? slot?.calorias || '' : '';

// ─── Alimentação constants ───────────────────────────────────────────────────
const REFEICOES_LOG = [
  'café da manhã',
  'lanche da manhã',
  'almoço',
  'lanche da tarde',
  'jantar',
  'ceia',
];

// ─── Recipe types ────────────────────────────────────────────────────────────
interface Ingrediente {
  id: string;
  nome: string;
  done: boolean;
}

interface Recipe {
  id: string;
  nome: string;
  cat: string;
  color: string;
  tempo: string;
  porcoes: string;
  calorias: string;
  ingredientes: Ingrediente[];
  preparo: string;
  tags: string[];
}

interface AlimItem {
  id: string;
  date: string;
  refeicao: string;
  alimento: string;
  porcao: string;
  calorias: string;
}

const CATS = ['todas', 'fit', 'salgado', 'doce', 'rápida'];

const RECIPE_CATS = ['fit', 'salgado', 'doce', 'rápida'];

const EMPTY_FORM = {
  nome: '',
  cat: 'salgado',
  color: DEFAULT_COLOR,
  tempo: '',
  porcoes: '',
  calorias: '',
  ingredientes: '',
  preparo: '',
  tags: '',
};

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function Receitas() {
  const [tab, setTab] = useState<'receitas' | 'cardapio' | 'alimentacao'>('receitas');

  // ── Receitas state ──────────────────────────────────────────────────────────
  const [recipes, saveRecipes] = useStorage<Recipe[]>('receitas:items', []);
  const [catFilter, setCatFilter] = useState('todas');
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Cardápio state ──────────────────────────────────────────────────────────
  const [plano, savePlano] = useStorage<Plan>('cronograma:refeicoes', DEFAULT_PLAN);
  const [editModal, setEditModal] = useState<{
    dia: string; ref: string; label: string; emoji: string; colorId: string;
  } | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editCal, setEditCal] = useState('');
  const [openDay, setOpenDay] = useState<string | null>(TODAY_ID);

  // ── Alimentação state ───────────────────────────────────────────────────────
  const [alimentacao, saveAlimentacao] = useStorage<AlimItem[]>('alimentacao:items', []);
  const [showAlimModal, setShowAlimModal] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [alimForm, setAlimForm] = useState({
    date: todayStr,
    refeicao: 'café da manhã',
    alimento: '',
    porcao: '',
    calorias: '',
  });

  const toast = useToast();

  // ── Receitas handlers ────────────────────────────────────────────────────────
  const filtered = recipes.filter(r =>
    catFilter === 'todas' || r.cat === catFilter || (r.tags || []).includes(catFilter)
  );
  const col1 = filtered.filter((_, i) => i % 2 === 0);
  const col2 = filtered.filter((_, i) => i % 2 !== 0);

  const openRecipeEdit = (recipe: Recipe) => {
    setForm({
      nome: recipe.nome,
      cat: recipe.cat,
      color: recipe.color || DEFAULT_COLOR,
      tempo: recipe.tempo || '',
      porcoes: recipe.porcoes || '',
      calorias: recipe.calorias || '',
      ingredientes: (recipe.ingredientes || []).map(i => i.nome).join('\n'),
      preparo: recipe.preparo || '',
      tags: (recipe.tags || []).join(', '),
    });
    setEditingId(recipe.id);
    setShowRecipeModal(true);
  };

  const resetRecipeModal = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowRecipeModal(false);
  };

  const addRecipe = () => {
    if (!form.nome.trim()) return;
    const ingredientes: Ingrediente[] = form.ingredientes
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(nome => ({ id: newId(), nome, done: false }));
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingId) {
      saveRecipes(rs =>
        rs.map(r => r.id === editingId ? { ...r, ...form, ingredientes, tags } : r)
      );
      toast('Receita atualizada');
    } else {
      saveRecipes(rs => [...rs, { id: newId(), ...form, ingredientes, tags }]);
      toast('Receita adicionada');
    }
    resetRecipeModal();
  };

  const confirmDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Remover receita',
      `Deseja remover "${recipe.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            saveRecipes(rs => rs.filter(r => r.id !== recipe.id));
            setOpenRecipeId(null);
            toast('Removida');
          },
        },
      ]
    );
  };

  const toggleIngrediente = (recipeId: string, ingId: string) => {
    saveRecipes(rs =>
      rs.map(r =>
        r.id === recipeId
          ? {
              ...r,
              ingredientes: r.ingredientes.map(i =>
                i.id === ingId ? { ...i, done: !i.done } : i
              ),
            }
          : r
      )
    );
  };

  // ── Cardápio handlers ────────────────────────────────────────────────────────
  const filledCount = (diaId: string) => {
    const d = plano[diaId] || EMPTY_DAY;
    return REFEICOES_PLAN.filter(r => getSlotText(d[r.id as keyof DayPlan])).length;
  };

  const openEdit = (dia: string, ref: string) => {
    const refeicao = REFEICOES_PLAN.find(r => r.id === ref)!;
    const slot = plano[dia]?.[ref as keyof DayPlan];
    setEditVal(getSlotText(slot));
    setEditCal(getSlotCal(slot));
    setEditModal({ dia, ref, label: refeicao.label, emoji: refeicao.emoji, colorId: refeicao.colorId });
  };

  const saveEdit = () => {
    if (!editModal) return;
    const val: SlotValue = editVal.trim()
      ? { texto: editVal.trim(), calorias: editCal.trim() }
      : '';
    savePlano(p => ({
      ...p,
      [editModal.dia]: { ...(p[editModal.dia] || EMPTY_DAY), [editModal.ref]: val },
    }));
    setEditModal(null);
    toast('Salvo');
  };

  const clearMeal = () => {
    if (!editModal) return;
    savePlano(p => ({
      ...p,
      [editModal.dia]: { ...(p[editModal.dia] || EMPTY_DAY), [editModal.ref]: '' },
    }));
    setEditVal('');
    setEditCal('');
    setEditModal(null);
    toast('Limpo');
  };

  const clearDay = (diaId: string) => {
    savePlano(p => ({ ...p, [diaId]: { ...EMPTY_DAY } }));
    toast('Dia limpo');
  };

  const copyDay = (fromId: string, toId: string) => {
    savePlano(p => ({ ...p, [toId]: { ...(plano[fromId] || EMPTY_DAY) } }));
    toast('Dia copiado');
  };

  // ── Alimentação handlers ─────────────────────────────────────────────────────
  const addAlimento = () => {
    if (!alimForm.alimento.trim()) return;
    saveAlimentacao(items => [...items, { id: newId(), ...alimForm }]);
    setAlimForm(f => ({ ...f, alimento: '', porcao: '', calorias: '' }));
    setShowAlimModal(false);
    toast('Adicionado');
  };

  const confirmDeleteAlimento = (itemId: string) => {
    Alert.alert('Remover', 'Remover este item?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          saveAlimentacao(a => a.filter(x => x.id !== itemId));
          toast('Removido');
        },
      },
    ]);
  };

  // ─── Recipe card ────────────────────────────────────────────────────────────
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    const ps = getPostit(recipe.color || DEFAULT_COLOR);
    const isOpen = openRecipeId === recipe.id;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpenRecipeId(isOpen ? null : recipe.id)}
        style={[
          styles.recipeCard,
          { backgroundColor: ps.bg, borderColor: ps.border },
        ]}
      >
        {/* Top stripe */}
        <View style={[styles.recipeStripe, { backgroundColor: ps.border }]} />

        <View style={{ paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12 }}>
          <Text style={styles.recipeName}>{recipe.nome}</Text>

          {(recipe.tempo || recipe.porcoes || recipe.calorias) ? (
            <View style={styles.recipeMeta}>
              {recipe.tempo ? (
                <Text style={styles.recipeMetaText}>⏱ {recipe.tempo}</Text>
              ) : null}
              {recipe.porcoes ? (
                <Text style={styles.recipeMetaText}>🍽 {recipe.porcoes}p</Text>
              ) : null}
              {recipe.calorias ? (
                <Text style={[styles.recipeMetaText, { color: colors.accent, fontFamily: fonts.sansMedium }]}>
                  🔥 {recipe.calorias} kcal
                </Text>
              ) : null}
            </View>
          ) : null}

          {recipe.cat ? (
            <View style={styles.catTag}>
              <Text style={styles.catTagText}>{recipe.cat.toUpperCase()}</Text>
            </View>
          ) : null}

          {/* Collapsed: ingredient preview */}
          {!isOpen && (recipe.ingredientes?.length ?? 0) > 0 && (
            <Text style={styles.ingredientPreview} numberOfLines={2}>
              {recipe.ingredientes.slice(0, 3).map(i => i.nome).join(', ')}
              {recipe.ingredientes.length > 3 ? ` +${recipe.ingredientes.length - 3}` : ''}
            </Text>
          )}

          {/* Expanded content */}
          {isOpen && (
            <View>
              <View style={styles.divider} />

              {(recipe.ingredientes?.length ?? 0) > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Ingredientes</Text>
                  {recipe.ingredientes.map(ing => (
                    <TouchableOpacity
                      key={ing.id}
                      onPress={() => toggleIngrediente(recipe.id, ing.id)}
                      style={styles.ingRow}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.ingCheck,
                        {
                          borderColor: ing.done ? ps.border : 'rgba(0,0,0,0.22)',
                          backgroundColor: ing.done ? ps.border : 'transparent',
                        },
                      ]}>
                        {ing.done && (
                          <Icon name="check" size={10} color="#fff" />
                        )}
                      </View>
                      <Text style={[
                        styles.ingName,
                        ing.done && styles.ingNameDone,
                      ]}>
                        {ing.nome}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {recipe.preparo ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Modo de preparo</Text>
                  <Text style={styles.preparoText}>{recipe.preparo}</Text>
                </>
              ) : null}

              <View style={styles.recipeActions}>
                <TouchableOpacity
                  onPress={() => openRecipeEdit(recipe)}
                  style={styles.recipeActionBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="edit" size={13} color={colors.accent} />
                  <Text style={[styles.recipeActionText, { color: colors.accent }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => confirmDeleteRecipe(recipe)}
                  style={styles.recipeActionBtn}
                  activeOpacity={0.7}
                >
                  <Icon name="trash" size={13} color={colors.red} />
                  <Text style={[styles.recipeActionText, { color: colors.red }]}>Remover</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <BackHeader
        title="Receitas"
        action={
          tab === 'receitas' ? (
            <TouchableOpacity
              onPress={() => setShowRecipeModal(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={22} color={colors.accent} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Tab chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabChips}
          style={{ marginBottom: 20 }}
        >
          {(['receitas', 'cardapio', 'alimentacao'] as const).map(t => {
            const LABELS = { receitas: 'Receitas', cardapio: 'Cardápio', alimentacao: 'Alimentação' };
            const active = tab === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tabChip, active && styles.tabChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                  {LABELS[t]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ════════════════════════════════════════════════════════
            TAB 1 — Receitas
        ════════════════════════════════════════════════════════ */}
        {tab === 'receitas' && (
          <View>
            {/* Category filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
              style={{ marginBottom: 16 }}
            >
              {CATS.map(c => {
                const active = catFilter === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCatFilter(c)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyText}>Nenhuma receita ainda</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 10 }}>
                  {col1.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                  {col2.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setShowRecipeModal(true)}
              style={styles.addBtn}
              activeOpacity={0.8}
            >
              <Icon name="plus" size={16} color={colors.text} />
              <Text style={styles.addBtnText}>Adicionar receita</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 2 — Cardápio
        ════════════════════════════════════════════════════════ */}
        {tab === 'cardapio' && (
          <View>
            {/* Day selector chips */}
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
                      isOpen && { color: colors.accentDk },
                      isToday && !isOpen && { color: colors.accent },
                    ]}>
                      {dia.short}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {REFEICOES_PLAN.map(r => (
                        <View
                          key={r.id}
                          style={[
                            styles.dot,
                            {
                              backgroundColor: getSlotText(plano[dia.id]?.[r.id as keyof DayPlan])
                                ? colors.accent
                                : colors.line,
                            },
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

            {/* Expanded day view */}
            {openDay && (() => {
              const dia = DIAS.find(d => d.id === openDay)!;
              const diaPlano = plano[dia.id] || EMPTY_DAY;
              const isToday = dia.id === TODAY_ID;
              return (
                <View>
                  <View style={styles.dayHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.dayTitle}>{dia.label}</Text>
                      {isToday && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>HOJE</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => clearDay(dia.id)} activeOpacity={0.7}>
                      <Text style={styles.clearBtn}>Limpar</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: 6 }}>
                    {REFEICOES_PLAN.map(ref => {
                      const slot = diaPlano[ref.id as keyof DayPlan];
                      const texto = getSlotText(slot);
                      const cal = getSlotCal(slot);
                      const hasValue = !!texto;
                      const ps = getPostit(ref.colorId);
                      return (
                        <TouchableOpacity
                          key={ref.id}
                          onPress={() => openEdit(dia.id, ref.id)}
                          style={[
                            styles.mealCard,
                            { backgroundColor: hasValue ? ps.bg : colors.surface },
                            hasValue && { borderColor: ps.border },
                          ]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.mealEmoji}>{ref.emoji}</Text>
                          <View style={styles.mealInfo}>
                            <Text style={styles.mealLabel}>{ref.label.toUpperCase()}</Text>
                            {hasValue ? (
                              <View>
                                <Text style={styles.mealValue} numberOfLines={1}>{texto}</Text>
                                {cal ? (
                                  <Text style={styles.mealCal}>🔥 {cal} kcal</Text>
                                ) : null}
                              </View>
                            ) : (
                              <Text style={styles.mealEmpty}>Toque para adicionar…</Text>
                            )}
                          </View>
                          <Icon
                            name={hasValue ? 'edit' : 'plus'}
                            size={14}
                            color={colors.text3}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Copy day chips */}
                  {filledCount(dia.id) > 0 && (
                    <View style={styles.copySection}>
                      <Text style={styles.copyLabel}>Copiar este dia para:</Text>
                      <View style={styles.copyChips}>
                        {DIAS.filter(d => d.id !== dia.id).map(d => (
                          <TouchableOpacity
                            key={d.id}
                            onPress={() => copyDay(dia.id, d.id)}
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
              );
            })()}

            {/* Full week view (no day selected) */}
            {!openDay && DIAS.map(dia => {
              const count = filledCount(dia.id);
              if (count === 0) return null;
              const diaPlano = plano[dia.id] || EMPTY_DAY;
              return (
                <View key={dia.id} style={{ marginBottom: 20 }}>
                  <View style={styles.dayHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.dayTitle}>{dia.label}</Text>
                      {dia.id === TODAY_ID && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>HOJE</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ gap: 4 }}>
                    {REFEICOES_PLAN.filter(r =>
                      getSlotText(diaPlano[r.id as keyof DayPlan])
                    ).map(ref => {
                      const ps = getPostit(ref.colorId);
                      const texto = getSlotText(diaPlano[ref.id as keyof DayPlan]);
                      const cal = getSlotCal(diaPlano[ref.id as keyof DayPlan]);
                      return (
                        <View key={ref.id} style={[
                          styles.mealCard,
                          { backgroundColor: ps.bg, borderColor: ps.border },
                        ]}>
                          <Text style={styles.mealEmoji}>{ref.emoji}</Text>
                          <View style={styles.mealInfo}>
                            <Text style={styles.mealLabel}>{ref.label.toUpperCase()}</Text>
                            <Text style={styles.mealValue} numberOfLines={1}>{texto}</Text>
                            {cal ? (
                              <Text style={styles.mealCal}>🔥 {cal} kcal</Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {openDay && (
              <TouchableOpacity
                onPress={() => setOpenDay(null)}
                style={styles.weekBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.weekBtnText}>Ver semana completa</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB 3 — Alimentação
        ════════════════════════════════════════════════════════ */}
        {tab === 'alimentacao' && (() => {
          const todayItems = alimentacao.filter(i => i.date === todayStr);
          const totalCal = todayItems.reduce((s, i) => s + (parseFloat(i.calorias) || 0), 0);
          const grouped: Record<string, AlimItem[]> = {};
          alimentacao.forEach(item => {
            if (!grouped[item.date]) grouped[item.date] = [];
            grouped[item.date].push(item);
          });
          const histDates = Object.keys(grouped)
            .filter(d => d !== todayStr)
            .sort()
            .reverse()
            .slice(0, 7);

          return (
            <View>
              {/* Today */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>Hoje</Text>
                  {totalCal > 0 && (
                    <Text style={styles.calTotal}>🔥 {Math.round(totalCal)} kcal</Text>
                  )}
                </View>
                {todayItems.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum alimento registrado hoje</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {todayItems.map(item => (
                      <View key={item.id} style={styles.alimRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.alimName}>{item.alimento}</Text>
                          <Text style={styles.alimMeta}>
                            {item.refeicao}
                            {item.porcao ? ` · ${item.porcao}` : ''}
                            {item.calorias ? ` · 🔥 ${item.calorias} kcal` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => confirmDeleteAlimento(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* History */}
              {histDates.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={styles.sectionTitle}>Histórico</Text>
                  {histDates.map(date => {
                    const items = grouped[date];
                    const cal = items.reduce((s, i) => s + (parseFloat(i.calorias) || 0), 0);
                    return (
                      <View key={date} style={[styles.card, { marginBottom: 8 }]}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.histDate}>{date}</Text>
                          {cal > 0 && (
                            <Text style={styles.histCal}>🔥 {Math.round(cal)} kcal</Text>
                          )}
                        </View>
                        {items.map(item => (
                          <Text key={item.id} style={styles.histItem}>
                            {item.refeicao}: {item.alimento}
                            {item.porcao ? ` (${item.porcao})` : ''}
                            {item.calorias ? ` · ${item.calorias} kcal` : ''}
                          </Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowAlimModal(true)}
                style={styles.addBtn}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={16} color={colors.text} />
                <Text style={styles.addBtnText}>Registrar alimento</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </ScrollView>

      {/* ════════════════════════════════════════════════════════
          MODAL: Nova / editar receita
      ════════════════════════════════════════════════════════ */}
      <Modal
        open={showRecipeModal}
        onClose={resetRecipeModal}
        title={editingId ? 'Editar receita' : 'Nova receita'}
        footer={
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={addRecipe}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              {editingId ? 'Salvar alterações' : 'Adicionar receita'}
            </Text>
          </TouchableOpacity>
        }
      >
        {/* Nome */}
        <TextInput
          style={styles.input}
          placeholder="Nome da receita"
          placeholderTextColor={colors.text3}
          value={form.nome}
          onChangeText={v => setForm(f => ({ ...f, nome: v }))}
          autoFocus
        />

        {/* Post-it color picker */}
        <View>
          <Text style={styles.fieldLabel}>Cor do post-it</Text>
          <View style={styles.colorRow}>
            {POSTIT.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setForm(f => ({ ...f, color: p.id }))}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: p.bg, borderColor: form.color === p.id ? colors.accent : p.border },
                  form.color === p.id && styles.colorSwatchSelected,
                ]}
                activeOpacity={0.8}
              />
            ))}
          </View>
        </View>

        {/* Category chips */}
        <View>
          <Text style={styles.fieldLabel}>Categoria</Text>
          <View style={styles.catChips}>
            {RECIPE_CATS.map(c => {
              const active = form.cat === c;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm(f => ({ ...f, cat: c }))}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tempo */}
        <TextInput
          style={styles.input}
          placeholder="Tempo (ex: 30min)"
          placeholderTextColor={colors.text3}
          value={form.tempo}
          onChangeText={v => setForm(f => ({ ...f, tempo: v }))}
        />

        {/* Porções + Calorias row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Porções (ex: 4)"
            placeholderTextColor={colors.text3}
            value={form.porcoes}
            onChangeText={v => setForm(f => ({ ...f, porcoes: v }))}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Calorias/porção"
            placeholderTextColor={colors.text3}
            keyboardType="numeric"
            value={form.calorias}
            onChangeText={v => setForm(f => ({ ...f, calorias: v }))}
          />
        </View>

        {/* Ingredientes */}
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
          placeholder="Ingredientes (um por linha)"
          placeholderTextColor={colors.text3}
          value={form.ingredientes}
          onChangeText={v => setForm(f => ({ ...f, ingredientes: v }))}
          multiline
        />

        {/* Modo de preparo */}
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Modo de preparo"
          placeholderTextColor={colors.text3}
          value={form.preparo}
          onChangeText={v => setForm(f => ({ ...f, preparo: v }))}
          multiline
        />

        {/* Tags */}
        <TextInput
          style={styles.input}
          placeholder="Tags (ex: rápida, fit)"
          placeholderTextColor={colors.text3}
          value={form.tags}
          onChangeText={v => setForm(f => ({ ...f, tags: v }))}
        />
      </Modal>

      {/* ════════════════════════════════════════════════════════
          MODAL: Editar refeição do cardápio
      ════════════════════════════════════════════════════════ */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={editModal ? `${editModal.emoji} ${editModal.label}` : ''}
        footer={
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={clearMeal} activeOpacity={0.7}>
              <Text style={styles.btnSecondaryText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimary, { flex: 2 }]} onPress={saveEdit} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        }
      >
        <TextInput
          style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
          placeholder={`O que vai comer no ${editModal?.label?.toLowerCase() ?? ''}?`}
          placeholderTextColor={colors.text3}
          value={editVal}
          onChangeText={setEditVal}
          multiline
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Calorias (kcal) — opcional"
          placeholderTextColor={colors.text3}
          keyboardType="numeric"
          value={editCal}
          onChangeText={setEditCal}
        />
      </Modal>

      {/* ════════════════════════════════════════════════════════
          MODAL: Registrar alimento
      ════════════════════════════════════════════════════════ */}
      <Modal
        open={showAlimModal}
        onClose={() => setShowAlimModal(false)}
        title="Registrar alimento"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addAlimento} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        {/* Date */}
        <TextInput
          style={styles.input}
          placeholder="Data (AAAA-MM-DD)"
          placeholderTextColor={colors.text3}
          value={alimForm.date}
          onChangeText={v => setAlimForm(f => ({ ...f, date: v }))}
          maxLength={10}
        />

        {/* Refeição chips */}
        <View>
          <Text style={styles.fieldLabel}>Refeição</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingRight: 4 }}
          >
            {REFEICOES_LOG.map(r => {
              const active = alimForm.refeicao === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setAlimForm(f => ({ ...f, refeicao: r }))}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Alimento */}
        <TextInput
          style={styles.input}
          placeholder="Alimento (ex: arroz integral)"
          placeholderTextColor={colors.text3}
          value={alimForm.alimento}
          onChangeText={v => setAlimForm(f => ({ ...f, alimento: v }))}
          autoFocus
        />

        {/* Porção + Calorias row */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Porção (ex: 100g)"
            placeholderTextColor={colors.text3}
            value={alimForm.porcao}
            onChangeText={v => setAlimForm(f => ({ ...f, porcao: v }))}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Kcal"
            placeholderTextColor={colors.text3}
            keyboardType="numeric"
            value={alimForm.calorias}
            onChangeText={v => setAlimForm(f => ({ ...f, calorias: v }))}
          />
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: spacing.screenPad,
    paddingBottom: 48,
  },

  // Tab chips
  tabChips: {
    gap: 6,
    paddingRight: spacing.screenPad,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  tabChipText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  tabChipTextActive: {
    color: colors.accentDk,
  },

  // Filter chips
  filterChips: {
    gap: 6,
    paddingRight: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  filterChipTextActive: {
    color: colors.accentDk,
  },

  // Recipe card
  recipeCard: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  recipeStripe: {
    height: 4,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  recipeName: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    color: colors.text,
    lineHeight: 19,
    marginBottom: 6,
  },
  recipeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  recipeMetaText: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text2,
  },
  catTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 6,
  },
  catTagText: {
    fontSize: 9,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    letterSpacing: 0.5,
  },
  ingredientPreview: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text3,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.text3,
    marginBottom: 10,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  ingCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ingName: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text,
    flex: 1,
    lineHeight: 17,
  },
  ingNameDone: {
    color: 'rgba(0,0,0,0.3)',
    textDecorationLine: 'line-through',
  },
  preparoText: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text2,
    lineHeight: 20,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  recipeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  recipeActionText: {
    fontSize: 12,
    fontFamily: fonts.sans,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.text3,
    textAlign: 'center',
  },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    color: colors.text,
  },

  // Cardápio
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
    padding: 4,
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
  mealEmoji: {
    fontSize: 18,
    flexShrink: 0,
  },
  mealInfo: {
    flex: 1,
    minWidth: 0,
  },
  mealLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.6,
    color: colors.text3,
  },
  mealValue: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: 18,
    marginTop: 2,
  },
  mealCal: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.accent,
    marginTop: 2,
  },
  mealEmpty: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginTop: 1,
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

  // Alimentação
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  calTotal: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.accent,
    fontWeight: '700',
  },
  alimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alimName: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: colors.text,
  },
  alimMeta: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginTop: 1,
  },
  histDate: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  histCal: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.accent,
  },
  histItem: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginBottom: 3,
    lineHeight: 18,
  },

  // Modal shared
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
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  colorSwatchSelected: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
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
});
