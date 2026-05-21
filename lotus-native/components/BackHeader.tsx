import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from './Icon';
import { fonts, spacing } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: React.ReactNode;
}

const BackHeader = ({ title, subtitle, onBack, action }: BackHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.screenPad,
      paddingBottom: 12,
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.line,
      gap: 12,
      paddingTop: insets.top + 8,
    }]}>
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: colors.bg2 }]}
        onPress={onBack ?? (() => router.back())}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Icon name="arrowLeft" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.text3 }]} numberOfLines={1}>{subtitle}</Text>}
      </View>

      {action ? <View style={styles.action}>{action}</View> : <View style={styles.actionPlaceholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleWrap: { flex: 1 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    marginTop: 2,
  },
  action: { flexShrink: 0 },
  actionPlaceholder: { width: 36, flexShrink: 0 },
});

export default BackHeader;
