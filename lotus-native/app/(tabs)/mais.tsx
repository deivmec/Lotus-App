import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { fonts, radius, spacing } from '../../lib/theme';
import { useTheme } from '../../context/ThemeContext';

const SECTIONS = [
  { id: 'perfil',       icon: 'user',       label: 'Perfil & Configurações', desc: 'Conta, aparência e preferências' },
  { id: 'compras',      icon: 'cart',       label: 'Compras',                desc: 'Listas e wishlist' },
  { id: 'financas',     icon: 'wallet',     label: 'Finanças',               desc: 'Gastos e metas' },
  { id: 'calendario',   icon: 'calendar',   label: 'Calendário',             desc: 'Eventos e agenda' },
  { id: 'saude',        icon: 'heart',      label: 'Saúde & Bem-estar',      desc: 'Humor, ciclo, treinos' },
  { id: 'cofre',        icon: 'lock',       label: 'Cofre',                  desc: 'Documentos e logins' },
  { id: 'viagem',       icon: 'plane',      label: 'Viagem',                 desc: 'Bucket list e planos' },
  { id: 'conteudo',     icon: 'book',       label: 'Conteúdo',               desc: 'Livros, filmes, cursos' },
  { id: 'inspiracao',   icon: 'palette',    label: 'Inspiração',             desc: 'Moodboard, quadros e paletas' },
  { id: 'utilitarios',  icon: 'calculator', label: 'Utilitários',            desc: 'Calculadora e conversor' },
  { id: 'notificacoes', icon: 'bell',       label: 'Notificações',           desc: 'Avisos urgentes' },
  { id: 'receitas',     icon: 'utensils',   label: 'Alimentação',            desc: 'Suas receitas favoritas' },
  { id: 'idiomas',      icon: 'globe',      label: 'Idiomas',                desc: 'Vocabulário e flashcards' },
  { id: 'links',        icon: 'link',       label: 'Links Rápidos',          desc: 'Favoritos organizados' },
  { id: 'autocuidados', icon: 'leaf',       label: 'Autocuidados',           desc: 'Capilar, skincare e bem-estar' },
] as const;

type C = { bg: string; bg2: string; bg3: string; line: string; surface: string; text: string; text2: string; text3: string; accent: string; accentBg: string; accentDk: string; green: string; greenBg: string; blue: string; blueBg: string; red: string; redBg: string; };
const makeStyles = (c: C) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: c.bg },
  container: { paddingHorizontal: spacing.screenPad },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heading: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: c.text,
    lineHeight: 34,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.text2,
    marginTop: 4,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: radius.md,
  },
  iconWrap: {
    width: 38,
    height: 38,
    backgroundColor: c.bg2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  rowDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: c.text3,
    marginTop: 1,
  },
});

export default function MaisTab() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Mais</Text>
          <Text style={styles.sub}>Todas as seções</Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push('/screens/busca')}
          activeOpacity={0.7}
        >
          <Icon name="search" size={18} color={colors.text2} />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {SECTIONS.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.row}
            onPress={() => router.push(`/screens/${s.id}` as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Icon name={s.icon as any} size={18} color={colors.text2} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowDesc}>{s.desc}</Text>
            </View>
            <Icon name="arrow" size={16} color={colors.text3} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
