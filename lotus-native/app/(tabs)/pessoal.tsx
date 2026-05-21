import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const todayStr = new Date().toISOString().slice(0, 10);
const newId = () => Date.now().toString() + Math.random().toString(36).slice(2);

const NOTE_COLORS = [
  { id: 'cream',  light: '#FAF8F5', dot: '#D4C9B8' },
  { id: 'yellow', light: '#FFFBDC', dot: '#D4A820' },
  { id: 'pink',   light: '#FFF0F3', dot: '#E08098' },
  { id: 'green',  light: '#EDFAF2', dot: '#60B478' },
  { id: 'blue',   light: '#EEF5FF', dot: '#6898D8' },
  { id: 'lilac',  light: '#F4EEFF', dot: '#9878C8' },
  { id: 'peach',  light: '#FFF3EC', dot: '#D89060' },
  { id: 'sage',   light: '#EEF3EA', dot: '#80A070' },
];

const getColorDef = (val?: string) =>
  NOTE_COLORS.find(c => c.id === val) ?? NOTE_COLORS[0];

const formatDatePtBR = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '');

// ─── PinDots ──────────────────────────────────────────────────────────────────

const PinDots = ({ value, error }: { value: string; error: boolean }) => {
  const { colors } = useTheme();
  const pinStyles = makePinStyles(colors);
  return (
    <View style={pinStyles.dots}>
      {[0, 1, 2, 3].map(i => (
        <View
          key={i}
          style={[
            pinStyles.dot,
            {
              backgroundColor:
                value.length > i
                  ? error ? colors.red : colors.accent
                  : colors.line,
            },
          ]}
        />
      ))}
    </View>
  );
};

const makePinStyles = (colors: any) => StyleSheet.create({
  dots: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 32,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});

// ─── PinPad ───────────────────────────────────────────────────────────────────

