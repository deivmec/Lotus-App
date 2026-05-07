import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from './Icon';
import { colors, radius, fonts } from '../lib/theme';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  strikethrough?: boolean;
}

const Checkbox = ({ checked, onToggle, children, strikethrough = true }: CheckboxProps) => (
  <TouchableOpacity
    style={styles.wrap}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked && <Icon name="check" size={12} color={colors.bg} />}
    </View>
    {children !== undefined && (
      <Text style={[
        styles.label,
        checked && styles.labelChecked,
        checked && strikethrough && styles.labelStrike,
      ]}>
        {children}
      </Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.sm / 2,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxChecked: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  label: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    fontFamily: fonts.sans,
  },
  labelChecked: {
    color: colors.text3,
  },
  labelStrike: {
    textDecorationLine: 'line-through',
  },
});

export default Checkbox;
