import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Pressable,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VocabWord {
  id: string;
  palavra: string;
  trad: string;
  ex: string;
  tema: string;
}

interface Flashcard {
  id: string;
  frente: string;
  verso: string;
  nivel: 'fácil' | 'médio' | 'difícil';
}

interface Nota {
  id: string;
  title: string;
  body: string;
  date: string;
}

interface TraducaoHistorico {
  id: string;
  from: string;
  to: string;
  input: string;
  output: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['vocab', 'flash', 'notas', 'tradutor'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  vocab: 'Vocabulário',
  flash: 'Flashcards',
  notas: 'Notas',
  tradutor: 'Tradutor',
};

const LANGS = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'Inglês' },
  { code: 'es', label: 'Espanhol' },
  { code: 'fr', label: 'Francês' },
  { code: 'de', label: 'Alemão' },
  { code: 'it', label: 'Italiano' },
  { code: 'ja', label: 'Japonês' },
];

const NIVEIS = ['fácil', 'médio', 'difícil'] as const;
type Nivel = typeof NIVEIS[number];

const NIVEL_COLORS: Record<Nivel, { bg: string; text: string }> = {
  fácil: { bg: colors.greenBg, text: colors.green },
  médio: { bg: colors.blueBg, text: colors.blue },
  difícil: { bg: colors.redBg, text: colors.red },
};

const newId = () => Date.now().toString();

