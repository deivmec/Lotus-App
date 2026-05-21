import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, fonts } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal = ({ open, onClose, title, children, footer }: ModalProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={[styles.handle, { backgroundColor: colors.line }]} />

          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer && (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), backgroundColor: colors.bg, borderTopColor: colors.line }]}>
              {footer}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginTop: 14,
    flexShrink: 0,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 20,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    flexShrink: 0,
  },
  body: { flexShrink: 1 },
  bodyContent: {
    padding: spacing.xl,
    gap: 12,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: 12,
    borderTopWidth: 1,
    flexShrink: 0,
  },
});

export default Modal;
