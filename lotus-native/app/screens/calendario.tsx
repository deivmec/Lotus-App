import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, useWindowDimensions,
} from 'react-native';
import Svg, { Path, Rect, Polygon, Circle, Line, Ellipse } from 'react-native-svg';
import BackHeader from '../../components/BackHeader';
import Modal from '../../components/Modal';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../components/Toast';
import { colors, fonts, radius } from '../../lib/theme';

const newId = () => Date.now().toString();
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEK = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const CAT_COLORS: Record<string, string> = {
  pessoal:     colors.accent,
  trabalho:    colors.blue,
  saude:       colors.green,
  viagem:      '#C4853A',
  natal:       '#4A8C55',
  aniversario: '#C45680',
};

const CATEGORIES = Object.keys(CAT_COLORS);

const Sticker = ({ category, size = 16 }: { category: string; size?: number }) => {
  const s = size;
  if (category === 'natal') return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Rect x="8.5" y="16" width="3" height="3.5" rx={0.5} fill="#8B6534" />
      <Polygon points="10,2 14.5,8.5 5.5,8.5" fill="#2E7D32" />
      <Polygon points="10,6 15.5,13 4.5,13" fill="#388E3C" />
      <Polygon points="10,10 16,18 4,18" fill="#43A047" />
      <Circle cx="10" cy="1.5" r="1.5" fill="#FDD835" />
      <Circle cx="8" cy="10.5" r="1" fill="#E53935" />
      <Circle cx="13" cy="12" r="0.8" fill="#FDD835" />
      <Circle cx="7" cy="14" r="0.8" fill="#1976D2" />
    </Svg>
  );
  if (category === 'trabalho') return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Rect x="2" y="8" width="16" height="10" rx={2} fill="#6D4C41" />
      <Path d="M7 8V6C7 5.45 7.45 5 8 5h4c.55 0 1 .45 1 1v2" stroke="#4E342E" strokeWidth={1.5} fill="none" />
      <Rect x="2" y="12" width="16" height="1" fill="#5D4037" />
      <Rect x="8.5" y="11" width="3" height="3" rx={0.5} fill="#8D6E63" />
      <Circle cx="10" cy="12.5" r="0.8" fill="#BCAAA4" />
    </Svg>
  );
  if (category === 'aniversario') return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Polygon points="10,2 4.5,16 15.5,16" fill="#E91E63" />
      <Line x1="7.5" y1="10" x2="10" y2="2" stroke="white" strokeWidth={0.8} strokeOpacity={0.4} />
      <Line x1="12.5" y1="10" x2="10" y2="2" stroke="white" strokeWidth={0.8} strokeOpacity={0.4} />
      <Ellipse cx="10" cy="16" rx="5.5" ry="1.8" fill="#F48FB1" />
      <Circle cx="10" cy="1.2" r="1.8" fill="#FFC107" />
      <Path d="M8.8 0.5 Q10 -0.5 11.2 0.5" stroke="#FF8F00" strokeWidth={1} fill="none" strokeLinecap="round" />
      <Circle cx="7" cy="12" r="0.8" fill="white" fillOpacity={0.5} />
      <Circle cx="13" cy="13" r="0.8" fill="white" fillOpacity={0.5} />
    </Svg>
  );
  if (category === 'saude') return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Path d="M10 16C10 16 3 11 3 7C3 4.8 4.8 3 7 3C8.3 3 9.5 3.7 10 4.8C10.5 3.7 11.7 3 13 3C15.2 3 17 4.8 17 7C17 11 10 16 10 16Z" fill="#E53935" />
      <Line x1="10" y1="6" x2="10" y2="12" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <Line x1="7" y1="9" x2="13" y2="9" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
  if (category === 'viagem') return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Path d="M17 7.5L11 10.5L10 3.5H8L9 10.5L3 13.5V15L9.5 13.5L10 18H12L12.5 13.5L19 15V13.5L13 10.5L17 7.5Z" fill="#1976D2" />
    </Svg>
  );
  // pessoal (default) — heart
  return (
    <Svg width={s} height={s} viewBox="0 0 20 20">
      <Path d="M10 16L4 10.5C2.5 9 2.5 6.5 4.5 5.2C6 4.2 8 4.8 10 7C12 4.8 14 4.2 15.5 5.2C17.5 6.5 17.5 9 16 10.5L10 16Z" fill="#E91E63" />
    </Svg>
  );
};