const emptyVocab = { palavra: '', trad: '', ex: '', tema: '' };
const emptyFlash = { frente: '', verso: '', nivel: 'médio' as Nivel };
const emptyNota = { title: '', body: '' };

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function IdiomasScreen() {
  const [tab, setTab] = useState<Tab>('vocab');

  // Storage
  const [vocab, saveVocab] = useStorage<VocabWord[]>('idiomas:vocabulario', []);
  const [flashcards, saveFlashcards] = useStorage<Flashcard[]>('idiomas:flashcards', []);
  const [notas, saveNotas] = useStorage<Nota[]>('idiomas:notas', []);
  const [historico, saveHistorico] = useStorage<TraducaoHistorico[]>('idiomas:tradutor', []);

  const toast = useToast();

  // Vocab modal
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [vocabForm, setVocabForm] = useState(emptyVocab);
  const [editVocabId, setEditVocabId] = useState<string | null>(null);

  // Flash modal
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashForm, setFlashForm] = useState(emptyFlash);
  const [editFlashId, setEditFlashId] = useState<string | null>(null);

  // Study mode
  const [studying, setStudying] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyFlipped, setStudyFlipped] = useState(false);
  const [studyScore, setStudyScore] = useState({ yes: 0, no: 0 });
  const [studyDone, setStudyDone] = useState(false);

  // Nota modal
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [notaForm, setNotaForm] = useState(emptyNota);
  const [editNotaId, setEditNotaId] = useState<string | null>(null);

  // Translator
  const [tradFrom, setTradFrom] = useState('pt');
  const [tradTo, setTradTo] = useState('en');
  const [tradInput, setTradInput] = useState('');
  const [tradResult, setTradResult] = useState('');
  const [tradLoading, setTradLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  // ─── Vocab handlers ─────────────────────────────────────────────────────────

  const openAddVocab = () => {
    setVocabForm(emptyVocab);
    setEditVocabId(null);
    setShowVocabModal(true);
  };

  const openEditVocab = (w: VocabWord) => {
    setVocabForm({ palavra: w.palavra, trad: w.trad, ex: w.ex, tema: w.tema });
    setEditVocabId(w.id);
    setShowVocabModal(true);
  };

  const saveVocabWord = () => {
    if (!vocabForm.palavra.trim() || !vocabForm.trad.trim()) return;
    if (editVocabId) {
      saveVocab((ws: VocabWord[]) =>
        ws.map(w => w.id === editVocabId ? { ...w, ...vocabForm } : w)
      );
      toast('Palavra atualizada');
    } else {
      saveVocab((ws: VocabWord[]) => [...ws, { id: newId(), ...vocabForm }]);
      toast('Palavra adicionada');
    }
    setShowVocabModal(false);
  };

  const deleteVocab = (id: string) => {
    Alert.alert('Remover', 'Remover esta palavra?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { saveVocab((ws: VocabWord[]) => ws.filter(w => w.id !== id)); toast('Removida'); },
      },
    ]);
  };

  // Group vocab by tema
  const temas = [...new Set(vocab.map(w => w.tema || 'Geral'))];

  // ─── Flashcard handlers ──────────────────────────────────────────────────────

  const openAddFlash = () => {
    setFlashForm(emptyFlash);
    setEditFlashId(null);
    setShowFlashModal(true);
  };

  const openEditFlash = (c: Flashcard) => {
    setFlashForm({ frente: c.frente, verso: c.verso, nivel: c.nivel });
    setEditFlashId(c.id);
    setShowFlashModal(true);
  };

  const saveFlashcard = () => {
    if (!flashForm.frente.trim() || !flashForm.verso.trim()) return;
    if (editFlashId) {
      saveFlashcards((cs: Flashcard[]) =>
        cs.map(c => c.id === editFlashId ? { ...c, ...flashForm } : c)
      );
      toast('Flashcard atualizado');
    } else {
      saveFlashcards((cs: Flashcard[]) => [...cs, { id: newId(), ...flashForm }]);
      toast('Flashcard adicionado');
    }
    setShowFlashModal(false);
  };

  const deleteFlash = (id: string) => {
    Alert.alert('Remover', 'Remover este flashcard?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { saveFlashcards((cs: Flashcard[]) => cs.filter(c => c.id !== id)); toast('Removido'); },
      },
    ]);
  };

  const startStudy = () => {
    if (flashcards.length === 0) return;
    setStudyIndex(0);
    setStudyFlipped(false);
    setStudyScore({ yes: 0, no: 0 });
    setStudyDone(false);
    setStudying(true);
  };

  const studyAnswer = (remembered: boolean) => {
    const next = studyIndex + 1;
    setStudyScore(s => ({ ...s, yes: remembered ? s.yes + 1 : s.yes, no: remembered ? s.no : s.no + 1 }));
    if (next >= flashcards.length) {
      setStudyDone(true);
    } else {
      setStudyIndex(next);
      setStudyFlipped(false);
    }
  };

  // ─── Nota handlers ───────────────────────────────────────────────────────────

  const openAddNota = () => {
    setNotaForm(emptyNota);
    setEditNotaId(null);
    setShowNotaModal(true);
  };

  const openEditNota = (n: Nota) => {
    setNotaForm({ title: n.title, body: n.body });
    setEditNotaId(n.id);
    setShowNotaModal(true);
  };

  const saveNota = () => {
    if (!notaForm.title.trim() && !notaForm.body.trim()) return;
    const date = new Date().toLocaleDateString('pt-BR');
    if (editNotaId) {
      saveNotas((ns: Nota[]) =>
        ns.map(n => n.id === editNotaId ? { ...n, ...notaForm, date } : n)
      );
      toast('Nota atualizada');
    } else {
      saveNotas((ns: Nota[]) => [...ns, { id: newId(), ...notaForm, date }]);
      toast('Nota salva');
    }
    setShowNotaModal(false);
  };

  const deleteNota = (id: string) => {
    Alert.alert('Remover', 'Remover esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { saveNotas((ns: Nota[]) => ns.filter(n => n.id !== id)); toast('Removida'); },
      },
    ]);
  };

  // ─── Translator handlers ──────────────────────────────────────────────────────

  const swapLangs = () => {
    const prev = tradFrom;
    setTradFrom(tradTo);
    setTradTo(prev);
    setTradInput(tradResult);
    setTradResult('');
  };

  const translate = async () => {
    const text = tradInput.trim();
    if (!text) return;
    setTradLoading(true);
    setTradResult('');
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${tradFrom}|${tradTo}`;
      const res = await fetch(url);
      const json = await res.json();
      const result: string = json?.responseData?.translatedText || '';
      setTradResult(result);
      if (result) {
        const entry: TraducaoHistorico = {
          id: newId(),
          from: tradFrom,
          to: tradTo,
          input: text,
          output: result,
        };
        saveHistorico((hs: TraducaoHistorico[]) => [entry, ...hs].slice(0, 10));
      }
    } catch {
      toast('Erro ao traduzir. Tente novamente.');
    } finally {
      setTradLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await Share.share({ message: text });
    } catch {
      // ignore
    }
  };

  const langLabel = (code: string) => LANGS.find(l => l.code === code)?.label ?? code;

  // ─── Study Mode Overlay ───────────────────────────────────────────────────────

  if (studying) {
    const card = flashcards[studyIndex];
    const total = flashcards.length;

    return (
      <View style={styles.flex}>
        <BackHeader
          title="Estudando"
          subtitle={`${studyIndex + 1} / ${total}`}
          onBack={() => setStudying(false)}
        />

        {studyDone ? (
          <View style={styles.studyDoneWrap}>
            <Text style={styles.studyDoneEmoji}>🎉</Text>
            <Text style={styles.studyDoneTitle}>Sessão completa!</Text>
            <View style={styles.studyScoreRow}>
              <View style={[styles.studyScoreBox, { backgroundColor: colors.greenBg }]}>
                <Text style={[styles.studyScoreNum, { color: colors.green }]}>{studyScore.yes}</Text>
                <Text style={[styles.studyScoreLabel, { color: colors.green }]}>Lembrei</Text>
              </View>
              <View style={[styles.studyScoreBox, { backgroundColor: colors.redBg }]}>
                <Text style={[styles.studyScoreNum, { color: colors.red }]}>{studyScore.no}</Text>
                <Text style={[styles.studyScoreLabel, { color: colors.red }]}>Não lembrei</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => setStudying(false)} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Voltar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.studyWrap}>
            {/* Score bar */}
            <View style={styles.studyScoreBar}>
              <Text style={[styles.studyScoreBadge, { color: colors.green }]}>✓ {studyScore.yes}</Text>
              <Text style={[styles.studyScoreBadge, { color: colors.red }]}>✗ {studyScore.no}</Text>
            </View>

            {/* Card */}
            <Pressable
              style={[
                styles.studyCard,
                studyFlipped && styles.studyCardFlipped,
              ]}
              onPress={() => setStudyFlipped(f => !f)}
            >
              {!studyFlipped ? (
                <View style={styles.studyCardContent}>
                  <Text style={styles.studyCardHint}>Frente · toque para revelar</Text>
                  <Text style={styles.studyCardText}>{card.frente}</Text>
                  <View style={[styles.nivelBadge, { backgroundColor: NIVEL_COLORS[card.nivel]?.bg ?? colors.bg2 }]}>
                    <Text style={[styles.nivelText, { color: NIVEL_COLORS[card.nivel]?.text ?? colors.text2 }]}>{card.nivel}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.studyCardContent}>
                  <Text style={styles.studyCardHint}>Verso</Text>
                  <Text style={styles.studyCardText}>{card.verso}</Text>
                </View>
              )}
            </Pressable>

            {studyFlipped && (
              <View style={styles.studyBtns}>
                <TouchableOpacity
                  style={[styles.studyAnswerBtn, styles.studyBtnNo]}
                  onPress={() => studyAnswer(false)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.studyAnswerText, { color: colors.red }]}>Não lembrei</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.studyAnswerBtn, styles.studyBtnYes]}
                  onPress={() => studyAnswer(true)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.studyAnswerText, { color: colors.green }]}>Lembrei</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // ─── Main UI ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Idiomas"
        action={
          (tab === 'vocab' || tab === 'flash' || tab === 'notas') ? (
            <TouchableOpacity
              onPress={tab === 'vocab' ? openAddVocab : tab === 'flash' ? openAddFlash : openAddNota}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={20} color={colors.accent} />
            </TouchableOpacity>
          ) : undefined
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
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {TAB_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Vocab tab ── */}
      {tab === 'vocab' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {vocab.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyText}>Nenhuma palavra ainda</Text>
            </View>
          ) : (
            temas.map(tema => {
              const words = vocab.filter(w => (w.tema || 'Geral') === tema);
              return (
                <View key={tema} style={styles.section}>
                  <Text style={styles.sectionLabel}>{tema}</Text>
                  {words.map((w, i) => (
                    <View key={w.id} style={[styles.card, i > 0 && { marginTop: 8 }]}>
                      <View style={styles.wordRow}>
                        <View style={styles.wordBody}>
                          <Text style={styles.wordPalavra}>{w.palavra}</Text>
                          <Text style={styles.wordTrad}>{w.trad}</Text>
                          {!!w.ex && (
                            <Text style={styles.wordEx} numberOfLines={2}>"{w.ex}"</Text>
                          )}
                        </View>
                        <View style={styles.rowActions}>
                          <TouchableOpacity onPress={() => openEditVocab(w)} activeOpacity={0.7} style={styles.iconBtn}>
                            <Icon name="edit" size={14} color={colors.text3} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => deleteVocab(w.id)} activeOpacity={0.7} style={styles.iconBtn}>
                            <Icon name="trash" size={14} color={colors.text3} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })
          )}

          <TouchableOpacity style={styles.btnAdd} onPress={openAddVocab} activeOpacity={0.7}>
            <Icon name="plus" size={16} color={colors.text2} />
            <Text style={styles.btnAddText}>Adicionar palavra</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Flash tab ── */}
      {tab === 'flash' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {flashcards.length > 0 && (
            <TouchableOpacity style={styles.studyStartBtn} onPress={startStudy} activeOpacity={0.85}>
              <Icon name="book" size={16} color={colors.bg} />
              <Text style={styles.studyStartText}>Estudar {flashcards.length} flashcard{flashcards.length !== 1 ? 's' : ''}</Text>
            </TouchableOpacity>
          )}

          {flashcards.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🃏</Text>
              <Text style={styles.emptyText}>Nenhum flashcard ainda</Text>
            </View>
          ) : (
            flashcards.map((c, i) => {
              const nc = NIVEL_COLORS[c.nivel] ?? { bg: colors.bg2, text: colors.text2 };
              return (
                <View key={c.id} style={[styles.card, i > 0 && { marginTop: 8 }]}>
                  <View style={styles.flashRow}>
                    <View style={styles.flashBody}>
                      <View style={styles.flashSide}>
                        <Text style={styles.flashSideLabel}>Frente</Text>
                        <Text style={styles.flashSideText}>{c.frente}</Text>
                      </View>
                      <View style={[styles.flashDivider]} />
                      <View style={styles.flashSide}>
                        <Text style={styles.flashSideLabel}>Verso</Text>
                        <Text style={styles.flashSideText}>{c.verso}</Text>
                      </View>
                    </View>
                    <View style={styles.flashMeta}>
                      <View style={[styles.nivelBadge, { backgroundColor: nc.bg }]}>
                        <Text style={[styles.nivelText, { color: nc.text }]}>{c.nivel}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <TouchableOpacity onPress={() => openEditFlash(c)} activeOpacity={0.7} style={styles.iconBtn}>
                          <Icon name="edit" size={14} color={colors.text3} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteFlash(c.id)} activeOpacity={0.7} style={styles.iconBtn}>
                          <Icon name="trash" size={14} color={colors.text3} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity style={[styles.btnAdd, { marginTop: flashcards.length > 0 ? 8 : 0 }]} onPress={openAddFlash} activeOpacity={0.7}>
            <Icon name="plus" size={16} color={colors.text2} />
            <Text style={styles.btnAddText}>Adicionar flashcard</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Notas tab ── */}
      {tab === 'notas' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {notas.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📝</Text>
              <Text style={styles.emptyText}>Nenhuma nota ainda</Text>
            </View>
          ) : (
            notas.map((n, i) => (
              <View key={n.id} style={[styles.card, i > 0 && { marginTop: 8 }]}>
                <View style={styles.notaRow}>
                  <View style={styles.notaBody}>
                    <Text style={styles.notaTitle}>{n.title}</Text>
                    {!!n.body && (
                      <Text style={styles.notaBodyText} numberOfLines={4}>{n.body}</Text>
                    )}
                    <Text style={styles.notaDate}>{n.date}</Text>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => openEditNota(n)} activeOpacity={0.7} style={styles.iconBtn}>
                      <Icon name="edit" size={14} color={colors.text3} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteNota(n.id)} activeOpacity={0.7} style={styles.iconBtn}>
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity style={[styles.btnAdd, { marginTop: notas.length > 0 ? 8 : 0 }]} onPress={openAddNota} activeOpacity={0.7}>
            <Icon name="plus" size={16} color={colors.text2} />
            <Text style={styles.btnAddText}>Nova nota</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Tradutor tab ── */}
      {tab === 'tradutor' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Language selectors */}
          <View style={styles.tradLangRow}>
            <TouchableOpacity
              style={styles.tradLangBtn}
              onPress={() => setShowFromPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.tradLangText}>{langLabel(tradFrom)}</Text>
              <Icon name="chevronDown" size={14} color={colors.text2} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tradSwapBtn} onPress={swapLangs} activeOpacity={0.7}>
              <Icon name="arrow" size={18} color={colors.text2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tradLangBtn}
              onPress={() => setShowToPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.tradLangText}>{langLabel(tradTo)}</Text>
              <Icon name="chevronDown" size={14} color={colors.text2} />
            </TouchableOpacity>
          </View>

          {/* Input */}
          <TextInput
            style={styles.tradInput}
            placeholder="Digite o texto para traduzir..."
            placeholderTextColor={colors.text3}
            value={tradInput}
            onChangeText={setTradInput}
            multiline
            textAlignVertical="top"
          />

          {/* Translate button */}
          <TouchableOpacity
            style={[styles.btnPrimary, tradLoading && styles.btnDisabled]}
            onPress={translate}
            activeOpacity={0.85}
            disabled={tradLoading}
          >
            {tradLoading
              ? <ActivityIndicator color={colors.bg} size="small" />
              : <Text style={styles.btnPrimaryText}>Traduzir</Text>
            }
          </TouchableOpacity>

          {/* Result */}
          {!!tradResult && (
            <View style={styles.tradResultBox}>
              <View style={styles.tradResultHeader}>
                <Text style={styles.tradResultLabel}>{langLabel(tradTo)}</Text>
                <TouchableOpacity onPress={() => copyText(tradResult)} activeOpacity={0.7} style={styles.copyBtn}>
                  <Icon name="copy" size={14} color={colors.accentDk} />
                  <Text style={styles.copyText}>Copiar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tradResultText}>{tradResult}</Text>
            </View>
          )}

          {/* History */}
          {historico.length > 0 && (
            <View style={styles.section}>
              <View style={styles.histHeader}>
                <Text style={styles.sectionLabel}>Histórico</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Limpar', 'Limpar histórico de traduções?', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Limpar', style: 'destructive', onPress: () => { saveHistorico([]); toast('Histórico limpo'); } },
                  ])}
                  activeOpacity={0.7}
                >
                  <Text style={styles.histClearText}>Limpar</Text>
                </TouchableOpacity>
              </View>
              {historico.map((h, i) => (
                <View key={h.id} style={[styles.histCard, i > 0 && { marginTop: 8 }]}>
                  <View style={styles.histLangRow}>
                    <Text style={styles.histLang}>{langLabel(h.from)}</Text>
                    <Icon name="arrow" size={12} color={colors.text3} />
                    <Text style={styles.histLang}>{langLabel(h.to)}</Text>
                  </View>
                  <Text style={styles.histInput} numberOfLines={2}>{h.input}</Text>
                  <Text style={styles.histOutput} numberOfLines={2}>{h.output}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── Vocab Modal ── */}
      <Modal
        open={showVocabModal}
        onClose={() => setShowVocabModal(false)}
        title={editVocabId ? 'Editar palavra' : 'Nova palavra'}
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={saveVocabWord} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{editVocabId ? 'Salvar' : 'Adicionar'}</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Palavra (ex: ubiquitous)"
          placeholderTextColor={colors.text3}
          value={vocabForm.palavra}
          onChangeText={v => setVocabForm(f => ({ ...f, palavra: v }))}
          autoFocus
        />
        <TextInput
          style={styles.input}
          placeholder="Tradução (ex: onipresente)"
          placeholderTextColor={colors.text3}
          value={vocabForm.trad}
          onChangeText={v => setVocabForm(f => ({ ...f, trad: v }))}
        />
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Exemplo de uso (opcional)"
          placeholderTextColor={colors.text3}
          value={vocabForm.ex}
          onChangeText={v => setVocabForm(f => ({ ...f, ex: v }))}
          multiline
          textAlignVertical="top"
        />
        <TextInput
          style={styles.input}
          placeholder="Tema (ex: Negócios, Viagem...)"
          placeholderTextColor={colors.text3}
          value={vocabForm.tema}
          onChangeText={v => setVocabForm(f => ({ ...f, tema: v }))}
        />
      </Modal>

      {/* ── Flashcard Modal ── */}
      <Modal
        open={showFlashModal}
        onClose={() => setShowFlashModal(false)}
        title={editFlashId ? 'Editar flashcard' : 'Novo flashcard'}
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={saveFlashcard} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{editFlashId ? 'Salvar' : 'Adicionar'}</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Frente (pergunta)"
          placeholderTextColor={colors.text3}
          value={flashForm.frente}
          onChangeText={v => setFlashForm(f => ({ ...f, frente: v }))}
          autoFocus
        />
        <TextInput
          style={[styles.input, styles.inputMulti]}
          placeholder="Verso (resposta)"
          placeholderTextColor={colors.text3}
          value={flashForm.verso}
          onChangeText={v => setFlashForm(f => ({ ...f, verso: v }))}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.fieldLabel}>Nível de dificuldade</Text>
        <View style={styles.chipRow}>
          {NIVEIS.map(n => {
            const nc = NIVEL_COLORS[n];
            const active = flashForm.nivel === n;
            return (
              <TouchableOpacity
                key={n}
                style={[
                  styles.chip,
                  active && { borderColor: nc.text, backgroundColor: nc.bg },
                ]}
                onPress={() => setFlashForm(f => ({ ...f, nivel: n }))}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && { color: nc.text }]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>

      {/* ── Nota Modal ── */}
      <Modal
        open={showNotaModal}
        onClose={() => setShowNotaModal(false)}
        title={editNotaId ? 'Editar nota' : 'Nova nota'}
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={saveNota} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{editNotaId ? 'Salvar' : 'Adicionar'}</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Título (ex: Phrasal verbs)"
          placeholderTextColor={colors.text3}
          value={notaForm.title}
          onChangeText={v => setNotaForm(f => ({ ...f, title: v }))}
          autoFocus
        />
        <TextInput
          style={[styles.input, styles.inputMultiLarge]}
          placeholder="Conteúdo da nota..."
          placeholderTextColor={colors.text3}
          value={notaForm.body}
          onChangeText={v => setNotaForm(f => ({ ...f, body: v }))}
          multiline
          textAlignVertical="top"
        />
      </Modal>

      {/* ── Language Picker: From ── */}
      <Modal
        open={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        title="De"
      >
        {LANGS.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langOption, tradFrom === l.code && styles.langOptionActive]}
            onPress={() => { setTradFrom(l.code); setShowFromPicker(false); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.langOptionText, tradFrom === l.code && styles.langOptionTextActive]}>
              {l.label}
            </Text>
            {tradFrom === l.code && <Icon name="check2" size={16} color={colors.accentDk} />}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* ── Language Picker: To ── */}
      <Modal
        open={showToPicker}
        onClose={() => setShowToPicker(false)}
        title="Para"
      >
        {LANGS.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langOption, tradTo === l.code && styles.langOptionActive]}
            onPress={() => { setTradTo(l.code); setShowToPicker(false); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.langOptionText, tradTo === l.code && styles.langOptionTextActive]}>
              {l.label}
            </Text>
            {tradTo === l.code && <Icon name="check2" size={16} color={colors.accentDk} />}
          </TouchableOpacity>
        ))}
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },

  // Tabs
  tabBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  tabTextActive: { color: colors.accentDk, fontFamily: fonts.sansMedium },

  // Content
  content: { padding: spacing.screenPad, paddingBottom: 48, gap: 0 },

  // Section
  section: { gap: 0, marginBottom: 16 },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },

  // Add button
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
    marginTop: 16,
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },

  // Icon button
  iconBtn: { padding: 4 },
  rowActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },

  // Vocab
  wordRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  wordBody: { flex: 1 },
  wordPalavra: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text, marginBottom: 2 },
  wordTrad: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, marginBottom: 4 },
  wordEx: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, fontStyle: 'italic' },

  // Flash list
  flashRow: { flexDirection: 'row', gap: 10 },
  flashBody: { flex: 1 },
  flashSide: { paddingVertical: 2 },
  flashSideLabel: { fontFamily: fonts.sans, fontSize: 10, fontWeight: '600', color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  flashSideText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text },
  flashDivider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  flashMeta: { alignItems: 'flex-end', justifyContent: 'space-between' },

  // Nivel badge
  nivelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  nivelText: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600' },

  // Notas
  notaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  notaBody: { flex: 1 },
  notaTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text, marginBottom: 4 },
  notaBodyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, marginBottom: 6, lineHeight: 18 },
  notaDate: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },

  // Study mode
  studyWrap: { flex: 1, padding: spacing.screenPad, gap: 16 },
  studyScoreBar: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  studyScoreBadge: { fontFamily: fonts.sansMedium, fontSize: 15 },
  studyCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 200,
  },
  studyCardFlipped: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accent,
  },
  studyCardContent: { alignItems: 'center', gap: 16, width: '100%' },
  studyCardHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  studyCardText: { fontFamily: fonts.serif, fontSize: 26, color: colors.text, textAlign: 'center', lineHeight: 32 },
  studyBtns: { flexDirection: 'row', gap: 12 },
  studyAnswerBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  studyBtnNo: { backgroundColor: colors.redBg, borderColor: colors.red },
  studyBtnYes: { backgroundColor: colors.greenBg, borderColor: colors.green },
  studyAnswerText: { fontFamily: fonts.sansMedium, fontSize: 15 },
  studyStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginBottom: 16,
  },
  studyStartText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },

  // Study done
  studyDoneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.screenPad, gap: 20 },
  studyDoneEmoji: { fontSize: 56 },
  studyDoneTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  studyScoreRow: { flexDirection: 'row', gap: 16, width: '100%' },
  studyScoreBox: { flex: 1, alignItems: 'center', borderRadius: radius.md, padding: 20, gap: 4 },
  studyScoreNum: { fontFamily: fonts.serif, fontSize: 36 },
  studyScoreLabel: { fontFamily: fonts.sans, fontSize: 13 },

  // Translator
  tradLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tradLangBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 6,
  },
  tradLangText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text, flex: 1 },
  tradSwapBtn: {
    padding: 8,
    backgroundColor: colors.bg2,
    borderRadius: radius.sm,
  },
  tradInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
    minHeight: 100,
    marginBottom: 12,
  },
  tradResultBox: {
    backgroundColor: colors.accentBg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  tradResultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tradResultLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: colors.accentDk },
  tradResultText: { fontFamily: fonts.serif, fontSize: 18, color: colors.text, lineHeight: 26 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  copyText: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '600', color: colors.accentDk },

  // History
  histHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  histClearText: { fontFamily: fonts.sans, fontSize: 12, color: colors.red },
  histCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  histLangRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  histLang: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3 },
  histInput: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },
  histOutput: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.text },

  // Lang picker option
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  langOptionActive: { backgroundColor: colors.accentBg },
  langOptionText: { fontFamily: fonts.sans, fontSize: 15, color: colors.text },
  langOptionTextActive: { fontFamily: fonts.sansMedium, color: colors.accentDk },

  // Forms
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
  inputMulti: { minHeight: 80 },
  inputMultiLarge: { minHeight: 120 },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
    marginTop: 4,
    marginBottom: 6,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2 },

  // Primary button
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
  btnDisabled: { opacity: 0.55 },
});
