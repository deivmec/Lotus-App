import React, { useState, useCallback, createContext, useContext, useRef, useEffect } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../lib/theme';

type ToastFn = (msg: string, duration?: number) => void;

const ToastCtx = createContext<ToastFn>(() => {});

interface ToastItem {
  id: number;
  msg: string;
  anim: Animated.Value;
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback<ToastFn>((msg, duration = 2200) => {
    const id = Date.now();
    const anim = new Animated.Value(0);

    setToasts(t => [...t, { id, msg, anim }]);

    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(duration - 440),
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setToasts(t => t.filter(x => x.id !== id));
    });
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <View style={[styles.container, { bottom: Math.max(insets.bottom + 90, 100) }]} pointerEvents="none">
        {toasts.map(t => (
          <Animated.View
            key={t.id}
            style={[
              styles.toast,
              {
                opacity: t.anim,
                transform: [{ translateY: t.anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              },
            ]}
          >
            <Text style={styles.msg}>{t.msg}</Text>
          </Animated.View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
};

export const useToast = () => useContext(ToastCtx);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  msg: {
    color: colors.bg,
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
  },
});