export default function Calendario() {
  const { width } = useWindowDimensions();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(todayStr);
  const [events, saveEvents] = useStorage<any[]>('events:items', []);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: selected, time: '09:00', category: 'pessoal' });
  const toast = useToast();

  const addEvent = () => {
    if (!form.title.trim()) return;
    saveEvents(ev => [...ev, { id: newId(), ...form, color: CAT_COLORS[form.category] }]);
    setForm(f => ({ ...f, title: '', time: '09:00' }));
    setShowModal(false);
    toast('Evento adicionado');
  };

  const delEvent = (id: string) => {
    Alert.alert('Remover evento', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => { saveEvents(ev => ev.filter(e => e.id !== id)); toast('Evento removido'); } },
    ]);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventsOnDay = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === d);
  };

  const selectedEvents = events
    .filter(e => e.date === selected)
    .sort((a, b) => (a.time > b.time ? 1 : -1));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  // Cell width: 7 columns inside 12px horizontal padding, 2px gap between cells
  const cellW = Math.floor((width - 24 - 12) / 7);

  return (
    <View style={styles.screen}>
      <BackHeader
        title="Calendário"
        action={
          <TouchableOpacity
            onPress={() => { setForm(f => ({ ...f, date: selected })); setShowModal(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="plus" size={20} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Icon name="arrowLeft" size={20} color={colors.text2} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Icon name="arrow" size={20} color={colors.text2} />
          </TouchableOpacity>
        </View>

        {/* Week day headers */}
        <View style={styles.weekRow}>
          {WEEK.map(d => (
            <View key={d} style={[styles.weekCell, { width: cellW }]}>
              <Text style={styles.weekLabel}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`e${i}`} style={{ width: cellW, height: 52 }} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSel = dateStr === selected;
            const dayEvents = eventsOnDay(day);
            return (
              <TouchableOpacity
                key={`d${i}`}
                onPress={() => setSelected(dateStr)}
                style={[
                  styles.dayCell,
                  { width: cellW, minHeight: 52 },
                  isSel && styles.dayCellSelected,
                  isToday && !isSel && styles.dayCellToday,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayNum,
                  (isSel || isToday) && styles.dayNumAccent,
                ]}>
                  {day}
                </Text>
                <View style={styles.stickersRow}>
                  {dayEvents.slice(0, 3).map((e, ei) => (
                    <Sticker key={ei} category={e.category} size={11} />
                  ))}
                  {dayEvents.length > 3 && (
                    <Text style={styles.moreText}>+{dayEvents.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected day events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionLabel}>{fmtDate(selected)}</Text>
            <TouchableOpacity onPress={() => { setForm(f => ({ ...f, date: selected })); setShowModal(true); }}>
              <Text style={styles.addEventBtn}>+ Evento</Text>
            </TouchableOpacity>
          </View>

          {selectedEvents.length === 0 ? (
            <Text style={styles.emptyText}>Sem eventos neste dia</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {selectedEvents.map(ev => (
                <View key={ev.id} style={styles.eventCard}>
                  <View style={[styles.eventBar, { backgroundColor: ev.color || colors.accent }]} />
                  <Sticker category={ev.category} size={22} />
                  <Text style={styles.eventTime}>{ev.time}</Text>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{ev.title}</Text>
                    {ev.category && <Text style={styles.eventCat}>{ev.category}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => delEvent(ev.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="trash" size={14} color={colors.text3} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Novo evento"
        footer={
          <TouchableOpacity style={styles.btnPrimary} onPress={addEvent} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>Adicionar</Text>
          </TouchableOpacity>
        }
      >
        <View style={{ gap: 12 }}>
          <TextInput
            style={styles.input}
            placeholder="Título do evento"
            placeholderTextColor={colors.text3}
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
            autoFocus
          />
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Data (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.text3}
              value={form.date}
              onChangeText={v => setForm(f => ({ ...f, date: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>Hora (HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor={colors.text3}
              value={form.time}
              onChangeText={v => setForm(f => ({ ...f, time: v }))}
              keyboardType="numeric"
            />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { marginBottom: 10 }]}>Adesivo</Text>
            <View style={styles.stickerGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setForm(f => ({ ...f, category: cat }))}
                  style={[
                    styles.stickerOption,
                    form.category === cat && styles.stickerOptionSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Sticker category={cat} size={24} />
                  <Text style={[
                    styles.stickerLabel,
                    form.category === cat && { color: colors.accent },
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
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
    padding: 12,
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    padding: 8,
  },
  monthTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  weekCell: {
    alignItems: 'center',
    paddingVertical: 3,
  },
  weekLabel: {
    fontSize: 9,
    fontFamily: fonts.sansMedium,
    color: colors.text3,
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 24,
  },
  dayCell: {
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 6,
    paddingTop: 4,
    paddingHorizontal: 2,
    paddingBottom: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    overflow: 'hidden',
  },
  dayCellSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  dayCellToday: {
    borderColor: colors.accent,
    backgroundColor: colors.bg2,
  },
  dayNum: {
    fontSize: 10,
    fontFamily: fonts.sans,
    color: colors.text,
    lineHeight: 14,
    marginBottom: 3,
  },
  dayNumAccent: {
    color: colors.accent,
    fontFamily: fonts.sansMedium,
  },
  stickersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 7,
    color: colors.text3,
  },
  eventsSection: {
    marginTop: 4,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addEventBtn: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.accent,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    color: colors.text3,
    fontSize: 13,
    fontFamily: fonts.sans,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
  },
  eventBar: {
    width: 4,
    height: 36,
    borderRadius: 99,
    flexShrink: 0,
  },
  eventTime: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.accent,
    minWidth: 36,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.text,
  },
  eventCat: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: colors.text3,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
    marginBottom: 6,
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
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stickerOption: {
    width: '30%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  stickerOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentBg,
  },
  stickerLabel: {
    fontSize: 10,
    fontFamily: fonts.sansMedium,
    color: colors.text2,
  },
  btnPrimary: {
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
});
