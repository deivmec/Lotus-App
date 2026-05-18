import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaletteColor = { hex: string; name: string };
type Palette = { id: string; name: string; colors: PaletteColor[] };
type BoardItem = string; // base64 data URI
type Board = { id: string; name: string; items: BoardItem[] };
type Tab = 'moodboard' | 'paletas' | 'portfolio';

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_PALETTES: Palette[] = [
  { id: 'dp1',  name: 'Natureza',     colors: [{ hex: '#4A5240', name: 'Musgo' }, { hex: '#8A9E7A', name: 'Sage' }, { hex: '#C8D4AD', name: 'Bambu' }, { hex: '#E8DCC8', name: 'Areia' }, { hex: '#A0784A', name: 'Terra' }] },
  { id: 'dp2',  name: 'Oceano',       colors: [{ hex: '#0D2137', name: 'Abismo' }, { hex: '#1B5E8A', name: 'Mar' }, { hex: '#4A90B8', name: 'Ondas' }, { hex: '#A8CCE0', name: 'Espuma' }, { hex: '#D4C4A8', name: 'Areia Molhada' }] },
  { id: 'dp3',  name: 'Pôr do Sol',   colors: [{ hex: '#1A1035', name: 'Noite' }, { hex: '#6B3FA0', name: 'Roxo' }, { hex: '#E8614A', name: 'Coral' }, { hex: '#F5943A', name: 'Laranja' }, { hex: '#F7CC6A', name: 'Dourado' }] },
  { id: 'dp4',  name: 'Pastel',       colors: [{ hex: '#FFD6D9', name: 'Rosa Bebê' }, { hex: '#DDD6F3', name: 'Lilás' }, { hex: '#C8ECD8', name: 'Menta' }, { hex: '#C8E6F5', name: 'Céu' }, { hex: '#FFE4C8', name: 'Pêssego' }] },
  { id: 'dp5',  name: 'Terroso',      colors: [{ hex: '#2C2A28', name: 'Carvão' }, { hex: '#C4704A', name: 'Ferrugem' }, { hex: '#D4A878', name: 'Caramelo' }, { hex: '#F2EBE0', name: 'Creme' }, { hex: '#FAF8F5', name: 'Branco Quente' }] },
  { id: 'dp6',  name: 'Rosa & Vinho', colors: [{ hex: '#6B1F3A', name: 'Vinho' }, { hex: '#9E3A5A', name: 'Marsala' }, { hex: '#C47A8A', name: 'Rosa Antigo' }, { hex: '#E8B4B8', name: 'Blush' }, { hex: '#F5E6D8', name: 'Champagne' }] },
  { id: 'dp7',  name: 'Minimalista',  colors: [{ hex: '#1A1A1A', name: 'Preto' }, { hex: '#4A4A4A', name: 'Grafite' }, { hex: '#8A8A8A', name: 'Cinza' }, { hex: '#C8C8C8', name: 'Prata' }, { hex: '#F0F0F0', name: 'Gelo' }] },
  { id: 'dp8',  name: 'Floral',       colors: [{ hex: '#3D6B47', name: 'Verde Folha' }, { hex: '#9B72A8', name: 'Lilás' }, { hex: '#C8A8D8', name: 'Lavanda' }, { hex: '#F0C8D8', name: 'Rosa Claro' }, { hex: '#F5E8B8', name: 'Palha' }] },
  { id: 'dp9',  name: 'Vintage',      colors: [{ hex: '#5C3D2E', name: 'Mogno' }, { hex: '#A0522D', name: 'Sienna' }, { hex: '#C8A870', name: 'Âmbar' }, { hex: '#E8D8B0', name: 'Marfim' }, { hex: '#F5F0E8', name: 'Pergaminho' }] },
  { id: 'dp10', name: 'Tropical',     colors: [{ hex: '#1A5C3A', name: 'Selva' }, { hex: '#2E9E5A', name: 'Folha' }, { hex: '#F7B731', name: 'Abacaxi' }, { hex: '#FF6B6B', name: 'Hibisco' }, { hex: '#4ECDC4', name: 'Turquesa' }] },
  { id: 'dp11', name: 'Nórdico',      colors: [{ hex: '#2C3E50', name: 'Meia-Noite' }, { hex: '#7F8C8D', name: 'Chumbo' }, { hex: '#BDC3C7', name: 'Névoa' }, { hex: '#ECF0F1', name: 'Neve' }, { hex: '#E8D5B7', name: 'Bege Quente' }] },
  { id: 'dp12', name: 'Outono',       colors: [{ hex: '#7B3F00', name: 'Castanha' }, { hex: '#CC5500', name: 'Abóbora' }, { hex: '#E8822A', name: 'Laranja Queimado' }, { hex: '#D4A828', name: 'Mostarda' }, { hex: '#8B7355', name: 'Caqui' }] },
  { id: 'dp13', name: 'Jóias',        colors: [{ hex: '#1A1A5E', name: 'Safira' }, { hex: '#2E8B57', name: 'Esmeralda' }, { hex: '#8B0000', name: 'Rubi' }, { hex: '#4B0082', name: 'Ametista' }, { hex: '#DAA520', name: 'Âmbar Dourado' }] },
  { id: 'dp14', name: 'Candy',        colors: [{ hex: '#FF85A1', name: 'Chiclete' }, { hex: '#FFA3D7', name: 'Cotton Candy' }, { hex: '#B8F0E6', name: 'Hortelã' }, { hex: '#FFF0A0', name: 'Baunilha' }, { hex: '#C8B4FF', name: 'Lavanda Doce' }] },
  { id: 'dp15', name: 'Urbano',       colors: [{ hex: '#1C1C1E', name: 'Asfalto' }, { hex: '#48484A', name: 'Concreto' }, { hex: '#98989A', name: 'Cimento' }, { hex: '#FF3B30', name: 'Vermelho Néon' }, { hex: '#F5F5F7', name: 'Alumínio' }] },
  { id: 'dp16', name: 'Aquarela',     colors: [{ hex: '#A8D8EA', name: 'Céu Claro' }, { hex: '#AA96DA', name: 'Lavanda' }, { hex: '#FCBAD3', name: 'Rosé' }, { hex: '#FFFFD2', name: 'Limão' }, { hex: '#B8F4C8', name: 'Menta' }] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const isValidHex = (hex: string) => /^#[0-9A-Fa-f]{6}$/.test(hex);

// ─── PaletteCard ─────────────────────────────────────────────────────────────

interface PaletteCardProps {
  palette: Palette;
  isDefault: boolean;
  onEdit: () => void;
  onDelete: () => void;
  toast: (msg: string) => void;
}

const PaletteCard = ({ palette, isDefault, onEdit, onDelete, toast }: PaletteCardProps) => {
  const copyHex = async (hex: string) => {
    try {
      await Share.share({ message: hex });
      toast('Copiado!');
    } catch {
      // user cancelled share sheet — no-op
    }
  };

  return (
    <View style={styles.paletteCard}>
      <View style={styles.paletteHeader}>
        <Text style={styles.paletteName}>{palette.name}</Text>
        <View style={styles.paletteActions}>
          {!isDefault && (
            <>
              <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={styles.iconBtn}>
                <Icon name="edit" size={15} color={colors.text2} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.iconBtn}>
                <Icon name="trash" size={15} color={colors.red} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={styles.swatchRow}>
        {palette.colors.map((c, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => copyHex(c.hex)}
            activeOpacity={0.75}
            style={styles.swatchWrap}
          >
            <View style={[styles.swatch, { backgroundColor: c.hex }]} />
            <Text style={styles.swatchName} numberOfLines={1}>{c.name}</Text>
            <Text style={styles.swatchHex} numberOfLines={1}>{c.hex}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InspracaoScreen() {
  const [tab, setTab] = useState<Tab>('moodboard');
  const toast = useToast();

  // ── Paletas state ──────────────────────────────────────────────────────────
  const [paletas, savePaletas] = useStorage<Palette[]>('inspiracao:paletas', DEFAULT_PALETTES);

  const [showAddPalette, setShowAddPalette]   = useState(false);
  const [showEditPalette, setShowEditPalette] = useState(false);
  const [editingPalette, setEditingPalette]   = useState<Palette | null>(null);

  const emptyPaletteForm = (): { name: string; colors: PaletteColor[] } => ({
    name: '',
    colors: [
      { hex: '#000000', name: '' },
      { hex: '#000000', name: '' },
      { hex: '#000000', name: '' },
      { hex: '#000000', name: '' },
      { hex: '#000000', name: '' },
    ],
  });

  const [paletteForm, setPaletteForm] = useState(emptyPaletteForm());

  const openAddPalette = () => {
    setPaletteForm(emptyPaletteForm());
    setShowAddPalette(true);
  };

  const openEditPalette = (p: Palette) => {
    setEditingPalette(p);
    setPaletteForm({ name: p.name, colors: p.colors.map(c => ({ ...c })) });
    setShowEditPalette(true);
  };

  const updatePaletteColorField = (
    idx: number,
    field: 'hex' | 'name',
    val: string,
  ) => {
    setPaletteForm(f => {
      const cols = [...f.colors];
      cols[idx] = { ...cols[idx], [field]: val };
      return { ...f, colors: cols };
    });
  };

  const addColorRow = () => {
    setPaletteForm(f => ({ ...f, colors: [...f.colors, { hex: '#000000', name: '' }] }));
  };

  const savePaletteForm = () => {
    if (!paletteForm.name.trim()) { toast('Nome obrigatório'); return; }
    const validColors = paletteForm.colors.filter(c => isValidHex(c.hex));
    if (validColors.length === 0) { toast('Adicione ao menos uma cor válida (#RRGGBB)'); return; }
    const newPalette: Palette = { id: newId(), name: paletteForm.name.trim(), colors: validColors };
    savePaletas((ps: Palette[]) => [...ps, newPalette]);
    setShowAddPalette(false);
    toast('Paleta criada!');
  };

  const saveEditPaletteForm = () => {
    if (!editingPalette) return;
    if (!paletteForm.name.trim()) { toast('Nome obrigatório'); return; }
    const validColors = paletteForm.colors.filter(c => isValidHex(c.hex));
    if (validColors.length === 0) { toast('Adicione ao menos uma cor válida (#RRGGBB)'); return; }
    savePaletas((ps: Palette[]) =>
      ps.map(p =>
        p.id === editingPalette.id
          ? { ...p, name: paletteForm.name.trim(), colors: validColors }
          : p,
      ),
    );
    setShowEditPalette(false);
    setEditingPalette(null);
    toast('Paleta atualizada!');
  };

  const deletePalette = (id: string) => {
    Alert.alert('Remover paleta', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => {
          savePaletas((ps: Palette[]) => ps.filter(p => p.id !== id));
          toast('Paleta removida');
        },
      },
    ]);
  };

  // ── Moodboard state ────────────────────────────────────────────────────────
  const [boards, saveBoards] = useStorage<Board[]>('inspiracao:boards', []);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);

  const addBoard = () => {
    const n = boards.length + 1;
    const board: Board = { id: newId(), name: `Quadro ${n}`, items: [] };
    saveBoards((bs: Board[]) => [...bs, board]);
  };

  const deleteBoard = (id: string) => {
    Alert.alert('Remover quadro', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => {
          saveBoards((bs: Board[]) => bs.filter(b => b.id !== id));
          if (activeBoard?.id === id) setActiveBoard(null);
          toast('Quadro removido');
        },
      },
    ]);
  };

  const renameBoard = (id: string, name: string) => {
    saveBoards((bs: Board[]) => bs.map(b => b.id === id ? { ...b, name } : b));
    if (activeBoard?.id === id) setActiveBoard(prev => prev ? { ...prev, name } : prev);
  };

  const [renamingId, setRenamingId]     = useState<string | null>(null);
  const [renameText, setRenameText]     = useState('');

  const openRename = (b: Board) => {
    setRenamingId(b.id);
    setRenameText(b.name);
  };

  const confirmRename = () => {
    if (renamingId && renameText.trim()) {
      renameBoard(renamingId, renameText.trim());
      toast('Quadro renomeado');
    }
    setRenamingId(null);
  };

  const addPhoto = useCallback(async () => {
    if (!activeBoard) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão negada', 'Permita acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      base64: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;
    const updatedItems = [...(activeBoard.items ?? []), uri];
    const updated = { ...activeBoard, items: updatedItems };
    setActiveBoard(updated);
    saveBoards((bs: Board[]) => bs.map(b => b.id === activeBoard.id ? updated : b));
    toast('Foto adicionada!');
  }, [activeBoard, saveBoards]);

  const removePhoto = useCallback((idx: number) => {
    if (!activeBoard) return;
    const updatedItems = activeBoard.items.filter((_, i) => i !== idx);
    const updated = { ...activeBoard, items: updatedItems };
    setActiveBoard(updated);
    saveBoards((bs: Board[]) => bs.map(b => b.id === activeBoard.id ? updated : b));
  }, [activeBoard, saveBoards]);

  const clearPhotos = () => {
    if (!activeBoard) return;
    Alert.alert('Limpar fotos', 'Remover todas as fotos deste quadro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Limpar', style: 'destructive',
        onPress: () => {
          const updated = { ...activeBoard, items: [] };
          setActiveBoard(updated);
          saveBoards((bs: Board[]) => bs.map(b => b.id === activeBoard.id ? updated : b));
          toast('Fotos removidas');
        },
      },
    ]);
  };

  // ─── Tab bar ────────────────────────────────────────────────────────────────

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: 'moodboard', label: 'Moodboard' },
    { key: 'paletas',   label: 'Paletas' },
    { key: 'portfolio', label: 'Portfólio' },
  ];

  const handleTabPress = (t: Tab) => {
    if (t === 'portfolio') {
      router.push('/screens/portfolio' as any);
      return;
    }
    setTab(t);
    setActiveBoard(null);
  };

  // ─── Palette form body (shared by add & edit) ────────────────────────────

  const PaletteFormBody = () => (
    <>
      <TextInput
        style={styles.input}
        placeholder="Nome da paleta"
        placeholderTextColor={colors.text3}
        value={paletteForm.name}
        onChangeText={v => setPaletteForm(f => ({ ...f, name: v }))}
        autoFocus
      />
      <Text style={styles.fieldLabel}>Cores</Text>
      {paletteForm.colors.map((c, idx) => (
        <View key={idx} style={styles.colorRow}>
          <View style={[styles.colorPreview, { backgroundColor: isValidHex(c.hex) ? c.hex : colors.bg3 }]} />
          <TextInput
            style={[styles.input, styles.hexInput]}
            placeholder="#RRGGBB"
            placeholderTextColor={colors.text3}
            value={c.hex}
            onChangeText={v => updatePaletteColorField(idx, 'hex', v)}
            autoCapitalize="characters"
            maxLength={7}
          />
          <TextInput
            style={[styles.input, styles.nameInput]}
            placeholder="Nome"
            placeholderTextColor={colors.text3}
            value={c.name}
            onChangeText={v => updatePaletteColorField(idx, 'name', v)}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addColorBtn} onPress={addColorRow} activeOpacity={0.7}>
        <Icon name="plus" size={14} color={colors.accent} />
        <Text style={styles.addColorText}>Adicionar cor</Text>
      </TouchableOpacity>
    </>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Inspiração"
        subtitle="Moodboard, paletas e portfólio"
        action={
          tab === 'paletas' ? (
            <TouchableOpacity onPress={openAddPalette} activeOpacity={0.7}>
              <Icon name="plus" size={20} color={colors.accent} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TAB_ITEMS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => handleTabPress(t.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── PALETAS TAB ─────────────────────────────────────────────────── */}
      {tab === 'paletas' && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {paletas.map(p => (
            <PaletteCard
              key={p.id}
              palette={p}
              isDefault={DEFAULT_PALETTES.some(d => d.id === p.id)}
              onEdit={() => openEditPalette(p)}
              onDelete={() => deletePalette(p.id)}
              toast={toast}
            />
          ))}

          {paletas.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎨</Text>
              <Text style={styles.emptyText}>Nenhuma paleta ainda</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── MOODBOARD TAB ───────────────────────────────────────────────── */}
      {tab === 'moodboard' && !activeBoard && (
        // Gallery view — 2-column grid of board cards
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {boards.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🖼️</Text>
              <Text style={styles.emptyText}>Nenhum quadro ainda</Text>
              <Text style={styles.emptySub}>Toque em + para criar seu primeiro moodboard</Text>
            </View>
          )}

          <View style={styles.boardGrid}>
            {boards.map(b => (
              <TouchableOpacity
                key={b.id}
                style={styles.boardCard}
                onPress={() => setActiveBoard(b)}
                activeOpacity={0.8}
              >
                {/* Image preview strip */}
                <View style={styles.boardPreview}>
                  {b.items.length === 0 ? (
                    <View style={styles.boardEmptyPreview}>
                      <Text style={styles.boardEmptyEmoji}>🖼️</Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flex}>
                      {b.items.slice(0, 3).map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.boardThumb} />
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* Board info */}
                <View style={styles.boardInfo}>
                  {renamingId === b.id ? (
                    <TextInput
                      style={styles.renameInput}
                      value={renameText}
                      onChangeText={setRenameText}
                      onSubmitEditing={confirmRename}
                      onBlur={confirmRename}
                      autoFocus
                    />
                  ) : (
                    <Text style={styles.boardName} numberOfLines={1}>{b.name}</Text>
                  )}
                  <Text style={styles.boardCount}>{b.items.length} foto{b.items.length !== 1 ? 's' : ''}</Text>
                  <View style={styles.boardActionsRow}>
                    <TouchableOpacity
                      onPress={e => { e.stopPropagation?.(); openRename(b); }}
                      activeOpacity={0.7}
                      style={styles.boardActionBtn}
                    >
                      <Icon name="edit" size={13} color={colors.text2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={e => { e.stopPropagation?.(); deleteBoard(b.id); }}
                      activeOpacity={0.7}
                      style={styles.boardActionBtn}
                    >
                      <Icon name="trash" size={13} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add board button */}
          <TouchableOpacity style={styles.addBoardBtn} onPress={addBoard} activeOpacity={0.8}>
            <Icon name="plus" size={18} color={colors.accent} />
            <Text style={styles.addBoardText}>Novo quadro</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {tab === 'moodboard' && activeBoard && (
        // Editor view
        // NOTE: This is a simplified RN version — no drag-and-drop, no canvas drawing,
        // no rotation. Full drag/draw functionality would require react-native-skia.
        <View style={styles.flex}>
          {/* Back link */}
          <TouchableOpacity
            style={styles.editorBack}
            onPress={() => setActiveBoard(null)}
            activeOpacity={0.7}
          >
            <Icon name="arrowLeft" size={16} color={colors.accent} />
            <Text style={styles.editorBackText}>Quadros</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.editorContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.editorTitle}>{activeBoard.name}</Text>
            <Text style={styles.editorSub}>{activeBoard.items.length} foto{activeBoard.items.length !== 1 ? 's' : ''}</Text>

            {/* Horizontal image gallery */}
            {activeBoard.items.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.galleryScroll}
                contentContainerStyle={styles.galleryContent}
              >
                {activeBoard.items.map((uri, idx) => (
                  <View key={idx} style={styles.galleryItem}>
                    <Image source={{ uri }} style={styles.galleryImg} />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => removePhoto(idx)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Icon name="x" size={12} color={colors.surface} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {activeBoard.items.length === 0 && (
              <View style={styles.editorEmpty}>
                <Text style={styles.editorEmptyEmoji}>🖼️</Text>
                <Text style={styles.editorEmptyText}>Nenhuma foto ainda</Text>
                <Text style={styles.editorEmptySub}>Toque em "Adicionar foto" para começar</Text>
              </View>
            )}

            {/* Action buttons */}
            <TouchableOpacity style={styles.btnPrimary} onPress={addPhoto} activeOpacity={0.85}>
              <Icon name="camera" size={16} color={colors.bg} />
              <Text style={styles.btnPrimaryText}>Adicionar foto</Text>
            </TouchableOpacity>

            {activeBoard.items.length > 0 && (
              <TouchableOpacity style={styles.btnDanger} onPress={clearPhotos} activeOpacity={0.85}>
                <Icon name="trash" size={16} color={colors.red} />
                <Text style={styles.btnDangerText}>Limpar fotos</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── ADD PALETTE MODAL ──────────────────────────────────────────── */}
      <Modal
        open={showAddPalette}
        onClose={() => setShowAddPalette(false)}
        title="Nova paleta"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={savePaletteForm} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar paleta</Text>
          </TouchableOpacity>
        }
      >
        <PaletteFormBody />
      </Modal>

      {/* ── EDIT PALETTE MODAL ─────────────────────────────────────────── */}
      <Modal
        open={showEditPalette}
        onClose={() => { setShowEditPalette(false); setEditingPalette(null); }}
        title="Editar paleta"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={saveEditPaletteForm} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Salvar alterações</Text>
          </TouchableOpacity>
        }
      >
        <PaletteFormBody />
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_GAP   = 12;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.screenPad * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: spacing.screenPad,
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.accent,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text3,
  },
  tabLabelActive: {
    color: colors.accent,
  },

  // ── Scroll / layout ────────────────────────────────────────────────────────
  scrollContent: {
    padding: spacing.screenPad,
    paddingBottom: 40,
    gap: 16,
  },

  // ── Empty states ───────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text2,
  },
  emptySub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // ── Palette card ───────────────────────────────────────────────────────────
  paletteCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 16,
    gap: 12,
  },
  paletteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paletteName: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.text,
  },
  paletteActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  swatchWrap: {
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  swatchName: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.text2,
    textAlign: 'center',
    maxWidth: 54,
  },
  swatchHex: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.text3,
    textAlign: 'center',
  },

  // ── Moodboard grid ─────────────────────────────────────────────────────────
  boardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  boardCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  boardPreview: {
    height: 120,
    backgroundColor: colors.bg2,
    overflow: 'hidden',
  },
  boardEmptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardEmptyEmoji: {
    fontSize: 32,
  },
  boardThumb: {
    width: 80,
    height: 80,
    margin: 4,
    borderRadius: radius.sm,
  },
  boardInfo: {
    padding: 10,
    gap: 4,
  },
  boardName: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text,
  },
  boardCount: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text3,
  },
  boardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  boardActionBtn: {
    padding: 4,
  },
  renameInput: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
  },

  // ── Add board button ───────────────────────────────────────────────────────
  addBoardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 16,
    backgroundColor: colors.accentBg,
    marginTop: 4,
  },
  addBoardText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.accent,
  },

  // ── Board editor ───────────────────────────────────────────────────────────
  editorBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.screenPad,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.bg,
  },
  editorBackText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.accent,
  },
  editorContent: {
    padding: spacing.screenPad,
    paddingBottom: 48,
    gap: 16,
  },
  editorTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
  },
  editorSub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
    marginTop: -8,
  },
  galleryScroll: {
    flexGrow: 0,
  },
  galleryContent: {
    gap: 10,
    paddingRight: 4,
  },
  galleryItem: {
    position: 'relative',
  },
  galleryImg: {
    width: 160,
    height: 120,
    borderRadius: radius.sm,
    backgroundColor: colors.bg3,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  editorEmptyEmoji: {
    fontSize: 36,
  },
  editorEmptyText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text2,
  },
  editorEmptySub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text3,
    textAlign: 'center',
  },

  // ── Palette form ───────────────────────────────────────────────────────────
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
  },
  fieldLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
    marginTop: 4,
    marginBottom: 4,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreview: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    flexShrink: 0,
  },
  hexInput: {
    width: 108,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
  },
  nameInput: {
    flex: 1,
    paddingVertical: 10,
  },
  addColorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  addColorText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.accent,
  },

  // ── Primary / danger buttons ───────────────────────────────────────────────
  btnPrimary: {
    backgroundColor: colors.text,
    borderRadius: radius.sm,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.bg,
  },
  btnDanger: {
    backgroundColor: colors.redBg,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnDangerText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.red,
  },
});