const PinPad = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const { colors } = useTheme();
  const padStyles = makePadStyles(colors);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <View style={padStyles.grid}>
      {keys.map((k, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => {
            if (!k) return;
            if (k === '⌫') onChange(value.slice(0, -1));
            else if (value.length < 4) onChange(value + k);
          }}
          style={[
            padStyles.key,
            { backgroundColor: k ? colors.bg2 : 'transparent' },
          ]}
          activeOpacity={k ? 0.6 : 1}
        >
          <Text style={[padStyles.keyText, { fontSize: k === '⌫' ? 18 : 22 }]}>
            {k}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const makePadStyles = (colors: any) => StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    gap: 10,
    marginTop: 8,
  },
  key: {
    width: 70,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: colors.text,
    fontFamily: fonts.sans,
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteFolder {
  id: string;
  name: string;
}

interface JournalEntry {
  id: string;
  date: string;
  text: string;
  locked: boolean;
}

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  color: string;
  date: string;
  folderId?: string;
}

interface NotePage {
  id?: string;
  title: string;
  body: string;
  tags: string;
  color: string;
  date?: string;
  isNew: boolean;
  folderId?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PessoalTab() {
  const { colors } = useTheme();
  const overlayStyles = makeOverlayStyles(colors);
  const noteEditorStyles = makeNoteEditorStyles(colors);
  const notebookStyles = makeNotebookStyles(colors);
  const listStyles = makeListStyles(colors);
  const dateSheetStyles = makeDateSheetStyles(colors);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();

  // Storage
  const [journal, saveJournal] = useStorage<JournalEntry[]>('journal:items', []);
  const [journalPin, saveJournalPin] = useStorage<string>('journal:pin', '');
  const [notes, saveNotes] = useStorage<Note[]>('notes:items', []);
  const [folders, saveFolders] = useStorage<NoteFolder[]>('notes:folders', []);

  // Tab
  const [tab, setTab] = useState<string>('diario');

  // Folder modal
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Search
  const [search, setSearch] = useState('');

  // Diary state
  const [journalPage, setJournalPage] = useState<null | {
    mode: 'new' | 'view';
    entry?: JournalEntry;
  }>(null);
  const [pageText, setPageText] = useState('');
  const [pinPhase, setPinPhase] = useState<null | 'unlock' | 'set' | 'confirm'>(null);
  const [pinTarget, setPinTarget] = useState<JournalEntry | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinFirst, setPinFirst] = useState('');
  const [pinError, setPinError] = useState('');

  // Notes state
  const [notePage, setNotePage] = useState<NotePage | null>(null);

  // Date sheet
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [customDate, setCustomDate] = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────

  const openNotebook = useCallback(
    (entry?: JournalEntry) => {
      setPinPhase(null);
      setPinTarget(null);
      setPinInput('');
      setPinFirst('');
      setPinError('');
      if (entry) {
        setPageText(entry.text);
        setJournalPage({ mode: 'view', entry });
      } else {
        setPageText('');
        setJournalPage({ mode: 'new' });
      }
    },
    [],
  );

  const closeNotebook = useCallback(() => {
    setJournalPage(null);
    setPageText('');
    setPinPhase(null);
    setPinInput('');
    setPinFirst('');
    setPinError('');
  }, []);

  const handleSaveNotebook = useCallback(() => {
    if (!pageText.trim()) {
      closeNotebook();
      return;
    }
    const entryDate = journalPage?.entry?.date ?? todayStr;

    const doSave = (pin: string) => {
      const existing = journal.find(e => e.date === entryDate);
      if (existing) {
        saveJournal(
          journal.map(e =>
            e.id === existing.id ? { ...e, text: pageText, locked: !!pin } : e,
          ),
        );
      } else {
        saveJournal([
          { id: newId(), date: entryDate, text: pageText, locked: !!pin },
          ...journal,
        ]);
      }
      toast('Entrada salva');
      closeNotebook();
    };

    if (journalPin) {
      doSave(journalPin);
    } else {
      setPinPhase('set');
    }
  }, [pageText, journalPage, journal, journalPin, saveJournal, toast, closeNotebook]);

  const handlePinInput = useCallback(
    (v: string) => {
      setPinInput(v);
      setPinError('');

      if (v.length < 4) return;

      if (pinPhase === 'unlock') {
        if (v === journalPin) {
          openNotebook(pinTarget ?? undefined);
        } else {
          setPinError('Senha incorreta');
          setTimeout(() => setPinInput(''), 400);
        }
      } else if (pinPhase === 'set') {
        setPinFirst(v);
        setPinInput('');
        setPinPhase('confirm');
      } else if (pinPhase === 'confirm') {
        if (v === pinFirst) {
          saveJournalPin(v);
          // Now save the entry
          const entryDate = journalPage?.entry?.date ?? todayStr;
          const existing = journal.find(e => e.date === entryDate);
          if (existing) {
            saveJournal(
              journal.map(e =>
                e.id === existing.id ? { ...e, text: pageText, locked: true } : e,
              ),
            );
          } else {
            saveJournal([
              { id: newId(), date: entryDate, text: pageText, locked: true },
              ...journal,
            ]);
          }
          toast('Senha criada e entrada salva');
          closeNotebook();
        } else {
          setPinError('Senhas não coincidem');
          setTimeout(() => {
            setPinInput('');
            setPinFirst('');
            setPinPhase('set');
            setPinError('');
          }, 600);
        }
      }
    },
    [
      pinPhase,
      journalPin,
      pinFirst,
      pinTarget,
      journalPage,
      pageText,
      journal,
      openNotebook,
      saveJournal,
      saveJournalPin,
      toast,
      closeNotebook,
    ],
  );

  const handleNoteBack = useCallback(() => {
    if (!notePage) return;
    const title = notePage.title.trim();
    const body = notePage.body.trim();
    if (!title && !body) {
      setNotePage(null);
      return;
    }
    const tags = notePage.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    const date = notePage.date ?? todayStr;

    if (notePage.isNew) {
      const newNote: Note = {
        id: newId(),
        title,
        body,
        tags,
        color: notePage.color,
        date,
        folderId: notePage.folderId,
      };
      saveNotes([newNote, ...notes]);
      toast('Nota adicionada');
    } else {
      saveNotes(
        notes.map(n =>
          n.id === notePage.id
            ? { ...n, title, body, tags, color: notePage.color }
            : n,
        ),
      );
      toast('Nota salva');
    }
    setNotePage(null);
  }, [notePage, notes, saveNotes, toast]);

  const handleDeleteNote = useCallback(() => {
    if (!notePage?.id) return;
    saveNotes(notes.filter(n => n.id !== notePage.id));
    toast('Nota removida');
    setNotePage(null);
  }, [notePage, notes, saveNotes, toast]);

  // ── Computed ───────────────────────────────────────────────────────────────

  const todayEntry = useMemo(
    () => journal.find(e => e.date === todayStr),
    [journal],
  );

  const pastEntries = useMemo(
    () =>
      journal
        .filter(e => e.date !== todayStr)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30),
    [journal],
  );

  const filteredNotes = useMemo(() => {
    let base: Note[];
    if (tab === 'notas') {
      base = notes.filter(n => !n.folderId);
    } else if (tab !== 'diario') {
      base = notes.filter(n => n.folderId === tab);
    } else {
      base = notes;
    }
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(
      n =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        (n.tags || []).some(t => t.toLowerCase().includes(q)),
    );
  }, [notes, search, tab]);

  const noteCardWidth = (width - 2 * spacing.screenPad - 10) / 2;

  // ── PIN unlock overlay ─────────────────────────────────────────────────────

  if (pinPhase === 'unlock' && pinTarget) {
    return (
      <View style={overlayStyles.root}>
        <Text style={overlayStyles.emoji}>💗🔒</Text>
        <Text style={overlayStyles.dateText}>
          {formatDatePtBR(pinTarget.date)}
        </Text>
        <Text style={overlayStyles.prompt}>Digite a senha para acessar</Text>
        <PinDots value={pinInput} error={!!pinError} />
        <PinPad value={pinInput} onChange={handlePinInput} />
        {!!pinError && (
          <Text style={overlayStyles.error}>{pinError}</Text>
        )}
        <TouchableOpacity
          onPress={() => {
            setPinPhase(null);
            setPinTarget(null);
            setPinInput('');
            setPinError('');
          }}
          style={{ marginTop: 24 }}
        >
          <Text style={overlayStyles.cancel}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Note full-page editor ──────────────────────────────────────────────────

  if (notePage !== null) {
    const colorDef = getColorDef(notePage.color);
    return (
      <KeyboardAvoidingView
        style={[noteEditorStyles.root, { backgroundColor: colorDef.light }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top bar */}
        <View
          style={[
            noteEditorStyles.topBar,
            { paddingTop: insets.top + 12, borderBottomColor: colorDef.dot + '30' },
          ]}
        >
          <TouchableOpacity onPress={handleNoteBack} style={noteEditorStyles.backBtn}>
            <Text style={[noteEditorStyles.backText, { color: colorDef.dot }]}>
              ‹ Notas
            </Text>
          </TouchableOpacity>

          {/* Color swatches */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={noteEditorStyles.swatchRow}
          >
            {NOTE_COLORS.map(c => {
              const isActive = notePage.color === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() =>
                    setNotePage(prev => prev ? { ...prev, color: c.id } : prev)
                  }
                  style={[
                    noteEditorStyles.swatch,
                    {
                      backgroundColor: c.dot,
                      width: isActive ? 22 : 17,
                      height: isActive ? 22 : 17,
                      borderRadius: isActive ? 11 : 8.5,
                      borderWidth: isActive ? 2.5 : 1,
                      borderColor: isActive ? c.dot : 'rgba(0,0,0,0.12)',
                      opacity: isActive ? 1 : 0.7,
                    },
                  ]}
                />
              );
            })}
          </ScrollView>

          {!notePage.isNew && (
            <TouchableOpacity onPress={handleDeleteNote} style={noteEditorStyles.trashBtn}>
              <Icon name="trash" size={20} color={colorDef.dot} />
            </TouchableOpacity>
          )}
        </View>

        {/* Writing area */}
        <ScrollView
          style={noteEditorStyles.scroll}
          contentContainerStyle={noteEditorStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            value={notePage.title}
            onChangeText={v =>
              setNotePage(prev => prev ? { ...prev, title: v } : prev)
            }
            placeholder="Título"
            placeholderTextColor={colorDef.dot + '80'}
            style={[noteEditorStyles.titleInput, { color: colors.text }]}
            autoFocus={notePage.isNew}
            returnKeyType="next"
          />
          <Text style={[noteEditorStyles.dateLabel, { color: colorDef.dot }]}>
            {formatDatePtBR(notePage.date ?? todayStr)}
          </Text>
          <TextInput
            value={notePage.body}
            onChangeText={v =>
              setNotePage(prev => prev ? { ...prev, body: v } : prev)
            }
            placeholder="Escreva aqui…"
            placeholderTextColor={colorDef.dot + '70'}
            style={[noteEditorStyles.bodyInput, { color: colors.text }]}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            value={notePage.tags}
            onChangeText={v =>
              setNotePage(prev => prev ? { ...prev, tags: v } : prev)
            }
            placeholder="Tags (separadas por vírgula)"
            placeholderTextColor={colorDef.dot + '70'}
            style={[
              noteEditorStyles.tagsInput,
              { borderTopColor: colorDef.dot + '40', color: colors.text },
            ]}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Diary notebook page ────────────────────────────────────────────────────

  if (journalPage !== null) {
    const entryDate = journalPage.entry?.date ?? todayStr;

    // PIN set overlay on top of notebook
    if (pinPhase === 'set' || pinPhase === 'confirm') {
      return (
        <View style={overlayStyles.root}>
          <Text style={overlayStyles.emoji}>🔐</Text>
          <Text style={overlayStyles.prompt}>
            {pinPhase === 'set' ? 'Criar senha do diário' : 'Confirmar senha'}
          </Text>
          <PinDots value={pinInput} error={!!pinError} />
          <PinPad value={pinInput} onChange={handlePinInput} />
          {!!pinError && (
            <Text style={overlayStyles.error}>{pinError}</Text>
          )}
          <TouchableOpacity
            onPress={() => {
              setPinPhase(null);
              setPinInput('');
              setPinFirst('');
              setPinError('');
            }}
            style={{ marginTop: 24 }}
          >
            <Text style={overlayStyles.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <KeyboardAvoidingView
        style={notebookStyles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top bar */}
        <View style={[notebookStyles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={closeNotebook} style={notebookStyles.backBtn}>
            <Text style={notebookStyles.backText}>‹ Diário</Text>
          </TouchableOpacity>
          <Text style={notebookStyles.dateLabel} numberOfLines={1}>
            {formatDatePtBR(entryDate)}
          </Text>
          <TouchableOpacity onPress={handleSaveNotebook} style={notebookStyles.saveBtn}>
            <Text style={notebookStyles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Paper area */}
        <ScrollView
          style={notebookStyles.paper}
          contentContainerStyle={notebookStyles.paperContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Red margin line */}
          <View style={notebookStyles.marginLine} />

          <TextInput
            value={pageText}
            onChangeText={setPageText}
            multiline
            placeholder="Escreva seu dia aqui…"
            placeholderTextColor="#C4B49A"
            style={notebookStyles.pageInput}
            textAlignVertical="top"
            autoFocus
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Main list view ─────────────────────────────────────────────────────────

  return (
    <View style={listStyles.root}>
      {/* Header */}
      <View
        style={[
          listStyles.header,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={listStyles.heading}>Pessoal</Text>
        <Text style={listStyles.sub}>Diário e notas</Text>
      </View>

      {/* Tab chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={listStyles.chipRow}
      >
        {(['diario', 'notas'] as const).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[listStyles.chip, tab === t && listStyles.chipActive]}
          >
            <Text style={[listStyles.chipText, tab === t && listStyles.chipTextActive]}>
              {t === 'diario' ? 'Diário' : 'Notas'}
            </Text>
          </TouchableOpacity>
        ))}
        {folders.map(f => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setTab(f.id)}
            onLongPress={() =>
              Alert.alert(f.name, 'O que deseja fazer com esta pasta?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Excluir pasta',
                  style: 'destructive',
                  onPress: () => {
                    saveFolders(fs => fs.filter(x => x.id !== f.id));
                    if (tab === f.id) setTab('notas');
                  },
                },
              ])
            }
            style={[listStyles.chip, tab === f.id && listStyles.chipActive]}
          >
            <Text style={[listStyles.chipText, tab === f.id && listStyles.chipTextActive]}>
              {f.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => { setNewFolderName(''); setShowFolderModal(true); }}
          style={listStyles.chipNew}
        >
          <Text style={listStyles.chipNewText}>+ Pasta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView
        contentContainerStyle={listStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {tab === 'diario' ? (
          <>
            {/* Write today button */}
            <TouchableOpacity
              onPress={() => {
                if (todayEntry?.locked && journalPin) {
                  setPinTarget(todayEntry);
                  setPinPhase('unlock');
                } else {
                  openNotebook(todayEntry);
                }
              }}
              style={listStyles.writeTodayBtn}
              activeOpacity={0.75}
            >
              <View style={listStyles.writeTodayInner}>
                <Text style={listStyles.writeTodayIcon}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={listStyles.writeTodayTitle}>
                    {todayEntry ? 'Ver entrada de hoje' : 'Escrever hoje'}
                  </Text>
                  <Text style={listStyles.writeTodayDate}>
                    {formatDatePtBR(todayStr)}
                  </Text>
                </View>
                {todayEntry?.locked && (
                  <Text style={{ fontSize: 18 }}>💗🔒</Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Past entries */}
            {pastEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                onPress={() => {
                  if (entry.locked && journalPin) {
                    setPinTarget(entry);
                    setPinPhase('unlock');
                  } else {
                    openNotebook(entry);
                  }
                }}
                style={listStyles.entryCard}
                activeOpacity={0.7}
              >
                <View style={listStyles.entryLeft}>
                  {/* Mini notebook lines */}
                  <View style={listStyles.notebookIcon}>
                    {[0, 1, 2].map(i => (
                      <View key={i} style={listStyles.notebookLine} />
                    ))}
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={listStyles.entryDate}>{formatDatePtBR(entry.date)}</Text>
                  <Text style={listStyles.entryPreview} numberOfLines={2}>
                    {entry.text}
                  </Text>
                </View>
                {entry.locked && (
                  <Text style={{ fontSize: 16, marginLeft: 8 }}>💗🔒</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Write on another date */}
            <TouchableOpacity
              onPress={() => {
                setCustomDate('');
                setShowDateSheet(true);
              }}
              style={listStyles.addBtn}
            >
              <Icon name="plus" size={16} color={colors.accent} />
              <Text style={listStyles.addBtnText}>Escrever em outra data</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Search */}
            <View style={listStyles.searchRow}>
              <Icon name="search" size={16} color={colors.text3} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar notas…"
                placeholderTextColor={colors.text3}
                style={listStyles.searchInput}
              />
            </View>

            {/* Empty state */}
            {filteredNotes.length === 0 && (
              <View style={listStyles.emptyState}>
                <Text style={listStyles.emptyIcon}>📓</Text>
                <Text style={listStyles.emptyText}>
                  {search ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
                </Text>
              </View>
            )}

            {/* Notes grid */}
            {filteredNotes.length > 0 && (
              <View style={listStyles.notesGrid}>
                {filteredNotes.map(note => {
                  const cd = getColorDef(note.color);
                  return (
                    <TouchableOpacity
                      key={note.id}
                      onPress={() =>
                        setNotePage({
                          id: note.id,
                          title: note.title,
                          body: note.body,
                          tags: (note.tags || []).join(', '),
                          color: note.color,
                          date: note.date,
                          isNew: false,
                        })
                      }
                      style={[
                        listStyles.noteCard,
                        {
                          width: noteCardWidth,
                          backgroundColor: cd.light,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      {/* Dog-ear */}
                      <View style={[listStyles.dogEar, { borderBottomColor: cd.dot + '60' }]} />

                      {/* Color dot */}
                      <View
                        style={[listStyles.colorDot, { backgroundColor: cd.dot }]}
                      />

                      {/* Title */}
                      {!!note.title && (
                        <Text style={listStyles.noteTitle} numberOfLines={2}>
                          {note.title}
                        </Text>
                      )}

                      {/* Body preview */}
                      {!!note.body && (
                        <Text style={listStyles.noteBody} numberOfLines={4}>
                          {stripHtml(note.body)}
                        </Text>
                      )}

                      {/* Footer */}
                      <View style={listStyles.noteFooter}>
                        <Text style={[listStyles.noteDate, { color: cd.dot }]}>
                          {note.date
                            ? new Date(note.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                              })
                            : ''}
                        </Text>
                        {(note.tags || []).length > 0 && (
                          <Text style={[listStyles.noteTags, { color: cd.dot }]} numberOfLines={1}>
                            {(note.tags || []).slice(0, 2).join(' · ')}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Add note */}
            <TouchableOpacity
              onPress={() =>
                setNotePage({
                  title: '',
                  body: '',
                  tags: '',
                  color: 'cream',
                  date: todayStr,
                  isNew: true,
                  folderId: tab !== 'notas' ? tab : undefined,
                })
              }
              style={listStyles.addBtn}
            >
              <Icon name="plus" size={16} color={colors.accent} />
              <Text style={listStyles.addBtnText}>Nova nota</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Folder creation modal */}
      {showFolderModal && (
        <View style={dateSheetStyles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowFolderModal(false)}
            activeOpacity={1}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={dateSheetStyles.kav}
          >
            <View style={[dateSheetStyles.sheet, { paddingBottom: Math.max(insets.bottom + 16, 32) }]}>
              <View style={dateSheetStyles.handle} />
              <Text style={dateSheetStyles.sheetTitle}>Nova pasta</Text>
              <TextInput
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Nome da pasta"
                placeholderTextColor={colors.text3}
                style={dateSheetStyles.dateInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  if (!newFolderName.trim()) return;
                  const id = newId();
                  saveFolders(fs => [...fs, { id, name: newFolderName.trim() }]);
                  setTab(id);
                  setShowFolderModal(false);
                }}
                style={dateSheetStyles.primaryBtn}
              >
                <Text style={dateSheetStyles.primaryBtnText}>Criar pasta</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Date sheet overlay */}
      {showDateSheet && (
        <View style={dateSheetStyles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowDateSheet(false)}
            activeOpacity={1}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={dateSheetStyles.kav}
          >
            <View
              style={[
                dateSheetStyles.sheet,
                { paddingBottom: Math.max(insets.bottom + 16, 32) },
              ]}
            >
              <View style={dateSheetStyles.handle} />
              <Text style={dateSheetStyles.sheetTitle}>Escrever em outra data</Text>
              <TextInput
                value={customDate}
                onChangeText={setCustomDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor={colors.text3}
                keyboardType="numeric"
                style={dateSheetStyles.dateInput}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => {
                  const trimmed = customDate.trim();
                  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                    toast('Formato inválido. Use AAAA-MM-DD');
                    return;
                  }
                  const existing = journal.find(e => e.date === trimmed);
                  setShowDateSheet(false);
                  if (existing?.locked && journalPin) {
                    setPinTarget(existing);
                    setPinPhase('unlock');
                  } else {
                    openNotebook(existing ?? undefined);
                    if (!existing) {
                      // We need to track the custom date for new entries
                      setJournalPage({ mode: 'new', entry: { id: '', date: trimmed, text: '', locked: false } });
                    }
                  }
                }}
                style={dateSheetStyles.primaryBtn}
              >
                <Text style={dateSheetStyles.primaryBtnText}>Abrir</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeOverlayStyles = (colors: any) => StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPad,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  dateText: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  prompt: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text2,
    marginBottom: 28,
    textAlign: 'center',
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red,
    marginTop: 12,
    textAlign: 'center',
  },
  cancel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text2,
    textAlign: 'center',
  },
});

const makeNoteEditorStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingHorizontal: 4,
  },
  swatch: {
    // width/height/borderRadius set inline
  },
  trashBtn: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  titleInput: {
    fontFamily: fonts.serif,
    fontSize: 28,
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: 6,
    padding: 0,
  },
  dateLabel: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginBottom: 16,
  },
  bodyInput: {
    multiline: true,
    fontFamily: fonts.sans,
    fontSize: 15,
    minHeight: 280,
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 16,
  } as any,
  tagsInput: {
    fontFamily: fonts.sans,
    fontSize: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    color: colors.text,
    padding: 0,
  },
});

const makeNotebookStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF6ED',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD0',
    gap: 8,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 4,
  },
  backText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.accent,
  },
  dateLabel: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
  },
  saveBtn: {
    paddingVertical: 4,
    paddingLeft: 4,
  },
  saveText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.accent,
  },
  paper: {
    flex: 1,
    backgroundColor: '#FAF6ED',
  },
  paperContent: {
    paddingTop: 16,
    paddingBottom: 60,
    minHeight: 600,
  },
  marginLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 56,
    width: 1,
    backgroundColor: '#EDBBAA',
  },
  pageInput: {
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 28,
    paddingLeft: 72,
    paddingRight: 24,
    paddingBottom: 40,
    paddingTop: 8,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
    color: colors.text,
    minHeight: 500,
  },
});

const makeListStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: 12,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.text,
  },
  sub: {
    fontSize: 13,
    color: colors.text2,
    fontFamily: fonts.sans,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPad,
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: colors.bg2,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text2,
  },
  chipTextActive: {
    color: '#fff',
  },
  chipNew: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderStyle: 'dashed',
  },
  chipNewText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text3,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
  },
  // Diary
  writeTodayBtn: {
    backgroundColor: colors.accentBg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginBottom: 12,
    overflow: 'hidden',
  },
  writeTodayInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  writeTodayIcon: {
    fontSize: 28,
  },
  writeTodayTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.accent,
  },
  writeTodayDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text2,
    marginTop: 2,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  entryLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebookIcon: {
    width: 28,
    gap: 4,
    justifyContent: 'center',
  },
  notebookLine: {
    height: 2,
    backgroundColor: colors.line,
    borderRadius: 1,
    width: '100%',
  },
  entryDate: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.text2,
    marginBottom: 4,
  },
  entryPreview: {
    fontFamily: fonts.serif,
    fontSize: 13,
    color: colors.text,
    opacity: 0.55,
    lineHeight: 18,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginTop: 8,
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.accent,
  },
  // Notes
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text2,
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  noteCard: {
    minHeight: 110,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    overflow: 'hidden',
  },
  dogEar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: 18,
    borderTopColor: 'rgba(0,0,0,0.06)',
    borderLeftWidth: 18,
    borderLeftColor: 'transparent',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  noteTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  noteBody: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text2,
    lineHeight: 16,
    marginBottom: 8,
  },
  noteFooter: {
    marginTop: 'auto',
    gap: 2,
  },
  noteDate: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
  noteTags: {
    fontFamily: fonts.sans,
    fontSize: 10,
  },
});

const makeDateSheetStyles = (colors: any) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    zIndex: 500,
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.screenPad,
    paddingTop: 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.line,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 16,
  },
  dateInput: {
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: '#fff',
  },
});
