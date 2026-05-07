import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fonts } from '../lib/theme';

interface TagProps {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}

const Tag = ({ children, bg = colors.bg2, color = colors.text3 }: TagProps) => (
  <View style={[styles.tag, { backgroundColor: bg }]}>
    <Text style={[styles.label, { color }]}>{children}</Text>
  </View>
);

const PRIORITY_MAP = {
  alta:  { label: 'Alta',  bg: colors.accentBg,  color: colors.accent },
  media: { label: 'Média', bg: colors.blueBg,     color: colors.blue },
  baixa: { label: 'Baixa', bg: colors.bg2,         color: colors.text3 },
} as const;

export const PriorityTag = ({ level }: { level: 'alta' | 'media' | 'baixa' }) => {
  const m = PRIORITY_MAP[level] ?? PRIORITY_MAP.baixa;
  return <Tag bg={m.bg} color={m.color}>{m.label}</Tag>;
};

const styles = StyleSheet.create({
  tag: {
    borderRadius: radius.sm / 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Tag;
