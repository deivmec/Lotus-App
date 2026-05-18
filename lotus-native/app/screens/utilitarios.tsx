import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet,
} from 'react-native';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius, spacing } from '../../lib/theme';

const newId = () => Date.now().toString();
const TABS = ['calc', 'moeda', 'medidas', 'contagem'] as const;
const TAB_LABELS: Record<string, string> = { calc: 'Calculadora', moeda: 'Moedas', medidas: 'Medidas', contagem: 'Contagem' };

const RATES: Record<string, number> = { BRL: 1, USD: 0.19, EUR: 0.18, GBP: 0.15, JPY: 28.5, ARS: 188 };
const MOEDAS = ['BRL', 'USD', 'EUR', 'GBP', 'JPY', 'ARS'];

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

const WEIGHT_UNITS = [
  { id: 'kg', label: 'kg',  toBase: 1,       fromBase: 1 },
  { id: 'g',  label: 'g',   toBase: 0.001,   fromBase: 1000 },
  { id: 'lb', label: 'lb',  toBase: 0.4536,  fromBase: 2.2046 },
  { id: 'oz', label: 'oz',  toBase: 0.0283,  fromBase: 35.274 },
];
const DIST_UNITS = [
  { id: 'km', label: 'km',  toBase: 1,        fromBase: 1 },
  { id: 'm',  label: 'm',   toBase: 0.001,    fromBase: 1000 },
  { id: 'mi', label: 'mi',  toBase: 1.60934,  fromBase: 0.62137 },
  { id: 'ft', label: 'ft',  toBase: 0.0003048, fromBase: 3280.84 },
  { id: 'in', label: 'in',  toBase: 0.0254,   fromBase: 39.3701 },
];

const convertUnit = (value: string, fromId: string, toId: string, units: typeof WEIGHT_UNITS) => {
  const v = parseFloat(value) || 0;
  const from = units.find(u => u.id === fromId);
  const to = units.find(u => u.id === toId);
  if (!from || !to) return '0';
  const result = v * from.toBase * to.fromBase;
  return result % 1 === 0 ? String(result) : result.toFixed(4).replace(/\.?0+$/, '');
};

const convertTemp = (value: string, from: string, to: string) => {
  const v = parseFloat(value);
  if (isNaN(v)) return '—';
  if (from === to) return String(v);
  if (from === 'C' && to === 'F') return ((v * 9 / 5) + 32).toFixed(1);
  if (from === 'F' && to === 'C') return ((v - 32) * 5 / 9).toFixed(1);
  return '—';
};

const daysUntil = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
};

interface UnitConverterProps {
  label: string;
  units: typeof WEIGHT_UNITS;
  value: string;
  setValue: (v: string) => void;
  fromUnit: string;
  setFrom: (v: string) => void;
  toUnit: string;
  setTo: (v: string) => void;
}

const UnitConverter = ({ label, units, value, setValue, fromUnit, setFrom, toUnit, setTo }: UnitConverterProps) => (
  <View style={ucStyles.card}>
    <Text style={ucStyles.label}>{label.toUpperCase()}</Text>
    <View style={ucStyles.row}>
      <View style={ucStyles.side}>
        <TextInput
          style={ucStyles.input}
          value={value}
          onChangeText={setValue}
          placeholder="0"
          placeholderTextColor={colors.text3}
          keyboardType="numeric"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <View style={ucStyles.unitRow}>
            {units.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[ucStyles.unitBtn, fromUnit === u.id && ucStyles.unitBtnActive]}
                onPress={() => setFrom(u.id)}
                activeOpacity={0.7}
              >
                <Text style={[ucStyles.unitText, fromUnit === u.id && ucStyles.unitTextActive]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <TouchableOpacity onPress={() => { setFrom(toUnit); setTo(fromUnit); }} activeOpacity={0.7} style={ucStyles.swapBtn}>
        <Icon name="arrow" size={18} color={colors.text2} />
      </TouchableOpacity>
      <View style={ucStyles.side}>
        <View style={ucStyles.resultBox}>
          <Text style={ucStyles.resultText}>{convertUnit(value, fromUnit, toUnit, units)}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
          <View style={ucStyles.unitRow}>
            {units.map(u => (
              <TouchableOpacity
                key={u.id}
                style={[ucStyles.unitBtn, toUnit === u.id && ucStyles.unitBtnActive]}
                onPress={() => setTo(u.id)}
                activeOpacity={0.7}
              >
                <Text style={[ucStyles.unitText, toUnit === u.id && ucStyles.unitTextActive]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  </View>
);

const ucStyles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14, marginBottom: 12 },
  label: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3, letterSpacing: 0.7, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { flex: 1 },
  input: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.sans, fontSize: 15, color: colors.text },
  unitRow: { flexDirection: 'row', gap: 4 },
  unitBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bg2 },
  unitBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  unitText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3 },
  unitTextActive: { color: colors.accentDk },
  swapBtn: { padding: 8 },
  resultBox: { backgroundColor: colors.bg2, borderRadius: radius.sm, padding: 12, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  resultText: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
});

