import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import BackHeader from '../../components/BackHeader';
import Icon from '../../components/Icon';
import { useStorage } from '../../hooks/useStorage';
import { colors, fonts, radius, spacing } from '../../lib/theme';

// ── helpers ──────────────────────────────────────────────────────────────────

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

const diffDays = (dateStr: string): number => {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// ── sub-components ────────────────────────────────────────────────────────────

interface UrgencyBadgeProps {
  days: number;
}

const UrgencyBadge = ({ days }: UrgencyBadgeProps) => {
  if (days <= 0) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.redBg }]}>
        <Text style={[styles.badgeText, { color: colors.red }]}>Hoje</Text>
      </View>
    );
  }
  if (days === 1) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.redBg }]}>
        <Text style={[styles.badgeText, { color: colors.red }]}>Amanhã</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.badgeText, { color: colors.text3 }]}>em {days}d</Text>
    </View>
  );
};

interface NotifItemProps {
  icon: string;
  title: string;
  sub: string;
  days: number;
  iconColor?: string;
}

const NotifItem = ({ icon, title, sub, days, iconColor = colors.text2 }: NotifItemProps) => (
  <View style={styles.item}>
    <View style={styles.itemIcon}>
      <Icon name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.itemBody}>
      <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.itemSub} numberOfLines={1}>{sub}</Text>
    </View>
    <UrgencyBadge days={days} />
  </View>
);

interface SectionHeaderProps {
  label: string;
}

const SectionHeader = ({ label }: SectionHeaderProps) => (
  <Text style={styles.sectionLabel}>{label}</Text>
);

// ── screen ────────────────────────────────────────────────────────────────────

export default function NotificacoesScreen() {
  const [tasks]      = useStorage<any[]>('tasks:items',  []);
  const [events]     = useStorage<any[]>('events:items', []);
  const [travelDocs] = useStorage<any[]>('viagem:docs',  []);
  const [meds]       = useStorage<any[]>('saude:meds',   []);
  const [medLogs]    = useStorage<Record<string, boolean>>('saude:medlogs', {});

  const urgentTasks = tasks
    .filter((t: any) => !t.done && t.date)
    .map((t: any) => ({ ...t, days: diffDays(t.date) }))
    .filter((t: any) => t.days >= 0 && t.days <= 3)
    .sort((a: any, b: any) => a.days - b.days);

  const upcomingEvents = events
    .filter((e: any) => { const d = diffDays(e.date); return d >= 0 && d <= 7; })
    .map((e: any) => ({ ...e, days: diffDays(e.date) }))
    .sort((a: any, b: any) => a.days - b.days);

  const expiringDocs = travelDocs
    .filter((d: any) => d.expiry)
    .map((d: any) => ({ ...d, days: diffDays(d.expiry) }))
    .filter((d: any) => d.days >= 0 && d.days < 90)
    .sort((a: any, b: any) => a.days - b.days);

  const unTakenMeds = meds.filter((m: any) => !medLogs[`${m.id}:${todayStr}`]);

  const total = urgentTasks.length + upcomingEvents.length + expiringDocs.length + unTakenMeds.length;

  return (
    <View style={styles.flex}>
      <BackHeader
        title="Notificações"
        subtitle={`${total} item(s) pendente(s)`}
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {total === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>Tudo em dia!</Text>
            <Text style={styles.emptyText}>Nenhuma notificação urgente</Text>
          </View>
        ) : (
          <>
            {/* ── Tarefas urgentes ─────────────────────────────────────── */}
            {urgentTasks.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Tarefas urgentes" />
                <View style={styles.card}>
                  {urgentTasks.map((t: any, idx: number) => (
                    <View key={t.id} style={idx < urgentTasks.length - 1 && styles.itemDivider}>
                      <NotifItem
                        icon="tasks"
                        title={t.title ?? t.name ?? '—'}
                        sub={t.date}
                        days={t.days}
                        iconColor={colors.accent}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Eventos próximos ─────────────────────────────────────── */}
            {upcomingEvents.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Eventos próximos" />
                <View style={styles.card}>
                  {upcomingEvents.map((e: any, idx: number) => (
                    <View key={e.id} style={idx < upcomingEvents.length - 1 && styles.itemDivider}>
                      <NotifItem
                        icon="calendar"
                        title={e.title ?? e.name ?? '—'}
                        sub={e.date}
                        days={e.days}
                        iconColor={colors.blue}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Documentos a vencer ──────────────────────────────────── */}
            {expiringDocs.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Documentos a vencer" />
                <View style={styles.card}>
                  {expiringDocs.map((d: any, idx: number) => (
                    <View key={d.id ?? idx} style={idx < expiringDocs.length - 1 && styles.itemDivider}>
                      <NotifItem
                        icon="idCard"
                        title={d.name ?? d.title ?? '—'}
                        sub={`Vence em ${d.expiry}`}
                        days={d.days}
                        iconColor={colors.red}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Medicamentos pendentes ───────────────────────────────── */}
            {unTakenMeds.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Medicamentos de hoje" />
                <View style={styles.card}>
                  {unTakenMeds.map((m: any, idx: number) => (
                    <View key={m.id} style={idx < unTakenMeds.length - 1 && styles.itemDivider}>
                      <NotifItem
                        icon="pill"
                        title={m.name ?? '—'}
                        sub={m.dose ?? 'Não tomado hoje'}
                        days={0}
                        iconColor={colors.green}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screenPad,
    paddingBottom: 40,
    gap: 20,
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
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.text,
    marginBottom: 6,
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

  // card wrapping list items
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  // individual item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  itemIcon: {
    width: 36,
    height: 36,
    backgroundColor: colors.bg2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  itemSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },

  // urgency badge
  badge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    fontWeight: '500',
  },
});
