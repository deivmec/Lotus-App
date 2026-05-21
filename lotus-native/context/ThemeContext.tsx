import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, darkColors } from '../lib/theme';

// ── Accent presets ────────────────────────────────────────────────────────────

export const ACCENT_PRESETS = [
  { id: 'terra',   label: 'Terra',   color: '#B8784A', accentBg: '#F5EDE6', accentDk: '#8A5530', accentBgDark: '#3A2518', accentDkDark: '#D4956A' },
  { id: 'sage',    label: 'Sage',    color: '#6A9E6A', accentBg: '#EBF5EB', accentDk: '#4A7A4A', accentBgDark: '#1A2E1A', accentDkDark: '#8EC88E' },
  { id: 'ocean',   label: 'Oceano',  color: '#5A7FAE', accentBg: '#EAF1F9', accentDk: '#3A5F8E', accentBgDark: '#182232', accentDkDark: '#7AAAD4' },
  { id: 'lavanda', label: 'Lavanda', color: '#8B72BE', accentBg: '#F2EEF9', accentDk: '#6A52A0', accentBgDark: '#221A38', accentDkDark: '#B09EDE' },
  { id: 'coral',   label: 'Coral',   color: '#C4684A', accentBg: '#FAEEE9', accentDk: '#9E4A30', accentBgDark: '#361A12', accentDkDark: '#E08870' },
  { id: 'gold',    label: 'Ouro',    color: '#B89B4A', accentBg: '#F7F2E4', accentDk: '#8C7228', accentBgDark: '#302810', accentDkDark: '#DEC26A' },
  { id: 'rosa',    label: 'Rosa',    color: '#C4567A', accentBg: '#FAEAF0', accentDk: '#9E3A5E', accentBgDark: '#381020', accentDkDark: '#E07A9E' },
  { id: 'teal',    label: 'Água',    color: '#4A9E95', accentBg: '#E8F5F4', accentDk: '#2A7A72', accentBgDark: '#10302E', accentDkDark: '#6AC4BA' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

type ColorSet = {
  bg: string; bg2: string; bg3: string; line: string; surface: string;
  text: string; text2: string; text3: string;
  accent: string; accentBg: string; accentDk: string;
  green: string; greenBg: string; blue: string; blueBg: string;
  red: string; redBg: string;
};

interface ThemeContextValue {
  dark: boolean;
  colors: ColorSet;
  accentId: string;
  toggleDark: () => void;
  setAccent: (id: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  colors,
  accentId: 'terra',
  toggleDark: () => {},
  setAccent: () => {},
});

function buildColors(base: typeof colors | typeof darkColors, isDark: boolean, accentPreset: typeof ACCENT_PRESETS[0]): ColorSet {
  return {
    ...base,
    accent:    accentPreset.color,
    accentBg:  isDark ? accentPreset.accentBgDark : accentPreset.accentBg,
    accentDk:  isDark ? accentPreset.accentDkDark : accentPreset.accentDk,
  };
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const scheme = useColorScheme();
  const [dark, setDark] = useState(scheme === 'dark');
  const [accentId, setAccentIdState] = useState('terra');

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('settings:theme'),
      AsyncStorage.getItem('settings:accent'),
    ]).then(([themeVal, accentVal]) => {
      if (themeVal === 'dark') setDark(true);
      else if (themeVal === 'light') setDark(false);
      else setDark(scheme === 'dark');
      if (accentVal && ACCENT_PRESETS.find(p => p.id === accentVal)) {
        setAccentIdState(accentVal);
      }
    });
  }, []);

  const toggleDark = async () => {
    const next = !dark;
    setDark(next);
    await AsyncStorage.setItem('settings:theme', next ? 'dark' : 'light');
  };

  const setAccent = async (id: string) => {
    const preset = ACCENT_PRESETS.find(p => p.id === id);
    if (!preset) return;
    setAccentIdState(id);
    await AsyncStorage.setItem('settings:accent', id);
  };

  const preset = ACCENT_PRESETS.find(p => p.id === accentId) ?? ACCENT_PRESETS[0];
  const activeColors = buildColors(dark ? darkColors : colors, dark, preset);

  return (
    <ThemeContext.Provider value={{ dark, colors: activeColors, accentId, toggleDark, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