export default function UtilitariosScreen() {
  const [tab, setTab] = useState<typeof TABS[number]>('calc');
  const toast = useToast();

  // Calculadora
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  const isOper = (b: string) => ['+', '−', '×', '÷'].includes(b);

  const calcPress = (btn: string) => {
    if (btn === 'C') { setDisplay('0'); setPrev(null); setOp(null); setResetNext(false); return; }
    if (btn === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (btn === '±') { setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d); return; }
    if (btn === '%') { setDisplay(d => String(parseFloat(d) / 100)); return; }
    if (isOper(btn)) { setPrev(parseFloat(display)); setOp(btn); setResetNext(true); return; }
    if (btn === '=') {
      if (prev === null || !op) return;
      const cur = parseFloat(display);
      const ops: Record<string, number> = { '+': prev + cur, '−': prev - cur, '×': prev * cur, '÷': prev / cur };
      const result = ops[op];
      setDisplay(String(Number.isFinite(result) ? result : 'Erro'));
      setPrev(null); setOp(null); setResetNext(true); return;
    }
    if (btn === '.') {
      if (resetNext) { setDisplay('0.'); setResetNext(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }
    if (resetNext) { setDisplay(btn); setResetNext(false); return; }
    setDisplay(d => d === '0' ? btn : d + btn);
  };

  // Moeda
  const [amount, setAmount] = useState('100');
  const [fromCurr, setFromCurr] = useState('BRL');
  const [toCurr, setToCurr]     = useState('USD');
  const convertCurr = () => ((parseFloat(amount) || 0) / RATES[fromCurr] * RATES[toCurr]).toFixed(2);

  // Medidas
  const [weightVal, setWeightVal] = useState('');
  const [weightFrom, setWeightFrom] = useState('kg');
  const [weightTo, setWeightTo]     = useState('lb');
  const [distVal, setDistVal]     = useState('');
  const [distFrom, setDistFrom]   = useState('km');
  const [distTo, setDistTo]       = useState('in');
  const [tempVal, setTempVal]     = useState('');
  const [tempFrom, setTempFrom]   = useState('C');
  const [tempTo, setTempTo]       = useState('F');

  // Contagem
  const [countdowns, saveCountdowns] = useStorage<any[]>('utilitarios:countdowns', []);
  const [events, saveEvents]         = useStorage<any[]>('events:items', []);
  const [showCdModal, setShowCdModal] = useState(false);
  const [newCd, setNewCd] = useState({ label: '', date: '' });

  const addCountdown = () => {
    if (!newCd.label.trim() || !newCd.date) return;
    const id = newId();
    saveCountdowns((cs: any[]) => [...cs, { id, ...newCd }]);
    saveEvents((evs: any[]) => [...evs, { id: newId(), title: `⏳ ${newCd.label}`, date: newCd.date, time: '00:00', category: 'contagem', sourceId: id }]);
    setNewCd({ label: '', date: '' });
    setShowCdModal(false);
    toast('Contagem criada e adicionada ao calendário');
  };

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Utilitários"
        action={tab === 'contagem' ? (
          <TouchableOpacity onPress={() => setShowCdModal(true)} activeOpacity={0.7}>
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        ) : undefined}
      />

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollBar} contentContainerStyle={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Calculadora ── */}
        {tab === 'calc' && (
          <View>
            <View style={styles.calcDisplay}>
              <Text style={styles.calcPrev}>{prev !== null ? `${prev} ${op}` : ''}</Text>
              <Text style={[styles.calcNum, { fontSize: display.length > 10 ? 28 : 42 }]}>{display}</Text>
            </View>
            <View style={styles.calcGrid}>
              {CALC_BUTTONS.flat().map((btn, i) => {
                const isOp = isOper(btn);
                const isEq = btn === '=';
                const isZero = btn === '0';
                const isClear = btn === 'C';
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.calcBtn,
                      isZero && styles.calcBtnWide,
                      isEq && styles.calcBtnEq,
                      isOp && styles.calcBtnOp,
                      isClear && styles.calcBtnClear,
                    ]}
                    onPress={() => calcPress(btn)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.calcBtnText, isEq && styles.calcBtnTextEq, isOp && styles.calcBtnTextOp]}>{btn}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Moedas ── */}
        {tab === 'moeda' && (
          <View style={styles.gap16}>
            <Text style={styles.sectionLabel}>Taxas aproximadas · sem internet</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Valor</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.text3}
              />
              <View style={styles.currRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>De</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRowH}>
                      {MOEDAS.map(m => (
                        <TouchableOpacity key={m} style={[styles.chip, fromCurr === m && styles.chipActive]} onPress={() => setFromCurr(m)} activeOpacity={0.7}>
                          <Text style={[styles.chipText, fromCurr === m && styles.chipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <TouchableOpacity style={styles.swapCurrBtn} onPress={() => { setFromCurr(toCurr); setToCurr(fromCurr); }} activeOpacity={0.7}>
                  <Icon name="arrow" size={18} color={colors.text2} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Para</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRowH}>
                      {MOEDAS.map(m => (
                        <TouchableOpacity key={m} style={[styles.chip, toCurr === m && styles.chipActive]} onPress={() => setToCurr(m)} activeOpacity={0.7}>
                          <Text style={[styles.chipText, toCurr === m && styles.chipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
              <View style={styles.resultBig}>
                <Text style={styles.resultBigSub}>{amount || 0} {fromCurr} =</Text>
                <Text style={styles.resultBigNum}>{convertCurr()} {toCurr}</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>Taxas base (vs BRL)</Text>
            <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
              {MOEDAS.filter(m => m !== 'BRL').map((m, i, arr) => (
                <View key={m} style={[styles.rateRow, i < arr.length - 1 && styles.rateRowBorder]}>
                  <Text style={styles.rateName}>{m}</Text>
                  <Text style={styles.rateVal}>1 {m} = R$ {(1 / RATES[m]).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Medidas ── */}
        {tab === 'medidas' && (
          <View>
            <UnitConverter label="Peso" units={WEIGHT_UNITS} value={weightVal} setValue={setWeightVal} fromUnit={weightFrom} setFrom={setWeightFrom} toUnit={weightTo} setTo={setWeightTo} />
            <UnitConverter label="Distância" units={DIST_UNITS} value={distVal} setValue={setDistVal} fromUnit={distFrom} setFrom={setDistFrom} toUnit={distTo} setTo={setDistTo} />
            <View style={ucStyles.card}>
              <Text style={ucStyles.label}>TEMPERATURA</Text>
              <View style={ucStyles.row}>
                <View style={ucStyles.side}>
                  <TextInput style={ucStyles.input} value={tempVal} onChangeText={setTempVal} placeholder="0" placeholderTextColor={colors.text3} keyboardType="numeric" />
                  <View style={[ucStyles.unitRow, { marginTop: 6 }]}>
                    {['C', 'F'].map(u => (
                      <TouchableOpacity key={u} style={[ucStyles.unitBtn, tempFrom === u && ucStyles.unitBtnActive]} onPress={() => setTempFrom(u)} activeOpacity={0.7}>
                        <Text style={[ucStyles.unitText, tempFrom === u && ucStyles.unitTextActive]}>°{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity onPress={() => { setTempFrom(tempTo); setTempTo(tempFrom); }} activeOpacity={0.7} style={ucStyles.swapBtn}>
                  <Icon name="arrow" size={18} color={colors.text2} />
                </TouchableOpacity>
                <View style={ucStyles.side}>
                  <View style={ucStyles.resultBox}>
                    <Text style={ucStyles.resultText}>{tempVal ? convertTemp(tempVal, tempFrom, tempTo) : '—'}</Text>
                  </View>
                  <View style={[ucStyles.unitRow, { marginTop: 6 }]}>
                    {['C', 'F'].map(u => (
                      <TouchableOpacity key={u} style={[ucStyles.unitBtn, tempTo === u && ucStyles.unitBtnActive]} onPress={() => setTempTo(u)} activeOpacity={0.7}>
                        <Text style={[ucStyles.unitText, tempTo === u && ucStyles.unitTextActive]}>°{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Contagem ── */}
        {tab === 'contagem' && (
          <View style={styles.gap16}>
            {countdowns.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>⏳</Text>
                <Text style={styles.emptyText}>Nenhuma contagem ainda</Text>
              </View>
            ) : (
              countdowns.map(cd => {
                const days = daysUntil(cd.date);
                const isPast = days < 0;
                const isToday = days === 0;
                return (
                  <View key={cd.id} style={styles.cdCard}>
                    <TouchableOpacity onPress={() => { saveCountdowns((cs: any[]) => cs.filter(c => c.id !== cd.id)); toast('Removido'); }} activeOpacity={0.7} style={styles.cdDel}>
                      <Icon name="trash" size={14} color={colors.text3} />
                    </TouchableOpacity>
                    <Text style={[styles.cdNum, { color: isPast ? colors.text3 : isToday ? colors.green : colors.text }]}>
                      {isToday ? '🎉' : Math.abs(days)}
                    </Text>
                    {!isToday && (
                      <Text style={[styles.cdSub, { color: isPast ? colors.text3 : colors.text2 }]}>
                        {isPast ? `dia${Math.abs(days) !== 1 ? 's' : ''} atrás` : `dia${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
                      </Text>
                    )}
                    {isToday && <Text style={styles.cdToday}>Hoje!</Text>}
                    <Text style={styles.cdLabel}>{cd.label}</Text>
                    <Text style={styles.cdDate}>{cd.date}</Text>
                  </View>
                );
              })
            )}
            <TouchableOpacity style={styles.btnAdd} onPress={() => setShowCdModal(true)} activeOpacity={0.7}>
              <Icon name="plus" size={16} color={colors.text2} />
              <Text style={styles.btnAddText}>Nova contagem</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal open={showCdModal} onClose={() => setShowCdModal(false)} title="Nova contagem regressiva"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addCountdown} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Criar</Text>
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="Ex: Viagem para o Japão"
          placeholderTextColor={colors.text3}
          value={newCd.label}
          onChangeText={v => setNewCd(c => ({ ...c, label: v }))}
          autoFocus
        />
        <Text style={styles.fieldLabel}>Data do evento (AAAA-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2025-12-31"
          placeholderTextColor={colors.text3}
          value={newCd.date}
          onChangeText={v => setNewCd(c => ({ ...c, date: v }))}
          keyboardType="numeric"
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  tabScrollBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  tabRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.screenPad, paddingVertical: 12 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface },
  tabBtnActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  tabText: { fontFamily: fonts.sans, fontSize: 13, fontWeight: '500', color: colors.text2 },
  tabTextActive: { color: colors.accentDk },
  content: { padding: spacing.screenPad, paddingBottom: 40 },
  gap16: { gap: 16 },
  calcDisplay: {
    backgroundColor: colors.text, borderRadius: radius.md, paddingHorizontal: 20,
    paddingTop: 24, paddingBottom: 16, marginBottom: 12,
  },
  calcPrev: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'right', minHeight: 16, marginBottom: 4 },
  calcNum: { fontFamily: fonts.serif, color: 'white', textAlign: 'right', lineHeight: 1.1 },
  calcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calcBtn: {
    width: '22%', aspectRatio: 1.1,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.line,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  calcBtnWide: { width: '48%' },
  calcBtnEq: { backgroundColor: colors.accent, borderColor: colors.accent },
  calcBtnOp: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  calcBtnClear: { backgroundColor: colors.bg3, borderColor: colors.bg3 },
  calcBtnText: { fontFamily: fonts.sans, fontSize: 18, fontWeight: '500', color: colors.text },
  calcBtnTextEq: { color: 'white' },
  calcBtnTextOp: { color: colors.accent },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  sectionLabel: { fontFamily: fonts.sans, fontSize: 11, fontWeight: '600', color: colors.text3, letterSpacing: 0.6, textTransform: 'uppercase' },
  fieldLabel: { fontFamily: fonts.sans, fontSize: 12, fontWeight: '500', color: colors.text2, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm,
    paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  currRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  swapCurrBtn: { padding: 8, marginTop: 28 },
  chipRowH: { flexDirection: 'row', gap: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.bg2 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  chipText: { fontFamily: fonts.sans, fontSize: 12, color: colors.text2 },
  chipTextActive: { color: colors.accentDk },
  resultBig: { backgroundColor: colors.bg2, borderRadius: radius.sm, padding: 16, alignItems: 'center', marginTop: 12 },
  resultBigSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.text3, marginBottom: 4 },
  resultBigNum: { fontFamily: fonts.serif, fontSize: 32, color: colors.text },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  rateRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rateName: { fontFamily: fonts.sans, fontSize: 14, fontWeight: '500', color: colors.text },
  rateVal: { fontFamily: fonts.sans, fontSize: 13, color: colors.text2, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text3 },
  cdCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 20, alignItems: 'center' },
  cdDel: { position: 'absolute', top: 12, right: 12, padding: 4 },
  cdNum: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 56 },
  cdSub: { fontFamily: fonts.sans, fontSize: 13, marginBottom: 8 },
  cdToday: { fontFamily: fonts.sans, fontSize: 13, color: colors.green, fontWeight: '600', marginBottom: 8 },
  cdLabel: { fontFamily: fonts.sans, fontSize: 15, fontWeight: '500', color: colors.text, marginBottom: 4 },
  cdDate: { fontFamily: fonts.sans, fontSize: 11, color: colors.text3 },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 12, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, borderStyle: 'dashed',
  },
  btnAddText: { fontFamily: fonts.sans, fontSize: 14, color: colors.text2 },
  btnPrimary: { backgroundColor: colors.text, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.bg },
});
