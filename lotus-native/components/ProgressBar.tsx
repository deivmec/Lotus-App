import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../lib/theme';

interface ProgressBarProps {
  value?: number;
  color?: string;
  height?: number;
}

const ProgressBar = ({ value = 0, color = colors.accent, height = 4 }: ProgressBarProps) => {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: color, height }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.bg3,
    borderRadius: 99,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 99,
  },
});

export default ProgressBar;
